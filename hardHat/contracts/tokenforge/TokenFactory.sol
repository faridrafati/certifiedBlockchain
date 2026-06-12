// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Features, TokenConfig, LPConfig} from "./ForgeTypes.sol";
import {InvalidConfig, InsufficientFee, ZeroAddress} from "./ForgeTypes.sol";
import {ForgeTokenDeployer} from "./ForgeTokenDeployer.sol";

/**
 * @title TokenFactory
 * @author CertifiedBlockchain (TokenForge)
 * @notice Trustless ERC-20 generator. Prices live on-chain (admin-updatable), so
 *         payment is validated against the selected feature bitmap and the frontend
 *         can never trick a buyer into underpaying. Deploys the token and hands all
 *         ownership/admin powers to the buyer in the same transaction.
 *
 * @dev Pricing: total = (basePrice + Σ featurePrice[selected]) * networkMultiplier / 1e4.
 *      The bitmap bit positions match Features.* ids. `validateConfig` mirrors the
 *      full dependency/conflict matrix on-chain and reverts InvalidConfig on any
 *      violation. Overpayment is refunded last (checks-effects-interactions).
 *
 *      Reflection (id 14), uRWA (id 22) and same-transaction LP setup (id 17) are
 *      reserved for a follow-up release: validateConfig encodes their full rules,
 *      but createToken rejects them with a clear message until their deployer
 *      families are wired in, so no half-built token can ever be minted.
 */
contract TokenFactory is Ownable2Step, ReentrancyGuard {
    // ----- pricing (wei) -----
    uint256 public basePrice;
    mapping(uint8 => uint256) public featurePrice; // featureId => price
    /// @notice Network multiplier in basis points (10000 = 1.0x, 2000 = 0.2x, 0 = free testnet).
    uint16 public networkMultiplierBps;

    // ----- treasury / control -----
    address public treasury;
    bool public paused;
    ForgeTokenDeployer public immutable forgeDeployer;

    // ----- registry -----
    struct TokenRecord {
        address token;
        address creator;
        string name;
        string symbol;
        uint256 featureBitmap;
        uint256 feePaid;
        uint64 createdAt;
    }
    TokenRecord[] public allTokens;
    mapping(address => uint256[]) private _tokensByCreator; // creator => indices into allTokens

    // ----- events -----
    event TokenCreated(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        uint256 featureBitmap,
        uint256 feePaid
    );
    event BasePriceUpdated(uint256 price);
    event FeaturePriceUpdated(uint8 indexed featureId, uint256 price);
    event NetworkMultiplierUpdated(uint16 bps);
    event TreasuryUpdated(address indexed treasury);
    event FactoryPaused(bool paused);
    event Withdrawn(address indexed to, uint256 amount);

    constructor(
        address owner_,
        address treasury_,
        uint256 basePrice_,
        uint16 networkMultiplierBps_,
        ForgeTokenDeployer deployer_
    ) Ownable(owner_) {
        if (treasury_ == address(0) || address(deployer_) == address(0)) revert ZeroAddress();
        treasury = treasury_;
        basePrice = basePrice_;
        networkMultiplierBps = networkMultiplierBps_;
        forgeDeployer = deployer_;
        _setDefaultPrices();
    }

    /// @dev Default price chart (mainnet ETH values from the spec), in wei.
    function _setDefaultPrices() private {
        featurePrice[Features.ID_REMOVE_CREDITS] = 0.20 ether;
        featurePrice[Features.ID_CUSTOM_DECIMALS] = 0.05 ether;
        featurePrice[Features.ID_SUPPLY_CAPPED] = 0.10 ether;
        featurePrice[Features.ID_SUPPLY_UNLIMITED] = 0.10 ether;
        featurePrice[Features.ID_ACCESS_OWNABLE] = 0.05 ether;
        featurePrice[Features.ID_ACCESS_ROLES] = 0.20 ether;
        featurePrice[Features.ID_PAUSABLE] = 0.15 ether;
        featurePrice[Features.ID_BURNABLE] = 0.10 ether;
        featurePrice[Features.ID_MINTABLE] = 0.15 ether;
        featurePrice[Features.ID_BATCH_OPS] = 0.15 ether;
        featurePrice[Features.ID_WHITELIST] = 0.25 ether;
        featurePrice[Features.ID_BLACKLIST] = 0.25 ether;
        featurePrice[Features.ID_CONTROLLED] = 0.25 ether;
        featurePrice[Features.ID_REFLECTION] = 0.50 ether;
        featurePrice[Features.ID_TAXABLE] = 0.40 ether;
        featurePrice[Features.ID_ANTI_WHALE] = 0.30 ether;
        featurePrice[Features.ID_LP_SETUP] = 0.30 ether;
        featurePrice[Features.ID_DEFLATIONARY] = 0.30 ether;
        featurePrice[Features.ID_CALLBACK] = 0.20 ether;
        featurePrice[Features.ID_PERMIT] = 0.15 ether;
        featurePrice[Features.ID_AUTH_3009] = 0.25 ether;
        featurePrice[Features.ID_URWA] = 0.60 ether;
        featurePrice[Features.ID_TOKEN_RECOVER] = 0.10 ether;
    }

    // ----------------------------------------------------------------
    // Pricing
    // ----------------------------------------------------------------
    /// @notice Total required fee in wei for a feature bitmap, after network multiplier.
    function requiredFee(uint256 bitmap) public view returns (uint256) {
        uint256 sum = basePrice;
        for (uint8 id = 1; id <= Features.MAX_FEATURE_ID; id++) {
            if (bitmap & (uint256(1) << id) != 0) {
                sum += featurePrice[id];
            }
        }
        return (sum * networkMultiplierBps) / 10_000;
    }

    // ----------------------------------------------------------------
    // Validation (mirrors the dependency/conflict matrix on-chain)
    // ----------------------------------------------------------------
    /// @notice Reverts InvalidConfig if the bitmap violates any dependency/conflict rule.
    function validateConfig(uint256 bm) public pure {
        bool capped = Features.has(bm, Features.SUPPLY_CAPPED);
        bool unlimited = Features.has(bm, Features.SUPPLY_UNLIMITED);
        bool ownable = Features.has(bm, Features.ACCESS_OWNABLE);
        bool roles = Features.has(bm, Features.ACCESS_ROLES);
        bool hasAccess = ownable || roles;
        bool mintable = Features.has(bm, Features.MINTABLE);
        bool reflection = Features.has(bm, Features.REFLECTION);
        bool urwa = Features.has(bm, Features.URWA);

        // supply type is mutually exclusive (Fixed is the absence of both)
        if (capped && unlimited) revert InvalidConfig("supply: capped xor unlimited");
        // access type is mutually exclusive
        if (ownable && roles) revert InvalidConfig("access: ownable xor roles");

        // capped/unlimited require mintable + access
        if ((capped || unlimited) && !mintable) revert InvalidConfig("supply needs mintable");
        if ((capped || unlimited) && !hasAccess) revert InvalidConfig("supply needs access");
        if (mintable && !hasAccess) revert InvalidConfig("mintable needs access");

        // pausable + owner-gated compliance features require access
        if (Features.has(bm, Features.PAUSABLE) && !hasAccess) revert InvalidConfig("pausable needs access");
        if (Features.has(bm, Features.WHITELIST) && !hasAccess) revert InvalidConfig("whitelist needs access");
        if (Features.has(bm, Features.BLACKLIST) && !hasAccess) revert InvalidConfig("blacklist needs access");
        if (Features.has(bm, Features.CONTROLLED) && !hasAccess) revert InvalidConfig("controlled needs access");
        if (Features.has(bm, Features.TAXABLE) && !hasAccess) revert InvalidConfig("taxable needs access");
        if (Features.has(bm, Features.ANTI_WHALE) && !hasAccess) revert InvalidConfig("antiwhale needs access");
        if (Features.has(bm, Features.DEFLATIONARY) && !hasAccess) revert InvalidConfig("deflationary needs access");
        if (Features.has(bm, Features.TOKEN_RECOVER) && !hasAccess) revert InvalidConfig("recover needs access");

        // reflection: fixed supply only; conflicts with mint/tax/deflationary/urwa
        if (reflection) {
            if (capped || unlimited) revert InvalidConfig("reflection needs fixed supply");
            if (mintable) revert InvalidConfig("reflection conflicts mintable");
            if (Features.has(bm, Features.TAXABLE)) revert InvalidConfig("reflection conflicts taxable");
            if (Features.has(bm, Features.DEFLATIONARY)) revert InvalidConfig("reflection conflicts deflationary");
            if (urwa) revert InvalidConfig("reflection conflicts urwa");
        }

        // uRWA: requires role-based access + whitelist; conflicts with reflection
        if (urwa) {
            if (!roles) revert InvalidConfig("urwa needs role access");
            if (!Features.has(bm, Features.WHITELIST)) revert InvalidConfig("urwa needs whitelist");
            if (reflection) revert InvalidConfig("urwa conflicts reflection");
        }
    }

    // ----------------------------------------------------------------
    // Create
    // ----------------------------------------------------------------
    /**
     * @notice Validate the config, charge the on-chain fee, deploy the token, and
     *         hand all ownership/admin powers to the caller.
     * @param cfg full token configuration; `cfg.owner_` is overwritten with msg.sender
     * @param lp  liquidity-pool parameters (reserved; must be zero for now)
     * @return token the deployed token address
     */
    function createToken(TokenConfig calldata cfg, LPConfig calldata lp)
        external
        payable
        nonReentrant
        returns (address token)
    {
        if (paused) revert InvalidConfig("factory paused");
        uint256 bm = cfg.featureBitmap;
        validateConfig(bm);

        // Reserved families / features not yet wired in: reject cleanly so a buyer
        // can never pay for a token that cannot be built.
        if (Features.has(bm, Features.REFLECTION)) revert InvalidConfig("reflection coming soon");
        if (Features.has(bm, Features.URWA)) revert InvalidConfig("urwa coming soon");
        if (Features.has(bm, Features.AUTH_3009)) revert InvalidConfig("auth3009 coming soon");
        if (Features.has(bm, Features.LP_SETUP)) revert InvalidConfig("lp setup coming soon");
        if (lp.tokenAmount != 0 || lp.nativeAmount != 0) revert InvalidConfig("lp setup coming soon");

        uint256 fee = requiredFee(bm);
        if (msg.value < fee) revert InsufficientFee(fee, msg.value);

        // Force ownership to the buyer regardless of what the frontend sent.
        TokenConfig memory c = cfg;
        c.owner_ = msg.sender;

        token = forgeDeployer.deploy(c);

        // registry
        uint256 idx = allTokens.length;
        allTokens.push(TokenRecord({
            token: token,
            creator: msg.sender,
            name: cfg.name,
            symbol: cfg.symbol,
            featureBitmap: bm,
            feePaid: fee,
            createdAt: uint64(block.timestamp)
        }));
        _tokensByCreator[msg.sender].push(idx);

        emit TokenCreated(token, msg.sender, cfg.name, cfg.symbol, bm, fee);

        // refund overpayment last (CEI); guarded by nonReentrant
        uint256 refund = msg.value - fee;
        if (refund > 0) {
            (bool ok, ) = payable(msg.sender).call{value: refund}("");
            require(ok, "refund failed");
        }
    }

    // ----------------------------------------------------------------
    // Registry getters
    // ----------------------------------------------------------------
    function getTokenCount() external view returns (uint256) {
        return allTokens.length;
    }

    function tokensByCreator(address creator) external view returns (uint256[] memory) {
        return _tokensByCreator[creator];
    }

    /// @notice Paginated registry read. Returns up to `limit` records from `start`.
    function getTokens(uint256 start, uint256 limit) external view returns (TokenRecord[] memory page) {
        uint256 len = allTokens.length;
        if (start >= len) return new TokenRecord[](0);
        uint256 end = start + limit;
        if (end > len) end = len;
        page = new TokenRecord[](end - start);
        for (uint256 i = start; i < end; i++) {
            page[i - start] = allTokens[i];
        }
    }

    // ----------------------------------------------------------------
    // Admin (Ownable2Step)
    // ----------------------------------------------------------------
    function setBasePrice(uint256 price) external onlyOwner {
        basePrice = price;
        emit BasePriceUpdated(price);
    }

    function setFeaturePrice(uint8 featureId, uint256 price) external onlyOwner {
        if (featureId == 0 || featureId > Features.MAX_FEATURE_ID) revert InvalidConfig("bad featureId");
        featurePrice[featureId] = price;
        emit FeaturePriceUpdated(featureId, price);
    }

    function setNetworkMultiplier(uint16 bps) external onlyOwner {
        networkMultiplierBps = bps;
        emit NetworkMultiplierUpdated(bps);
    }

    function setTreasury(address treasury_) external onlyOwner {
        if (treasury_ == address(0)) revert ZeroAddress();
        treasury = treasury_;
        emit TreasuryUpdated(treasury_);
    }

    function setPaused(bool paused_) external onlyOwner {
        paused = paused_;
        emit FactoryPaused(paused_);
    }

    /// @notice Withdraw collected fees to the fixed treasury (no arbitrary target).
    function withdraw() external onlyOwner nonReentrant {
        uint256 bal = address(this).balance;
        (bool ok, ) = payable(treasury).call{value: bal}("");
        require(ok, "withdraw failed");
        emit Withdrawn(treasury, bal);
    }
}

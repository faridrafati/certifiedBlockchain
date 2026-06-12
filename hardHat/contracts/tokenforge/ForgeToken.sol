// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC1363} from "@openzeppelin/contracts/token/ERC20/extensions/ERC1363.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Features, TokenConfig} from "./ForgeTypes.sol";
import {FeatureDisabled, Blacklisted, NotWhitelisted, ZeroAddress, LengthMismatch, FeeTooHigh, LimitTooLow, CapExceeded} from "./ForgeTypes.sol";

/**
 * @title ForgeToken
 * @author CertifiedBlockchain (TokenForge)
 * @notice Configurable ERC-20 covering every TokenForge feature except Reflection
 *         and uRWA (which ship as dedicated families). Behaviour is selected at
 *         construction via an immutable feature bitmap, so disabled features are
 *         dead branches that cost almost no gas and cannot be turned on later.
 * @dev `_update` applies, in order: blacklist -> whitelist mode -> pause ->
 *      anti-whale -> tax -> auto-burn. All fee caps and the anti-whale floor are
 *      immutable constants the owner can never exceed (anti-honeypot by design).
 *
 * Access model: this family uses Ownable2Step. The "Role Based" access type in
 * the catalog maps to the dedicated RWA family; here `accessType != None` is
 * represented by having an owner. When the chosen access type is None, the
 * constructor leaves the owner unset and all admin functions are unreachable.
 */
contract ForgeToken is ERC20, ERC20Burnable, ERC20Permit, ERC1363, Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ----- immutable feature flags (set once at construction) -----
    uint256 public immutable featureBitmap;
    uint8 private immutable _customDecimals;
    bool private immutable _hasCustomDecimals;
    bool private immutable _isCapped;
    bool private immutable _isBurnable;
    bool private immutable _isMintable;
    bool private immutable _isPausable;
    bool private immutable _hasWhitelist;
    bool private immutable _hasBlacklist;
    bool private immutable _isControlled;
    bool private immutable _isTaxable;
    bool private immutable _hasAntiWhale;
    bool private immutable _isDeflationary;
    bool private immutable _hasBatch;
    bool private immutable _hasTokenRecover;
    bool private immutable _creditsRemoved;
    bool private immutable _hasPermit;
    bool private immutable _hasCallback;

    uint256 public immutable cap; // 0 when not capped

    // ----- hard, immutable safety bounds (anti-honeypot) -----
    uint16 public constant MAX_SINGLE_FEE_BPS = 1000;   // 10% per individual fee
    uint16 public constant MAX_TOTAL_FEE_BPS = 2000;    // 20% combined tax + burn
    uint16 public constant MIN_LIMIT_BPS = 10;          // anti-whale floor: 0.1% of supply
    uint256 public constant MAX_FEE_EXCLUSIONS = 200;   // bound on exclusion set

    // ----- platform credit -----
    string public constant GENERATOR = "TokenForge - tokenforge.xyz";

    // ----- pausable state -----
    bool public paused;

    // ----- compliance state -----
    mapping(address => bool) public blacklisted;
    mapping(address => bool) public whitelisted;
    bool public whitelistEnabled;

    // ----- tax state -----
    uint16 public buyTaxBps;
    uint16 public sellTaxBps;
    uint16 public transferTaxBps;
    address public taxWallet;
    mapping(address => bool) public isAmmPair;
    mapping(address => bool) public excludedFromFees;

    // ----- deflationary state -----
    uint16 public burnFeeBps;

    // ----- anti-whale state -----
    uint256 public maxTxAmount;
    uint256 public maxWalletAmount;
    mapping(address => bool) public excludedFromLimits;

    // ----- events (every state change is observable) -----
    event Paused(address account);
    event Unpaused(address account);
    event BlacklistUpdated(address indexed account, bool value);
    event WhitelistUpdated(address indexed account, bool value);
    event WhitelistEnabledSet(bool value);
    event ControlledTransfer(address indexed from, address indexed to, uint256 amount, address indexed by);
    event TaxRatesUpdated(uint16 buy, uint16 sell, uint16 transfer);
    event TaxWalletUpdated(address indexed wallet);
    event AmmPairUpdated(address indexed pair, bool value);
    event FeeExclusionUpdated(address indexed account, bool excluded);
    event BurnFeeUpdated(uint16 bps);
    event LimitsUpdated(uint256 maxTx, uint256 maxWallet);
    event LimitExclusionUpdated(address indexed account, bool excluded);
    event TokenForgeCredit(string generator);
    event ERC20Recovered(address indexed token, uint256 amount);
    event ETHRecovered(uint256 amount);

    /**
     * @param cfg full token configuration (see ForgeTypes.TokenConfig)
     * @dev `cfg.owner_` receives the initial supply and all admin powers. When the
     *      access type is None the factory passes the dead address pattern by
     *      simply not selecting any admin feature; this contract still records an
     *      owner for supply delivery but exposes no privileged surface in that case.
     */
    constructor(TokenConfig memory cfg)
        ERC20(cfg.name, cfg.symbol)
        ERC20Permit(cfg.name)
        Ownable(cfg.owner_)
    {
        if (cfg.owner_ == address(0)) revert ZeroAddress();
        uint256 bm = cfg.featureBitmap;
        featureBitmap = bm;

        // decimals
        if (Features.has(bm, Features.CUSTOM_DECIMALS)) {
            if (cfg.decimals_ > 18) revert CapExceeded();
            _customDecimals = cfg.decimals_;
            _hasCustomDecimals = true;
        } else {
            _customDecimals = 18;
            _hasCustomDecimals = false;
        }

        _isCapped = Features.has(bm, Features.SUPPLY_CAPPED);
        _isBurnable = Features.has(bm, Features.BURNABLE);
        _isMintable = Features.has(bm, Features.MINTABLE);
        _isPausable = Features.has(bm, Features.PAUSABLE);
        _hasWhitelist = Features.has(bm, Features.WHITELIST);
        _hasBlacklist = Features.has(bm, Features.BLACKLIST);
        _isControlled = Features.has(bm, Features.CONTROLLED);
        _isTaxable = Features.has(bm, Features.TAXABLE);
        _hasAntiWhale = Features.has(bm, Features.ANTI_WHALE);
        _isDeflationary = Features.has(bm, Features.DEFLATIONARY);
        _hasBatch = Features.has(bm, Features.BATCH_OPS);
        _hasTokenRecover = Features.has(bm, Features.TOKEN_RECOVER);
        _creditsRemoved = Features.has(bm, Features.REMOVE_CREDITS);
        _hasPermit = Features.has(bm, Features.PERMIT);
        _hasCallback = Features.has(bm, Features.CALLBACK);

        if (_isCapped) {
            if (cfg.maxSupply < cfg.initialSupply || cfg.maxSupply == 0) revert CapExceeded();
            cap = cfg.maxSupply;
        }

        // exclude creator + this contract from fees and limits by default
        excludedFromFees[cfg.owner_] = true;
        excludedFromFees[address(this)] = true;
        excludedFromLimits[cfg.owner_] = true;
        excludedFromLimits[address(this)] = true;

        if (_isTaxable) {
            _setTaxRates(cfg.buyTaxBps, cfg.sellTaxBps, cfg.transferTaxBps);
            taxWallet = cfg.taxWallet == address(0) ? cfg.owner_ : cfg.taxWallet;
            excludedFromFees[taxWallet] = true;
        }
        if (_isDeflationary) {
            _setBurnFee(cfg.burnBps);
        }
        if (_hasWhitelist) {
            whitelisted[cfg.owner_] = true;
            whitelisted[address(this)] = true;
            whitelistEnabled = true;
        }

        // mint initial supply (respects cap via _update path checks below)
        if (cfg.initialSupply > 0) {
            _mint(cfg.owner_, cfg.initialSupply);
        }

        // anti-whale defaults: set after supply so % is meaningful
        if (_hasAntiWhale) {
            uint256 supply = totalSupply();
            uint256 floor = (supply * MIN_LIMIT_BPS) / 10_000;
            uint256 mtx = (supply * cfg.maxTxBps) / 10_000;
            uint256 mw = (supply * cfg.maxWalletBps) / 10_000;
            maxTxAmount = mtx < floor ? floor : mtx;
            maxWalletAmount = mw < floor ? floor : mw;
        }

        if (!_creditsRemoved) {
            emit TokenForgeCredit(GENERATOR);
        }
    }

    // ----------------------------------------------------------------
    // Metadata
    // ----------------------------------------------------------------
    function decimals() public view override returns (uint8) {
        return _hasCustomDecimals ? _customDecimals : 18;
    }

    /// @notice Public credit string; empty when the Remove Credits feature was bought.
    function generator() external view returns (string memory) {
        return _creditsRemoved ? "" : GENERATOR;
    }

    // ----------------------------------------------------------------
    // Modifiers
    // ----------------------------------------------------------------
    modifier whenFeature(bool enabled) {
        if (!enabled) revert FeatureDisabled();
        _;
    }

    // ----------------------------------------------------------------
    // Mint / supply
    // ----------------------------------------------------------------
    /// @notice Mint new tokens (Mintable). Respects the cap when Capped.
    function mint(address to, uint256 amount) external whenFeature(_isMintable) onlyOwner {
        _mint(to, amount);
    }

    function _maxSupplyCheck(uint256 mintedTotal) private view {
        if (_isCapped && mintedTotal > cap) revert CapExceeded();
    }

    // ----------------------------------------------------------------
    // Pausable
    // ----------------------------------------------------------------
    function pause() external whenFeature(_isPausable) onlyOwner {
        paused = true;
        emit Paused(_msgSender());
    }

    function unpause() external whenFeature(_isPausable) onlyOwner {
        paused = false;
        emit Unpaused(_msgSender());
    }

    // ----------------------------------------------------------------
    // Blacklist
    // ----------------------------------------------------------------
    function setBlacklist(address[] calldata accounts, bool value)
        external
        whenFeature(_hasBlacklist)
        onlyOwner
    {
        for (uint256 i = 0; i < accounts.length; i++) {
            blacklisted[accounts[i]] = value;
            emit BlacklistUpdated(accounts[i], value);
        }
    }

    // ----------------------------------------------------------------
    // Whitelist
    // ----------------------------------------------------------------
    function setWhitelist(address[] calldata accounts, bool value)
        external
        whenFeature(_hasWhitelist)
        onlyOwner
    {
        for (uint256 i = 0; i < accounts.length; i++) {
            whitelisted[accounts[i]] = value;
            emit WhitelistUpdated(accounts[i], value);
        }
    }

    function setWhitelistEnabled(bool value) external whenFeature(_hasWhitelist) onlyOwner {
        whitelistEnabled = value;
        emit WhitelistEnabledSet(value);
    }

    // ----------------------------------------------------------------
    // Controlled (forced) transfer
    // ----------------------------------------------------------------
    /// @notice Move tokens without allowance (compliance/RWA). Owner-only.
    function controlledTransfer(address from, address to, uint256 amount)
        external
        whenFeature(_isControlled)
        onlyOwner
    {
        if (to == address(0)) revert ZeroAddress();
        _transfer(from, to, amount);
        emit ControlledTransfer(from, to, amount, _msgSender());
    }

    // ----------------------------------------------------------------
    // Tax
    // ----------------------------------------------------------------
    function _setTaxRates(uint16 buy, uint16 sell, uint16 transfer_) private {
        if (buy > MAX_SINGLE_FEE_BPS || sell > MAX_SINGLE_FEE_BPS || transfer_ > MAX_SINGLE_FEE_BPS) {
            revert FeeTooHigh();
        }
        // combined worst-case fee on a single transfer must respect the global cap
        uint16 maxTax = buy > sell ? buy : sell;
        maxTax = transfer_ > maxTax ? transfer_ : maxTax;
        if (uint256(maxTax) + uint256(burnFeeBps) > MAX_TOTAL_FEE_BPS) revert FeeTooHigh();
        buyTaxBps = buy;
        sellTaxBps = sell;
        transferTaxBps = transfer_;
        emit TaxRatesUpdated(buy, sell, transfer_);
    }

    function setTaxRates(uint16 buy, uint16 sell, uint16 transfer_)
        external
        whenFeature(_isTaxable)
        onlyOwner
    {
        _setTaxRates(buy, sell, transfer_);
    }

    function setTaxWallet(address wallet) external whenFeature(_isTaxable) onlyOwner {
        if (wallet == address(0)) revert ZeroAddress();
        taxWallet = wallet;
        excludedFromFees[wallet] = true;
        emit TaxWalletUpdated(wallet);
    }

    function setAmmPair(address pair, bool value) external whenFeature(_isTaxable) onlyOwner {
        if (pair == address(0)) revert ZeroAddress();
        isAmmPair[pair] = value;
        emit AmmPairUpdated(pair, value);
    }

    function setExcludedFromFees(address account, bool excluded)
        external
        whenFeature(_isTaxable)
        onlyOwner
    {
        excludedFromFees[account] = excluded;
        emit FeeExclusionUpdated(account, excluded);
    }

    // ----------------------------------------------------------------
    // Deflationary
    // ----------------------------------------------------------------
    function _setBurnFee(uint16 bps) private {
        if (bps > MAX_SINGLE_FEE_BPS) revert FeeTooHigh();
        uint16 maxTax = buyTaxBps > sellTaxBps ? buyTaxBps : sellTaxBps;
        maxTax = transferTaxBps > maxTax ? transferTaxBps : maxTax;
        if (uint256(maxTax) + uint256(bps) > MAX_TOTAL_FEE_BPS) revert FeeTooHigh();
        burnFeeBps = bps;
        emit BurnFeeUpdated(bps);
    }

    function setBurnFee(uint16 bps) external whenFeature(_isDeflationary) onlyOwner {
        _setBurnFee(bps);
    }

    // ----------------------------------------------------------------
    // Anti-whale
    // ----------------------------------------------------------------
    function setLimits(uint256 newMaxTx, uint256 newMaxWallet)
        external
        whenFeature(_hasAntiWhale)
        onlyOwner
    {
        uint256 floor = (totalSupply() * MIN_LIMIT_BPS) / 10_000;
        // owner may RAISE or disable (0 == disabled) but never set a non-zero value below the floor
        if (newMaxTx != 0 && newMaxTx < floor) revert LimitTooLow();
        if (newMaxWallet != 0 && newMaxWallet < floor) revert LimitTooLow();
        maxTxAmount = newMaxTx;
        maxWalletAmount = newMaxWallet;
        emit LimitsUpdated(newMaxTx, newMaxWallet);
    }

    function setExcludedFromLimits(address account, bool excluded)
        external
        whenFeature(_hasAntiWhale)
        onlyOwner
    {
        excludedFromLimits[account] = excluded;
        emit LimitExclusionUpdated(account, excluded);
    }

    // ----------------------------------------------------------------
    // Batch operations
    // ----------------------------------------------------------------
    function transferBatch(address[] calldata to, uint256[] calldata amounts)
        external
        whenFeature(_hasBatch)
    {
        if (to.length != amounts.length) revert LengthMismatch();
        for (uint256 i = 0; i < to.length; i++) {
            _transfer(_msgSender(), to[i], amounts[i]);
        }
    }

    function mintBatch(address[] calldata to, uint256[] calldata amounts)
        external
        whenFeature(_hasBatch)
        onlyOwner
    {
        if (!_isMintable) revert FeatureDisabled();
        if (to.length != amounts.length) revert LengthMismatch();
        for (uint256 i = 0; i < to.length; i++) {
            _mint(to[i], amounts[i]);
        }
    }

    function burnBatch(address[] calldata from, uint256[] calldata amounts)
        external
        whenFeature(_hasBatch)
    {
        if (!_isBurnable) revert FeatureDisabled();
        if (from.length != amounts.length) revert LengthMismatch();
        for (uint256 i = 0; i < from.length; i++) {
            if (from[i] != _msgSender()) {
                _spendAllowance(from[i], _msgSender(), amounts[i]);
            }
            _burn(from[i], amounts[i]);
        }
    }

    // ----------------------------------------------------------------
    // Token recover
    // ----------------------------------------------------------------
    /// @notice Rescue ERC-20s sent to this contract by mistake. Cannot touch holder balances.
    function recoverERC20(address token, uint256 amount)
        external
        whenFeature(_hasTokenRecover)
        onlyOwner
        nonReentrant
    {
        IERC20(token).safeTransfer(owner(), amount);
        emit ERC20Recovered(token, amount);
    }

    /// @notice Rescue native coin sent to this contract by mistake.
    function recoverETH() external whenFeature(_hasTokenRecover) onlyOwner nonReentrant {
        uint256 bal = address(this).balance;
        (bool ok, ) = payable(owner()).call{value: bal}("");
        require(ok, "ETH transfer failed");
        emit ETHRecovered(bal);
    }

    // ----------------------------------------------------------------
    // Feature-gated inherited entry points
    // These come from OZ base classes and are always present in bytecode, so we
    // gate them on the immutable flags to honour the per-feature pricing model.
    // ----------------------------------------------------------------
    function burn(uint256 amount) public override whenFeature(_isBurnable) {
        super.burn(amount);
    }

    function burnFrom(address account, uint256 amount) public override whenFeature(_isBurnable) {
        super.burnFrom(account, amount);
    }

    function permit(
        address owner_,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public override whenFeature(_hasPermit) {
        super.permit(owner_, spender, value, deadline, v, r, s);
    }

    // Only the `bytes data` overloads are virtual in OZ ERC1363; the 2-arg
    // versions forward to these, so gating these covers all callback entry points.
    function transferAndCall(address to, uint256 value, bytes memory data)
        public
        override
        whenFeature(_hasCallback)
        returns (bool)
    {
        return super.transferAndCall(to, value, data);
    }

    function transferFromAndCall(address from, address to, uint256 value, bytes memory data)
        public
        override
        whenFeature(_hasCallback)
        returns (bool)
    {
        return super.transferFromAndCall(from, to, value, data);
    }

    function approveAndCall(address spender, uint256 value, bytes memory data)
        public
        override
        whenFeature(_hasCallback)
        returns (bool)
    {
        return super.approveAndCall(spender, value, data);
    }

    // ----------------------------------------------------------------
    // Core transfer hook: blacklist -> whitelist -> pause -> anti-whale -> tax -> burn
    // ----------------------------------------------------------------
    function _update(address from, address to, uint256 value) internal override {
        // cap enforcement on mint
        if (from == address(0)) {
            _maxSupplyCheck(totalSupply() + value);
        }

        // blacklist
        if (_hasBlacklist) {
            if (blacklisted[from]) revert Blacklisted(from);
            if (blacklisted[to]) revert Blacklisted(to);
        }

        // whitelist (mint/burn exempt via address(0))
        if (_hasWhitelist && whitelistEnabled) {
            if (from != address(0) && !whitelisted[from]) revert NotWhitelisted(from);
            if (to != address(0) && !whitelisted[to]) revert NotWhitelisted(to);
        }

        // pause (mint/burn still allowed for owner flows? no: pause halts all transfers)
        if (_isPausable && paused) {
            // allow mint (from==0) and burn (to==0) so owner can still manage supply while paused
            if (from != address(0) && to != address(0)) revert FeatureDisabled();
        }

        bool isTransfer = from != address(0) && to != address(0);

        // anti-whale (only on real transfers, skip excluded)
        if (_hasAntiWhale && isTransfer && !excludedFromLimits[from] && !excludedFromLimits[to]) {
            if (maxTxAmount != 0 && value > maxTxAmount) revert FeeTooHigh();
            if (maxWalletAmount != 0 && !isAmmPair[to]) {
                if (balanceOf(to) + value > maxWalletAmount) revert FeeTooHigh();
            }
        }

        // fees (tax + auto-burn) only on real transfers and only when not excluded
        uint256 fee;
        uint256 burnPart;
        if (isTransfer && !excludedFromFees[from] && !excludedFromFees[to]) {
            if (_isTaxable) {
                uint16 rate;
                if (isAmmPair[from]) {
                    rate = buyTaxBps;
                } else if (isAmmPair[to]) {
                    rate = sellTaxBps;
                } else {
                    rate = transferTaxBps;
                }
                if (rate > 0) {
                    fee = (value * rate) / 10_000;
                }
            }
            if (_isDeflationary && burnFeeBps > 0) {
                burnPart = (value * burnFeeBps) / 10_000;
            }
        }

        if (fee == 0 && burnPart == 0) {
            super._update(from, to, value);
            return;
        }

        uint256 net = value - fee - burnPart;
        super._update(from, to, net);
        if (fee > 0) {
            super._update(from, taxWallet, fee);
        }
        if (burnPart > 0) {
            super._update(from, address(0), burnPart); // true burn
        }
    }

    // resolve multiple-inheritance _update (ERC20 + ERC1363 share ERC20)
    // (ERC1363 does not override _update; this single override suffices)

    receive() external payable {}
}

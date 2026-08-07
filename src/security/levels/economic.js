/**
 * @file economic.js
 * @description DEX & economic logic failures (Ethernaut levels 22, 23, 31, 34,
 *              36, 38). Snippets are original minimal illustrations of each
 *              flaw, not copies of the level contracts.
 */

export const LEVELS = [
  {
    id: 22,
    slug: 'dex',
    name: 'Dex',
    difficulty: 3,
    category: 'economic',
    summary: 'Pricing a swap from live token balances lets a trader walk the ratio until one reserve is empty.',
    attack:
      'getSwapPrice quotes amount * balanceOf(to) / balanceOf(from) straight from the pool’s live ' +
      'balances, so every swap is priced by whatever the previous swap left behind: there is no ' +
      'constant-product invariant, no fee, and no slippage bound. Swapping an entire holding back ' +
      'and forth alternately over- and under-prices each leg, and the imbalance compounds instead ' +
      'of decaying, so after six legs one quote exceeds a whole reserve and the trader takes all of it. ' +
      'Truncating integer division only decides the exact leg count, not whether the drain works.',
    prevention:
      'Price from reserves the pool tracks in its own storage, under an invariant that can only grow ' +
      '(constant product plus a fee) — never from balanceOf, which anyone can move with a direct ' +
      'transfer. Require a caller-supplied minimum output so a bad quote reverts instead of settling.',
    vulnerable: `contract Dex {
    address public token1;
    address public token2;

    // The price is read off whatever the pool happens to hold right now.
    function getSwapPrice(address from, address to, uint256 amount)
        public view returns (uint256)
    {
        return (amount * IERC20(to).balanceOf(address(this)))
            / IERC20(from).balanceOf(address(this));
    }

    function swap(address from, address to, uint256 amount) public {
        uint256 out = getSwapPrice(from, to, amount);
        IERC20(from).transferFrom(msg.sender, address(this), amount);
        IERC20(to).transfer(msg.sender, out);
    }
}`,
    fixed: `contract Dex {
    IERC20 public token1;
    IERC20 public token2;
    uint256 public reserve1; // accounted internally, never read from balanceOf
    uint256 public reserve2;

    // Constant product with a 0.3% fee: k only grows, so a round trip gives
    // back less than it took and a donated balance cannot move the price.
    function swap1For2(uint256 amountIn, uint256 minOut) external {
        uint256 inWithFee = amountIn * 997;
        uint256 out = (inWithFee * reserve2) / (reserve1 * 1000 + inWithFee);
        require(out >= minOut, "slippage");
        reserve1 += amountIn;
        reserve2 -= out;
        token1.transferFrom(msg.sender, address(this), amountIn);
        token2.transfer(msg.sender, out);
    }
}`,
    refs: [{ label: 'Play Dex on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/22' }],
  },
  {
    id: 23,
    slug: 'dex-two',
    name: 'Dex Two',
    difficulty: 4,
    category: 'economic',
    summary: 'Without a pair check, the pool prices itself against a worthless token the caller minted.',
    attack:
      'swap() verifies only that the caller owns the amount being sold; the require that both ' +
      'addresses are the pool’s registered token1/token2 is missing, so the caller names the pair. ' +
      'An attacker deploys their own ERC20, sends the pool a token of it so the quote denominator ' +
      'is 1, then swaps that worthless token in and takes the entire balance of a real token out — ' +
      'repeated once per side, this empties the pool. The pricing formula, still reading balanceOf, ' +
      'quotes any pair it is handed.',
    prevention:
      'Whitelist the assets a pool will touch: reject any from/to combination other than the ' +
      'registered pair, and track reserves internally so an unregistered token can never enter the ' +
      'pricing formula. Treat every address argument as attacker-chosen until checked against stored state.',
    vulnerable: `contract Dex {
    address public token1;
    address public token2;

    // Nothing requires that from and to are this pool's own tokens.
    function swap(address from, address to, uint256 amount) public {
        require(IERC20(from).balanceOf(msg.sender) >= amount, "not enough");
        uint256 out = (amount * IERC20(to).balanceOf(address(this)))
            / IERC20(from).balanceOf(address(this));
        IERC20(from).transferFrom(msg.sender, address(this), amount);
        IERC20(to).transfer(msg.sender, out);
    }
}`,
    fixed: `contract Dex {
    address public token1;
    address public token2;
    mapping(address => uint256) public reserves; // accounted, not balanceOf

    function swap(address from, address to, uint256 amount) public {
        // Only the two tokens this pool was configured with may enter it.
        require(
            (from == token1 && to == token2) || (from == token2 && to == token1),
            "unsupported pair"
        );
        uint256 out = (amount * reserves[to]) / (reserves[from] + amount);
        reserves[from] += amount;
        reserves[to] -= out;
        IERC20(from).transferFrom(msg.sender, address(this), amount);
        IERC20(to).transfer(msg.sender, out);
    }
}`,
    refs: [{ label: 'Play Dex Two on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/23' }],
  },
  {
    id: 31,
    slug: 'stake',
    name: 'Stake',
    difficulty: 6,
    category: 'economic',
    summary: 'Stake credit is granted on allowance alone, and the transfer meant to back it may silently fail.',
    attack:
      'StakeWETH checks the caller’s WETH allowance rather than their balance, then credits ' +
      'UserStake and totalStaked before any tokens move. The transferFrom is issued as a raw .call ' +
      'whose success flag is captured and thrown away, so a token that reverts, returns false, or ' +
      'does not exist at that address still leaves the credit standing. Because ether and WETH share ' +
      'one ledger, Unstake then pays real wei out against a position that was never funded, emptying ' +
      'the contract while totalStaked stays high.',
    prevention:
      'Credit only value the contract has confirmed it received: require the boolean returned by ' +
      'transferFrom (or use SafeERC20), and prefer measuring the balance delta so fee-on-transfer ' +
      'tokens cannot over-credit. Keep every asset in its own ledger so an ether withdrawal can never ' +
      'be settled against a token deposit.',
    vulnerable: `contract Stake {
    mapping(address => uint256) public userStake; // credited in ether terms
    uint256 public totalStaked;
    address public weth;

    function stakeWETH(uint256 amount) external {
        // Allowance is not balance, and the transfer's result is discarded.
        require(IERC20(weth).allowance(msg.sender, address(this)) >= amount, "no allowance");
        userStake[msg.sender] += amount;
        totalStaked += amount;
        weth.call(abi.encodeWithSignature(
            "transferFrom(address,address,uint256)", msg.sender, address(this), amount));
    }

    function unstake(uint256 amount) external {
        require(userStake[msg.sender] >= amount, "too much");
        userStake[msg.sender] -= amount;
        totalStaked -= amount;
        payable(msg.sender).call{value: amount}(""); // ether for a WETH credit
    }
}`,
    fixed: `contract Stake {
    mapping(address => uint256) public ethStake;
    mapping(address => uint256) public wethStake; // separate ledger per asset
    IERC20 public weth;

    function stakeWETH(uint256 amount) external {
        uint256 before = weth.balanceOf(address(this));
        // The return value is required, and only what arrived is credited.
        require(weth.transferFrom(msg.sender, address(this), amount), "transfer failed");
        wethStake[msg.sender] += weth.balanceOf(address(this)) - before;
    }

    function unstakeWETH(uint256 amount) external {
        wethStake[msg.sender] -= amount; // underflow reverts under ^0.8
        require(weth.transfer(msg.sender, amount), "transfer failed");
    }

    function unstakeETH(uint256 amount) external {
        ethStake[msg.sender] -= amount;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "send failed");
    }
}`,
    refs: [{ label: 'Play Stake on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/31' }],
  },
  {
    id: 34,
    slug: 'bet-house',
    name: 'Bet House',
    difficulty: 4,
    category: 'economic',
    summary: 'The pool burns whatever receipts you still hold, so moving them first makes one deposit reusable.',
    attack:
      'Pool.deposit mints a freely transferable receipt token for every deposit, but withdrawAll ' +
      'refunds the recorded deposit and then burns balanceOf(msg.sender) — the caller’s current ' +
      'receipt balance — instead of the amount that deposit minted. Sending the receipts to a second ' +
      'address first turns the burn into a no-op, so the same deposit tokens can be deposited, ' +
      'stripped of receipts, and withdrawn again without limit until that second address holds the ' +
      'balance the bet requires. lockDeposits() has no guard at all, so the same address flips its own ' +
      'depositsLocked flag to true without ever depositing, satisfying BetHouse’s other precondition.',
    prevention:
      'Burn against a per-account amount the contract recorded at mint time, not a live balance the ' +
      'holder can move — the receipt and the claim must be destroyed in the same accounting entry. ' +
      'Guard any state other contracts read as a precondition, and never let one global flag stand in ' +
      'for per-account bookkeeping.',
    vulnerable: `contract Pool {
    mapping(address => uint256) public deposited;
    mapping(address => bool) public locked;
    IReceipt public receipt; // freely transferable, minted 1:1 on deposit

    function deposit(uint256 amount) external {
        deposited[msg.sender] += amount;
        depositToken.transferFrom(msg.sender, address(this), amount);
        receipt.mint(msg.sender, amount);
    }

    function withdrawAll() external {
        uint256 amount = deposited[msg.sender];
        deposited[msg.sender] = 0;
        depositToken.transfer(msg.sender, amount);
        // Burns what is left in the wallet, not what this deposit minted:
        // move the receipts away first and nothing at all is burned.
        receipt.burn(msg.sender, receipt.balanceOf(msg.sender));
    }

    // No deposit required to claim your funds are locked.
    function lockDeposits() external { locked[msg.sender] = true; }
}`,
    fixed: `contract Pool {
    mapping(address => uint256) public deposited;
    mapping(address => uint256) public minted; // what this account was issued
    mapping(address => bool) public locked;

    function withdrawAll() external {
        require(!locked[msg.sender], "deposits locked");
        uint256 amount = deposited[msg.sender];
        uint256 owed = minted[msg.sender];
        deposited[msg.sender] = 0;
        minted[msg.sender] = 0;
        // The exact receipts this deposit created must come back with it.
        receipt.burnFrom(msg.sender, owed);
        depositToken.transfer(msg.sender, amount);
    }

    function lockDeposits() external {
        require(deposited[msg.sender] > 0, "nothing deposited");
        locked[msg.sender] = true;
    }
}`,
    refs: [{ label: 'Play Bet House on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/34' }],
  },
  {
    id: 36,
    slug: 'cashback',
    name: 'Cashback',
    difficulty: 8,
    category: 'economic',
    summary: 'Rewards are paid on numbers the payer reports, from storage the payer is free to rewrite.',
    attack:
      'The hub authorises a caller by reading msg.sender.code and matching the EIP-7702 delegation ' +
      'designator (0xef0100 followed by 20 bytes) against its own address, then trusts everything ' +
      'that account reports — the transient unlocked flag and the milestone nonce both live in the ' +
      'account’s storage, not the hub’s. An EOA may delegate to any implementation it likes, write ' +
      'that nonce slot directly, and re-delegate to the hub with the counter pre-seeded, so the ' +
      'milestone bonus fires on the very first payment. Accrual is also unconstrained in who receives ' +
      'the payment, so the same wei paid to yourself in a loop mints cashback at nothing but gas cost.',
    prevention:
      'A delegation designator proves which code an account runs, never that its storage is honest: ' +
      'keep every balance, nonce, and lock the protocol rewards in the protocol’s own storage, keyed ' +
      'by account. Reward only value the contract itself observed moving to a distinct counterparty, ' +
      'not an amount the caller passes in, and reject self-payments outright.',
    vulnerable: `contract Rewards {
    Rewards immutable HUB = Rewards(payable(address(this)));
    uint256 public counter;              // slot lives in each delegated EOA
    mapping(address => uint256) public points;
    mapping(address => bool) public gotBonus;

    // Runs inside an EOA that has delegated to this code (EIP-7702).
    function payWithRewards(address to, uint256 amount) external {
        (bool ok,) = to.call{value: amount}(""); // to may be msg.sender
        require(ok, "pay failed");
        counter += 1;
        HUB.accrue(amount);
    }

    // Runs on the hub; the caller is trusted because its code delegates here.
    function accrue(uint256 amount) external {
        bytes memory code = msg.sender.code;
        address delegate;
        assembly { delegate := mload(add(code, 0x17)) } // 0xef0100 ++ address
        require(delegate == address(HUB), "not delegated");
        points[msg.sender] += amount / 200;             // 0.5% of a self-payment
        if (Rewards(payable(msg.sender)).counter() == 10000) gotBonus[msg.sender] = true;
    }
}`,
    fixed: `contract Rewards {
    Rewards immutable HUB = Rewards(payable(address(this)));
    mapping(address => uint256) public points;
    mapping(address => uint256) public counter; // hub storage, not the EOA's
    mapping(address => bool) public gotBonus;

    function payWithRewards(address to, uint256 amount) external {
        require(to != address(this) && to != tx.origin, "no self-payment");
        (bool ok,) = to.call{value: amount}("");
        require(ok, "pay failed");
        HUB.accrue(to, amount);
    }

    function accrue(address to, uint256 amount) external {
        require(_delegatesToHub(msg.sender), "not delegated");
        require(to != msg.sender && to != tx.origin, "no self-payment");
        // The counter the bonus depends on is the hub's own, so re-delegating
        // an account cannot pre-seed it.
        counter[msg.sender] += 1;
        points[msg.sender] += amount / 200;
        if (counter[msg.sender] == 10000) gotBonus[msg.sender] = true;
    }
}`,
    refs: [{ label: 'Play Cashback on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/36' }],
  },
  {
    id: 38,
    slug: 'unique-nft',
    name: 'UniqueNFT',
    difficulty: 5,
    category: 'economic',
    summary: 'The receiver hook fires before the mint, so the free EOA path can be re-entered for a second NFT.',
    attack:
      'The private mint helper calls checkOnERC721Received on the recipient before _mint, so the ' +
      'balanceOf(msg.sender) == 0 guard still passes while the callback is running. The free path, ' +
      'mintNFTEOA, is protected only by tx.origin == msg.sender and — unlike the payable path — ' +
      'carries no nonReentrant modifier, and since EIP-7702 an EOA can hold code while still being ' +
      'tx.origin. Delegating the account to a contract whose onERC721Received calls mintNFTEOA again ' +
      're-enters that unguarded path and mints a second and third token, skipping the 1 ether fee the ' +
      'contract path charges.',
    prevention:
      'Follow checks-effects-interactions: record the mint before any callback, and use _safeMint so ' +
      'the receiver hook runs after the balance update rather than before it. Do not treat ' +
      'tx.origin == msg.sender as an is-an-EOA test — EIP-7702 broke that assumption — and put the ' +
      'reentrancy guard on every entry point that reaches shared state, not only the one you expect ' +
      'contracts to use.',
    vulnerable: `contract UniqueNFT is ERC721 {
    uint256 public nextId;

    // "Only EOAs mint for free" — true before EIP-7702, not after.
    function mintFree() external {
        require(tx.origin == msg.sender, "not an EOA");
        _mintOne();
    }

    function _mintOne() private {
        require(balanceOf(msg.sender) == 0, "one per address");
        uint256 id = nextId++;
        // The hook fires before the mint, so balanceOf is still 0 here and
        // the recipient can call mintFree() again from inside it.
        ERC721Utils.checkOnERC721Received(address(0), address(0), msg.sender, id, "");
        _mint(msg.sender, id);
    }
}`,
    fixed: `contract UniqueNFT is ERC721, ReentrancyGuard {
    uint256 public nextId;
    mapping(address => bool) public minted;

    function mintFree() external nonReentrant {
        // Code length, not tx.origin: a 7702 account has code.
        require(msg.sender.code.length == 0, "contracts pay the fee");
        _mintOne();
    }

    function _mintOne() private {
        require(!minted[msg.sender], "one per address");
        minted[msg.sender] = true;   // effect recorded before any interaction
        uint256 id = nextId++;
        _safeMint(msg.sender, id);   // hook runs after the balance settles
    }
}`,
    refs: [{ label: 'Play UniqueNFT on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/38' }],
  },
];

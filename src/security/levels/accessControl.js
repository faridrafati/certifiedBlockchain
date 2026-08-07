/**
 * @file accessControl.js
 * @description Access control & authorization failures (Ethernaut levels 1, 2,
 *              4, 15, 26, 28). Snippets are original minimal illustrations of
 *              each flaw, not copies of the level contracts.
 */

export const LEVELS = [
  {
    id: 1,
    slug: 'fallback',
    name: 'Fallback',
    difficulty: 1,
    category: 'access-control',
    summary: 'A payable fallback hands ownership to anyone who sends wei directly.',
    attack:
      'The contract guards its withdraw function with an owner check, but its receive/fallback ' +
      'function reassigns owner to msg.sender for any direct transfer that meets a trivial ' +
      'condition. An attacker satisfies the contribution precondition, sends 1 wei with no ' +
      'calldata to trigger the fallback, becomes owner, and drains the balance.',
    prevention:
      'Treat receive() and fallback() as untrusted public entry points: they should never mutate ' +
      'privileged state. Keep ownership transfer in one explicit function guarded by onlyOwner, ' +
      'and prefer a two-step transfer so a mistake is recoverable.',
    vulnerable: `contract Vault {
    address public owner = msg.sender;

    // Any direct transfer can seize ownership.
    receive() external payable {
        require(msg.value > 0);
        owner = msg.sender;
    }

    function withdraw() external {
        require(msg.sender == owner, "not owner");
        payable(owner).transfer(address(this).balance);
    }
}`,
    fixed: `contract Vault {
    address public owner = msg.sender;
    address public pendingOwner;

    // Accepts ether, touches no privileged state.
    receive() external payable {}

    function transferOwnership(address next) external {
        require(msg.sender == owner, "not owner");
        pendingOwner = next;
    }

    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "not pending owner");
        owner = pendingOwner;
        pendingOwner = address(0);
    }

    function withdraw() external {
        require(msg.sender == owner, "not owner");
        payable(owner).transfer(address(this).balance);
    }
}`,
    refs: [{ label: 'Play Fallback on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/1' }],
  },
  {
    id: 2,
    slug: 'fallout',
    name: 'Fallout',
    difficulty: 2,
    category: 'access-control',
    summary: 'A misspelled constructor stays an ordinary public function, so the first caller becomes owner.',
    attack:
      'Before Solidity 0.4.22 the constructor was just a function sharing the contract name, so a ' +
      'one-character typo (Fal1out instead of Fallout) leaves an ordinary public function sitting ' +
      'in the deployed ABI. Nothing marks it as already-run: the first person to call it sets ' +
      'owner = msg.sender and inherits every onlyOwner power, including the withdrawal function. ' +
      'The same shape reappears in modern code as an initialize() that nobody guarded.',
    prevention:
      'Use the constructor keyword so the compiler, not a name match, decides what runs once at ' +
      'deployment. When setup must happen after deployment (proxies), use OpenZeppelin ' +
      'Initializable with the initializer modifier so the setup path can never be replayed.',
    vulnerable: `contract Treasury {
    address public owner;

    // Intended as one-time setup, but it is just a public function:
    // whoever calls it first owns the contract.
    function initialize() public payable {
        owner = msg.sender;
    }

    function collect() external {
        require(msg.sender == owner, "not owner");
        payable(msg.sender).transfer(address(this).balance);
    }
}`,
    fixed: `contract Treasury {
    address public owner;

    // The compiler guarantees a constructor runs exactly once, at
    // deployment, and never appears in the deployed ABI.
    constructor() payable {
        owner = msg.sender;
    }

    function collect() external {
        require(msg.sender == owner, "not owner");
        payable(msg.sender).transfer(address(this).balance);
    }
}`,
    refs: [{ label: 'Play Fallout on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/2' }],
  },
  {
    id: 4,
    slug: 'telephone',
    name: 'Telephone',
    difficulty: 1,
    category: 'access-control',
    summary: 'An owner check on tx.origin trusts the whole call chain, not the caller in front of it.',
    attack:
      'The contract decides authorization by comparing tx.origin, the externally owned account ' +
      'that signed the transaction, against msg.sender, the immediate caller. tx.origin stays the ' +
      'victim EOA through every nested CALL, so the two values differ exactly when a contract sits ' +
      'in the middle — and any contract the owner is persuaded to interact with, an airdrop claim ' +
      'or a swap router, can relay the ownership call from that position. This is also why ' +
      'tx.origin phishing survives however careful the owner is about approvals.',
    prevention:
      'Authorize on msg.sender, never tx.origin: msg.sender names the contract or account directly ' +
      'in front of you and cannot be inherited by an intermediary. Use OpenZeppelin Ownable with ' +
      'onlyOwner, plus a two-step transferOwnership/acceptOwnership handoff.',
    vulnerable: `contract Registry {
    address public owner = msg.sender;

    // tx.origin is the transaction signer, not the caller. Any contract
    // the owner calls can relay this and pass the check.
    function changeOwner(address next) external {
        require(tx.origin == owner, "not owner");
        owner = next;
    }
}`,
    fixed: `contract Registry {
    address public owner = msg.sender;
    address public pendingOwner;

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    // msg.sender is the immediate caller and cannot be spoofed by a
    // contract sitting in the middle of the call chain.
    function transferOwnership(address next) external onlyOwner {
        pendingOwner = next;
    }

    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "not pending owner");
        owner = pendingOwner;
        pendingOwner = address(0);
    }
}`,
    refs: [{ label: 'Play Telephone on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/4' }],
  },
  {
    id: 15,
    slug: 'naught-coin',
    name: 'Naught Coin',
    difficulty: 5,
    category: 'access-control',
    summary: 'A time lock placed on transfer() leaves the inherited approve/transferFrom path wide open.',
    attack:
      'The token overrides ERC-20 transfer with a lockTokens modifier that blocks the original ' +
      'holder until a ten-year timelock expires, but it inherits approve and transferFrom from the ' +
      'base ERC20 untouched. The holder calls approve(accomplice, balance) and the accomplice calls ' +
      'transferFrom(holder, accomplice, balance); that route reaches the internal _transfer without ' +
      'the modified function ever executing, so the lock is simply never evaluated.',
    prevention:
      'Enforce invariants at the single lowest choke point every path funnels through — the _update ' +
      'hook in OpenZeppelin ERC-20 v5, _beforeTokenTransfer in v4 — instead of on individual ' +
      'external functions. When extending a standard, enumerate every inherited mutator and prove ' +
      'each one is covered by the new rule.',
    vulnerable: `contract LockedToken is ERC20 {
    address public holder;
    uint256 public unlockAt;

    // Only transfer() is guarded. approve() and transferFrom() are
    // inherited untouched and reach _transfer without this check.
    function transfer(address to, uint256 amount)
        public
        override
        returns (bool)
    {
        require(msg.sender != holder || block.timestamp > unlockAt, "locked");
        return super.transfer(to, amount);
    }
}`,
    fixed: `contract LockedToken is ERC20 {
    address public holder;
    uint256 public unlockAt;

    // One choke point: transfer, transferFrom, mint and burn all funnel
    // through _update, so no inherited entry point can route around it.
    function _update(address from, address to, uint256 amount)
        internal
        override
    {
        require(from != holder || block.timestamp > unlockAt, "locked");
        super._update(from, to, amount);
    }
}`,
    refs: [
      { label: 'Play Naught Coin on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/15' },
    ],
  },
  {
    id: 26,
    slug: 'double-entry-point',
    name: 'DoubleEntryPoint',
    difficulty: 4,
    category: 'access-control',
    summary: 'A legacy token forwards into the real one, so an address-based deny check guards the wrong door.',
    attack:
      'The vault refuses to sweep its underlying token by comparing the token address it was handed, ' +
      'but a legacy token contract shares the same balances and forwards every transfer into the ' +
      'real token as delegateTransfer(to, value, msg.sender). Sweeping the legacy address therefore ' +
      'moves the underlying balance out through an entry point the deny check never inspected. ' +
      'delegateTransfer compounds it by taking the account whose tokens move as an argument and ' +
      'trusting its one permitted caller to fill it in honestly, so nothing downstream re-verifies it.',
    prevention:
      'Authorize on the effect, not on a name: assert which balance may change rather than which ' +
      'address was passed in, because several contracts can front the same asset. A privileged ' +
      'function must derive the acting account from msg.sender instead of accepting it as a ' +
      'parameter, and blanket sweep-everything helpers should be replaced by an explicit allow-list.',
    vulnerable: `interface IToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address who) external view returns (uint256);
}

contract Vault {
    IToken public underlying;
    address public recipient;

    // Denies one address, not one asset. An alias token that forwards
    // into \`underlying\` passes this check and drains it anyway.
    function sweep(IToken token) external {
        require(address(token) != address(underlying), "cannot sweep underlying");
        token.transfer(recipient, token.balanceOf(address(this)));
    }
}`,
    fixed: `interface IToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address who) external view returns (uint256);
}

contract Vault {
    IToken public underlying;
    address public recipient;
    mapping(address => bool) public sweepable;

    // Allow-list what may leave, then assert the protected balance did
    // not move, so no aliasing route can smuggle it out.
    function sweep(IToken token) external {
        require(sweepable[address(token)], "token not sweepable");
        uint256 held = underlying.balanceOf(address(this));
        token.transfer(recipient, token.balanceOf(address(this)));
        require(underlying.balanceOf(address(this)) == held, "underlying moved");
    }
}`,
    refs: [
      {
        label: 'Play DoubleEntryPoint on Ethernaut',
        url: 'https://ethernaut.openzeppelin.com/level/26',
      },
    ],
  },
  {
    id: 28,
    slug: 'gatekeeper-three',
    name: 'Gatekeeper Three',
    difficulty: 6,
    category: 'access-control',
    summary: 'A public function named like a constructor hands over ownership, and private storage is not secret.',
    attack:
      'The first gate requires msg.sender to be the owner, but ownership is assigned by an ordinary ' +
      'public function whose name merely looks like a constructor (construct0r), so an attacking ' +
      'contract calls it and becomes owner in the same transaction. The second gate is opened by a ' +
      'password held in a private state variable, which is still plain storage — anyone reads the ' +
      'slot with eth_getStorageAt and hands it straight back. The last gate only proceeds when a ' +
      'send of 0.001 ether to the owner returns false, which the attacker guarantees by deploying a ' +
      'contract with no payable receive or fallback.',
    prevention:
      'Initialize once in a real constructor, or with OpenZeppelin Initializable and the initializer ' +
      'modifier, and never leave a privileged setter public. Treat private as a visibility hint, not ' +
      'confidentiality: on-chain secrets must be stored as a keccak256 commitment (commit-reveal) or ' +
      'kept off-chain. Always check the return value of send/call and prefer pull-over-push, so a ' +
      'refusing recipient cannot steer control flow.',
    vulnerable: `contract Gate {
    address public owner;
    bytes32 private password; // "private" hides nothing on-chain
    address public entrant;

    // Looks like a constructor; it is a public function. First caller wins.
    function construct0r() public {
        owner = msg.sender;
    }

    function enter(bytes32 guess) external {
        require(msg.sender == owner, "not owner");
        require(guess == password, "bad password");
        entrant = tx.origin;
    }
}`,
    fixed: `contract Gate {
    address public owner;
    bytes32 private immutable passwordHash; // a commitment, not the secret
    address public entrant;

    constructor(bytes32 passwordHash_) {
        owner = msg.sender;
        passwordHash = passwordHash_;
    }

    function enter(bytes32 guess) external {
        require(msg.sender == owner, "not owner");
        require(
            keccak256(abi.encodePacked(guess, msg.sender)) == passwordHash,
            "bad password"
        );
        entrant = msg.sender;
    }
}`,
    refs: [
      {
        label: 'Play Gatekeeper Three on Ethernaut',
        url: 'https://ethernaut.openzeppelin.com/level/28',
      },
    ],
  },
];

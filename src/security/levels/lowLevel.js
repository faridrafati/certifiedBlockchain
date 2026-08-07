/**
 * @file lowLevel.js
 * @description Contract interaction & low-level call failures (Ethernaut levels
 *              0, 7, 11, 13, 14, 17, 18, 21, 27, 29, 30). Snippets are original
 *              minimal illustrations of each flaw, not copies of the level
 *              contracts.
 */

export const LEVELS = [
  {
    id: 0,
    slug: 'hello-ethernaut',
    name: 'Hello Ethernaut',
    difficulty: 0,
    category: 'low-level',
    summary: 'Nothing on chain is private: a password kept in the contract is readable by anyone who asks.',
    attack:
      'The instance keeps its password in a state variable and exposes authenticate(string), which ' +
      'compares the argument against it. The compiler-generated public getter hands the value out ' +
      'directly, and even a private variable is only unreadable to other contracts — eth_getStorageAt ' +
      'returns the raw slot to any RPC client. No cryptography is broken: the secret shipped with the ' +
      'deployment and is part of the public state.',
    prevention:
      'Never store a secret on chain. Publish a commitment — keccak256 of the secret plus a salt — and ' +
      'verify the pre-image at reveal time, or keep the secret off chain entirely and authenticate with ' +
      'a signature the contract recovers with ECDSA.',
    vulnerable: `contract Door {
    // Ships with the bytecode and is served by the generated getter.
    string public password = "open-sesame";
    mapping(address => bool) public cleared;

    function authenticate(string calldata guess) external {
        if (keccak256(bytes(guess)) == keccak256(bytes(password))) {
            cleared[msg.sender] = true;
        }
    }
}`,
    fixed: `contract Door {
    // Only the digest lives on chain; the pre-image never touches storage.
    bytes32 private immutable commitment;
    mapping(address => bool) public cleared;

    constructor(bytes32 commitment_) {
        commitment = commitment_;
    }

    function authenticate(string calldata secret, bytes32 salt) external {
        require(keccak256(abi.encodePacked(secret, salt)) == commitment, "bad secret");
        cleared[msg.sender] = true;
    }
}`,
    refs: [
      { label: 'Play Hello Ethernaut on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/0' },
    ],
  },
  {
    id: 7,
    slug: 'force',
    name: 'Force',
    difficulty: 5,
    category: 'low-level',
    summary: 'Ether can be forced in with selfdestruct, so a contract balance is never a safe invariant.',
    attack:
      'The contract declares no payable function, so its author assumes address(this).balance can only ' +
      'move through its own accounting. SELFDESTRUCT credits the target account without executing any ' +
      'code there — no receive, no fallback, no chance to revert. Ether sent to a counterfactual address ' +
      'before deployment and block coinbase payouts arrive the same way. Any invariant written as ' +
      'address(this).balance == internalTotal can therefore be broken permanently by one forced wei.',
    prevention:
      'Never treat address(this).balance as an accounting source or an invariant. Track deposits in a ' +
      'state variable that only your own payable entry points update, and settle against that internal ' +
      'ledger so unsolicited ether is simply ignored.',
    vulnerable: `contract Sale {
    uint256 public totalDeposited;

    function deposit() external payable {
        totalDeposited += msg.value;
    }

    // selfdestruct raises the balance with no code running here, so this
    // equality can be broken from outside and the sale bricked forever.
    function settle() external {
        require(address(this).balance == totalDeposited, "unexpected ether");
        uint256 owed = totalDeposited;
        totalDeposited = 0;
        payable(msg.sender).transfer(owed);
    }
}`,
    fixed: `contract Sale {
    uint256 public totalDeposited;

    function deposit() external payable {
        totalDeposited += msg.value;
    }

    // Settlement reads the internal ledger only; forced ether is inert.
    function settle() external {
        uint256 owed = totalDeposited;
        totalDeposited = 0;
        (bool ok, ) = msg.sender.call{value: owed}("");
        require(ok, "transfer failed");
    }
}`,
    refs: [{ label: 'Play Force on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/7' }],
  },
  {
    id: 11,
    slug: 'elevator',
    name: 'Elevator',
    difficulty: 4,
    category: 'low-level',
    summary: 'The same callback is invoked twice and the untrusted callee answers differently each time.',
    attack:
      'goTo calls back into msg.sender through an interface and asks the same question twice: once as ' +
      'the guard and once as the value it stores. Because the interface function is declared without ' +
      'view, the compiler emits CALL rather than STATICCALL, so the callee may flip an internal flag ' +
      'between the two invocations and return false then true. The guard passes on the first answer ' +
      'while the second answer is what gets written to storage.',
    prevention:
      'Treat any value returned by an untrusted address as attacker-chosen: read it once into a local ' +
      'variable and use that cached copy for both the check and the effect. Declaring the interface ' +
      'function view forces a STATICCALL that cannot write state, but caching is what actually removes ' +
      'the second chance to answer.',
    vulnerable: `interface IOracle {
    // Not view, so the compiler emits CALL: the callee may write state.
    function isFinal(uint256) external returns (bool);
}

contract Elevator {
    bool public atTop;

    function goTo(uint256 floorNum) external {
        IOracle oracle = IOracle(msg.sender);
        // Two calls, two chances for the caller to answer differently.
        if (!oracle.isFinal(floorNum)) {
            atTop = oracle.isFinal(floorNum);
        }
    }
}`,
    fixed: `interface IOracle {
    // view forces a STATICCALL: the callee cannot mutate state at all.
    function isFinal(uint256) external view returns (bool);
}

contract Elevator {
    bool public atTop;

    function goTo(uint256 floorNum) external {
        // Ask once, keep the answer, branch on the cached copy only.
        bool isFinal = IOracle(msg.sender).isFinal(floorNum);
        atTop = isFinal;
    }
}`,
    refs: [{ label: 'Play Elevator on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/11' }],
  },
  {
    id: 13,
    slug: 'gatekeeper-one',
    name: 'Gatekeeper One',
    difficulty: 8,
    category: 'low-level',
    summary: 'Three gates that test gas, casts, and tx.origin — none of which is actually access control.',
    attack:
      'require(msg.sender != tx.origin) is cleared by routing the call through any throwaway relay ' +
      'contract. require(gasleft() % 8191 == 0) is cleared by brute-forcing the gas passed to that relay ' +
      'until the remaining gas at the modifier hits a multiple — a few hundred off-chain iterations. The ' +
      'third gate compares truncated casts of a bytes8 key against uint16(uint160(tx.origin)), a value ' +
      'anyone can read, so the key is computed arithmetically. None of the three ever asks who the ' +
      'caller is.',
    prevention:
      'Authorization must be an explicit check of msg.sender against stored, granted identity — an ' +
      'allowlist mapping or an OpenZeppelin AccessControl role. Gas amounts, bit patterns, and tx.origin ' +
      'are obfuscation, not authorization; tx.origin additionally breaks under phishing because it names ' +
      'the victim who signed, not the contract that called.',
    vulnerable: `contract Gate {
    address public entrant;

    modifier gateOne() {
        require(msg.sender != tx.origin); // any relay contract clears this
        _;
    }

    modifier gateTwo() {
        require(gasleft() % 8191 == 0); // brute-forced off chain
        _;
    }

    modifier gateThree(bytes8 key) {
        // Derived from tx.origin, which is public: not a secret.
        require(uint32(uint64(key)) == uint16(uint160(tx.origin)));
        _;
    }

    function enter(bytes8 key) external gateOne gateTwo gateThree(key) {
        entrant = tx.origin;
    }
}`,
    fixed: `contract Gate {
    address public immutable owner;
    mapping(address => bool) public allowed;
    address public entrant;

    constructor() {
        owner = msg.sender;
    }

    function setAllowed(address who, bool ok) external {
        require(msg.sender == owner, "not owner");
        allowed[who] = ok;
    }

    // One real check: is this exact caller on the list?
    function enter() external {
        require(allowed[msg.sender], "not allowed");
        entrant = msg.sender;
    }
}`,
    refs: [
      { label: 'Play Gatekeeper One on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/13' },
    ],
  },
  {
    id: 14,
    slug: 'gatekeeper-two',
    name: 'Gatekeeper Two',
    difficulty: 6,
    category: 'low-level',
    summary: 'extcodesize is zero during construction, so a "no contracts allowed" gate lets a contract in.',
    attack:
      'The gate proves the caller is an externally owned account with extcodesize(caller()) == 0. An ' +
      'account only receives its runtime code after its constructor returns, so a contract that makes ' +
      'the call from inside its own constructor reports a code size of zero and walks through. The same ' +
      'contract satisfies msg.sender != tx.origin, and the final gate is a plain XOR: the key is ' +
      'uint64(bytes8(keccak256(abi.encodePacked(address(this))))) ^ type(uint64).max, computable in that ' +
      'very constructor.',
    prevention:
      'There is no reliable on-chain test for "the caller is an EOA" — extcodesize, code.length, and ' +
      'msg.sender == tx.origin all fail against constructor calls, and account abstraction breaks the ' +
      'idea outright. Gate on an explicit allowlist or a verified signature, and never treat a value ' +
      'derivable from public data as a secret key.',
    vulnerable: `contract Gate {
    address public entrant;

    // "Only EOAs" is false: a contract calling from its own constructor
    // has extcodesize 0, because its runtime code is not stored yet.
    modifier onlyEOA() {
        uint256 size;
        assembly {
            size := extcodesize(caller())
        }
        require(size == 0, "no contracts");
        _;
    }

    modifier withKey(bytes8 key) {
        // Derivable from msg.sender in one line: not a secret.
        require(uint64(bytes8(keccak256(abi.encodePacked(msg.sender)))) ^ uint64(key) == type(uint64).max);
        _;
    }

    function enter(bytes8 key) external onlyEOA withKey(key) {
        entrant = tx.origin;
    }
}`,
    fixed: `contract Gate {
    address public immutable operator;
    mapping(address => bool) public registered;
    address public entrant;

    constructor(address operator_) {
        operator = operator_;
    }

    // Explicit registration beats guessing at the caller account type.
    function register(address who) external {
        require(msg.sender == operator, "not operator");
        registered[who] = true;
    }

    function enter() external {
        require(registered[msg.sender], "not registered");
        entrant = msg.sender;
    }
}`,
    refs: [
      { label: 'Play Gatekeeper Two on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/14' },
    ],
  },
  {
    id: 17,
    slug: 'recovery',
    name: 'Recovery',
    difficulty: 6,
    category: 'low-level',
    summary: 'A "lost" contract address is deterministic, and its unguarded selfdestruct pays out to anyone.',
    attack:
      'The address of a child contract is not secret: CREATE derives it as the last 20 bytes of ' +
      'keccak256(rlp([deployer, nonce])), so anyone can recompute it from the factory address and the ' +
      'nonce, or simply read it from the internal creation trace. The child then exposes ' +
      'destroy(address payable) with no owner check, and SELFDESTRUCT forwards its entire balance to ' +
      'whatever address the caller passes in.',
    prevention:
      'Address obscurity is not access control. Guard every state-changing function — above all a ' +
      'selfdestruct — with an explicit owner or role check, and prefer removing selfdestruct entirely ' +
      '(EIP-6780 deprecated it) in favour of a permissioned withdraw that follows pull-over-push.',
    vulnerable: `contract Deposit {
    address public creator;

    constructor(address creator_) {
        creator = creator_;
    }

    receive() external payable {}

    // No access control. CREATE addresses are keccak256(rlp(deployer,
    // nonce)) -- never secret -- so anyone can find this and drain it.
    function destroy(address payable to) external {
        selfdestruct(to);
    }
}`,
    fixed: `contract Deposit {
    address public immutable creator;

    constructor(address creator_) {
        creator = creator_;
    }

    receive() external payable {}

    // Permissioned, explicit, and no selfdestruct anywhere.
    function withdraw(address payable to) external {
        require(msg.sender == creator, "not creator");
        uint256 amount = address(this).balance;
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "transfer failed");
    }
}`,
    refs: [{ label: 'Play Recovery on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/17' }],
  },
  {
    id: 18,
    slug: 'magic-number',
    name: 'MagicNumber',
    difficulty: 6,
    category: 'low-level',
    summary: 'A ten-byte hand-written runtime answers every selector, so an interface cast proves nothing.',
    attack:
      'The contract accepts any address as its solver and later casts it to an interface. The EVM has ' +
      'no notion of a type at an address — four-byte selector dispatch is a Solidity convention, not a ' +
      'protocol rule. A hand-assembled runtime of ten bytes (PUSH1 0x2a, PUSH1 0x80, MSTORE, PUSH1 0x20, ' +
      'PUSH1 0x80, RETURN) ignores calldata completely and returns 42 to every call, deployed by ' +
      'initcode that CODECOPYs those bytes and RETURNs them. "It implements the interface" is not a fact ' +
      'the caller can check.',
    prevention:
      'Never assume an address implements the interface you cast it to. Require code.length != 0 before ' +
      'calling, treat return data as untrusted (check returndatasize and decode defensively), and where ' +
      'the counterparty matters, deploy the dependency yourself or pin it to an immutable address you ' +
      'control.',
    vulnerable: `interface ISolver {
    function answer() external view returns (uint256);
}

contract Quiz {
    address public solver;

    // Any address at all: no code check, no way to check the interface.
    function setSolver(address who) external {
        solver = who;
    }

    // A 10-byte hand-written runtime returns 42 for EVERY selector, so a
    // passing call here says nothing about what that account really is.
    function check() external view returns (bool) {
        return ISolver(solver).answer() == 42;
    }
}`,
    fixed: `contract Solver {
    function answer() external pure returns (uint256) {
        return 42;
    }
}

contract Quiz {
    // Deployed by us, so its bytecode is known and cannot be swapped.
    Solver public immutable solver;

    constructor() {
        solver = new Solver();
    }

    function check() external view returns (bool) {
        return solver.answer() == 42;
    }
}`,
    refs: [{ label: 'Play MagicNumber on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/18' }],
  },
  {
    id: 21,
    slug: 'shop',
    name: 'Shop',
    difficulty: 4,
    category: 'low-level',
    summary: 'A view callback still reads your state, so it quotes one price before the sale and another after.',
    attack:
      'buy() calls msg.sender.price() twice with the state change isSold = true sitting between them, ' +
      'and stores the second answer. Declaring price() as view only forces a STATICCALL, which forbids ' +
      'the buyer from writing — it does not stop the buyer from reading. The buyer calls the public ' +
      'isSold getter back on the shop and returns a high price while it is false and zero once it is ' +
      'true, so the guard passes and the recorded price becomes zero.',
    prevention:
      'Read an untrusted return value exactly once, cache it, and use that copy for both the check and ' +
      'the effect; never re-query after mutating state the callee can observe. view guarantees only that ' +
      'no write happens, never that the answer stays the same between two calls.',
    vulnerable: `interface IBuyer {
    function price() external view returns (uint256);
}

contract Shop {
    uint256 public price = 100;
    bool public isSold; // public getter the buyer can read mid-call

    function buy() external {
        IBuyer buyer = IBuyer(msg.sender);
        // The second call happens after isSold flips, so it can return 0.
        if (buyer.price() >= price && !isSold) {
            isSold = true;
            price = buyer.price();
        }
    }
}`,
    fixed: `interface IBuyer {
    function price() external view returns (uint256);
}

contract Shop {
    uint256 public price = 100;
    bool public isSold;

    function buy() external {
        // One call, one answer, cached before any state changes.
        uint256 offer = IBuyer(msg.sender).price();
        require(!isSold, "already sold");
        require(offer >= price, "offer too low");
        isSold = true;
        price = offer;
    }
}`,
    refs: [{ label: 'Play Shop on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/21' }],
  },
  {
    id: 27,
    slug: 'good-samaritan',
    name: 'Good Samaritan',
    difficulty: 5,
    category: 'low-level',
    summary: 'A callee reverts with the caller own custom error and the try/catch mistakes it for its signal.',
    attack:
      'requestDonation wraps the transfer in try/catch and treats revert data equal to ' +
      'NotEnoughBalance() as proof the wallet is nearly empty. On the way there, the coin notifies any ' +
      'recipient that has code by calling notify() on it. A malicious recipient reverts inside notify ' +
      'with exactly that custom error; the four-byte selector bubbles up unchanged through transfer and ' +
      'donate10 into the catch block, so the contract mistakes an error it never raised for its own ' +
      'signal and ships the entire remaining balance via transferRemainder.',
    prevention:
      'Revert data returned from a call chain that touches untrusted code is attacker-controlled input, ' +
      'not a trustworthy signal — check the condition against your own state instead. Apply ' +
      'checks-effects-interactions so the callback fires after your state has settled and cannot steer ' +
      'the branch you take next.',
    vulnerable: `error NotEnoughBalance();

interface INotifyable {
    function notify(uint256) external;
}

contract Charity {
    uint256 public pot = 1000000;

    function requestDonation() external {
        try this.donate10(msg.sender) {}
        catch (bytes memory err) {
            // Revert data from untrusted code, trusted as our own signal.
            if (bytes4(err) == NotEnoughBalance.selector) pot = 0; // gives it all away
        }
    }

    function donate10(address to) external {
        if (pot < 10) revert NotEnoughBalance();
        pot -= 10;
        INotifyable(to).notify(10); // attacker reverts here with OUR error
    }
}`,
    fixed: `interface INotifyable {
    function notify(uint256) external;
}

contract Charity {
    event Drained(address to, uint256 amount);

    uint256 public pot = 1000000;

    function requestDonation() external {
        // Decide from our own state, never from a callee revert payload.
        if (pot < 10) {
            uint256 remainder = pot;
            pot = 0;
            emit Drained(msg.sender, remainder);
            return;
        }
        pot -= 10; // effects settled before the external interaction
        INotifyable(msg.sender).notify(10); // a revert here just reverts
    }
}`,
    refs: [
      { label: 'Play Good Samaritan on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/27' },
    ],
  },
  {
    id: 29,
    slug: 'switch',
    name: 'Switch',
    difficulty: 8,
    category: 'low-level',
    summary: 'A guard reading a fixed calldata offset is fooled by moving the ABI dynamic-data pointer.',
    attack:
      'flipSwitch(bytes) validates its argument by calldatacopying four bytes from the hard-coded ' +
      'calldata offset 68 and comparing them with the turnSwitchOff() selector. Offset 68 is only where ' +
      'the payload begins under canonical ABI encoding — the word at offset 4 is an attacker-supplied ' +
      'head pointing at the dynamic data. Point it past 68, leave the off selector sitting at 68 as ' +
      'decoy filler, and place the real payload, turnSwitchOn(), where the pointer actually leads. The ' +
      'modifier inspects the decoy while address(this).call(_data) executes the real one.',
    prevention:
      'Never inspect calldata at a hard-coded offset — resolving dynamic offsets is the ABI decoder job, ' +
      'not yours. Validate the decoded parameter the function actually received, and prefer removing the ' +
      'arbitrary-call indirection so callers reach only the explicit functions they are permitted to ' +
      'reach.',
    vulnerable: `contract Switchboard {
    bool public on;
    bytes4 private constant OFF = bytes4(keccak256("turnOff()"));

    // Reads a FIXED calldata offset, assuming canonical ABI encoding.
    modifier onlyOff() {
        bytes32[1] memory selector;
        assembly {
            calldatacopy(selector, 68, 4)
        }
        require(bytes4(selector[0]) == OFF, "only turnOff()");
        _;
    }

    function flip(bytes calldata data) external onlyOff {
        (bool ok, ) = address(this).call(data);
        require(ok, "call failed");
    }

    function turnOn() external {
        require(msg.sender == address(this));
        on = true;
    }
}`,
    fixed: `contract Switchboard {
    bool public on;

    // The indirection is gone: callers reach the exact function they are
    // allowed to reach, and the compiler decodes the calldata for us.
    function turnOff() external {
        on = false;
    }

    // If an indirection is genuinely needed, validate the DECODED
    // argument, never bytes read from a guessed calldata offset.
    function flip(bytes calldata data) external {
        require(bytes4(data) == this.turnOff.selector, "only turnOff()");
        (bool ok, ) = address(this).call(data);
        require(ok, "call failed");
    }
}`,
    refs: [{ label: 'Play Switch on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/29' }],
  },
  {
    id: 30,
    slug: 'higher-order',
    name: 'HigherOrder',
    difficulty: 8,
    category: 'low-level',
    summary: 'Inline assembly reads the raw calldata word, skipping the ABI decoder uint8 range check.',
    attack:
      'registerTreasury(uint8) never reads its declared parameter. It runs ' +
      'sstore(treasury_slot, calldataload(4)), taking the full 32-byte word at calldata offset 4 straight ' +
      'into storage. That bypasses the ABI decoder, which is the thing that would have rejected a word ' +
      'whose high-order bits are dirty for a uint8. A hand-built transaction whose data is the selector ' +
      'followed by 0xff...ff stores a treasury far above the > 255 threshold that claimLeadership guards, ' +
      'and the caller becomes commander.',
    prevention:
      'Let the compiler decode calldata: read the named parameter instead of calldataload. When inline ' +
      'assembly is genuinely required, mask and range-check the value yourself before storing it, and ' +
      'never assume a declared parameter type constrains bytes you read raw.',
    vulnerable: `contract Treasury {
    address public commander;
    uint256 public treasury;

    // The uint8 parameter is declared but never read: calldataload(4)
    // takes the whole 32-byte word, skipping the ABI decoder entirely.
    function registerTreasury(uint8) external {
        assembly {
            sstore(treasury.slot, calldataload(4))
        }
    }

    function claimLeadership() external {
        require(treasury > 255, "not a member");
        commander = msg.sender;
    }
}`,
    fixed: `contract Treasury {
    address public commander;
    uint256 public treasury;

    // Read the decoded parameter. Solidity's ABI decoder reverts when the
    // 32-byte word does not fit in uint8, so no raw calldata slips past.
    function registerTreasury(uint8 amount) external {
        treasury = amount;
    }

    function claimLeadership() external {
        require(treasury > 255, "not a member");
        commander = msg.sender;
    }
}`,
    refs: [{ label: 'Play HigherOrder on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/30' }],
  },
];

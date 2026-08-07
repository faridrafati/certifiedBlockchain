/**
 * @file storageLayout.js
 * @description Storage layout & delegatecall failures (Ethernaut levels 6, 8,
 *              12, 16, 33). Snippets are original minimal illustrations of each
 *              flaw, not copies of the level contracts.
 */

export const LEVELS = [
  {
    id: 6,
    slug: 'delegation',
    name: 'Delegation',
    difficulty: 4,
    category: 'storage-layout',
    summary:
      "A catch-all fallback delegatecalls user calldata, running foreign code against this contract's storage.",
    attack:
      'The fallback forwards raw msg.data to a library with DELEGATECALL, which executes the ' +
      "callee's bytecode against the caller's storage, balance, and msg.sender. Because the " +
      'library declares address owner as its first variable, any write it makes to slot 0 lands ' +
      "on the proxy's own owner variable. An attacker sends a bare transaction whose calldata is " +
      'just the four-byte selector of pwn(), the fallback relays it, and slot 0 becomes the ' +
      'attacker address — no access check was ever bypassed because none existed.',
    prevention:
      'Never forward arbitrary calldata into delegatecall. Restrict the fallback to an explicit ' +
      'allowlist of selectors (or drop the fallback entirely and expose named functions), and ' +
      'keep privileged state such as owner out of any slot the delegate target can reach — an ' +
      'unstructured EIP-1967 slot for proxy metadata is the standard answer.',
    vulnerable: `contract Delegate {
    address public owner;               // slot 0 here...

    function pwn() external {
        owner = msg.sender;             // ...written into the CALLER's slot 0
    }
}

contract Proxy {
    address public owner = msg.sender;  // ...is also slot 0 here
    address private lib;

    // Relays any calldata at all. delegatecall runs Delegate's code
    // with Proxy's storage, so pwn() silently seizes ownership.
    fallback() external {
        (bool ok,) = lib.delegatecall(msg.data);
        require(ok, "delegatecall failed");
    }
}`,
    fixed: `contract Proxy {
    address public owner = msg.sender;  // slot 0, unreachable below
    address private lib;

    bytes4 private constant SET_TIME = bytes4(keccak256("setTime(uint256)"));

    // Only one pre-approved selector may reach the library, and that
    // library's layout is known not to touch slot 0.
    fallback() external {
        require(msg.sig == SET_TIME, "selector not allowed");
        (bool ok,) = lib.delegatecall(msg.data);
        require(ok, "delegatecall failed");
    }

    // Ownership moves through one explicit, guarded entry point.
    function transferOwnership(address next) external {
        require(msg.sender == owner, "not owner");
        owner = next;
    }
}`,
    refs: [
      { label: 'Play Delegation on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/6' },
    ],
  },
  {
    id: 8,
    slug: 'vault',
    name: 'Vault',
    difficulty: 3,
    category: 'storage-layout',
    summary:
      'A password marked private is still plain text in storage slot 1 that anyone can read off chain.',
    attack:
      'The private keyword only stops other Solidity contracts from reading the variable; it is ' +
      'not encryption and it is not access control. The constructor writes the password into ' +
      'storage slot 1, where every archive node serves it: one eth_getStorageAt(vault, 1) call ' +
      'returns the exact bytes32. The attacker replays that value straight into unlock() and the ' +
      'equality check passes on the first try.',
    prevention:
      'Treat all chain state as public — never store a secret, and never make a check depend on ' +
      'one staying hidden. When a value must be withheld until reveal time, use commit-reveal: ' +
      'store keccak256 of the secret salted and bound to msg.sender, then verify the preimage on ' +
      'reveal so the commitment cannot be front-run or replayed by an observer.',
    vulnerable: `contract Vault {
    bool public locked = true;

    // "private" hides this from other contracts, not from the world:
    // it still occupies storage slot 1 and eth_getStorageAt returns it.
    bytes32 private password;

    constructor(bytes32 _password) {
        password = _password;
    }

    function unlock(bytes32 guess) external {
        require(guess == password, "wrong password");
        locked = false;
    }
}`,
    fixed: `contract Vault {
    bool public locked = true;

    // Only a commitment lives on chain. The secret stays off chain
    // until its holder reveals it, and the hash is bound to the
    // caller so a watcher cannot front-run the reveal.
    bytes32 private immutable commitment;

    constructor(bytes32 _commitment) {
        commitment = _commitment;
    }

    function unlock(bytes32 secret, bytes32 salt) external {
        require(
            keccak256(abi.encodePacked(secret, salt, msg.sender)) == commitment,
            "bad commitment"
        );
        locked = false;
    }
}`,
    refs: [{ label: 'Play Vault on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/8' }],
  },
  {
    id: 12,
    slug: 'privacy',
    name: 'Privacy',
    difficulty: 6,
    category: 'storage-layout',
    summary:
      'Packed private state is public: the key is just the top 16 bytes of one readable storage slot.',
    attack:
      'Solidity packs variables smaller than 32 bytes into a shared slot in declaration order, so ' +
      'the bool, the uint256, and the three small ints occupy slots 0, 1 and 2, pushing the ' +
      'bytes32[3] array into slots 3, 4 and 5. The unlock check compares the caller-supplied ' +
      'bytes16 against bytes16(data[2]), and a bytes32-to-bytes16 cast keeps the high-order half, ' +
      'so the key is literally the first 16 bytes of slot 5. Reading that slot with ' +
      'eth_getStorageAt and truncating it produces the key with no guessing at all.',
    prevention:
      'Do not put anything confidential in storage, and know the packing rules well enough to ' +
      'predict which slot any variable lands in — private and unlabelled slots are equally ' +
      'readable. Gate the unlock on a keccak256 commitment or an ECDSA signature the contract ' +
      'verifies, so the authorising value never needs to be stored.',
    vulnerable: `contract Privacy {
    bool public locked = true;      // slot 0
    uint256 public id;              // slot 1
    uint8 private flattening = 10;  // slot 2, byte 0
    uint8 private denomination;     // slot 2, byte 1  <- packed together
    uint16 private awkwardness;     // slot 2, bytes 2-3
    bytes32[3] private data;        // slots 3, 4 and 5

    constructor(bytes32[3] memory _data) {
        data = _data;
    }

    // The "key" is just the leading half of slot 5, one RPC call away.
    function unlock(bytes16 key) external {
        require(key == bytes16(data[2]), "wrong key");
        locked = false;
    }
}`,
    fixed: `contract Privacy {
    bool public locked = true;

    // Nothing secret is stored. Only the hash of a key the owner keeps
    // off chain, bound to the caller so the reveal cannot be stolen.
    bytes32 private immutable keyHash;

    constructor(bytes32 _keyHash) {
        keyHash = _keyHash;
    }

    function unlock(bytes32 key) external {
        require(
            keccak256(abi.encodePacked(key, msg.sender)) == keyHash,
            "wrong key"
        );
        locked = false;
    }
}`,
    refs: [
      { label: 'Play Privacy on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/12' },
    ],
  },
  {
    id: 16,
    slug: 'preservation',
    name: 'Preservation',
    difficulty: 8,
    category: 'storage-layout',
    summary:
      "A delegatecall target with a different layout overwrites the caller's library pointer, then its owner.",
    attack:
      'The helper contract declares uint256 storedTime as its only variable, so setTime writes ' +
      "slot 0. Under DELEGATECALL that write hits the caller's slot 0, which holds " +
      'timeZone1Library rather than a timestamp. Passing uint256(uint160(attackerContract)) to ' +
      'setFirstTime therefore replaces the library address with an attacker-controlled contract; ' +
      "a second call to the same function now executes the attacker's setTime, which assigns " +
      'to its own third variable and lands on slot 2 — owner.',
    prevention:
      "A DELEGATECALL target must share the caller's exact storage layout: declare that layout " +
      'once in a shared base contract both sides inherit, or use a Solidity library, which is ' +
      'stateless by construction and cannot collide. Make the target address immutable or ' +
      'constant so a slot-0 write can never repoint it, and keep proxy metadata in unstructured ' +
      'EIP-1967 slots that ordinary variables cannot reach.',
    vulnerable: `contract TimeLib {
    uint256 storedTime;                 // slot 0 of the LIBRARY

    function setTime(uint256 t) external {
        storedTime = t;                 // ...writes slot 0 of the CALLER
    }
}

contract Preservation {
    address public lib;                 // slot 0  <- clobbered first
    address public owner;               // slot 1
    uint256 storedTime;                 // slot 2  <- clobbered second

    function setFirstTime(uint256 t) external {
        (bool ok,) = lib.delegatecall(
            abi.encodeWithSignature("setTime(uint256)", t)
        );
        require(ok, "delegatecall failed");
    }
}`,
    fixed: `library TimeLib {
    // A Solidity library is stateless: DELEGATECALL into it can never
    // reach a storage slot, so no layout can collide.
    function normalize(uint256 t) internal pure returns (uint256) {
        return t - (t % 60);
    }
}

contract Preservation {
    using TimeLib for uint256;

    address public owner;               // no library pointer to hijack
    uint256 public storedTime;

    constructor() {
        owner = msg.sender;
    }

    function setFirstTime(uint256 t) external {
        require(msg.sender == owner, "not owner");
        storedTime = t.normalize();
    }
}`,
    refs: [
      {
        label: 'Play Preservation on Ethernaut',
        url: 'https://ethernaut.openzeppelin.com/level/16',
      },
    ],
  },
  {
    id: 33,
    slug: 'magic-animal-carousel',
    name: 'Magic Animal Carousel',
    difficulty: 6,
    category: 'storage-layout',
    summary:
      'A 96-bit name shifted into an 80-bit packed field spills into the next-crate pointer beside it.',
    attack:
      'Each crate is one storage word hand-packed as an 80-bit animal name in bits 176-255, a ' +
      '16-bit next-crate pointer in bits 160-175, and the 160-bit owner in bits 0-159. The spin ' +
      'function narrows the encoded name to 80 bits before shifting it by 176, but the rename ' +
      'path shifts the full 96-bit encoding by only 160, so the last two bytes of a 12-character ' +
      'name land inside the pointer field — and the write ORs the old pointer back in instead of ' +
      'masking it, so those stray bits can only be set, never cleared. Choosing those two bytes ' +
      "redirects the next spin into any crate the attacker names, overwriting another player's " +
      'animal and owner.',
    prevention:
      'Mask or narrow every value to its field width before shifting it into a packed slot, and ' +
      'clear the destination bits first (slot & ~MASK | value << OFFSET) rather than ORing onto ' +
      'whatever was there. Better still, declare a struct with sized members and let the compiler ' +
      'pack it, or funnel every write through one accessor per field so two call sites cannot ' +
      'disagree about an offset.',
    vulnerable: `// One word per crate, hand-packed:
//   [255..176] name (80 bits) | [175..160] nextId (16) | [159..0] owner
contract Carousel {
    uint256 constant NEXT_ID_MASK = uint256(type(uint16).max) << 160;

    mapping(uint256 => uint256) public crate;

    function spin(uint256 id, uint80 name) external {
        uint256 next = (crate[id] & NEXT_ID_MASK) >> 160;
        crate[id] = uint256(name) << 176 | next << 160 | uint160(msg.sender);
    }

    // BUG: name is 96 bits here and shifted by only 160, so its low two
    // bytes land in nextId — and the old pointer is ORed back on top,
    // so the injected bits survive.
    function rename(uint256 id, uint96 name) external {
        require(msg.sender == address(uint160(crate[id])), "not owner");
        crate[id] = uint256(name) << 160 | (crate[id] & NEXT_ID_MASK)
            | uint160(msg.sender);
    }
}`,
    fixed: `contract Carousel {
    uint256 constant NAME_MASK = uint256(type(uint80).max) << 176;
    uint256 constant NEXT_ID_MASK = uint256(type(uint16).max) << 160;

    mapping(uint256 => uint256) public crate;

    // One writer per field: the value is typed to the field's exact
    // width and the destination bits are cleared before the OR, so
    // nothing can bleed into nextId or owner.
    function _setName(uint256 id, uint80 name) private {
        crate[id] = (crate[id] & ~NAME_MASK) | (uint256(name) << 176);
    }

    function spin(uint256 id, uint80 name, uint16 next) external {
        crate[id] = (crate[id] & ~NEXT_ID_MASK) | (uint256(next) << 160);
        _setName(id, name);
    }

    function rename(uint256 id, uint80 name) external {
        require(msg.sender == address(uint160(crate[id])), "not owner");
        _setName(id, name);
    }
}`,
    refs: [
      {
        label: 'Play Magic Animal Carousel on Ethernaut',
        url: 'https://ethernaut.openzeppelin.com/level/33',
      },
    ],
  },
];

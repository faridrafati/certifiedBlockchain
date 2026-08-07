/**
 * @file crypto.js
 * @description Cryptography & signature failures (Ethernaut levels 32, 35, 37,
 *              39). Snippets are original minimal illustrations of each flaw,
 *              not copies of the level contracts.
 */

export const LEVELS = [
  {
    id: 32,
    slug: 'impersonator',
    name: 'Impersonator',
    difficulty: 8,
    category: 'crypto',
    summary: 'A replay guard keyed on (r, s, v) is bypassed by the malleable twin of the same signature.',
    attack:
      'The lock derives one immutable digest from its id, so the controller signature never changes, ' +
      'and the deployment event publishes that signature to anyone reading the chain. The replay guard ' +
      'stores keccak256 of the (r, s, v) triple, but secp256k1 is symmetric: (r, n - s, v ^ 1) recovers ' +
      'the identical signer over the identical digest while hashing to a different key. Submitting that ' +
      'mirrored signature clears the controller check with an unused fingerprint, and changeController ' +
      'hands the lock to a new address.',
    prevention:
      'Reject non-canonical signatures the way EIP-2 does: require s in the lower half of the curve ' +
      'order and v in {27, 28}, which is exactly what OpenZeppelin ECDSA.recover enforces. Better still, ' +
      'do not fingerprint signatures at all: bind an incrementing nonce, the chain id, and the contract ' +
      'address into the digest so every authorisation is single-use by construction.',
    vulnerable: `contract Lock {
    bytes32 public immutable digest; // fixed per lock, no nonce
    address public controller;
    mapping(bytes32 => bool) public usedSig;

    constructor(bytes32 d, address c) {
        digest = d;
        controller = c;
    }

    // Replay guard fingerprints the raw (r, s, v) triple, so the
    // mirrored signature (r, n - s, v ^ 1) is seen as a new one.
    function changeController(uint8 v, bytes32 r, bytes32 s, address next) external {
        bytes32 key = keccak256(abi.encode(r, s, v));
        require(!usedSig[key], "signature used");
        require(ecrecover(digest, v, r, s) == controller, "bad signature");
        usedSig[key] = true;
        controller = next;
    }
}`,
    fixed: `contract Lock {
    // EIP-2: only the lower half of the curve order is canonical.
    uint256 constant HALF_N =
        0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0;

    address public controller;
    uint256 public nonce;

    function changeController(uint8 v, bytes32 r, bytes32 s, address next) external {
        require(uint256(s) <= HALF_N, "malleable s");
        require(v == 27 || v == 28, "bad v");

        // Nonce, chain and contract are inside the digest, so a
        // signature authorises exactly one call and never repeats.
        bytes32 digest = keccak256(
            abi.encode(block.chainid, address(this), nonce, next)
        );
        address signer = ecrecover(digest, v, r, s);
        require(signer != address(0) && signer == controller, "bad signature");

        nonce++;
        controller = next;
    }
}`,
    refs: [
      { label: 'Play Impersonator on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/32' },
    ],
  },
  {
    id: 35,
    slug: 'elliptic-token',
    name: 'Elliptic Token',
    difficulty: 8,
    category: 'crypto',
    summary: 'Signatures checked against bare hashes with no domain separator replay across unrelated functions.',
    attack:
      'Every signature here is verified against a bare keccak256 result with no EIP-712 domain separator, ' +
      'no per-function type tag, and no binding to the contract address, chain id, or a signer nonce. The ' +
      'permit path is worse: it recovers over bytes32(amount), a 32-byte word the caller passes in raw, so ' +
      'the caller picks the digest that the owner signature is checked against. A hash the owner signed for ' +
      'one purpose therefore validates a completely different action, and the usedHashes registry does not ' +
      'catch it because each path files the same authorisation under a different key.',
    prevention:
      'Sign structured data, not bare words: EIP-712 with a domain separator (name, version, chainId, ' +
      'verifyingContract) and one distinct type hash per action, so a signature meant for one function can ' +
      'never be presented to another. Track consumption with a per-signer nonce inside the signed struct ' +
      'instead of a shared hash registry, and never recover against a digest the caller supplies directly.',
    vulnerable: `contract Voucher {
    address public owner;
    mapping(bytes32 => bool) public usedHashes;

    function redeem(uint256 amount, address to, bytes32 salt, bytes memory sig) external {
        bytes32 h = keccak256(abi.encodePacked(amount, to, salt));
        require(!usedHashes[h], "used");
        require(ECDSA.recover(h, sig) == owner, "bad voucher");
        usedHashes[h] = true;
        _mint(to, amount);
    }

    function permit(uint256 amount, address spender, bytes memory sig) external {
        // The digest is a caller-supplied word: any hash the owner
        // ever signed can be handed in here and reused as a permit.
        address from = ECDSA.recover(bytes32(amount), sig);
        _approve(from, spender, amount);
    }
}`,
    fixed: `contract Voucher is EIP712 {
    bytes32 constant PERMIT_TYPEHASH =
        keccak256("Permit(address from,address spender,uint256 amount,uint256 nonce)");

    mapping(address => uint256) public nonces;

    // One type hash per action, and _hashTypedDataV4 mixes in this
    // contract and this chain, so no signature crosses over.
    function permit(address from, address spender, uint256 amount, bytes memory sig) external {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(PERMIT_TYPEHASH, from, spender, amount, nonces[from]++)
            )
        );
        require(ECDSA.recover(digest, sig) == from, "bad permit");
        _approve(from, spender, amount);
    }
}`,
    refs: [
      { label: 'Play Elliptic Token on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/35' },
    ],
  },
  {
    id: 37,
    slug: 'impersonator-two',
    name: 'Impersonator Two',
    difficulty: 8,
    category: 'crypto',
    summary: 'Two signatures sharing one r value expose the reused ECDSA nonce, and with it the private key.',
    attack:
      'Authorisation rests entirely on signatures from one long-lived owner key, and the contract itself ' +
      'publishes them: the setAdmin and switchLock signatures used to set the instance up sit in plain ' +
      'sight on chain. Both carry the same r, which means the signer reused the ephemeral nonce k across ' +
      'two different messages, and that is fatal for ECDSA. With all arithmetic modulo the curve order, ' +
      'k = (z1 - z2) / (s1 - s2) and then d = (s1 * k - z1) / r recovers the private key outright, after ' +
      'which the attacker signs a fresh setAdmin message naming themselves, flips the lock, and withdraws.',
    prevention:
      'Produce signatures only with libraries that derive k deterministically per RFC 6979, and treat any ' +
      'repeated r from the same key as a compromised key that must be rotated immediately. On chain, never ' +
      'let a single EOA signature be the whole authorisation: bind the action to msg.sender, add a deadline, ' +
      'and keep the signing key replaceable so a leak stays recoverable.',
    vulnerable: `contract Treasury {
    address public signer; // one long-lived key authorises everything
    address public admin;
    uint256 public nonce;

    // Anyone holding a valid signature may act, and the signatures
    // are published on chain, so every (r, s) pair is public.
    function setAdmin(uint8 v, bytes32 r, bytes32 s, address newAdmin) external {
        bytes32 digest = keccak256(abi.encode(address(this), nonce, newAdmin));
        require(ecrecover(digest, v, r, s) == signer, "bad signature");
        nonce++;
        admin = newAdmin;
    }

    function withdraw() external {
        require(msg.sender == admin, "not admin");
        payable(admin).transfer(address(this).balance);
    }
}`,
    fixed: `contract Treasury {
    address public signer;
    address public admin;
    uint256 public nonce;

    // A signature alone is never enough: the claimant must also be
    // msg.sender and the grant expires, so a leaked key cannot
    // quietly take the treasury while nobody is watching.
    function claimAdmin(uint8 v, bytes32 r, bytes32 s, uint256 deadline) external {
        require(block.timestamp <= deadline, "expired");
        bytes32 digest = keccak256(
            abi.encode(block.chainid, address(this), nonce, msg.sender, deadline)
        );
        require(ecrecover(digest, v, r, s) == signer, "bad signature");
        nonce++;
        admin = msg.sender;
    }

    function rotateSigner(address next) external {
        require(msg.sender == admin, "not admin");
        signer = next;
    }
}`,
    refs: [
      { label: 'Play Impersonator Two on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/37' },
    ],
  },
  {
    id: 39,
    slug: 'forger',
    name: 'Forger',
    difficulty: 5,
    category: 'crypto',
    summary: 'A spent-signature registry keyed on raw bytes misses the same signature in its compact form.',
    attack:
      'The mint function fingerprints spent authorisations with keccak256 of the signature bytes rather ' +
      'than of the message that was signed. A secp256k1 signature has more than one valid encoding: ' +
      'EIP-2098 packs the same (r, s, v) into 64 bytes by folding the recovery bit into the top bit of s, ' +
      'and OpenZeppelin ECDSA.recover accepts both the 65-byte and the compact 64-byte form. The two ' +
      'encodings recover the same signer over the same digest but hash to different keys, so a signature ' +
      'the owner already spent mints again in its other form, and a deadline of type(uint256).max means ' +
      'it never expires.',
    prevention:
      'Key replay protection on what was authorised, not on how it was encoded: mark the message digest or ' +
      'a per-signer nonce as consumed, never keccak256(signature). Build that digest with EIP-712 so it ' +
      'carries the verifying contract, the chain id, and a real deadline, and if you must inspect raw ' +
      'signature bytes, reject any length other than the canonical 65.',
    vulnerable: `contract Mintable {
    address public signer;
    mapping(bytes32 => bool) public usedSig;

    // The guard fingerprints the signature bytes, not the message.
    // Re-encoded as a 64-byte EIP-2098 pair, the same signature
    // hashes to a different key and passes again.
    function mintWithSig(address to, uint256 amount, bytes32 salt, bytes calldata sig) external {
        bytes32 key = keccak256(sig);
        require(!usedSig[key], "signature used");

        bytes32 digest = keccak256(abi.encode(to, amount, salt));
        require(ECDSA.recover(digest, sig) == signer, "bad signature");

        usedSig[key] = true;
        _mint(to, amount);
    }
}`,
    fixed: `contract Mintable is EIP712 {
    bytes32 constant MINT_TYPEHASH =
        keccak256("Mint(address to,uint256 amount,bytes32 salt,uint256 deadline)");

    address public signer;
    mapping(bytes32 => bool) public usedDigest;

    // The guard fingerprints the signed message, so every encoding
    // of that signature consumes the one and only slot.
    function mintWithSig(address to, uint256 amount, bytes32 salt, uint256 deadline, bytes calldata sig)
        external
    {
        require(block.timestamp <= deadline, "expired");
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(MINT_TYPEHASH, to, amount, salt, deadline))
        );
        require(!usedDigest[digest], "digest used");
        usedDigest[digest] = true;
        require(ECDSA.recover(digest, sig) == signer, "bad signature");
        _mint(to, amount);
    }
}`,
    refs: [
      { label: 'Play Forger on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/39' },
    ],
  },
];

/**
 * @file standards.js
 * @description EEA EthTrust Security Levels — the certification requirements a
 *              contract has to satisfy at Security Level [S], [M] or [Q].
 *
 * Source: EEA EthTrust Security Levels Specification, Version 3
 *         https://entethalliance.org/specs/ethtrust-sl/
 *         Published by the Enterprise Ethereum Alliance under Apache-2.0.
 *         Snapshot taken 2026-08-07.
 *
 * Version caveat worth surfacing in the view header: the document's own <title>
 * still reads "v-after-2 Editor's Draft" while its Status section says this is
 * Version 3, approved for publication, with a superseding version expected in
 * the second half of 2026. Describe it as Version 3 with a snapshot date — not
 * as the final word.
 *
 * Authoring rules applied here:
 * - `id` is the spec's own anchor id, copied verbatim. Note that
 *   `req-1-compiler-sol-2021-4` is the only id using a lowercase "sol"; every
 *   sibling uses "SOL". That is the real anchor, not a typo.
 * - `title` is the spec's requirement name with its level prefix removed,
 *   because `level` already carries it (spec: "[S] No tx.origin").
 * - `statement` restates the requirement's single normative sentence and stays
 *   deliberately close to the spec's wording: it drops the defined term
 *   "Tested code" for plain "the code", lowercases the RFC 2119 keyword, and
 *   trims trailing cross-references, but does not reword the obligation itself,
 *   because paraphrasing a MUST changes what it demands. The spec is published
 *   under Apache-2.0, which permits this with attribution.
 * - `rationale` is original prose written for this page and tracks no source
 *   sentence.
 * - Neither is a substitute for the normative text at `anchor`.
 *
 * Scope: the 70 normative requirements at Levels [S] (22), [M] (24) and [Q]
 * (24). The spec also lists 11 non-normative "[GP] Recommended Good Practices"
 * (SHOULD, not MUST); they are outside the S/M/Q shape this view renders and
 * are deliberately omitted rather than promoted to requirements.
 *
 * The compiler requirements sit in §5.1.3 Compiler Bugs
 * (https://entethalliance.org/specs/ethtrust-sl/#sec-1-compiler-bugs) and its
 * Level [M] counterpart §5.2.5
 * (https://entethalliance.org/specs/ethtrust-sl/#sec-level-2-compiler-bugs).
 * Each SOL-YYYY-N name is the uid the bug carries in Solidity's own bugs.json,
 * so it can be looked up there directly.
 */

const ANCHOR_BASE = 'https://entethalliance.org/specs/ethtrust-sl/#';

export const LEVELS_INFO = [
  {
    level: 'S',
    name: 'Automated static analysis',
    blurb:
      'The machine-checkable floor. Level [S] requirements are written so an unguided tool can ' +
      'read bytecode and source and decide whether they hold — no delegatecall, no selfdestruct, ' +
      'no tx.origin, no raw assembly, check every low-level return, follow Checks-Effects-' +
      'Interactions, and avoid the compiler versions with known miscompilation bugs. Where a ' +
      'construct is genuinely needed, an Overriding Requirement at a higher level allows it in ' +
      'exchange for stricter review.',
  },
  {
    level: 'M',
    name: 'Manual audit',
    blurb:
      'Level [M] means a human auditor or team read the code and was satisfied. It adds the ' +
      'judgement calls a scanner cannot make — is this randomness unpredictable enough, is this ' +
      'rounding exploitable, is this signature genuinely unreplayable — and supplies most of the ' +
      'Overriding Requirements that let [S] prohibitions be lifted, always paired with a duty to ' +
      'document why the risky construct is there. Code must already pass Level [S] to qualify.',
  },
  {
    level: 'Q',
    name: 'Documented business logic',
    blurb:
      'Level [Q] moves past "the code is free of known flaws" to "the code does what it is ' +
      'supposed to do". It requires a written specification of the business logic, the system ' +
      'architecture and the threat model, NatSpec on every public interface, and evidence that ' +
      'the implementation matches all of it — plus the protocol-level defenses (ordering attacks, ' +
      'MEV, oracle failure, governance capture, least privilege) that only make sense against a ' +
      'stated intent. Code must already pass Level [M] to qualify.',
  },
];

export const REQUIREMENTS = [
  /* ---------------------------------------------------------------- */
  /* Security Level [S] — 22 requirements                             */
  /* ---------------------------------------------------------------- */
  {
    id: 'req-1-eip155-chainid',
    level: 'S',
    title: 'Encode Hashes with chainid',
    statement:
      'Hashes the code builds for transactions must incorporate the chain id, as recommended by EIP-155.',
    rationale:
      'Without the chain id inside the hash, one signature is valid on every EVM chain that shares ' +
      'the address. A message harvested from a testnet or from a post-fork sibling chain can then ' +
      'be replayed against the real deployment.',
    anchor: ANCHOR_BASE + 'req-1-eip155-chainid',
  },
  {
    id: 'req-1-no-create2',
    level: 'S',
    title: 'No CREATE2',
    statement:
      'The code must not contain a CREATE2 instruction unless it satisfies both overriding ' +
      'requirements [M] Protect CREATE2 Calls and [M] Document Special Code Use.',
    rationale:
      'CREATE2 makes a contract address knowable before any code lives there, so users can be ' +
      'pointed at an address whose contents are decided later. That turns an audited integration ' +
      'into an unaudited one without the address ever changing.',
    anchor: ANCHOR_BASE + 'req-1-no-create2',
  },
  {
    id: 'req-1-no-tx.origin',
    level: 'S',
    title: 'No tx.origin',
    statement:
      'The code must not use tx.origin unless it satisfies the overriding requirement ' +
      '[Q] Verify tx.origin Usage.',
    rationale:
      'tx.origin names the account that signed the transaction, never the caller directly in ' +
      'front of you. Any contract a privileged user is persuaded to touch can relay a call and ' +
      'pass an authorization check written against tx.origin.',
    anchor: ANCHOR_BASE + 'req-1-no-tx.origin',
  },
  {
    id: 'req-1-exact-balance-check',
    level: 'S',
    title: 'No Exact Balance Check',
    statement:
      'The code must not test an account balance for exact equality with an amount or a variable ' +
      'unless it satisfies the overriding requirement [M] Verify Exact Balance Checks.',
    rationale:
      'A balance can be increased by anyone, through a selfdestruct payout or ether pre-sent to ' +
      'the address before deployment, and neither route runs your code. An equality check is ' +
      'therefore an invariant an outsider can falsify for a few wei, wedging whatever it gates.',
    anchor: ANCHOR_BASE + 'req-1-exact-balance-check',
  },
  {
    id: 'req-1-no-hashing-consecutive-variable-length-args',
    level: 'S',
    title: 'No Hashing Consecutive Variable Length Arguments',
    statement:
      'The code must not call abi.encodePacked() with two or more consecutive variable-length arguments.',
    rationale:
      'encodePacked writes no length prefix, so ("a","bc") and ("ab","c") flatten to identical ' +
      'bytes and therefore to an identical hash. That collision is enough to make a signature or ' +
      'a merkle proof authorize a message nobody agreed to; abi.encode does not have the problem.',
    anchor: ANCHOR_BASE + 'req-1-no-hashing-consecutive-variable-length-args',
  },
  {
    id: 'req-1-self-destruct',
    level: 'S',
    title: 'No selfdestruct()',
    statement:
      'The code must not contain selfdestruct(), or its deprecated alias suicide(), unless it ' +
      'satisfies both [M] Protect Self-destruction and [M] Document Special Code Use.',
    rationale:
      'A reachable selfdestruct converts every address running the code into an empty account. ' +
      'Calls into it stop reverting and start silently succeeding, and anything holding value ' +
      'behind it — most sharply a logic contract behind a proxy — becomes unreachable.',
    anchor: ANCHOR_BASE + 'req-1-self-destruct',
  },
  {
    id: 'req-1-no-assembly',
    level: 'S',
    title: 'No assembly {}',
    statement:
      'The code must not contain an assembly {} block unless it satisfies the full set of ' +
      'overriding requirements at Level [M]: Avoid Common assembly {} Attack Vectors, Document ' +
      'Special Code Use, and the assembly-related compiler bug requirements SOL-2022-5 in ' +
      'assembly {}, SOL-2022-7, SOL-2022-4 and SOL-2021-3.',
    rationale:
      'Inline assembly steps outside the type system and the compiler safety checks, which is ' +
      'exactly where storage pointer collisions and arbitrary jumps through function-type ' +
      'variables become reachable. Several compiler bugs also only bite code that reads memory ' +
      'from assembly.',
    anchor: ANCHOR_BASE + 'req-1-no-assembly',
  },
  {
    id: 'req-1-unicode-bdo',
    level: 'S',
    title: 'No Unicode Direction Control Characters',
    statement:
      'The source must not contain the Unicode direction control characters U+2066, U+2067, ' +
      'U+2068, U+2029, U+202A, U+202B, U+202C, U+202D or U+202E unless it satisfies ' +
      '[M] No Unnecessary Unicode Controls.',
    rationale:
      'These characters change the order in which text is displayed without changing what the ' +
      'compiler sees. A reviewer can read a condition or a comment that says the opposite of ' +
      'what will actually execute.',
    anchor: ANCHOR_BASE + 'req-1-unicode-bdo',
  },
  {
    id: 'req-1-check-return',
    level: 'S',
    title: 'Check External Calls Return',
    statement:
      'Every use of the low-level call functions call(), delegatecall(), staticcall() and send() ' +
      'must have its returned value checked for failure, unless the code satisfies ' +
      '[M] Handle External Call Returns.',
    rationale:
      'The low-level calls report failure by returning false rather than by reverting. An ' +
      'unchecked call lets the transaction continue as though a transfer or an interaction ' +
      'succeeded, so the accounting and the actual state quietly diverge.',
    anchor: ANCHOR_BASE + 'req-1-check-return',
  },
  {
    id: 'req-1-use-c-e-i',
    level: 'S',
    title: 'Use Check-Effects-Interaction',
    statement:
      'Code that makes external calls must use the Checks-Effects-Interactions pattern against ' +
      're-entrancy, unless it satisfies [M] Protect External Calls together with [M] Document ' +
      'Special Code Use, or the Level [Q] set of Verify External Calls, Document Contract Logic, ' +
      'Document System Architecture and Implement as Documented.',
    rationale:
      'If state is written after the external call instead of before it, the callee re-enters ' +
      'while your books still show the pre-call balance and can repeat the same withdrawal until ' +
      'the contract is empty.',
    anchor: ANCHOR_BASE + 'req-1-use-c-e-i',
  },
  {
    id: 'req-1-delegatecall',
    level: 'S',
    title: 'No delegatecall()',
    statement:
      'The code must not contain delegatecall() unless it satisfies [M] Protect External Calls ' +
      'together with [M] Document Special Code Use, or the Level [Q] set of Verify External ' +
      'Calls, Document Contract Logic, Document System Architecture and Implement as Documented.',
    rationale:
      'delegatecall runs code from another contract against your storage, your balance and your ' +
      'msg.sender. If the target is attacker-influenced, or its storage layout merely differs ' +
      'from yours, it can rewrite the owner slot or the implementation pointer.',
    anchor: ANCHOR_BASE + 'req-1-delegatecall',
  },
  {
    id: 'req-1-compiler-SOL-2023-3',
    level: 'S',
    title: 'Compiler Bug SOL-2023-3',
    statement:
      'Code containing Yul that uses the verbatim instruction twice, each time surrounded by ' +
      'identical code, must disable the block deduplicator when compiling with Solidity 0.8.5 ' +
      'through 0.8.22 inclusive.',
    rationale:
      'Across that range the deduplicator compared the code around a verbatim item instead of the ' +
      'item itself, so two distinct blocks were merged into one. The deployed bytecode then does ' +
      'not do what the source says.',
    anchor: ANCHOR_BASE + 'req-1-compiler-SOL-2023-3',
  },
  {
    id: 'req-1-compiler-SOL-2022-6',
    level: 'S',
    title: 'Compiler Bug SOL-2022-6',
    statement:
      'Code that ABI-encodes a tuple containing a dynamic component with ABIEncoderV2, where the ' +
      'last element is a calldata static array of base type uint or bytes32, must not use ' +
      'Solidity 0.5.8 through 0.8.15 inclusive.',
    rationale:
      'In that range the encoded data came out corrupted. Every consumer downstream — a hash, a ' +
      'signature check, another contract — then operates on values that were never supplied.',
    anchor: ANCHOR_BASE + 'req-1-compiler-SOL-2022-6',
  },
  {
    id: 'req-1-compiler-SOL-2022-5-push',
    level: 'S',
    title: 'Compiler Bug SOL-2022-5 with .push()',
    statement:
      'Code that copies a bytes array from calldata or memory whose size is not a multiple of 32 ' +
      'bytes and then writes into the result with an empty .push() must not use a Solidity ' +
      'compiler older than 0.8.15.',
    rationale:
      'Before 0.8.15 such a copy left the tail of the final word holding whatever was adjacent, ' +
      'so bytes that were never part of the array stayed readable. Its Level [M] sibling covers ' +
      'the same bug reached through assembly {}.',
    anchor: ANCHOR_BASE + 'req-1-compiler-SOL-2022-5-push',
  },
  {
    id: 'req-1-compiler-SOL-2022-3',
    level: 'S',
    title: 'Compiler Bug SOL-2022-3',
    statement:
      'Code that uses both memory and calldata pointers for the same function, changes a function ' +
      'data location during inheritance, and then makes an internal call from a site that only ' +
      'knows the base signature, must not use Solidity 0.6.9 through 0.8.12 inclusive.',
    rationale:
      'Those versions applied an optimization that is only sound for external calls, treating ' +
      'memory and calldata pointers as equivalent. The callee reads from the wrong region and ' +
      'sees data that was never passed.',
    anchor: ANCHOR_BASE + 'req-1-compiler-SOL-2022-3',
  },
  {
    id: 'req-1-compiler-SOL-2022-2',
    level: 'S',
    title: 'Compiler Bug SOL-2022-2',
    statement:
      'Code holding a nested array that it passes to an external function, feeds to abi.encode(), ' +
      'or uses in an event, must not use Solidity 0.6.9 through 0.8.12 inclusive.',
    rationale:
      'A single-pass encode and decode of a nested array could read past calldatasize(), so ' +
      'memory outside the argument was pulled into the encoded value and forwarded onward.',
    anchor: ANCHOR_BASE + 'req-1-compiler-SOL-2022-2',
  },
  {
    id: 'req-1-compiler-SOL-2022-1',
    level: 'S',
    title: 'Compiler Bug SOL-2022-1',
    statement:
      'Code that passes a number literal for a bytesNN type shorter than 32 bytes, or a string ' +
      'literal for any bytesNN type, as the first parameter of abi.encodeCall(), must not use ' +
      'Solidity 0.8.11 or 0.8.12.',
    rationale:
      'Those two releases encoded such literals incorrectly, so the call that leaves the contract ' +
      'is not the call that was written — an especially quiet failure inside a forwarder or a ' +
      'multicall.',
    anchor: ANCHOR_BASE + 'req-1-compiler-SOL-2022-1',
  },
  {
    id: 'req-1-compiler-sol-2021-4',
    level: 'S',
    title: 'Compiler Bug SOL-2021-4',
    statement:
      'Code using custom value types shorter than 32 bytes must not use Solidity 0.8.8.',
    rationale:
      'That release gave such types a full 32-byte storage slot they did not need. The surplus ' +
      'can be abused to read storage that should be out of reach, and it breaks compatibility ' +
      'with parts of the system built by a different compiler version.',
    anchor: ANCHOR_BASE + 'req-1-compiler-sol-2021-4',
  },
  {
    id: 'req-1-compiler-SOL-2021-2',
    level: 'S',
    title: 'Compiler Bug SOL-2021-2',
    statement:
      'Code that calls abi.decode() on byte arrays held in memory must not use ABIEncoderV2 with ' +
      'Solidity 0.4.16 through 0.8.3 inclusive.',
    rationale:
      'Pointer validation in that range overflowed, so a decode could read beyond the array it ' +
      'was given and return adjacent memory as though it were the decoded value.',
    anchor: ANCHOR_BASE + 'req-1-compiler-SOL-2021-2',
  },
  {
    id: 'req-1-compiler-SOL-2021-1',
    level: 'S',
    title: 'Compiler Bug SOL-2021-1',
    statement:
      'Code with two or more keccak(mem, length) instructions where the memory pointers are equal ' +
      'but the lengths differ and are not multiples of 32 must not use the optimizer with a ' +
      'Solidity compiler older than 0.8.3.',
    rationale:
      'The optimizer served the second hash from a cache keyed only on the pointer, so two ' +
      'different inputs produced the same digest. Any commitment, nullifier or signature domain ' +
      'built that way collides.',
    anchor: ANCHOR_BASE + 'req-1-compiler-SOL-2021-1',
  },
  {
    id: 'req-1-compiler-060',
    level: 'S',
    title: 'Use a Modern Compiler',
    statement:
      'The code must not use a Solidity compiler older than 0.8.0 unless it meets the listed ' +
      'Version 2 requirements as overriding requirements (including [S] No Overflow/Underflow and ' +
      'the SOL-2020 compiler bugs), and must not use one older than 0.6.0 unless it also meets ' +
      'the long list of Version 1 requirements covering the SOL-2019, SOL-2018, SOL-2017 and ' +
      'SOL-2016 bugs plus [S] Explicit Storage.',
    rationale:
      'This is the umbrella that makes an old compiler expensive rather than forbidden. From ' +
      '0.8.0 the compiler reverts on overflow and underflow by default; every step back below ' +
      'that adds a fresh catalogue of known miscompilations you now have to rule out one by one.',
    anchor: ANCHOR_BASE + 'req-1-compiler-060',
  },
  {
    id: 'req-1-no-ancient-compilers',
    level: 'S',
    title: 'No Ancient Compilers',
    statement: 'The code must not use a Solidity compiler version older than 0.3.',
    rationale:
      'Bugs were not tracked before 0.3, so there is no list to check the build against. The risk ' +
      'is not a known defect but an unbounded set of unknown ones.',
    anchor: ANCHOR_BASE + 'req-1-no-ancient-compilers',
  },

  /* ---------------------------------------------------------------- */
  /* Security Level [M] — 24 requirements                             */
  /* ---------------------------------------------------------------- */
  {
    id: 'req-2-pass-l1',
    level: 'M',
    title: 'Pass Security Level [S]',
    statement:
      'To be eligible for certification at Level [M], the code must first meet every requirement ' +
      'of Level [S].',
    rationale:
      'The levels are cumulative by explicit requirement, not by convention. A manual audit is an ' +
      'addition to the machine-checkable floor, never a substitute for it.',
    anchor: ANCHOR_BASE + 'req-2-pass-l1',
  },
  {
    id: 'req-2-enforce-eval-order',
    level: 'M',
    title: 'Explicitly Disambiguate Evaluation Order',
    statement:
      'The code must not contain statements whose outcome depends on the order in which variables ' +
      'or subexpressions are evaluated.',
    rationale:
      'Solidity does not fully fix evaluation order, and it has not stayed consistent across ' +
      'compiler versions. A statement calling two functions that both touch shared state can ' +
      'therefore produce a different result after a routine compiler bump; events, addmod and ' +
      'mulmod are called out as particularly unintuitive.',
    anchor: ANCHOR_BASE + 'req-2-enforce-eval-order',
  },
  {
    id: 'req-2-verify-exact-balance-check',
    level: 'M',
    title: 'Verify Exact Balance Checks',
    statement:
      'Code that does compare a balance for exact equality must protect itself against transfers ' +
      'that change the balance being tested. This overrides [S] No Exact Balance Check.',
    rationale:
      'The prohibition exists because balances can be forced upward by routes that never execute ' +
      'your code. Keeping the check means proving that an unsolicited deposit cannot change the ' +
      'outcome.',
    anchor: ANCHOR_BASE + 'req-2-verify-exact-balance-check',
  },
  {
    id: 'req-2-unicode-bdo',
    level: 'M',
    title: 'No Unnecessary Unicode Controls',
    statement:
      'Unicode direction control characters may appear only where they are needed to render text ' +
      'correctly, and only where the rendered result does not mislead a reader. This overrides ' +
      '[S] No Unicode Direction Control Characters.',
    rationale:
      'Right-to-left scripts legitimately need these characters. The auditable question is not ' +
      'whether they are present but whether the displayed text still matches the code.',
    anchor: ANCHOR_BASE + 'req-2-unicode-bdo',
  },
  {
    id: 'req-2-no-homoglyph-attack',
    level: 'M',
    title: 'No Homoglyph-style Attack',
    statement:
      'The code must not use homoglyphs, Unicode control characters, combining characters, or ' +
      'characters drawn from multiple Unicode blocks, where the effect is misleading.',
    rationale:
      'Two identifiers that render identically but differ by one codepoint let a reviewer approve ' +
      'one function while a different one ships. The same trick makes token names and strings ' +
      'impersonate a trusted original.',
    anchor: ANCHOR_BASE + 'req-2-no-homoglyph-attack',
  },
  {
    id: 'req-2-external-calls',
    level: 'M',
    title: 'Protect External Calls',
    statement:
      'For code that makes external calls, every address called must correspond to code inside ' +
      'the tested set, all called contracts must be controlled by the same entity, and the ' +
      're-entrancy protection must be at least as strong as Checks-Effects-Interactions — unless ' +
      'the Level [Q] set of Verify External Calls, Document Contract Logic, Document System ' +
      'Architecture and Implement as Documented is met. This overrides [S] Use ' +
      'Check-Effects-Interaction.',
    rationale:
      'Departing from Checks-Effects-Interactions is allowed only when every callee is known, ' +
      'reviewed and under the same control, so the set of things that can re-enter is closed and ' +
      'enumerable.',
    anchor: ANCHOR_BASE + 'req-2-external-calls',
  },
  {
    id: 'req-2-avoid-readonly-reentrancy',
    level: 'M',
    title: 'Avoid Read-only Re-entrancy Attacks',
    statement:
      'Code that makes external calls must protect itself against read-only re-entrancy attacks.',
    rationale:
      'A view function called back during an interaction returns state caught mid-update. Nothing ' +
      'is written by the attacker, yet a pool price or a share ratio read at that instant is ' +
      'wrong, and an integrating protocol acts on it. The spec suggests exposing a lock that ' +
      'view functions check so callers can refuse inconsistent data.',
    anchor: ANCHOR_BASE + 'req-2-avoid-readonly-reentrancy',
  },
  {
    id: 'req-2-handle-return',
    level: 'M',
    title: 'Handle External Call Returns',
    statement:
      'Code that makes external calls must handle the possible error results in a reasonable way. ' +
      'This overrides [S] Check External Calls Return.',
    rationale:
      'Reading the success flag is only half the job. A call to a function that does not exist ' +
      'may hit a fallback and report success, and a low-level call reports failure without ' +
      'reverting — the audit question is what the code then does about it.',
    anchor: ANCHOR_BASE + 'req-2-handle-return',
  },
  {
    id: 'req-2-documented',
    level: 'M',
    title: 'Document Special Code Use',
    statement:
      'Each use of CREATE2, assembly {}, selfdestruct() or suicide(), external calls, ' +
      'delegatecall(), code that can overflow or underflow, block.number or block.timestamp, and ' +
      'oracles or pseudo-randomness must be documented along with how the code guards against ' +
      'misuse, and that documentation must be available to anyone who can call the code.',
    rationale:
      'This is the second half of nearly every Level [S] exemption. Publishing why a dangerous ' +
      'construct is present, and what contains it, is what turns an unexplained risk into a ' +
      'reviewable design decision.',
    anchor: ANCHOR_BASE + 'req-2-documented',
  },
  {
    id: 'req-2-check-rounding',
    level: 'M',
    title: 'Ensure Proper Rounding of Computations Affecting Value',
    statement:
      'The code must identify and defend against exploitable rounding: the possible error range ' +
      'must be documented, value must not be created or lost unintentionally, and rounding must ' +
      'not permit a repeatable round trip that manufactures value.',
    rationale:
      'Integer arithmetic standing in for real numbers always rounds somewhere. When the ' +
      'direction of that error is predictable and the operation can be repeated cheaply, dust ' +
      'per call compounds into a drain — the mechanism behind share-price and vault inflation ' +
      'attacks.',
    anchor: ANCHOR_BASE + 'req-2-check-rounding',
  },
  {
    id: 'req-2-self-destruct',
    level: 'M',
    title: 'Protect Self-destruction',
    statement:
      'Code containing selfdestruct() or suicide() must ensure only authorised parties can reach ' +
      'it, and must protect those calls consistently with what the contract author claims, unless ' +
      'it meets [Q] Enforce Least Privilege. This overrides [S] No selfdestruct().',
    rationale:
      'Destruction is irreversible and instantaneous, so the access control in front of it is the ' +
      'entire safety argument. It has to match the published claims, not merely exist.',
    anchor: ANCHOR_BASE + 'req-2-self-destruct',
  },
  {
    id: 'req-2-safe-assembly',
    level: 'M',
    title: 'Avoid Common assembly {} Attack Vectors',
    statement:
      'The code must not use assembly {} to change a variable unless it can neither create storage ' +
      'pointer collisions nor allow arbitrary values to be assigned to variables of function type. ' +
      'This is part of the set overriding [S] No assembly {}.',
    rationale:
      'Those two capabilities are what make assembly qualitatively different from Solidity: one ' +
      'lets an unrelated write land on a privileged slot, the other turns a call into a jump to ' +
      'an address of the attacker choosing.',
    anchor: ANCHOR_BASE + 'req-2-safe-assembly',
  },
  {
    id: 'req-2-protect-create2',
    level: 'M',
    title: 'Protect CREATE2 Calls',
    statement:
      'Any contract deployed with CREATE2 must be inside the tested code, must not use ' +
      'selfdestruct(), delegatecall() or callcode(), and must be fully consistent with what the ' +
      'contract author claims — unless the Level [Q] external-call set is met. This is part of ' +
      'the set overriding [S] No CREATE2.',
    rationale:
      'The danger of a precomputed address is that its occupant can be replaced. Forbidding ' +
      'selfdestruct and delegatecall in the deployed contract is what makes the address a ' +
      'permanent commitment to reviewed code.',
    anchor: ANCHOR_BASE + 'req-2-protect-create2',
  },
  {
    id: 'req-2-overflow-underflow',
    level: 'M',
    title: 'Safe Overflow/Underflow',
    statement:
      'The code must not contain calculations that can overflow or underflow unless there is a ' +
      'demonstrated need, such as modular arithmetic, and guards keep the behavior consistent ' +
      'with what the contract author claims.',
    rationale:
      'Solidity 0.8 reverts by default, which moves the risk into deliberate unchecked blocks and ' +
      'inline assembly. Those are exactly the places where a wrapped subtraction becomes a balance ' +
      'of 2^256 minus one.',
    anchor: ANCHOR_BASE + 'req-2-overflow-underflow',
  },
  {
    id: 'req-2-random-enough',
    level: 'M',
    title: 'Sources of Randomness',
    statement:
      'Any source of randomness the code relies on must be resistant enough to prediction that it ' +
      'still serves its purpose.',
    rationale:
      'Everything on chain is visible to the party choosing when to submit a transaction, so ' +
      'block hashes, timestamps and prevrandao are observable or nudgeable by whoever builds the ' +
      'block. The bar is set by what an outcome is worth, not by whether the value looks random.',
    anchor: ANCHOR_BASE + 'req-2-random-enough',
  },
  {
    id: 'req-2-block-data-misuse',
    level: 'M',
    title: "Don't Misuse Block Data",
    statement:
      'Block numbers and timestamps used by the code must not introduce vulnerability to MEV or ' +
      'similar attacks.',
    rationale:
      'Block producers choose the timestamp within a tolerance and decide which transactions land ' +
      'in which block. Deadlines, lock expiries and reward windows keyed on that data are ' +
      'therefore levers the proposer holds, not neutral clocks.',
    anchor: ANCHOR_BASE + 'req-2-block-data-misuse',
  },
  {
    id: 'req-2-signature-verification',
    level: 'M',
    title: 'Proper Signature Verification',
    statement:
      'The code must properly verify signatures so that messages signed off-chain are genuinely ' +
      'authentic.',
    rationale:
      'ecrecover returns the zero address on malformed input rather than reverting, so a check ' +
      'that forgets to reject it authorizes anyone. Verification also has to bind the message to ' +
      'the intended signer, contract and chain, not merely recover some address.',
    anchor: ANCHOR_BASE + 'req-2-signature-verification',
  },
  {
    id: 'req-2-malleable-signatures-for-replay',
    level: 'M',
    title: 'No Improper Usage of Signatures for Replay Attack Protection',
    statement:
      'Where signatures provide replay protection, one signature must not be reusable in the same ' +
      'function, in another function of the tested code, at another contract address where the ' +
      'same accounts may sign, or on another chain — unless [Q] Intended Replay is met — and ' +
      'multiple valid signatures must not exist for the same message.',
    rationale:
      'Replay protection fails in two directions. Either the same signature is accepted twice, or ' +
      'the signature can be transformed into a second distinct-looking one for the same message, ' +
      'defeating a nonce keyed on the signature bytes.',
    anchor: ANCHOR_BASE + 'req-2-malleable-signatures-for-replay',
  },
  {
    id: 'req-2-compiler-SOL-2023-1',
    level: 'M',
    title: 'Solidity Compiler Bug 2023-1',
    statement:
      'Code containing a compound expression with side effects that uses .selector must compile ' +
      'with the viaIR option on Solidity 0.6.2 through 0.8.20 inclusive.',
    rationale:
      'Without viaIR in that range the expression was never evaluated, so its side effects simply ' +
      'did not happen while the surrounding code carried on as if they had.',
    anchor: ANCHOR_BASE + 'req-2-compiler-SOL-2023-1',
  },
  {
    id: 'req-2-compiler-SOL-2022-7',
    level: 'M',
    title: 'Compiler Bug SOL-2022-7',
    statement:
      'Code with storage writes followed by a conditional early termination from an inline ' +
      'assembly function containing return() or stop() must not use Solidity 0.8.13 through ' +
      '0.8.16 inclusive. This is part of the set overriding [S] No assembly {}.',
    rationale:
      'The optimizer sometimes dropped those storage writes altogether, so state the source ' +
      'clearly commits is missing after the transaction succeeds.',
    anchor: ANCHOR_BASE + 'req-2-compiler-SOL-2022-7',
  },
  {
    id: 'req-2-compiler-SOL-2022-5-assembly',
    level: 'M',
    title: 'Compiler Bug SOL-2022-5 in assembly {}',
    statement:
      'Code that copies a bytes array from calldata or memory whose size is not a multiple of 32 ' +
      'bytes and then reads it from assembly {} without explicitly matching the copied length ' +
      'must not use a Solidity compiler older than 0.8.15. This is part of the set overriding ' +
      '[S] No assembly {}.',
    rationale:
      'Same underlying defect as the .push() form at Level [S]: the last word keeps whatever was ' +
      'next to the source data, and assembly reading past the logical length exposes it.',
    anchor: ANCHOR_BASE + 'req-2-compiler-SOL-2022-5-assembly',
  },
  {
    id: 'req-2-compiler-SOL-2022-4',
    level: 'M',
    title: 'Compiler Bug SOL-2022-4',
    statement:
      'Code with at least two assembly {} blocks, where one writes memory it never reads again and ' +
      'another refers to that memory, must not use the yulOptimizer with Solidity 0.8.13 or ' +
      '0.8.14. This is part of the set overriding [S] No assembly {}.',
    rationale:
      'The optimizer could not see the cross-block reference and discarded the write as dead, so ' +
      'the second block read stale or uninitialized memory.',
    anchor: ANCHOR_BASE + 'req-2-compiler-SOL-2022-4',
  },
  {
    id: 'req-2-compiler-SOL-2021-3',
    level: 'M',
    title: 'Compiler Bug SOL-2021-3',
    statement:
      'Code that reads an immutable signed integer of a type shorter than 256 bits inside an ' +
      'assembly {} block must not use Solidity 0.6.5 through 0.8.8 inclusive. This is part of the ' +
      'set overriding [S] No assembly {}.',
    rationale:
      'Those releases could return the wrong value for such a read, so a bound or a rate stored ' +
      'as an immutable int is not the number the constructor set.',
    anchor: ANCHOR_BASE + 'req-2-compiler-SOL-2021-3',
  },
  {
    id: 'req-2-compiler-060',
    level: 'M',
    title: 'Use a Modern Compiler',
    statement:
      'The code must not use a Solidity compiler older than 0.8.0 unless it meets the Version 2 ' +
      'requirement [M] Compiler Bug Check Constructor Payment as an overriding requirement, and ' +
      'must not use one older than 0.6.0 unless it also meets six Version 1 requirements: ' +
      '[M] Compiler Bug SOL-2020-2, [M] Compiler Bug SOL-2019-2 in assembly {}, [M] Compiler Bug ' +
      'Check Identity Calls, [M] Validate ecrecover() input, [M] Compiler Bug No Zero Ether Send ' +
      'and [M] Declare storage Explicitly.',
    rationale:
      'The Level [M] half of the modern-compiler rule covers the bugs whose trigger conditions a ' +
      'scanner cannot reliably detect, so staying on an old compiler buys a specific list of ' +
      'manual review obligations.',
    anchor: ANCHOR_BASE + 'req-2-compiler-060',
  },

  /* ---------------------------------------------------------------- */
  /* Security Level [Q] — 24 requirements                             */
  /* ---------------------------------------------------------------- */
  {
    id: 'req-3-pass-l2',
    level: 'Q',
    title: 'Pass Security Level [M]',
    statement:
      'To be eligible for certification at Level [Q], the code must first meet every requirement ' +
      'of Level [M].',
    rationale:
      'Level [Q] is about intent and correctness. It only means something on top of code that has ' +
      'already passed the automated checks and a manual audit.',
    anchor: ANCHOR_BASE + 'req-3-pass-l2',
  },
  {
    id: 'req-3-timelock-for-privileged-actions',
    level: 'Q',
    title: 'Use TimeLock Delays for Sensitive Operations',
    statement:
      'Sensitive operations affecting all or a majority of users must go through a timelock delay.',
    rationale:
      'A delay converts a unilateral privileged action into a public announcement with time to ' +
      'react. Without it, a compromised key changes the rules and moves funds in the same block.',
    anchor: ANCHOR_BASE + 'req-3-timelock-for-privileged-actions',
  },
  {
    id: 'req-3-linted',
    level: 'Q',
    title: 'Code Linting',
    statement:
      'The code must not create unnecessary variables, reuse one name for different things in the ' +
      'same scope, include assert() statements that fail in normal operation, or contain ' +
      'unreachable code beyond deliberate error handling; a function must not share the contract ' +
      'name unless declared with the constructor keyword; visibility must be explicit on every ' +
      'function and variable; and the pragma must specify one or more compiler versions.',
    rationale:
      'Each item is a known historical footgun rather than a style preference — the shadowed ' +
      'name that silently binds to the wrong declaration, the mistyped constructor that stays a ' +
      'public function, the implicit visibility that defaults to public on old compilers.',
    anchor: ANCHOR_BASE + 'req-3-linted',
  },
  {
    id: 'req-3-enough-gas',
    level: 'Q',
    title: 'Manage Gas Use Increases',
    statement:
      'Data structures that grow over time must remain workable within available gas, consistent ' +
      'with the description given for [Q] Document Contract Logic.',
    rationale:
      'Iterating a structure whose size is set by users is a denial of service waiting for enough ' +
      'entries. What counts as reasonable growth can only be judged against the documented ' +
      'business logic, which is why this requirement lives at Level [Q].',
    anchor: ANCHOR_BASE + 'req-3-enough-gas',
  },
  {
    id: 'req-3-protect-gas',
    level: 'Q',
    title: 'Protect Gas Usage',
    statement: 'The code must protect against malicious actors stealing or wasting gas.',
    rationale:
      'Contracts that sponsor transactions on behalf of users pay for work an attacker chooses. ' +
      'Gas griefing and gas siphoning turn that generosity into a denial-of-service budget.',
    anchor: ANCHOR_BASE + 'req-3-protect-gas',
  },
  {
    id: 'req-3-check-oracles',
    level: 'Q',
    title: 'Protect against Oracle Failure',
    statement: 'The code must protect itself against malfunctions in the oracles it relies on.',
    rationale:
      'An oracle is an external dependency that can go stale, report zero, or be manipulated ' +
      'within a block. Code that consumes a price without staleness and sanity bounds inherits ' +
      'every failure mode of its feed.',
    anchor: ANCHOR_BASE + 'req-3-check-oracles',
  },
  {
    id: 'req-3-block-front-running',
    level: 'Q',
    title: 'Protect against Ordering Attacks',
    statement:
      'The code must manage information so that it is protected against ordering attacks.',
    rationale:
      'Pending transactions are public and their order is for sale. Anything whose value depends ' +
      'on being first — a claim, an auction bid, an allowance change — has to be designed so ' +
      'seeing it in the mempool does not help, typically with a commit-reveal step.',
    anchor: ANCHOR_BASE + 'req-3-block-front-running',
  },
  {
    id: 'req-3-block-mev',
    level: 'Q',
    title: 'Protect against MEV Attacks',
    statement:
      'Code susceptible to MEV attacks must follow appropriate design patterns to mitigate the risk.',
    rationale:
      'Where ordering carries extractable value, the block builder is a rational adversary with ' +
      'perfect information. Sandwichable swaps and liquidations need slippage bounds and design ' +
      'choices that shrink the extractable margin.',
    anchor: ANCHOR_BASE + 'req-3-block-mev',
  },
  {
    id: 'req-3-protect-governance',
    level: 'Q',
    title: 'Protect Against Governance Takeovers',
    statement:
      'Code including a governance system must protect against malicious exploitation of the ' +
      'governance design.',
    rationale:
      'If voting power can be borrowed for one block, governance is a flash-loan away from ' +
      'passing anything. Snapshot-based voting weight and proposal delays are what keep the ' +
      'design from being an unguarded upgrade path.',
    anchor: ANCHOR_BASE + 'req-3-protect-governance',
  },
  {
    id: 'req-3-all-valid-inputs',
    level: 'Q',
    title: 'Process All Inputs',
    statement:
      'The code must validate its inputs and behave correctly whether the input is as designed or ' +
      'malformed.',
    rationale:
      'Every external function is an untrusted entry point; there is no caller-side validation to ' +
      'rely on. Correct behavior on malformed input includes rejecting it cleanly rather than ' +
      'proceeding on a zero address or an empty array.',
    anchor: ANCHOR_BASE + 'req-3-all-valid-inputs',
  },
  {
    id: 'req-3-event-on-state-change',
    level: 'Q',
    title: 'State Changes Trigger Events',
    statement: 'The code must emit an event for every transaction that changes state.',
    rationale:
      'Events are the only affordable way to observe a contract from outside. Complete event ' +
      'coverage is what makes monitoring, incident response and off-chain reconstruction ' +
      'possible after the fact.',
    anchor: ANCHOR_BASE + 'req-3-event-on-state-change',
  },
  {
    id: 'req-3-no-private-data',
    level: 'Q',
    title: 'No Private Data',
    statement: 'The code must not store private data on the blockchain.',
    rationale:
      'The private keyword controls what other contracts may read, not what the world can see: ' +
      'every storage slot is public and permanent. A secret on chain is a published secret with ' +
      'a delay.',
    anchor: ANCHOR_BASE + 'req-3-no-private-data',
  },
  {
    id: 'req-3-intended-replay',
    level: 'Q',
    title: 'Intended Replay',
    statement:
      'Where a signature can be reused, the replay must be intended, documented and safe to reuse. ' +
      'This overrides [M] No Improper Usage of Signatures for Replay Attack Protection.',
    rationale:
      'Some designs genuinely want a reusable signature, such as a standing allowlist permission ' +
      'for a period. The requirement is that the reuse is a stated allowance which has been ' +
      'checked for abuse, not an oversight.',
    anchor: ANCHOR_BASE + 'req-3-intended-replay',
  },
  {
    id: 'req-3-documented',
    level: 'Q',
    title: 'Document Contract Logic',
    statement:
      'A specification of the business logic the code is meant to implement must be available to ' +
      'anyone who can call it.',
    rationale:
      'Without a stated intent there is no such thing as a logic bug — only surprising behavior. ' +
      'This document is what several other Level [Q] requirements are judged against.',
    anchor: ANCHOR_BASE + 'req-3-documented',
  },
  {
    id: 'req-3-document-system',
    level: 'Q',
    title: 'Document System Architecture',
    statement:
      'Documentation of the system architecture must be provided, covering the overall design, ' +
      'privileged roles, security assumptions and intended usage.',
    rationale:
      'Most real incidents live between contracts rather than inside one. Naming the privileged ' +
      'roles and the trust assumptions is what lets a reviewer see which of them a single ' +
      'compromised key would break.',
    anchor: ANCHOR_BASE + 'req-3-document-system',
  },
  {
    id: 'req-3-document-threats',
    level: 'Q',
    title: 'Document Threat Models',
    statement:
      'Threat models must be documented, describing each threat, the security assumptions, the ' +
      'expected response and the expected outcome.',
    rationale:
      'A threat model makes the defended surface explicit and, just as usefully, the undefended ' +
      'one. Integrators can then decide whether their own assumptions are covered.',
    anchor: ANCHOR_BASE + 'req-3-document-threats',
  },
  {
    id: 'req-3-annotate',
    level: 'Q',
    title: 'Annotate Code with NatSpec',
    statement:
      'Every public interface must carry NatSpec comments explaining the intent of each function, ' +
      'parameter, event and return value, together with developer notes on safe usage.',
    rationale:
      'NatSpec puts the intended meaning next to the implementation, where a reviewer compares ' +
      'them, and surfaces it in wallets and explorers where a user is deciding whether to sign.',
    anchor: ANCHOR_BASE + 'req-3-annotate',
  },
  {
    id: 'req-3-implement-as-documented',
    level: 'Q',
    title: 'Implement as Documented',
    statement:
      'The code must behave as described in the documentation provided for [Q] Document Contract ' +
      'Logic and [Q] Document System Architecture.',
    rationale:
      'This is the requirement that gives the documentation teeth. Documentation that the ' +
      'implementation contradicts is worse than none, because integrators build against it.',
    anchor: ANCHOR_BASE + 'req-3-implement-as-documented',
  },
  {
    id: 'req-3-access-control',
    level: 'Q',
    title: 'Enforce Least Privilege',
    statement:
      'Code granting privileged access must implement access control that gives the least ' +
      'privilege necessary for those interactions, judged against the documentation from ' +
      '[Q] Document Contract Logic. This overrides [M] Protect Self-destruction.',
    rationale:
      'A single all-powerful role means one key compromise is total. Splitting privileges by what ' +
      'each role actually needs bounds the damage any one of them can do.',
    anchor: ANCHOR_BASE + 'req-3-access-control',
  },
  {
    id: 'req-3-revocable-permisions',
    level: 'Q',
    title: 'Use Revocable and Transferable Access Control Permissions',
    statement:
      'If the code uses access control for privileged actions, it must provide a mechanism to ' +
      'revoke and to transfer those permissions.',
    rationale:
      'Keys leak and people leave. Without revocation and transfer, the only response to a ' +
      'compromised admin is to migrate the whole system. (The spec anchor spells this id ' +
      '"permisions" — copied verbatim so the link resolves.)',
    anchor: ANCHOR_BASE + 'req-3-revocable-permisions',
  },
  {
    id: 'req-3-no-single-admin-eoa',
    level: 'Q',
    title: 'No Single Admin EOA for Privileged Actions',
    statement:
      'Critical administrative tasks must require multiple signatures, unless a multisig admin ' +
      'with greater privileges can revoke a compromised or rogue EOA and reverse any adverse ' +
      'action it took.',
    rationale:
      'One externally owned account holding admin rights makes a single lost or stolen private ' +
      'key an existential risk to the whole system.',
    anchor: ANCHOR_BASE + 'req-3-no-single-admin-eoa',
  },
  {
    id: 'req-3-external-calls',
    level: 'Q',
    title: 'Verify External Calls',
    statement:
      'Code containing external calls must document why each one is needed and protect it in a ' +
      'way fully consistent with what the contract author claims. This is part of the sets ' +
      'overriding [S] Use Check-Effects-Interaction and [M] Protect External Calls.',
    rationale:
      'This is the Level [Q] route to calling contracts outside the tested set: instead of ' +
      'proving the callee list is closed, you state the purpose of each call and show the ' +
      'protection matches the published claims.',
    anchor: ANCHOR_BASE + 'req-3-external-calls',
  },
  {
    id: 'req-3-verify-tx.origin',
    level: 'Q',
    title: 'Verify tx.origin Usage',
    statement:
      'Each use of tx.origin must be consistent with the stated security and functionality ' +
      'objectives, and must not let another contract violate the assertions made for ' +
      '[Q] Document Contract Logic or [Q] Document System Architecture — even when that contract ' +
      'is called by a user authorized to interact directly. This overrides [S] No tx.origin.',
    rationale:
      'The clause about an authorized user calling another contract is the phishing case stated ' +
      'precisely: the check must still hold when the legitimate signer is the one being used as ' +
      'the vehicle.',
    anchor: ANCHOR_BASE + 'req-3-verify-tx.origin',
  },
  {
    id: 'req-3-consistent-solidity-output',
    level: 'Q',
    title: 'Specify Solidity Compiler Versions to Produce Consistent Output',
    statement:
      'The pragma must specify a range of Solidity versions that all produce the same bytecode ' +
      'given the same compilation options.',
    rationale:
      'Certification is granted to bytecode, not to source. A floating pragma means the audited ' +
      'artifact and the deployed artifact can differ, and the spec requires a fresh assessment ' +
      'whenever the produced bytecode changes.',
    anchor: ANCHOR_BASE + 'req-3-consistent-solidity-output',
  },
];

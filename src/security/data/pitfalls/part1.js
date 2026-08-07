/**
 * @file part1.js
 * @description Secureum "Security Pitfalls & Best Practices 101" — items 1-34.
 *              Covers the compiler/pragma run, access control and constructors,
 *              reentrancy, on-chain data and time, arithmetic and ordering,
 *              token-standard integration and ether handling.
 *
 * Source: Rajeev | Secureum, "101 Security Pitfalls & Best Practices"
 *         https://secureum.substack.com/p/security-pitfalls-and-best-practices-101
 *         (fetched 2026-08-07 directly from substack; no mirror required).
 *
 * The source numbers its items 1-101 in a single flat list; `id` preserves that
 * numbering across part1/part2/part3 so a reader can look up the original entry.
 * Every `text` is an original paraphrase — no source sentence is reproduced.
 * `title`, `tags` and `severity` are authored judgements: the source assigns no
 * severity and no tags to any item.
 */

export const PITFALLS = [
  {
    id: 1,
    title: 'Choose the compiler version deliberately',
    text:
      'Very old compilers miss later bug fixes and built-in safety checks, while the newest release ' +
      'may still be hiding bugs nobody has found yet. The article suggests settling on a version ' +
      'that has been in the field long enough to be trusted, naming 0.7.5, 0.7.6 or 0.8.4.',
    tags: ['compiler', 'versioning'],
    severity: 'medium',
  },
  {
    id: 2,
    title: 'Lock the pragma before deploying',
    text:
      'Deploy with exactly the compiler version and flags the code was tested under. A floating ' +
      'range such as a caret pragma lets a later build silently pick a different compiler than the ' +
      'one that was reviewed.',
    tags: ['compiler', 'pragma', 'build'],
    severity: 'medium',
  },
  {
    id: 3,
    title: 'Use one compiler version across the codebase',
    text:
      'Files pinned to different pragma versions bring different sets of compiler bugs and ' +
      'different built-in checks into the same deployment. Standardize on a single version.',
    tags: ['compiler', 'pragma'],
    severity: 'low',
  },
  {
    id: 4,
    title: 'Gate every privileged function',
    text:
      'Functions carrying critical logic need an explicit authorization check, normally an address ' +
      'comparison expressed as a modifier. Wherever that check is absent, an attacker drives the ' +
      'privileged path directly.',
    tags: ['access-control', 'authorization'],
    severity: 'high',
  },
  {
    id: 5,
    title: 'Never leave a withdrawal path open',
    text:
      'An external or public function that forwards ether or tokens to a caller-supplied address ' +
      'with no permission check is an open till. Anyone can pull out funds they never deposited.',
    tags: ['access-control', 'withdrawal'],
    severity: 'high',
  },
  {
    id: 6,
    title: 'Guard selfdestruct behind access control',
    text:
      'An unprotected selfdestruct lets any caller erase the contract, whether by mistake or on ' +
      'purpose. Restrict who is allowed to reach it.',
    tags: ['access-control', 'selfdestruct'],
    severity: 'high',
  },
  {
    id: 7,
    title: 'Keep modifiers to checks only',
    text:
      'A modifier that writes state or makes an external call breaks the checks-effects-interactions ' +
      'ordering of every function it decorates. Because the modifier body sits far from those ' +
      'functions, the side effect routinely escapes both developers and reviewers.',
    tags: ['modifiers', 'checks-effects-interactions'],
    severity: 'medium',
  },
  {
    id: 8,
    title: 'Make every modifier path reach the placeholder or revert',
    text:
      'If some branch of a modifier neither runs the underscore placeholder nor reverts, the ' +
      'decorated function never executes and simply returns default values. Callers read that as ' +
      'success.',
    tags: ['modifiers', 'control-flow'],
    severity: 'medium',
  },
  {
    id: 9,
    title: 'Use the constructor keyword',
    text:
      'Before solc 0.4.22 the constructor was an ordinary function that had to match the contract ' +
      'name, so one typo left it callable by anyone. Between 0.4.22 and 0.5.0 both styles coexisted ' +
      'with precedence rules of their own; 0.5.0 made the keyword mandatory.',
    tags: ['constructor', 'legacy-solidity'],
    severity: 'high',
  },
  {
    id: 10,
    title: 'Do not call unimplemented base constructors',
    text:
      'Invoking a base constructor that has no implementation gives false assurance that ' +
      'initialization happened. Either implement it or drop the call.',
    tags: ['constructor', 'inheritance'],
    severity: 'low',
  },
  {
    id: 11,
    title: 'Know the missing creation-time callValue check (v0.4.5 to v0.6.8)',
    text:
      'From 0.4.5 the creation code of a contract without a payable constructor was meant to revert ' +
      'on a non-zero value deployment, but the check was omitted when a contract declared no ' +
      'constructor of its own and inherited one from a base. Such deployments could carry value ' +
      'anyway. Fixed in v0.6.8.',
    tags: ['compiler-bug', 'constructor', 'ether'],
    severity: 'low',
  },
  {
    id: 12,
    title: 'Never delegatecall an address the caller chooses',
    text:
      'delegatecall and callcode run the target code against your own storage, balance and ' +
      'msg.sender. If the destination is user-controlled, the attacker is executing arbitrary code ' +
      'inside your contract. Restrict destinations to addresses you trust.',
    tags: ['delegatecall', 'access-control'],
    severity: 'high',
  },
  {
    id: 13,
    title: 'Finish the bookkeeping before calling out',
    text:
      'An untrusted external call can re-enter before your state has been updated, producing repeat ' +
      'withdrawals or events emitted out of order. Apply checks-effects-interactions and add a ' +
      'reentrancy guard.',
    tags: ['reentrancy', 'checks-effects-interactions'],
    severity: 'high',
  },
  {
    id: 14,
    title: 'Treat ERC-777 hooks as reentrancy points',
    text:
      'ERC-777 fires sender and receiver hooks during a transfer, handing control to an arbitrary ' +
      'address mid-transfer. Without a guard, that callback is a reentrancy opportunity in code that ' +
      'looks like a plain token move.',
    tags: ['reentrancy', 'erc777', 'tokens'],
    severity: 'high',
  },
  {
    id: 15,
    title: 'Stop using transfer() and send() as a reentrancy defense',
    text:
      'Their 2300 gas stipend was only ever an accident of gas costs, and opcode repricing can break ' +
      'contracts that lean on it. Send ether with call() and no hardcoded gas limit, and defend ' +
      'reentrancy with checks-effects-interactions or an explicit guard.',
    tags: ['reentrancy', 'ether-transfer', 'gas'],
    severity: 'medium',
  },
  {
    id: 16,
    title: 'private is a visibility keyword, not secrecy',
    text:
      'Marking a variable private only stops other contracts from reading it through Solidity; the ' +
      'storage slot is still public data any node will serve. Sensitive values belong off-chain, or ' +
      'on-chain only as a commitment.',
    tags: ['storage', 'privacy'],
    severity: 'high',
  },
  {
    id: 17,
    title: 'Do not derive randomness from block data',
    text:
      'block.timestamp, the legacy now alias, and blockhash are all values a block producer can nudge ' +
      'within a range. Anything of value selected by such a PRNG is steerable by whoever builds the ' +
      'block.',
    tags: ['randomness', 'prng'],
    severity: 'high',
  },
  {
    id: 18,
    title: 'Treat block values as approximate clocks',
    text:
      'Neither block.timestamp nor block.number is a reliable representation of wall-clock time: ' +
      'block intervals change, and producers have latitude over the timestamp they publish. Do not ' +
      'let precise timing decide value.',
    tags: ['timestamp', 'time'],
    severity: 'medium',
  },
  {
    id: 19,
    title: 'Keep arithmetic inside its bounds',
    text:
      'Before solc 0.8.0 arithmetic wrapped silently, so an attacker-controlled operand could roll a ' +
      'balance past zero; SafeMath and similar libraries existed to catch it. 0.8.0 made those checks ' +
      'the default, but an unchecked block opts back out of them.',
    tags: ['arithmetic', 'overflow'],
    severity: 'high',
  },
  {
    id: 20,
    title: 'Multiply before you divide',
    text:
      'Integer division truncates, so dividing first discards precision the later multiplication ' +
      'cannot recover. Reorder the expression so the multiplication happens first.',
    tags: ['arithmetic', 'precision'],
    severity: 'medium',
  },
  {
    id: 21,
    title: 'Assume nothing about transaction ordering',
    text:
      'Anyone watching the mempool can place a transaction ahead of yours, turning an ordering ' +
      'assumption into a race. The canonical example is front-running a change to an ERC-20 ' +
      'allowance.',
    tags: ['front-running', 'ordering'],
    severity: 'high',
  },
  {
    id: 22,
    title: 'Change allowances incrementally',
    text:
      'Overwriting an allowance in one step lets a watching spender use the old value and the new ' +
      'one. The safeIncreaseAllowance and safeDecreaseAllowance helpers in the OpenZeppelin SafeERC20 ' +
      'library close that window.',
    tags: ['erc20', 'approval', 'front-running'],
    severity: 'medium',
  },
  {
    id: 23,
    title: 'Do not trust raw ecrecover',
    text:
      'For any valid signature a second, equally valid encoding exists, so a replay guard keyed on ' +
      'the signature bytes can be defeated with a tweaked copy. Recover through the OpenZeppelin ' +
      'ECDSA library, which rejects the malleable form.',
    tags: ['signatures', 'ecdsa', 'replay'],
    severity: 'high',
  },
  {
    id: 24,
    title: 'Wrap non-standard ERC-20 transfers',
    text:
      'Several widely held tokens return nothing at all from transfer(). Code compiled with solc ' +
      '0.4.22 or later that expects a boolean will revert against them, so route calls through the ' +
      'SafeERC20 wrappers instead.',
    tags: ['erc20', 'tokens', 'integration'],
    severity: 'medium',
  },
  {
    id: 25,
    title: 'Do not assume conforming ERC-721 return types',
    text:
      'An ERC-721 whose ownerOf() returns a bool rather than an address will make a modern caller ' +
      'revert. Build on the OpenZeppelin ERC-721 implementations rather than assuming conformance.',
    tags: ['erc721', 'tokens', 'integration'],
    severity: 'low',
  },
  {
    id: 26,
    title: 'Never treat this.balance as an invariant',
    text:
      'Ether arrives through payable calls, as the beneficiary of a selfdestruct, as a coinbase ' +
      'payout, or by funding the address before the contract is even deployed. Logic pinned to an ' +
      'exact balance can therefore be pushed off course by anyone willing to donate.',
    tags: ['ether', 'balance', 'forced-send'],
    severity: 'medium',
  },
  {
    id: 27,
    title: 'Get fallback and receive right',
    text:
      'The two entry points differ in which calls they catch, what visibility and mutability they ' +
      'accept, and how they behave under an ether transfer. Confirm the one you declared is the one ' +
      'you meant, and that you have thought through everything it will accept.',
    tags: ['fallback', 'receive'],
    severity: 'medium',
  },
  {
    id: 28,
    title: 'Avoid exact equality on balances',
    text:
      'A strict equality against a token or ether balance can be knocked out of alignment by a dust ' +
      'transfer, whether accidental or deliberate. Where the logic tolerates it, compare with a ' +
      'threshold instead.',
    tags: ['arithmetic', 'balance'],
    severity: 'medium',
  },
  {
    id: 29,
    title: 'Give received ether a way out',
    text:
      'A contract that accepts ether through payable functions but ships no withdrawal path traps ' +
      'everything sent to it, permanently. Either remove payable or add a way to get the funds back.',
    tags: ['ether', 'locked-funds'],
    severity: 'medium',
  },
  {
    id: 30,
    title: 'Authorize on msg.sender, never tx.origin',
    text:
      'tx.origin stays the signing account through the entire call chain, so a malicious contract the ' +
      'user is persuaded to call can relay a privileged call and satisfy the check. msg.sender names ' +
      'the immediate caller and cannot be inherited that way.',
    tags: ['access-control', 'tx-origin', 'phishing'],
    severity: 'high',
  },
  {
    id: 31,
    title: 'Know the limits of caller-is-an-EOA checks',
    text:
      'An extcodesize test reports zero for a contract that is still inside its constructor, so the ' +
      'check is bypassable from that window. Comparing tx.origin against msg.sender is the usual ' +
      'alternative and carries trade-offs of its own; understand both before relying on either.',
    tags: ['eoa-check', 'extcodesize'],
    severity: 'medium',
  },
  {
    id: 32,
    title: 'delete does not clear a nested mapping',
    text:
      'Deleting a struct leaves any mapping it contains fully populated, so stale entries survive what ' +
      'looks like a reset and later reads pick them back up.',
    tags: ['storage', 'mappings', 'delete'],
    severity: 'medium',
  },
  {
    id: 33,
    title: 'Flag conditions that cannot vary',
    text:
      'A comparison that is always true or always false, such as testing an unsigned value for being ' +
      'at least zero, means the check you intended is not actually running. Treat it as flawed logic ' +
      'rather than harmless redundancy.',
    tags: ['logic', 'dead-check'],
    severity: 'low',
  },
  {
    id: 34,
    title: 'Do not hardcode booleans in conditionals',
    text:
      'A literal true or false sitting where a condition belongs usually marks logic that was ' +
      'stubbed out, inverted, or never finished.',
    tags: ['logic', 'code-smell'],
    severity: 'low',
  },
];

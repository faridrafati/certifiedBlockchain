/**
 * @file medium.js
 * @description Slither detectors of severity Medium — 28 entries, the complete
 *              Medium set in the upstream detector documentation.
 *
 * Source: https://github.com/crytic/slither/wiki/Detector-Documentation
 * (parsed from https://raw.githubusercontent.com/wiki/crytic/slither/Detector-Documentation.md)
 *
 * `check`, `severity` and `confidence` are reproduced exactly as Slither
 * publishes them, because `check` is the CLI identifier a reader will type into
 * `slither --detect <check>` and the severity/confidence pair is what the tool
 * actually reports. `description` and `recommendation` are summarized in our
 * own words, not copied from the upstream text.
 *
 * Ordering: confidence High first, then Medium, alphabetical by `check` within
 * each group — the same order the upstream document lists them.
 */

export const DETECTORS = [
  {
    check: 'domain-separator-collision',
    title: 'Domain separator collision',
    severity: 'Medium',
    confidence: 'High',
    description:
      'An ERC-20 token exposes a function whose selector clashes with the DOMAIN_SEPARATOR() ' +
      'signature defined by EIP-2612, so contracts that rely on permit can end up invoking the ' +
      'wrong code path.',
    recommendation:
      'Rename or remove the colliding function so DOMAIN_SEPARATOR() resolves to the intended ' +
      'EIP-2612 implementation.',
  },
  {
    check: 'enum-conversion',
    title: 'Dangerous enum conversion',
    severity: 'Medium',
    confidence: 'High',
    description:
      'A value is converted to an enum without any guarantee that it falls inside the declared ' +
      'members. Compilers older than solc 0.4.5 accepted out-of-range conversions silently, so a ' +
      'caller could steer the contract into an undefined state.',
    recommendation:
      'Build with a current compiler release. If an older solc is unavoidable, range-check the ' +
      'value before converting it.',
  },
  {
    check: 'erc20-interface',
    title: 'Incorrect erc20 interface',
    severity: 'Medium',
    confidence: 'High',
    description:
      'ERC-20 functions are declared without the return values the standard requires. A caller ' +
      'compiled with solc newer than 0.4.22 expects that value and reverts when it is missing, so ' +
      'the token cannot be integrated.',
    recommendation:
      'Declare each ERC-20 function with the exact return type and value the standard specifies.',
  },
  {
    check: 'erc721-interface',
    title: 'Incorrect erc721 interface',
    severity: 'Medium',
    confidence: 'High',
    description:
      'The same mismatch on the ERC-721 side: interface functions are declared with missing or ' +
      'wrong return values, which breaks callers compiled with solc newer than 0.4.22.',
    recommendation:
      'Give every ERC-721 function the return type and value defined by the standard.',
  },
  {
    check: 'incorrect-equality',
    title: 'Dangerous strict equalities',
    severity: 'Medium',
    confidence: 'High',
    description:
      'A strict equality is tested against a quantity an outsider can nudge, typically a balance. ' +
      'Sending a little extra ether makes an "exactly N" condition false forever, which can wedge ' +
      'the contract in a state it never leaves.',
    recommendation:
      'Test balances and other externally influenced figures with >= or <= rather than ==.',
  },
  {
    check: 'locked-ether',
    title: 'Contracts that lock Ether',
    severity: 'Medium',
    confidence: 'High',
    description:
      'The contract accepts ether through a payable function but offers no way to move it out ' +
      'again, so every wei it receives is stranded permanently.',
    recommendation:
      'Drop the payable attribute if the contract was never meant to hold funds; otherwise add a ' +
      'withdrawal function.',
  },
  {
    check: 'mapping-deletion',
    title: 'Deletion on mapping containing a structure',
    severity: 'Medium',
    confidence: 'High',
    description:
      'Deleting a struct leaves any mapping nested inside it untouched, so entries the code ' +
      'assumes were wiped survive and can later be read back as if still valid.',
    recommendation:
      'Mark the structure inactive with an explicit flag instead of deleting it, since delete ' +
      'cannot reach the nested mapping.',
  },
  {
    check: 'pyth-deprecated-functions',
    title: 'Pyth deprecated functions',
    severity: 'Medium',
    confidence: 'High',
    description:
      'The contract calls a Pyth oracle function the vendor has deprecated, such as getPrice, ' +
      'whose behaviour and support guarantees no longer match the current SDK.',
    recommendation:
      'Move to the current Pyth SDK entry points listed in the Pyth API reference.',
  },
  {
    check: 'pyth-unchecked-confidence',
    title: 'Pyth unchecked confidence level',
    severity: 'Medium',
    confidence: 'High',
    description:
      'A Pyth price is consumed without inspecting the confidence interval delivered alongside it, ' +
      'so a wide and effectively low-quality quote is treated as if it were precise.',
    recommendation:
      'Read the confidence value with the price and reject or widen tolerances when the interval ' +
      'is too large, following the Pyth best-practice guidance.',
  },
  {
    check: 'pyth-unchecked-publishtime',
    title: 'Pyth unchecked publishTime',
    severity: 'Medium',
    confidence: 'High',
    description:
      'A Pyth price is used without checking its publishTime, so a stale quote can be consumed as ' +
      'though it were current.',
    recommendation:
      'Compare publishTime against the current block time and refuse any price older than the ' +
      'staleness window the protocol tolerates.',
  },
  {
    check: 'shadowing-abstract',
    title: 'State variable shadowing from abstract contracts',
    severity: 'Medium',
    confidence: 'High',
    description:
      'A derived contract redeclares a state variable that an abstract base already defines, so ' +
      'two separate storage slots exist where the reader expects one and base logic keeps using ' +
      'the slot the derived code never writes.',
    recommendation:
      'Remove the redeclaration in the derived contract and use the inherited variable.',
  },
  {
    check: 'tautological-compare',
    title: 'Tautological compare',
    severity: 'Medium',
    confidence: 'High',
    description:
      'A variable is compared against itself, which makes the result a constant: always true for ' +
      '==, >= and <=, and always false for !=, < and >.',
    recommendation:
      'Delete the comparison, or compare against the value that was actually intended.',
  },
  {
    check: 'tautology',
    title: 'Tautology or contradiction',
    severity: 'Medium',
    confidence: 'High',
    description:
      'A condition can never change outcome because the operand type already decides it, such as ' +
      'testing an unsigned value with >= 0 or checking a uint8 against 512.',
    recommendation:
      'Fix the comparison — usually either the operand type or the bound is wrong.',
  },
  {
    check: 'write-after-write',
    title: 'Write after write',
    severity: 'Medium',
    confidence: 'High',
    description:
      'A variable is assigned and then assigned again with nothing reading it in between, so the ' +
      'first write is dead and the value the author expected to survive does not.',
    recommendation:
      'Remove the redundant assignment, or restore the read that was meant to sit between the two ' +
      'writes.',
  },
  {
    check: 'boolean-cst',
    title: 'Misuse of a Boolean constant',
    severity: 'Medium',
    confidence: 'Medium',
    description:
      'A boolean literal stands where a real condition belongs — if (false), or a term OR-ed with ' +
      'true — which normally marks debugging leftovers or logic that was never finished.',
    recommendation:
      'Work out what the condition was meant to test and rewrite it without the constant.',
  },
  {
    check: 'chronicle-unchecked-price',
    title: 'Chronicle unchecked price',
    severity: 'Medium',
    confidence: 'Medium',
    description:
      'A value read from a Chronicle oracle is used without validation, so a feed that has gone ' +
      'inactive or been deprecated is consumed as a live price.',
    recommendation:
      'Validate the value Chronicle returns before acting on it.',
  },
  {
    check: 'constant-function-asm',
    title: 'Constant functions using assembly code',
    severity: 'Medium',
    confidence: 'Medium',
    description:
      'A function marked constant, pure or view contains assembly, which the compiler cannot prove ' +
      'is read-only. From Solidity 0.5 such calls run under STATICCALL, so a mislabelled function ' +
      'that writes state reverts on every caller.',
    recommendation:
      'Re-check the mutability annotations on contracts built before Solidity 0.5.0 and correct ' +
      'any that no longer hold.',
  },
  {
    check: 'constant-function-state',
    title: 'Constant functions changing the state',
    severity: 'Medium',
    confidence: 'Medium',
    description:
      'A function annotated constant, pure or view demonstrably modifies state. Callers compiled ' +
      'with Solidity 0.5 and later issue a STATICCALL, so the call reverts instead of doing the ' +
      'work the annotation promised.',
    recommendation:
      'Align the annotation with what the function really does, and audit older contracts whose ' +
      'mutability was never enforced by the compiler.',
  },
  {
    check: 'divide-before-multiply',
    title: 'Divide before multiply',
    severity: 'Medium',
    confidence: 'Medium',
    description:
      'Integer division truncates in Solidity, so dividing before multiplying throws away ' +
      'precision that the later multiplication can never recover.',
    recommendation:
      'Reorder the arithmetic so multiplication happens before division.',
  },
  {
    check: 'gelato-unprotected-randomness',
    title: 'Gelato unprotected randomness',
    severity: 'Medium',
    confidence: 'Medium',
    description:
      'A call to the Gelato VRF helper _requestRandomness sits inside a function with no caller ' +
      'restriction, so anyone can trigger randomness requests at the expense of the contract.',
    recommendation:
      'Restrict randomness requests to authorized callers.',
  },
  {
    check: 'out-of-order-retryable',
    title: 'Out-of-order retryable transactions',
    severity: 'Medium',
    confidence: 'Medium',
    description:
      'Logic assumes that several retryable tickets created in one transaction will execute in ' +
      'order and all succeed. They can fail individually or land out of sequence, so a later step ' +
      'such as an unstake can run after an earlier claim was dropped.',
    recommendation:
      'Never rely on the ordering or the success of retryable tickets; make each ticket safe to ' +
      'execute on its own.',
  },
  {
    check: 'reentrancy-no-eth',
    title: 'Reentrancy vulnerabilities',
    severity: 'Medium',
    confidence: 'Medium',
    description:
      'State is written after an external call, so a reentrant call observes stale values. This ' +
      'variant covers the cases that move no ether — reentrancy involving ether is reported by ' +
      'reentrancy-eth instead.',
    recommendation:
      'Apply the checks-effects-interactions pattern so every state update completes before the ' +
      'external call, or guard the entry point with a reentrancy lock.',
  },
  {
    check: 'reused-constructor',
    title: 'Reused base constructors',
    severity: 'Medium',
    confidence: 'Medium',
    description:
      'The same base constructor receives arguments from two places in one inheritance hierarchy, ' +
      'either through a diamond where both parents construct the base or through a child that ' +
      'repeats arguments its parent already supplied.',
    recommendation:
      'Keep exactly one argument list per base constructor and delete the duplicate call.',
  },
  {
    check: 'tx-origin',
    title: 'Dangerous usage of tx.origin',
    severity: 'Medium',
    confidence: 'Medium',
    description:
      'Authorization is decided by comparing tx.origin, which stays the transaction signer through ' +
      'every nested call. Any contract a legitimate user is lured into calling can therefore relay ' +
      'the privileged call and pass the check.',
    recommendation:
      'Authorize on msg.sender, which names the immediate caller, and never use tx.origin as an ' +
      'access-control check.',
  },
  {
    check: 'unchecked-lowlevel',
    title: 'Unchecked low-level calls',
    severity: 'Medium',
    confidence: 'Medium',
    description:
      'The success flag returned by a low-level call is discarded, so a failed call is ' +
      'indistinguishable from a successful one and execution continues on the assumption it worked.',
    recommendation:
      'Inspect the returned success flag and revert or log on failure instead of ignoring it.',
  },
  {
    check: 'unchecked-send',
    title: 'Unchecked Send',
    severity: 'Medium',
    confidence: 'Medium',
    description:
      'send reports failure by returning false rather than reverting, and that result is thrown ' +
      'away, so the contract carries on as though the payment had gone through.',
    recommendation:
      'Test the boolean send returns and handle the failure branch explicitly.',
  },
  {
    check: 'uninitialized-local',
    title: 'Uninitialized local variables',
    severity: 'Medium',
    confidence: 'Medium',
    description:
      'A local variable is read before anything assigns it, so it still holds the zero value of ' +
      'its type — an address local used this way sends funds to address(0), where they are lost.',
    recommendation:
      'Assign every local before it is used, and write an intended zero explicitly so the ' +
      'intention is visible in the source.',
  },
  {
    check: 'unused-return',
    title: 'Unused return',
    severity: 'Medium',
    confidence: 'Medium',
    description:
      'The value returned by an external call is neither stored nor checked. When the callee is a ' +
      'non-mutating helper such as a SafeMath operation, dropping the result means the computation ' +
      'had no effect at all.',
    recommendation:
      'Store or act on every return value, and check the ones that report success or failure.',
  },
];

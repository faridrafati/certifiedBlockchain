/**
 * @file high.js
 * @description Slither detectors documented at severity High — all 29 of them.
 *
 * Source: crytic/slither "Detector Documentation" wiki
 *         https://github.com/crytic/slither/wiki/Detector-Documentation
 *         (parsed from https://raw.githubusercontent.com/wiki/crytic/slither/Detector-Documentation.md)
 *
 * The wiki lists 100 detectors; 29 carry `Severity: High` and none carry a
 * "Critical" severity, so this file is the complete High set. `check`,
 * `severity` and `confidence` are reproduced verbatim from the source because
 * they are identifiers a reader will type into the CLI or look up in the wiki.
 * `description` and `recommendation` are original summaries written for this
 * page, not copies of Slither's text — read the wiki for the normative wording.
 *
 * `title` is the wiki's own section heading with markdown backticks removed
 * (they are formatting, not part of the name) and the one stray trailing period
 * on "Incorrect shift in assembly" dropped, since these render as plain text.
 *
 * Six detectors share the title "Reentrancy vulnerabilities" across severities;
 * `check` is the only unique key here. Never key a list on `title`.
 *
 * Entries follow wiki document order.
 */

export const DETECTORS = [
  {
    check: 'abiencoderv2-array',
    title: 'Storage ABIEncoderV2 Array',
    severity: 'High',
    confidence: 'High',
    description:
      'Compilers from 0.4.7 through 0.5.9 carry a known defect that makes the ABI encoder emit ' +
      'wrong bytes for a storage array, so every call, hash or signature built from that array ' +
      'silently carries corrupted data.',
    recommendation: 'Build with solc 0.5.10 or later, where the encoder defect is fixed.',
  },
  {
    check: 'arbitrary-send-erc20',
    title: 'Arbitrary from in transferFrom',
    severity: 'High',
    confidence: 'High',
    description:
      'A transferFrom call takes its source address from somewhere other than msg.sender, which ' +
      'lets any caller spend the allowance of every account that has approved this contract.',
    recommendation:
      'Pass msg.sender as the source argument so a caller can only ever move their own tokens.',
  },
  {
    check: 'array-by-reference',
    title: 'Modifying storage array by value',
    severity: 'High',
    confidence: 'High',
    description:
      'An array argument that lands in memory is a copy, so a helper that appears to update a ' +
      'storage array writes into the copy and the state change is thrown away when it returns.',
    recommendation:
      'Spell out the data location on every reference-type parameter, and use storage wherever ' +
      'the callee is meant to write through to state.',
  },
  {
    check: 'encode-packed-collision',
    title: 'ABI encodePacked Collision',
    severity: 'High',
    confidence: 'High',
    description:
      'abi.encodePacked joins dynamic values without any length marker, so two different argument ' +
      'lists can flatten to the same bytes — and therefore the same hash used as an id or as a ' +
      'signed message.',
    recommendation:
      'Keep at most one dynamic-length argument in abi.encodePacked, or switch to abi.encode, ' +
      'which pads each argument and cannot collide.',
  },
  {
    check: 'incorrect-shift',
    title: 'Incorrect shift in assembly',
    severity: 'High',
    confidence: 'High',
    description:
      'The assembly shift opcodes take the number of bits first and the value second. Writing the ' +
      'operands the other way round shifts the wrong number and produces a quietly wrong result.',
    recommendation:
      'Swap the operands so the bit count comes first, as in shr(bits, value).',
  },
  {
    check: 'multiple-constructors',
    title: 'Multiple constructor schemes',
    severity: 'High',
    confidence: 'High',
    description:
      'A contract declares both a constructor keyword and a legacy function named after the ' +
      'contract, leaving two constructor candidates where only one of them actually runs at ' +
      'deployment.',
    recommendation:
      'Keep exactly one constructor and declare it with the constructor keyword rather than by ' +
      'contract name.',
  },
  {
    check: 'name-reused',
    title: 'Name reused',
    severity: 'High',
    confidence: 'High',
    description:
      'Two contracts in the same project share a name, so the build keeps artifacts for only one ' +
      'of them and the other is never compiled into the output that gets deployed or reviewed.',
    recommendation: 'Rename one of the contracts so every name in the project is unique.',
  },
  {
    check: 'protected-vars',
    title: 'Protected Variables',
    severity: 'High',
    confidence: 'High',
    description:
      'A state variable annotated as write-protected — via the custom security natspec tag naming ' +
      'a required modifier — is also assigned by a function that never applies that guard.',
    recommendation:
      'Apply the declared access control modifier to every function that writes the variable.',
  },
  {
    check: 'public-mappings-nested',
    title: 'Public mappings with nested variables',
    severity: 'High',
    confidence: 'High',
    description:
      'Before Solidity 0.5, the automatic getter generated for a public mapping whose value is a ' +
      'nested structure handed callers incorrect data.',
    recommendation:
      'Do not expose a mapping with nested value types as public — write an explicit getter, or ' +
      'move to a 0.5 or later compiler.',
  },
  {
    check: 'rtlo',
    title: 'Right-to-Left-Override character',
    severity: 'High',
    confidence: 'High',
    description:
      'The U+202E override character reverses how text is displayed, so source can read one way ' +
      'to a human reviewer while the compiler sees an entirely different order of tokens.',
    recommendation:
      'Reject U+202E, and bidirectional control characters generally, anywhere in contract source.',
  },
  {
    check: 'shadowing-state',
    title: 'State variable shadowing',
    severity: 'High',
    confidence: 'High',
    description:
      'A derived contract redeclares a state variable that a base contract already owns. The two ' +
      'sit in different slots, so base-contract logic keeps reading the copy the derived contract ' +
      'never writes — a classic way for an owner check to consult the wrong address.',
    recommendation:
      'Delete the duplicate declaration so one variable is shared across the whole inheritance chain.',
  },
  {
    check: 'suicidal',
    title: 'Suicidal',
    severity: 'High',
    confidence: 'High',
    description:
      'A path to selfdestruct is reachable without any caller restriction, so anyone at all can ' +
      'destroy the contract and push its balance to an address of their choosing.',
    recommendation:
      'Put access control on every function that can destroy the contract or move its funds.',
  },
  {
    check: 'uninitialized-state',
    title: 'Uninitialized state variables',
    severity: 'High',
    confidence: 'High',
    description:
      'A state variable is read but never assigned, so the contract runs against the default zero ' +
      'value — the zero address, an empty hash, a zero balance — instead of the intended one.',
    recommendation:
      'Assign every state variable before it is read, and write the zero value explicitly where ' +
      'zero is genuinely what you want.',
  },
  {
    check: 'uninitialized-storage',
    title: 'Uninitialized storage variables',
    severity: 'High',
    confidence: 'High',
    description:
      'A local storage pointer that is never aimed at anything defaults to the first storage slot, ' +
      'so writing through it overwrites whichever state variable happens to live there.',
    recommendation: 'Initialize every local storage pointer at the point of declaration.',
  },
  {
    check: 'unprotected-upgrade',
    title: 'Unprotected upgradeable contract',
    severity: 'High',
    confidence: 'High',
    description:
      'The logic contract behind a proxy can still be initialized directly, so an attacker takes ' +
      'ownership of the implementation and, if it can reach selfdestruct, deletes the code every ' +
      'proxy delegates into.',
    recommendation:
      'Give the implementation a constructor that disables its initializer, so only a proxy can ' +
      'ever run the setup path.',
  },
  {
    check: 'arbitrary-send-erc20-permit',
    title: 'Arbitrary from in transferFrom used with permit',
    severity: 'High',
    confidence: 'Medium',
    description:
      'The contract calls permit and then transferFrom with a caller-supplied source address. ' +
      'Against a token that has no permit but does have a fallback, the permit call succeeds ' +
      'silently and the transferFrom sweeps whatever anyone has already approved to the contract.',
    recommendation:
      'Confirm the specific token really implements permit before depending on it, and do not let ' +
      'the caller choose the source address.',
  },
  {
    check: 'arbitrary-send-eth',
    title: 'Functions that send Ether to arbitrary destinations',
    severity: 'High',
    confidence: 'Medium',
    description:
      'A function forwards ether to a destination the caller picks, with nothing restricting who ' +
      'may call it, so the contract balance can be routed to an attacker.',
    recommendation:
      'Restrict who may trigger an ether transfer and settle it against a recorded entitlement, so ' +
      'no caller can withdraw funds that are not theirs.',
  },
  {
    check: 'controlled-array-length',
    title: 'Array Length Assignment',
    severity: 'High',
    confidence: 'Medium',
    description:
      'A dynamic array length is assigned directly from a value the caller influences. Stretched ' +
      'to the full width of the storage space, the array becomes a window onto every slot in the ' +
      'contract, writable through an ordinary index.',
    recommendation:
      'Grow arrays by pushing elements instead of assigning the length, and where a direct ' +
      'assignment is unavoidable prove its value cannot be reached by user input.',
  },
  {
    check: 'controlled-delegatecall',
    title: 'Controlled Delegatecall',
    severity: 'High',
    confidence: 'Medium',
    description:
      'A delegatecall or callcode destination is chosen by the caller, which runs attacker-supplied ' +
      'code against the storage, balance and identity of this contract.',
    recommendation:
      'Avoid delegatecall where the design allows it, and otherwise pin the destination to a fixed, ' +
      'trusted address.',
  },
  {
    check: 'delegatecall-loop',
    title: 'Payable functions using delegatecall inside a loop',
    severity: 'High',
    confidence: 'Medium',
    description:
      'msg.value keeps its full amount on every iteration, so a payable function that delegatecalls ' +
      'a value-crediting function inside a loop credits the same ether once per pass.',
    recommendation:
      'Check that the delegatecalled function is neither payable nor reads msg.value, or lift the ' +
      'call out of the loop entirely.',
  },
  {
    check: 'incorrect-exp',
    title: 'Incorrect exponentiation',
    severity: 'High',
    confidence: 'Medium',
    description:
      'The caret is bitwise XOR in Solidity, not a power operator, so an expression written to ' +
      'raise a number to a power compiles cleanly and computes something else.',
    recommendation: 'Use the double-asterisk operator for exponentiation.',
  },
  {
    check: 'incorrect-return',
    title: 'Incorrect return in assembly',
    severity: 'High',
    confidence: 'Medium',
    description:
      'A return inside an assembly block is the EVM return opcode: it ends the whole external call ' +
      'and hands back raw memory, so the surrounding Solidity function never runs its remaining ' +
      'statements and the caller decodes bytes it did not expect.',
    recommendation:
      'Use the leave statement to exit the assembly function while letting the Solidity code around ' +
      'it continue.',
  },
  {
    check: 'msg-value-loop',
    title: 'msg.value inside a loop',
    severity: 'High',
    confidence: 'Medium',
    description:
      'msg.value is a single figure for the whole transaction, so reading it once per iteration ' +
      'hands out several times the ether that was actually paid in.',
    recommendation:
      'Pass the per-recipient amounts in as their own parameter and require the total to equal ' +
      'msg.value before any of it is credited.',
  },
  {
    check: 'reentrancy-balance',
    title: 'Reentrancy vulnerabilities',
    severity: 'High',
    confidence: 'Medium',
    description:
      'A balance is captured ahead of an external call, then compared again once it returns. A ' +
      'reentrant call ' +
      'made during the interaction can move that balance, so the later comparison judges the ' +
      'result against a stale number.',
    recommendation:
      'Move standard token amounts with transferFrom, or wrap the function in a reentrancy guard so ' +
      'the balance cannot shift underneath the check.',
  },
  {
    check: 'reentrancy-eth',
    title: 'Reentrancy vulnerabilities',
    severity: 'High',
    confidence: 'Medium',
    description:
      'State that governs an ether payout is written only after the payout happens, so the ' +
      'recipient can call straight back in and be paid again before the bookkeeping catches up. ' +
      'Reentrancy that moves no ether is reported separately as reentrancy-no-eth.',
    recommendation:
      'Follow checks-effects-interactions — validate, write state, then make the external call — ' +
      'and add a reentrancy guard where the ordering cannot be rearranged.',
  },
  {
    check: 'return-leave',
    title: 'Return instead of leave in assembly',
    severity: 'High',
    confidence: 'Medium',
    description:
      'A Yul function uses return where leave was meant, which halts the entire call instead of ' +
      'returning control to the code that invoked it.',
    recommendation: 'Use leave to return from a Yul function.',
  },
  {
    check: 'storage-array',
    title: 'Storage Signed Integer Array',
    severity: 'High',
    confidence: 'Medium',
    description:
      'Compilers from 0.4.7 through 0.5.9 carry a known defect that writes wrong values into ' +
      'storage arrays of signed integers.',
    recommendation: 'Build with solc 0.5.10 or later.',
  },
  {
    check: 'unchecked-transfer',
    title: 'Unchecked transfer',
    severity: 'High',
    confidence: 'Medium',
    description:
      'The boolean returned by an external transfer or transferFrom is discarded, so a token that ' +
      'signals failure by returning false rather than reverting leaves the contract crediting a ' +
      'movement that never happened.',
    recommendation:
      'Route token movements through SafeERC20, or check the returned boolean at every call site.',
  },
  {
    check: 'weak-prng',
    title: 'Weak PRNG',
    severity: 'High',
    confidence: 'Medium',
    description:
      'Randomness derived from block.timestamp, now or blockhash — typically through a modulo — ' +
      'produces a value that block producers can nudge and that anyone can read before deciding ' +
      'whether to act on it.',
    recommendation:
      'Never derive randomness from block data such as block.timestamp or blockhash.',
  },
];

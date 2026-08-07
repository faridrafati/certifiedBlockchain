/**
 * @file informational.js
 * @description Slither detectors of severity Informational (21) and
 *              Optimization (5) — 26 entries.
 *
 * Source: crytic/slither Detector Documentation
 *   https://github.com/crytic/slither/wiki/Detector-Documentation
 *   (parsed from https://raw.githubusercontent.com/wiki/crytic/slither/Detector-Documentation.md)
 *
 * `check`, `severity` and `confidence` are reproduced exactly as documented so
 * a reader can run `slither --detect <check>` and look the entry up upstream.
 * `title` matches the documentation heading. `description` and `recommendation`
 * are summarized in our own words, not copied from the upstream text.
 *
 * Informational and Optimization findings are style, clarity and gas notes:
 * they do not describe an exploitable flaw on their own, but they routinely
 * sit next to one, and reviewers are expected to clear them before shipping.
 */

export const DETECTORS = [
  /* ---------------------------------------------------------------- */
  /* Informational — 21                                               */

  {
    check: 'assembly',
    title: 'Assembly usage',
    severity: 'Informational',
    confidence: 'High',
    description:
      'Flags inline EVM assembly blocks. Assembly steps outside the checks the compiler ' +
      'normally applies — typing, bounds and (since 0.8.0) arithmetic overflow — so mistakes ' +
      'inside a block fail silently instead of reverting.',
    recommendation:
      'Prefer high-level Solidity. Where assembly is genuinely required, keep the block as ' +
      'small as possible and give it dedicated review and tests.',
  },
  {
    check: 'assert-state-change',
    title: 'Assert state change',
    severity: 'Informational',
    confidence: 'High',
    description:
      'Reports an assert() whose checked expression also mutates state, such as ' +
      'assert((counter += 1) > 10). assert is meant to test an invariant that already holds; ' +
      'folding the state change into the condition hides it from the reader and ties it to a ' +
      'statement that is expected to be side-effect free.',
    recommendation:
      'Move the state change out of the condition. Use require() for checks that involve state ' +
      'updates or caller input, and reserve assert() for invariants.',
  },
  {
    check: 'boolean-equal',
    title: 'Boolean equality',
    severity: 'Informational',
    confidence: 'High',
    description:
      'Detects comparisons against the boolean literals, such as if (flag == true). The ' +
      'comparison adds nothing and invites the classic typo of writing = where == was meant.',
    recommendation:
      'Test the boolean directly — if (flag) or if (!flag) — and drop the equality.',
  },
  {
    check: 'cyclomatic-complexity',
    title: 'Cyclomatic complexity',
    severity: 'Informational',
    confidence: 'High',
    description:
      'Reports functions whose cyclomatic complexity exceeds 11, meaning the function carries ' +
      'more independent branch paths than a reviewer can hold in mind or a test suite is likely ' +
      'to cover exhaustively.',
    recommendation:
      'Split the function into smaller subroutines so each one has a branch count that can be ' +
      'reasoned about and tested.',
  },
  {
    check: 'deprecated-standards',
    title: 'Deprecated standards',
    severity: 'Informational',
    confidence: 'High',
    description:
      'Detects deprecated Solidity constructs — block.blockhash(), msg.gas, throw, sha3(), ' +
      'callcode(), suicide(), and constant used as a function mutability specifier. They either ' +
      'already fail to compile on current versions or will stop working on a future one.',
    recommendation:
      'Replace each with its current form: blockhash(), gasleft(), revert(), keccak256(), ' +
      'delegatecall(), selfdestruct(), and view.',
  },
  {
    check: 'erc20-indexed',
    title: 'Unindexed ERC20 event parameters',
    severity: 'Informational',
    confidence: 'High',
    description:
      'Checks whether the ERC-20 Transfer and Approval events mark the parameters the standard ' +
      'requires as indexed. Unindexed parameters are not written into the block bloom filter, so ' +
      'wallets, explorers and indexers filtering logs by address will miss this token.',
    recommendation:
      'Add the indexed keyword to the event parameters the ERC-20 specification declares as ' +
      'indexed — the two address parameters of Transfer and Approval.',
  },
  {
    check: 'function-init-state',
    title: 'Function Initializing State',
    severity: 'Informational',
    confidence: 'High',
    description:
      'Flags a state variable initialized at its declaration by calling a function that is not ' +
      'pure or constant, or that reads another non-constant state variable. Declaration-position ' +
      'then decides the result: the call observes variables declared after it as still zero, so ' +
      'two variables initialized by the same call can end up with different values.',
    recommendation:
      'Do not initialize state variables from function calls or other mutable state at the ' +
      'declaration. If a value must be computed at deployment, set it in the constructor, which ' +
      'runs after every declaration-site initializer.',
  },
  {
    check: 'incorrect-using-for',
    title: 'Incorrect usage of using-for statement',
    severity: 'Informational',
    confidence: 'High',
    description:
      'Detects a using L for T statement where library L contains no function whose first ' +
      'parameter is of type T. The compiler accepts the statement, but it attaches nothing — the ' +
      'line reads as if members were added to the type when none were.',
    recommendation:
      'Verify that every using-for directive names a library with at least one function matching ' +
      'the bound type, and remove the directive if it attaches nothing.',
  },
  {
    check: 'low-level-calls',
    title: 'Low-level calls',
    severity: 'Informational',
    confidence: 'High',
    description:
      'Reports use of the low-level call family. These bypass the compiler-generated checks a ' +
      'typed interface call performs: they do not verify that code exists at the target address, ' +
      'and they report failure as a returned boolean rather than by reverting, so an ignored ' +
      'return value turns a failed call into a silent no-op.',
    recommendation:
      'Prefer typed interface calls. Where a low-level call is necessary, check the returned ' +
      'success flag and, when the target is meant to be a contract, check that its code size is ' +
      'non-zero.',
  },
  {
    check: 'missing-inheritance',
    title: 'Missing inheritance',
    severity: 'Informational',
    confidence: 'High',
    description:
      'Detects a contract that implements the complete function set of an interface or abstract ' +
      'contract in the codebase without declaring that it inherits from it. The compiler cannot ' +
      'then check the signatures against the interface, so a later edit to either side can drift ' +
      'apart unnoticed.',
    recommendation:
      'Declare the inheritance so the compiler enforces conformance to the interface.',
  },
  {
    check: 'naming-convention',
    title: 'Conformance to Solidity naming conventions',
    severity: 'Informational',
    confidence: 'High',
    description:
      'Reports identifiers that depart from the naming conventions in the Solidity style guide. ' +
      'The detector allows two exceptions: lowercase name, symbol and decimals constants (as ERC-20 ' +
      'requires), and a leading underscore on mixed-case private variables or unused arguments.',
    recommendation:
      'Rename identifiers to match the style guide, so a reader can infer scope and mutability ' +
      'from the name alone.',
  },
  {
    check: 'pragma',
    title: 'Different pragma directives are used',
    severity: 'Informational',
    confidence: 'High',
    description:
      'Detects source files in the same codebase declaring different Solidity versions. Each ' +
      'version carries its own set of fixed and open compiler bugs, so a mixed set widens the ' +
      'surface a reviewer has to account for.',
    recommendation:
      'Settle on a single Solidity version across every file in the project.',
  },
  {
    check: 'redundant-statements',
    title: 'Redundant Statements',
    severity: 'Informational',
    confidence: 'High',
    description:
      'Detects statements that name a type or an identifier without doing anything with it — a ' +
      'bare uint; or a bare function name on its own line. No code is generated for them, so they ' +
      'are either leftovers or the visible half of a line that was never finished.',
    recommendation:
      'Delete them, or complete the statement that was intended.',
  },
  {
    check: 'solc-version',
    title: 'Incorrect versions of Solidity',
    severity: 'Informational',
    confidence: 'High',
    description:
      'Reports the compiler versions a project allows. Old releases miss later security checks ' +
      'and bug fixes, and a broad or complex pragma range leaves the version that actually ' +
      'compiles the deployed bytecode undetermined.',
    recommendation:
      'Deploy with a recent Solidity release that has no known severe issues — the detector sets ' +
      'the floor at 0.8.0 — expressed as a simple pragma that admits only such versions. Test ' +
      'against the latest release as well.',
  },
  {
    check: 'unimplemented-functions',
    title: 'Unimplemented functions',
    severity: 'Informational',
    confidence: 'High',
    description:
      'Detects functions declared by a base interface or abstract contract that the most-derived ' +
      'contract never implements, leaving the contract unusable as a deployment target even ' +
      'though it looks complete from the inheritance list.',
    recommendation:
      'Implement every inherited declaration in any contract meant to be deployed and called ' +
      'directly, rather than only inherited from.',
  },
  {
    check: 'unindexed-event-address',
    title: 'Unindexed event address parameters',
    severity: 'Informational',
    confidence: 'High',
    description:
      'Detects events that take address parameters but declare no indexed parameter at all. ' +
      'Off-chain consumers can then only scan every log and decode it, instead of filtering by ' +
      'topic for the address they care about.',
    recommendation:
      'Mark the address parameters indexed so off-chain tooling can filter the logs efficiently.',
  },
  {
    check: 'unused-state',
    title: 'Unused state variable',
    severity: 'Informational',
    confidence: 'High',
    description:
      'Reports state variables that are declared but never read or written. Beyond the noise, an ' +
      'unused variable still occupies its storage slot, so removing it in a later upgrade shifts ' +
      'the layout of everything after it.',
    recommendation:
      'Remove state variables that are never used — and do so before deployment, not in an ' +
      'upgrade, so the storage layout is not disturbed.',
  },
  {
    check: 'costly-loop',
    title: 'Costly operations inside a loop',
    severity: 'Informational',
    confidence: 'Medium',
    description:
      'Detects expensive operations, in particular storage writes, performed on every iteration ' +
      'of a loop. Cost grows with the iteration count, and a loop whose length is user-influenced ' +
      'can be pushed past the gas limit.',
    recommendation:
      'Accumulate into a local variable inside the loop and write the result to storage once ' +
      'after it, so the loop pays memory costs rather than an SSTORE per iteration.',
  },
  {
    check: 'dead-code',
    title: 'Dead-code',
    severity: 'Informational',
    confidence: 'Medium',
    description:
      'Detects functions that are never called anywhere in the codebase. Unreachable code enlarges ' +
      'the surface a reviewer must read, and it is often the remains of a path that was meant to ' +
      'stay reachable.',
    recommendation:
      'Remove the unused functions, or restore the call site if the code was supposed to be ' +
      'reachable.',
  },
  {
    check: 'reentrancy-unlimited-gas',
    title: 'Reentrancy vulnerabilities',
    severity: 'Informational',
    confidence: 'Medium',
    description:
      'The reentrancy detector restricted to paths that go through transfer or send. The 2300 gas ' +
      'stipend those two forward makes exploitation impractical in practice, which is why this ' +
      'variant is only Informational — but the stipend is an accident of current opcode pricing, ' +
      'not a guarantee, and repricing has changed what fits inside it before.',
    recommendation:
      'Apply the checks-effects-interactions pattern — update state before the external call — or ' +
      'use a reentrancy guard, rather than relying on the gas stipend to hold.',
  },
  {
    check: 'too-many-digits',
    title: 'Too many digits',
    severity: 'Informational',
    confidence: 'Medium',
    description:
      'Detects numeric literals with long runs of digits. They cannot be checked by eye, and an ' +
      'order-of-magnitude slip does not look like one: 10000000000000000000 reads as 1 ether but ' +
      'is 10 ether.',
    recommendation:
      'Write the value with an ether or time unit suffix, or in scientific notation, so the ' +
      'magnitude is legible.',
  },

  /* ---------------------------------------------------------------- */
  /* Optimization — 5                                                 */

  {
    check: 'cache-array-length',
    title: 'Cache array length',
    severity: 'Optimization',
    confidence: 'High',
    description:
      'Detects a for loop whose condition reads the length member of a storage array that the ' +
      'loop body never modifies, so every iteration pays for a storage read of a value that ' +
      'cannot have changed.',
    recommendation:
      'Read the length once into a local variable before the loop and compare against that.',
  },
  {
    check: 'constable-states',
    title: 'State variables that could be declared constant',
    severity: 'Optimization',
    confidence: 'High',
    description:
      'Reports state variables that are never updated after deployment yet are not declared ' +
      'constant, so each read costs a storage load.',
    recommendation:
      'Declare any variable whose value is fixed at compile time as constant. It is then inlined ' +
      'into the bytecode and consumes no storage slot at all.',
  },
  {
    check: 'external-function',
    title: 'Public function that could be declared external',
    severity: 'Optimization',
    confidence: 'High',
    description:
      'Reports public functions that the contract never calls internally. A public function must ' +
      'be callable from inside, so its arguments are copied into memory on every call; an ' +
      'external one can read them straight from calldata.',
    recommendation:
      'Mark such functions external and move their unmodified reference-type parameters to ' +
      'calldata.',
  },
  {
    check: 'immutable-states',
    title: 'State variables that could be declared immutable',
    severity: 'Optimization',
    confidence: 'High',
    description:
      'Reports state variables that are never updated after deployment but are not declared ' +
      'immutable, so each read is a storage load rather than a bytecode constant.',
    recommendation:
      'Mark any variable that is assigned once at deployment and never again as immutable. Reads ' +
      'then come from the bytecode rather than from storage.',
  },
  {
    check: 'var-read-using-this',
    title: 'Public variable read in external context',
    severity: 'Optimization',
    confidence: 'High',
    description:
      'Detects a contract reading one of its own public state variables through this, for example ' +
      'this.myMap(x). That routes the read through the getter as an external STATICCALL to the ' +
      'contract itself instead of a direct storage load.',
    recommendation:
      'Read the state variable directly instead of calling the contract through this.',
  },
];

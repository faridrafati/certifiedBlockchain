/**
 * @file low.js
 * @description Slither detectors classified Low severity — 17 of the 100
 *              detectors documented by crytic/slither. Check ids, titles,
 *              severities and confidences are reproduced exactly because they
 *              are the CLI identifiers; the prose is summarized in our own
 *              words, not copied from the wiki.
 *
 * Source: https://github.com/crytic/slither/wiki/Detector-Documentation
 * Parsed from https://raw.githubusercontent.com/wiki/crytic/slither/Detector-Documentation.md
 * on 2026-08-07. Entries follow the order they appear in that document.
 *
 * Severity and confidence are Slither's own labels: severity is how bad a true
 * positive is, confidence is how sure the analysis is that the finding is real.
 */

export const DETECTORS = [
  {
    check: 'chainlink-feed-registry',
    title: 'Chainlink Feed Registry usage',
    severity: 'Low',
    confidence: 'High',
    description:
      'The contract reads prices through the Chainlink Feed Registry, a lookup layer Chainlink ' +
      'currently deploys only on Ethereum mainnet. On any other chain that address holds no code, ' +
      'so every registry lookup reverts and the pricing path is dead the moment it is deployed.',
    recommendation:
      'Keep Feed Registry usage on Ethereum mainnet. On every other chain, resolve and store the ' +
      'aggregator address for each pair directly instead of going through the registry.',
  },
  {
    check: 'incorrect-modifier',
    title: 'Incorrect modifier',
    severity: 'Low',
    confidence: 'High',
    description:
      'A modifier has at least one path that neither reaches the placeholder nor reverts. When ' +
      'execution takes that path the function body never runs, yet the call still succeeds and ' +
      'hands back the zero value of the declared return type, so the caller reads a silent default ' +
      'where it expected either a result or a failure.',
    recommendation:
      'Make every path through a modifier either execute the placeholder or revert, so a guard that ' +
      'does not pass produces a rejected call rather than a default return value.',
  },
  {
    check: 'optimism-deprecation',
    title: 'Optimism deprecated predeploy or function',
    severity: 'Low',
    confidence: 'High',
    description:
      'The code calls an Optimism predeploy, or a function on one, that has been deprecated — for ' +
      'example the scalar getter on the GasPriceOracle at ' +
      '0x420000000000000000000000000000000000000F. Deprecated entry points revert when invoked, so ' +
      'the surrounding logic fails on chain even though it compiles and deploys cleanly.',
    recommendation:
      'Replace deprecated Optimism predeploys and functions with their supported equivalents, and ' +
      'pin the check to the OP Stack release the contract is actually targeting.',
  },
  {
    check: 'shadowing-builtin',
    title: 'Built-in Symbol Shadowing',
    severity: 'Low',
    confidence: 'High',
    description:
      'A local variable, state variable, function, modifier or event reuses the name of a Solidity ' +
      'built-in symbol. Every later reference then resolves to the declaration instead of the ' +
      'built-in, so code that appears to read the block timestamp or to assert an invariant is ' +
      'quietly doing something else entirely.',
    recommendation:
      'Rename any declaration that collides with a built-in symbol, so the built-in stays reachable ' +
      'and a reader can trust that the familiar name means what it usually means.',
  },
  {
    check: 'shadowing-local',
    title: 'Local variable shadowing',
    severity: 'Low',
    confidence: 'High',
    description:
      'A local variable or function parameter reuses the name of a state variable or of another ' +
      'component in scope. A parameter named owner, for instance, turns require(owner == msg.sender) ' +
      'into a comparison between two values the caller supplied, so the guard passes for anyone ' +
      'while still reading like an ownership check.',
    recommendation:
      'Rename the local declaration so the outer component stays reachable, then re-read every guard ' +
      'that referenced the shadowed name to confirm it compares what it was meant to compare.',
  },
  {
    check: 'uninitialized-fptr-cst',
    title: 'Uninitialized function pointers in constructors',
    severity: 'Low',
    confidence: 'High',
    description:
      'Calling an uninitialized internal function pointer from a constructor hits a compiler bug ' +
      'present in solc 0.4.5 through 0.4.26 and 0.5.0 through 0.5.8. The call does not fail cleanly, ' +
      'so construction can complete having executed something nobody wrote.',
    recommendation:
      'Assign a function pointer before calling it, prefer a direct call where a pointer is not ' +
      'genuinely needed, and compile with a version outside the two affected ranges.',
  },
  {
    check: 'variable-scope',
    title: 'Pre-declaration usage of local variables',
    severity: 'Low',
    confidence: 'High',
    description:
      'A local variable is read on a path where its declaration has not been stepped over yet — it ' +
      'is declared further down the function, or inside a branch that may never execute. The read ' +
      'yields the zero value, so a loop bound or an arithmetic operand silently becomes 0 instead of ' +
      'the value the author intended.',
    recommendation:
      'Declare every local before its first use, and never let a declaration that unconditional code ' +
      'depends on sit inside a conditional scope.',
  },
  {
    check: 'void-cst',
    title: 'Void constructor',
    severity: 'Low',
    confidence: 'High',
    description:
      'A derived contract calls a base constructor that the base never implements. The call reads ' +
      'like initialization and compiles without complaint, but no code runs, so whatever setup a ' +
      'reviewer assumes it performs is simply absent from the deployed contract.',
    recommendation:
      'Remove the empty base constructor call, or implement the base constructor if the ' +
      'initialization the call implies is genuinely required.',
  },
  {
    check: 'calls-loop',
    title: 'Calls inside a loop',
    severity: 'Low',
    confidence: 'Medium',
    description:
      'An external call sits inside a loop, which lets one uncooperative recipient decide the fate of ' +
      'the whole batch. A single destination whose fallback reverts, or that consumes enough gas to ' +
      'exhaust the transaction, makes every iteration after it unreachable and the operation fails ' +
      'for everyone.',
    recommendation:
      'Prefer a pull pattern to a push pattern here: record what each account is owed and let ' +
      'recipients withdraw individually, so one failing address cannot block the rest.',
  },
  {
    check: 'events-access',
    title: 'Missing events access control',
    severity: 'Low',
    confidence: 'Medium',
    description:
      'A function that changes a critical access control parameter — the owner, an admin, a role ' +
      'holder — writes the new value without emitting an event. The handover leaves no trace in the ' +
      'logs, so monitoring, alerting and post-incident reconstruction have nothing to key on.',
    recommendation:
      'Emit an event carrying the previous and the new value on every privileged parameter change, ' +
      'and index the address fields so off-chain watchers can filter on them.',
  },
  {
    check: 'events-maths',
    title: 'Missing events arithmetic',
    severity: 'Low',
    confidence: 'Medium',
    description:
      'A setter for a critical numeric parameter — a price, a fee, a rate, a cap — updates state ' +
      'without emitting an event. Off-chain consumers cannot tell when the number moved or what it ' +
      'moved from, which matters precisely because downstream pricing and accounting depend on it.',
    recommendation:
      'Emit an event with the old and new value whenever a critical arithmetic parameter is updated.',
  },
  {
    check: 'incorrect-unary',
    title: 'Dangerous unary expressions',
    severity: 'Low',
    confidence: 'Medium',
    description:
      'An assignment written as x =+ 1 applies a unary plus to the operand instead of performing the ' +
      'compound increment x += 1 that was almost certainly intended. The variable is overwritten ' +
      'with the operand on every execution rather than accumulating, so a counter never rises above ' +
      'its first value.',
    recommendation:
      'Rewrite the statement as the compound assignment the surrounding logic expects, and treat any ' +
      'occurrence of =+ as a typo rather than as a deliberate unary expression.',
  },
  {
    check: 'missing-zero-check',
    title: 'Missing zero address validation',
    severity: 'Low',
    confidence: 'Medium',
    description:
      'An address argument is stored or forwarded without being compared against the zero address. A ' +
      'setter called with an omitted or miscomputed argument then installs address(0) as owner, ' +
      'treasury or recipient, which makes the role permanently unreachable and burns anything routed ' +
      'to it.',
    recommendation:
      'Require the address to be non-zero in every setter and constructor that accepts one, and use a ' +
      'two-step handover for ownership so that a wrong-but-nonzero address is still recoverable.',
  },
  {
    check: 'reentrancy-benign',
    title: 'Reentrancy vulnerabilities',
    severity: 'Low',
    confidence: 'Medium',
    description:
      'State is written after an external call, but re-entering produces only the effect of calling ' +
      'the function twice in a row — which is why Slither separates this case from the ether-moving ' +
      'reports of reentrancy-eth and reentrancy-no-eth. It is still a checks-effects-interactions ' +
      'violation, and it stops being benign as soon as the surrounding code grows a balance or an ' +
      'accounting invariant.',
    recommendation:
      'Apply the checks-effects-interactions pattern so every state update completes before the ' +
      'external call, or wrap the function in a reentrancy guard.',
  },
  {
    check: 'reentrancy-events',
    title: 'Reentrancy vulnerabilities',
    severity: 'Low',
    confidence: 'Medium',
    description:
      'An external call runs before the event is emitted, so a callee that re-enters can change the ' +
      'value the event finally reports or interleave the order of the logs. Contract state stays ' +
      'consistent, but indexers, bridges and accounting systems that trust the log stream see a ' +
      'sequence of values that never actually occurred.',
    recommendation:
      'Emit the event before making the external call, following checks-effects-interactions, so each ' +
      'log records the state transition the function itself performed.',
  },
  {
    check: 'return-bomb',
    title: 'Return Bomb',
    severity: 'Low',
    confidence: 'Medium',
    description:
      'A low-level call lets the callee decide how much returndata comes back, and Solidity copies ' +
      'all of it into memory before the caller can look at it. A hostile callee returns or reverts ' +
      'with an enormous buffer, the caller pays the memory expansion cost, and the caller runs out of ' +
      'gas before it can finish its own bookkeeping — even when the call itself was gas-capped.',
    recommendation:
      'Never let Solidity decode an unbounded amount of returndata for you: against an untrusted ' +
      'callee, make the call from assembly and copy back only a fixed number of bytes, or route it ' +
      'through an excessively-safe-call helper that does the same.',
  },
  {
    check: 'timestamp',
    title: 'Block timestamp',
    severity: 'Low',
    confidence: 'Medium',
    description:
      'Logic branches on block.timestamp, a value the block producer chooses within a tolerance ' +
      'rather than one read from a trustworthy clock. Comparisons that pick a winner, seed a random ' +
      'number or enforce a deadline measured in seconds can therefore be nudged by whoever builds the ' +
      'block.',
    recommendation:
      'Never use block.timestamp as a source of randomness, and do not build logic on intervals short ' +
      'enough that a few seconds of producer slack changes the outcome; keep deadlines wide enough ' +
      'that the drift is irrelevant.',
  },
];

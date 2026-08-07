/**
 * @file part2.js
 * @description Secureum "Security Pitfalls & Best Practices 101" — items 35-76.
 *              Covers logic and mutability smells, low-level call handling,
 *              shadowing, loops and denial of service, events, address and
 *              assertion hygiene, visibility and inheritance, then the
 *              assembly / uninitialized-state / unused-code run.
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
    id: 35,
    title: 'Test booleans directly',
    text:
      'A boolean can be used as a condition on its own; comparing it to true or false adds nothing ' +
      'and leaves room for a mistyped operator.',
    tags: ['logic', 'style'],
    severity: 'info',
  },
  {
    id: 36,
    title: 'Do not label state-changing code view or pure',
    text:
      'From solc 0.5.0 a function marked constant, view or pure is reached through STATICCALL, so any ' +
      'state write inside it — including one hidden in assembly — reverts at runtime rather than ' +
      'failing to compile. Earlier versions let it through.',
    tags: ['mutability', 'staticcall'],
    severity: 'medium',
  },
  {
    id: 37,
    title: 'Check what low-level calls return',
    text:
      'call, callcode, delegatecall and send report failure by returning false instead of reverting. ' +
      'Discarding that result lets a failed transfer look exactly like a successful one.',
    tags: ['low-level-calls', 'error-handling'],
    severity: 'high',
  },
  {
    id: 38,
    title: 'A call into an empty address still succeeds',
    text:
      'By EVM design, call, delegatecall and staticcall return true even when the target account does ' +
      'not exist. Where it matters, verify the account is really there before calling it.',
    tags: ['low-level-calls', 'address-validation'],
    severity: 'medium',
  },
  {
    id: 39,
    title: 'Do not shadow built-ins or outer declarations',
    text:
      'Naming a local, state variable, function, modifier or event after a Solidity built-in symbol, ' +
      'or after something already in scope, makes the code read as one thing while behaving as ' +
      'another.',
    tags: ['shadowing', 'naming'],
    severity: 'medium',
  },
  {
    id: 40,
    title: 'Never redeclare an inherited state variable',
    text:
      'A derived contract that redeclares a base variable such as the owner gets a second storage ' +
      'slot. The base modifier keeps reading its own copy while the derived code writes the other, ' +
      'which is how ownership checks end up guarding nothing.',
    tags: ['shadowing', 'inheritance', 'access-control'],
    severity: 'high',
  },
  {
    id: 41,
    title: 'Declare before use',
    text:
      'Under solc below 0.5.0 a variable could be referenced ahead of its declaration and would ' +
      'evaluate to a default value. 0.5.0 adopted C99-style scoping, so a variable is only usable ' +
      'after it is declared and only within its own or a nested scope.',
    tags: ['scoping', 'legacy-solidity'],
    severity: 'low',
  },
  {
    id: 42,
    title: 'Keep storage writes out of loops',
    text:
      'Updating a state variable on every iteration multiplies the most expensive operation in the ' +
      'EVM and can run the transaction out of gas. Accumulate into a local and write once at the end.',
    tags: ['gas', 'loops'],
    severity: 'medium',
  },
  {
    id: 43,
    title: 'Do not make external calls inside a loop',
    text:
      'One reverting callee, or one that consumes the remaining gas, halts the whole loop — a denial ' +
      'of service that is worse when the iteration count is caller-controlled. Bound the loop, or ' +
      'restructure so recipients pull rather than being pushed to.',
    tags: ['denial-of-service', 'loops', 'external-calls'],
    severity: 'high',
  },
  {
    id: 44,
    title: 'Bound anything you iterate over',
    text:
      'A loop across an array that can grow without limit eventually costs more gas than a block ' +
      'allows, at which point the function is permanently unusable by anyone.',
    tags: ['denial-of-service', 'gas-limit', 'loops'],
    severity: 'high',
  },
  {
    id: 45,
    title: 'Emit events on privileged state changes',
    text:
      'Ownership handovers and parameter updates have to be observable off-chain. Without an event, ' +
      'monitoring, indexing and incident response have nothing to watch.',
    tags: ['events', 'observability'],
    severity: 'medium',
  },
  {
    id: 46,
    title: 'Index the parameters tooling filters on',
    text:
      'Indexed arguments land in the block bloom filter, which is how clients and indexers locate ' +
      'them cheaply. Deviating from the indexing that standard events use, such as ERC-20 Transfer ' +
      'and Approval, breaks off-chain tooling that expects it.',
    tags: ['events', 'erc20', 'indexing'],
    severity: 'low',
  },
  {
    id: 47,
    title: 'Library events with contract-typed arguments hashed wrongly (v0.5.0 to v0.5.8)',
    text:
      'In that range the compiler hashed the contract name rather than the address type into an event ' +
      'signature declared in a library, so emitted logs carried the wrong topic. Fixed in v0.5.8.',
    tags: ['compiler-bug', 'events', 'libraries'],
    severity: 'low',
  },
  {
    id: 48,
    title: 'Watch for an assignment written as a unary plus',
    text:
      'Writing the plus before the equals sign produces an assignment of a unary-plus expression, not ' +
      'an increment, so the variable is overwritten instead of added to. Solidity 0.5.0 removed the ' +
      'unary plus operator for exactly this reason.',
    tags: ['logic', 'typo', 'legacy-solidity'],
    severity: 'medium',
  },
  {
    id: 49,
    title: 'Reject the zero address in setters',
    text:
      'Assigning address zero to a role or a destination can make functionality permanently ' +
      'unreachable, or send tokens somewhere nobody can retrieve them. Validate address parameters ' +
      'before storing them.',
    tags: ['address-validation', 'zero-address'],
    severity: 'medium',
  },
  {
    id: 50,
    title: 'Make critical address changes two-step',
    text:
      'Have the current holder nominate the new address in one transaction, then require the new ' +
      'address to claim the role in a second. A typo in the first step then stays recoverable instead ' +
      'of locking the contract out of its own controls.',
    tags: ['access-control', 'two-step', 'ownership'],
    severity: 'high',
  },
  {
    id: 51,
    title: 'Keep assertions free of side effects',
    text:
      'The expression inside require() or assert() should test an invariant, not change one. State ' +
      'mutations buried in a condition are easy to miss and behave differently on the failing path.',
    tags: ['assertions', 'side-effects'],
    severity: 'medium',
  },
  {
    id: 52,
    title: 'Use require for inputs, assert for invariants',
    text:
      'require() belongs on inputs and returned values; assert() states something that should never ' +
      'be false. Between solc 0.4.10 and 0.8.0 the two also differed in cost, since require compiled ' +
      'to REVERT and refunded the unused gas while assert compiled to INVALID and burned all of it.',
    tags: ['assertions', 'error-handling'],
    severity: 'low',
  },
  {
    id: 53,
    title: 'Drop deprecated keywords and aliases',
    text:
      'block.blockhash, msg.gas, throw, sha3, callcode, suicide, constant on functions and the var ' +
      'declaration all have modern replacements. Leaving the old spelling in place invites errors ' +
      'when the code meets a newer compiler.',
    tags: ['deprecated', 'compiler'],
    severity: 'low',
  },
  {
    id: 54,
    title: 'Always state function visibility explicitly',
    text:
      'Under solc below 0.5.0 an omitted visibility specifier meant public, which quietly turned ' +
      'internal helpers into open entry points capable of changing state. 0.5.0 made the specifier ' +
      'mandatory.',
    tags: ['visibility', 'access-control', 'legacy-solidity'],
    severity: 'high',
  },
  {
    id: 55,
    title: 'Order base contracts from general to specific',
    text:
      'When several bases define the same function, the declared inheritance order decides which ' +
      'implementation is linearized into place. Get the order wrong and the contract silently runs ' +
      'the wrong one.',
    tags: ['inheritance', 'linearization'],
    severity: 'medium',
  },
  {
    id: 56,
    title: 'Confirm the contract really inherits what it appears to',
    text:
      'A contract can implement every function of an interface by name and still never declare that ' +
      'it inherits from it, so the compiler never checks conformance and anything reasoning about the ' +
      'type is working from an assumption.',
    tags: ['inheritance', 'interfaces'],
    severity: 'low',
  },
  {
    id: 57,
    title: 'Do not let a relayer choose your gas',
    text:
      'A relayer submitting a transaction on a user behalf can supply just enough gas for the inner ' +
      'call to fail while the outer transaction still succeeds. That position has to be either ' +
      'trusted or constrained by the contract.',
    tags: ['griefing', 'gas', 'meta-transactions'],
    severity: 'medium',
  },
  {
    id: 58,
    title: 'State the data location explicitly',
    text:
      'Whether a struct, array or mapping parameter is a memory copy or a storage reference decides ' +
      'whether writes to it persist. The location was optional before solc 0.5.0; write it out ' +
      'everywhere and make sure it is the one you meant.',
    tags: ['data-location', 'storage', 'memory'],
    severity: 'medium',
  },
  {
    id: 59,
    title: 'Do not manipulate function pointers in assembly',
    text:
      'A function-type variable holds a jump destination. Writing to it from assembly can send ' +
      'execution to an arbitrary point in the code, so handle such variables carefully and keep them ' +
      'out of assembly entirely where possible.',
    tags: ['assembly', 'function-pointers'],
    severity: 'high',
  },
  {
    id: 60,
    title: 'Prefer abi.encode over abi.encodePacked for hashing',
    text:
      'Packing two or more variable-length arguments concatenates them with no delimiter, so ' +
      'different splits of the same bytes hash identically. Use abi.encode, use fixed-length types, ' +
      'or keep users away from the packed parameters.',
    tags: ['hashing', 'abi-encoding', 'collision'],
    severity: 'high',
  },
  {
    id: 61,
    title: 'Beware dirty high-order bits in msg.data',
    text:
      'Types narrower than 32 bytes can carry unused high-order bits. Operations on the type ignore ' +
      'them, but msg.data does not, so the same logical call has several byte representations and ' +
      'anything keyed on the raw calldata is malleable.',
    tags: ['msg-data', 'malleability'],
    severity: 'medium',
  },
  {
    id: 62,
    title: 'Assembly shift operands run the other way round',
    text:
      'In Solidity assembly the first argument to shl, shr and sar is the number of bits and the ' +
      'second is the value being shifted — the reverse of how the operators read. Getting it backwards ' +
      'produces silently wrong numbers rather than an error.',
    tags: ['assembly', 'shifts'],
    severity: 'high',
  },
  {
    id: 63,
    title: 'Justify every assembly block',
    text:
      'Inline assembly bypasses the checks the compiler would otherwise apply, so mistakes surface as ' +
      'corrupted memory instead of a compile error. Use it only where it is genuinely needed and ' +
      'review it line by line.',
    tags: ['assembly', 'review'],
    severity: 'medium',
  },
  {
    id: 64,
    title: 'Reject the right-to-left override character (U+202E)',
    text:
      'This control character flips the rendering direction of the text after it, so source can read ' +
      'one way to a human and mean another to the compiler. It has no legitimate use in contract ' +
      'source and its presence should be treated as deliberate deception.',
    tags: ['unicode', 'source-integrity', 'deception'],
    severity: 'high',
  },
  {
    id: 65,
    title: 'Mark unchanging state as constant',
    text:
      'A value that never changes should be declared constant, which removes a storage read from ' +
      'every access and makes the intent explicit.',
    tags: ['gas', 'constants'],
    severity: 'info',
  },
  {
    id: 66,
    title: 'Keep variable names distinguishable',
    text:
      'Two variables whose names differ by a character or two invite a mix-up that no compiler will ' +
      'ever catch. Rename until they cannot be confused.',
    tags: ['naming', 'readability'],
    severity: 'low',
  },
  {
    id: 67,
    title: 'Initialize state and locals explicitly',
    text:
      'An uninitialized variable reads as zero, and zero is rarely a neutral value: a zero address ' +
      'burns a transfer, a zero amount turns an operation into a no-op. Assign every variable on ' +
      'purpose.',
    tags: ['initialization', 'zero-value'],
    severity: 'high',
  },
  {
    id: 68,
    title: 'Never leave a local storage pointer unset',
    text:
      'An unassigned local of storage type pointed at the first storage slot in older compilers, so ' +
      'writing through it clobbered whatever state lived there. solc 0.5.0 and later disallow the ' +
      'pattern outright.',
    tags: ['storage', 'initialization', 'legacy-solidity'],
    severity: 'high',
  },
  {
    id: 69,
    title: 'Uninitialized function pointers in constructors (0.4.5-0.4.25, 0.5.0-0.5.7)',
    text:
      'A compiler bug in those two version ranges made calls through an uninitialized function ' +
      'pointer inside a constructor behave unpredictably.',
    tags: ['compiler-bug', 'constructor', 'function-pointers'],
    severity: 'medium',
  },
  {
    id: 70,
    title: 'Double-check long numeric literals',
    text:
      'A literal with many digits is easy to write with one digit too few or one too many, and the ' +
      'error is invisible on review. Prefer scientific notation or ether and time unit suffixes.',
    tags: ['literals', 'arithmetic'],
    severity: 'medium',
  },
  {
    id: 71,
    title: 'Validate enum conversions',
    text:
      'solc below 0.4.5 accepted conversions producing an enum value outside the declared range, ' +
      'leaving the variable in a state no branch handles. Newer compilers reject it, so check the ' +
      'conversion or move up a version.',
    tags: ['enums', 'legacy-solidity'],
    severity: 'low',
  },
  {
    id: 72,
    title: 'Declare externally-only functions external',
    text:
      'A public function that nothing inside the contract calls can be external instead, which avoids ' +
      'copying its arguments into memory on every call.',
    tags: ['gas', 'visibility'],
    severity: 'info',
  },
  {
    id: 73,
    title: 'Remove unreachable code',
    text:
      'Code that can never execute usually marks a missing branch, an abandoned requirement, or an ' +
      'optimization waiting to happen. Delete it, or restore the path that was supposed to reach it.',
    tags: ['dead-code', 'maintenance'],
    severity: 'low',
  },
  {
    id: 74,
    title: 'Do not discard return values',
    text:
      'Ignoring what a call returns hides both outright failures and results the caller was meant to ' +
      'act on, which is why it so often signals a genuine bug rather than a stylistic choice.',
    tags: ['return-values', 'error-handling'],
    severity: 'medium',
  },
  {
    id: 75,
    title: 'Delete unused variables',
    text:
      'A state or local variable nothing reads is either a leftover or evidence that intended logic ' +
      'was never written. Investigate before removing it.',
    tags: ['unused-code', 'maintenance'],
    severity: 'low',
  },
  {
    id: 76,
    title: 'Remove statements with no effect',
    text:
      'An expression statement that produces no code is a symptom of something half-written, not a ' +
      'harmless artifact. Treat it as a question to answer rather than noise to ignore.',
    tags: ['redundant-code', 'maintenance'],
    severity: 'low',
  },
];

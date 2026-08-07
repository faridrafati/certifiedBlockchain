/**
 * @file part3.js
 * @description Secureum "Security Pitfalls & Best Practices 101" — items 77-101.
 *              Two blocks: the run of known Solidity compiler bugs (77-94), then
 *              proxy-based upgradeability (95-101).
 *
 * Source: Rajeev | Secureum, "101 Security Pitfalls & Best Practices"
 *         https://secureum.substack.com/p/security-pitfalls-and-best-practices-101
 *         (fetched 2026-08-07 directly from substack; no mirror required).
 *
 * The source numbers its items 1-101 in a single flat list; `id` preserves that
 * numbering across part1/part2/part3 so a reader can look up the original entry.
 * Every `text` is an original paraphrase — no source sentence is reproduced.
 * `title`, `tags` and `severity` are authored judgements: the source assigns no
 * severity and no tags to any item. Compiler-bug items keep the affected version
 * window the source states, because that is the fact a reader checks their own
 * pragma against.
 */

export const PITFALLS = [
  {
    id: 77,
    title: 'Signed-integer storage arrays corrupt under ABIEncoderV2 (v0.4.7 to v0.5.10)',
    text:
      'Writing a signed-integer array into a storage array of another element type corrupted the ' +
      'destination array. The bug was present from v0.4.7 until the fix landed in v0.5.10.',
    tags: ['compiler-bug', 'abiencoderv2', 'storage'],
    severity: 'medium',
  },
  {
    id: 78,
    title: 'Dynamic constructor arguments clipped under ABIEncoderV2 (v0.4.16 to v0.5.9)',
    text:
      'A constructor taking a struct or array that itself contains a dynamically sized array either ' +
      'reverted or decoded to invalid data. Present from v0.4.16 until the fix in v0.5.9.',
    tags: ['compiler-bug', 'abiencoderv2', 'constructor'],
    severity: 'medium',
  },
  {
    id: 79,
    title: 'Multi-slot storage array elements misread under ABIEncoderV2 (v0.4.16 to v0.5.10)',
    text:
      'Storage arrays whose elements are structs or statically sized arrays were read incorrectly when ' +
      'encoded straight out of storage into an external call or abi.encode(). Present from v0.4.16 ' +
      'until the fix in v0.5.10.',
    tags: ['compiler-bug', 'abiencoderv2', 'storage'],
    severity: 'medium',
  },
  {
    id: 80,
    title: 'Calldata structs with dynamically encoded members read wrong (v0.5.6 to v0.5.11)',
    text:
      'Reading from a calldata struct containing members that are statically sized but dynamically ' +
      'encoded produced incorrect values. Present from v0.5.6 until the fix in v0.5.11.',
    tags: ['compiler-bug', 'abiencoderv2', 'calldata'],
    severity: 'medium',
  },
  {
    id: 81,
    title: 'Packed storage encoded from storage corrupts data (v0.5.0 to v0.5.7)',
    text:
      'Structs and arrays whose members are shorter than 32 bytes could be corrupted when encoded ' +
      'directly out of storage with ABIEncoderV2. Present from v0.5.0 until the fix in v0.5.7.',
    tags: ['compiler-bug', 'abiencoderv2', 'packing'],
    severity: 'medium',
  },
  {
    id: 82,
    title: 'Yul optimizer dropped MLOAD and SLOAD (v0.5.14 to v0.5.15)',
    text:
      'The Yul optimizer replaced a load with a value written earlier to that location, but only when ' +
      'ABIEncoderV2 was active and the experimental Yul optimizer had been switched on by hand ' +
      'alongside the regular one. A one-release window: v0.5.14, repaired in v0.5.15.',
    tags: ['compiler-bug', 'yul-optimizer', 'abiencoderv2'],
    severity: 'medium',
  },
  {
    id: 83,
    title: 'Array slices of dynamically encoded base types read invalid data (v0.6.0 to v0.6.8)',
    text:
      'Taking a slice of an array whose element type is dynamically encoded, a multi-dimensional array ' +
      'for instance, returned invalid data. Present from v0.6.0 until the fix in v0.6.8.',
    tags: ['compiler-bug', 'abiencoderv2', 'array-slice'],
    severity: 'medium',
  },
  {
    id: 84,
    title: 'Doubled backslashes in string literals re-encoded (v0.5.14 to v0.6.8)',
    text:
      'With ABIEncoderV2 enabled, a string literal carrying a doubled backslash escape and passed ' +
      'straight into an external or encoding call could travel as a different string than the one ' +
      'written. Present from v0.5.14 until the fix in v0.6.8.',
    tags: ['compiler-bug', 'abiencoderv2', 'string-literals'],
    severity: 'low',
  },
  {
    id: 85,
    title: 'Constant double shifts past 256 bits optimized wrongly (v0.5.5 to v0.5.6)',
    text:
      'Nested logical shifts by compile-time constants whose combined width reaches 2**256 or more ' +
      'were optimized to unexpected values, which required the optimizer to be on and evmVersion to ' +
      'be Constantinople or later. A one-release window: v0.5.5, repaired in v0.5.6.',
    tags: ['compiler-bug', 'optimizer', 'shifts'],
    severity: 'medium',
  },
  {
    id: 86,
    title: 'byte opcode with a second argument of 31 optimized wrongly (v0.5.5 to v0.5.7)',
    text:
      'The optimizer mishandled the byte opcode when its second argument was 31, or a constant ' +
      'expression evaluating to 31 — reachable through constant index access on a fixed-size bytes ' +
      'type or through inline assembly. Present from v0.5.5 until the fix in v0.5.7.',
    tags: ['compiler-bug', 'optimizer', 'assembly'],
    severity: 'medium',
  },
  {
    id: 87,
    title: 'Yul optimizer deleted essential loop assignments (v0.5.8 / v0.6.0 to v0.5.16 / v0.6.1)',
    text:
      'Assignments to variables declared inside a Yul for loop could be dropped when continue or break ' +
      'was used, which showed up mostly in inline assembly loops. It spans two release lines: present ' +
      'from v0.5.8 and v0.6.0, repaired in v0.5.16 and v0.6.1.',
    tags: ['compiler-bug', 'yul-optimizer', 'loops'],
    severity: 'medium',
  },
  {
    id: 88,
    title: 'A derived contract could change a base private method (v0.3.0 to v0.5.17)',
    text:
      'Private methods of a base contract are not callable from a derived one, yet declaring a ' +
      'function there with the same name and type changed how the base behaved. Present from v0.3.0 ' +
      'until the fix in v0.5.17, one of the longest-lived bugs on the list.',
    tags: ['compiler-bug', 'inheritance', 'visibility'],
    severity: 'high',
  },
  {
    id: 89,
    title: 'Multi-slot tuple components assigned invalid values (v0.1.6 to v0.6.6)',
    text:
      'Tuple assignments whose components occupy several stack slots — nested tuples, external ' +
      'function pointers, or references to calldata arrays of dynamic size — could produce invalid ' +
      'values. Present from v0.1.6 until the fix in v0.6.6.',
    tags: ['compiler-bug', 'tuples'],
    severity: 'medium',
  },
  {
    id: 90,
    title: 'Shrinking a dynamic storage array left stale bytes (repaired in v0.7.3)',
    text:
      'Overwriting a storage array of elements at most 16 bytes wide so that it ended up shorter did ' +
      'not fully zero the slots being released. Repaired in v0.7.3; the source gives no version where ' +
      'it was introduced.',
    tags: ['compiler-bug', 'storage', 'arrays'],
    severity: 'medium',
  },
  {
    id: 91,
    title: 'Storing a zero-length bytes value could corrupt it (repaired in v0.7.4)',
    text:
      'Move a zero-length bytes or string value into storage, then lengthen that array later without ' +
      'writing anything into the new space, and the array read back corrupted. Repaired in v0.7.4; ' +
      'the source gives no version where it was introduced.',
    tags: ['compiler-bug', 'storage', 'bytes'],
    severity: 'medium',
  },
  {
    id: 92,
    title: 'Very large memory arrays overlapped in memory (v0.2.0 to v0.6.5)',
    text:
      'Creating an extremely large memory array could produce overlapping memory regions and so ' +
      'corrupt memory. Present from v0.2.0 until the fix in v0.6.5.',
    tags: ['compiler-bug', 'memory', 'overflow'],
    severity: 'high',
  },
  {
    id: 93,
    title: 'Calldata arguments through using-for read invalid data (v0.6.9 to v0.6.10)',
    text:
      'Calling an internal library function that takes calldata parameters through a using-for binding ' +
      'read invalid data. A one-release window: v0.6.9, repaired in v0.6.10.',
    tags: ['compiler-bug', 'libraries', 'calldata'],
    severity: 'medium',
  },
  {
    id: 94,
    title: 'Duplicate free functions went unflagged (v0.7.1 to v0.7.2)',
    text:
      'The compiler raised no error when one source unit defined two or more free functions sharing a ' +
      'name and parameter types, nor when an imported alias shadowed another free function with ' +
      'identical parameters. A one-release window: v0.7.1, repaired in v0.7.2.',
    tags: ['compiler-bug', 'free-functions', 'shadowing'],
    severity: 'medium',
  },
  {
    id: 95,
    title: 'Guard the initializer of an upgradeable contract',
    text:
      'Behind a proxy the constructor is useless, so setup moves into a public initializer that anyone ' +
      'can call. Restricting it to a single invocation, as the OpenZeppelin Initializable modifier ' +
      'does, is not optional.',
    tags: ['proxy', 'initializer', 'access-control'],
    severity: 'high',
  },
  {
    id: 96,
    title: 'Initialize state inside the initializer, not at declaration',
    text:
      'A value assigned in a state variable declaration is written into the storage of the ' +
      'implementation contract, never the proxy storage the system actually reads, so the proxy sees ' +
      'zero. Move every such assignment into the initializer.',
    tags: ['proxy', 'initializer', 'storage'],
    severity: 'high',
  },
  {
    id: 97,
    title: 'Import the upgradeable variants of dependencies',
    text:
      'Contracts pulled into an upgradeable system must themselves be the upgradeable editions, the ' +
      'ones rewritten to initialize rather than construct. Mixing in a constructor-based dependency ' +
      'leaves part of the state unset behind the proxy.',
    tags: ['proxy', 'dependencies', 'initializer'],
    severity: 'medium',
  },
  {
    id: 98,
    title: 'Keep selfdestruct and delegatecall out of implementation contracts',
    text:
      'Either one can be used to destroy the logic contract, at which point every proxy in the system ' +
      'is delegating to an address with no code and the whole deployment is bricked.',
    tags: ['proxy', 'selfdestruct', 'delegatecall'],
    severity: 'high',
  },
  {
    id: 99,
    title: 'Preserve the storage layout across upgrades',
    text:
      'Declaration order, types and mutability of state variables have to survive an upgrade exactly ' +
      'as they were. Reorder or retype anything and the new implementation reads slots the proxy ' +
      'already holds as something else entirely.',
    tags: ['proxy', 'storage-layout', 'upgrade'],
    severity: 'high',
  },
  {
    id: 100,
    title: 'Check for selector collisions between proxy and implementation',
    text:
      'When a four-byte function selector on the proxy matches one on the implementation, the proxy ' +
      'answers the call itself instead of delegating. A malicious proxy can arrange that deliberately, ' +
      'so verify no selector collides.',
    tags: ['proxy', 'selector-collision'],
    severity: 'high',
  },
  {
    id: 101,
    title: 'Do not shadow implementation functions on the proxy',
    text:
      'A function defined on the proxy takes precedence over the implementation function of the same ' +
      'name, which then becomes unreachable for as long as the shadow exists.',
    tags: ['proxy', 'shadowing'],
    severity: 'medium',
  },
];

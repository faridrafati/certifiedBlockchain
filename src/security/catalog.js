/**
 * @file catalog.js
 * @description Vulnerability reference for the Security page, indexed by the
 *              levels of OpenZeppelin's Ethernaut wargame.
 *
 * Content lives in ./levels/<category>.js, one module per vulnerability class,
 * so each file stays small enough to edit and review on its own. This file
 * declares the classes and concatenates them.
 *
 * Level ids, names, and difficulty values mirror Ethernaut's own game data
 * (OpenZeppelin/ethernaut -> client/src/gamedata/gamedata.json) so this list
 * stays aligned with the live site. Ids are zero-based like the level URLs;
 * the UI displays id + 1 to match the site's visible numbering.
 */

// Explicit .js extensions: Vite resolves them, and they let the catalog be
// imported by a plain `node` script for the integrity check.
import { LEVELS as accessControl } from './levels/accessControl.js';
import { LEVELS as reentrancy } from './levels/reentrancy.js';
import { LEVELS as storageLayout } from './levels/storageLayout.js';
import { LEVELS as randomness } from './levels/randomness.js';
import { LEVELS as arithmetic } from './levels/arithmetic.js';
import { LEVELS as lowLevel } from './levels/lowLevel.js';
import { LEVELS as dos } from './levels/dos.js';
import { LEVELS as proxy } from './levels/proxy.js';
import { LEVELS as economic } from './levels/economic.js';
import { LEVELS as crypto } from './levels/crypto.js';

export const CATEGORIES = [
  {
    id: 'access-control',
    name: 'Access Control & Authorization',
    icon: 'fa-lock',
    blurb: 'Who is allowed to call what — and every way that check gets sidestepped.',
  },
  {
    id: 'reentrancy',
    name: 'Reentrancy',
    icon: 'fa-refresh',
    blurb: 'External calls that re-enter the contract before its own state has settled.',
  },
  {
    id: 'storage-layout',
    name: 'Storage Layout & Delegatecall',
    icon: 'fa-database',
    blurb:
      'Slot collisions, borrowed delegatecall context, and data that private visibility never actually hides.',
  },
  {
    id: 'randomness',
    name: 'Randomness & Predictability',
    icon: 'fa-random',
    blurb: 'On-chain entropy the caller can compute first, then only play when it already wins.',
  },
  {
    id: 'arithmetic',
    name: 'Arithmetic & Type Safety',
    icon: 'fa-calculator',
    blurb: 'Overflow, underflow, and truncating casts that quietly rewrite a balance.',
  },
  {
    id: 'low-level',
    name: 'Contract Interaction & Low-Level Calls',
    icon: 'fa-code',
    blurb: 'Raw calls, fallbacks, gas accounting, calldata, and hand-written bytecode.',
  },
  {
    id: 'dos',
    name: 'Denial of Service',
    icon: 'fa-ban',
    blurb: 'Making a contract permanently unusable instead of stealing from it.',
  },
  {
    id: 'proxy',
    name: 'Proxy & Upgradeability',
    icon: 'fa-clone',
    blurb: 'Unguarded initializers, hijacked implementations, and wallets that delegate too much.',
  },
  {
    id: 'economic',
    name: 'DEX & Economic Logic',
    icon: 'fa-line-chart',
    blurb: 'Pricing, accounting, and incentive flaws that drain value while every call succeeds.',
  },
  {
    id: 'crypto',
    name: 'Cryptography & Signatures',
    icon: 'fa-key',
    blurb: 'ECDSA malleability, replayed signatures, and approvals forged from a public key.',
  },
];

export const LEVELS = [
  ...accessControl, ...reentrancy, ...storageLayout, ...randomness, ...arithmetic,
  ...lowLevel, ...dos, ...proxy, ...economic, ...crypto,
].sort((a, b) => a.id - b.id);

/**
 * @file index.js
 * @description Single entry point for the five reference datasets behind the
 *              Security page's non-Ethernaut tabs. Renderers import from here
 *              and never reach into the per-source modules, so a file split
 *              (splitting pitfalls into a fourth part, adding a detector
 *              severity) stays invisible to the UI.
 *
 * Sources, one per dataset:
 * - HACKS       solidity-by-example.org/hacks
 * - DETECTORS   crytic/slither detector documentation
 * - PITFALLS    Secureum "Security Pitfalls & Best Practices 101"
 * - REQUIREMENTS / LEVELS_INFO   EEA EthTrust Security Levels, Version 3
 * - PRACTICES / AUDIT_SOURCE     Polymarket contract-security registry
 *
 * Every module carries its own attribution header with the snapshot date; all
 * prose here and below is paraphrased, with source identifiers (detector check
 * ids, EthTrust requirement ids, Secureum item numbers) preserved verbatim so
 * a reader can look up the normative text.
 *
 * Explicit .js extensions match catalog.js: Vite resolves them, and they let
 * these modules be imported by a plain `node` script for the integrity check.
 */

import { DETECTORS as high } from './detectors/high.js';
import { DETECTORS as medium } from './detectors/medium.js';
import { DETECTORS as low } from './detectors/low.js';
import { DETECTORS as informational } from './detectors/informational.js';
import { PITFALLS as part1 } from './pitfalls/part1.js';
import { PITFALLS as part2 } from './pitfalls/part2.js';
import { PITFALLS as part3 } from './pitfalls/part3.js';

export { HACKS } from './hacks.js';
export { LEVELS_INFO, REQUIREMENTS } from './standards.js';
export { PRACTICES, SOURCE as AUDIT_SOURCE } from './auditPractice.js';

// Severity order, not wiki order: the table defaults to worst-first, and the
// renderer should not have to know how the source files were split.
export const DETECTORS = [...high, ...medium, ...low, ...informational];

// The Secureum items are numbered 1..N in the source; the three part files
// split them by theme, so sort restores the canonical numbering.
export const PITFALLS = [...part1, ...part2, ...part3].sort((a, b) => a.id - b.id);

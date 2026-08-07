/**
 * @file auditPractice.js
 * @description Transferable audit-disclosure practices, read off Polymarket's
 *              public `contract-security` registry
 *              (https://github.com/Polymarket/contract-security).
 *
 *              Every entry below is an independent summary written for this
 *              page. Nothing is reproduced from the source repository, and
 *              Polymarket neither reviewed nor endorsed this material — the
 *              registry is simply a public artefact that happens to
 *              demonstrate the practices well.
 *
 *              Registry snapshot: branch `main`, fetched 2026-08-07. At that
 *              point the README carried 23 contract rows across four tables
 *              (V1 Contracts 12, Polymarket V2 8, Deposit Wallet 2, Perps 1),
 *              named 7 distinct audit firms, and shipped 24 files in
 *              `audit-reports/`. Counts are a snapshot, not a guarantee.
 *
 *              Deliberately omitted: one README link resolves to a file that
 *              is not in the repository, two committed reports are unlinked,
 *              and one row's firm label disagrees with its target filename.
 *              None of those are attributed to a firm here.
 */

export const PRACTICES = [
  {
    title: 'Publish one registry that covers every deployed contract',
    detail:
      'Keep a single public index of what you deployed and what has been reviewed, rather ' +
      'than scattering audit news across blog posts and release threads. Held in version ' +
      'control it diffs and greps, so a reader can see exactly what changed and when — and ' +
      'a contract missing from the list becomes conspicuous instead of invisible.',
    evidence:
      'The whole repository is one README holding four tables — V1 Contracts, Polymarket V2, ' +
      'Deposit Wallet and Perps — with 23 contract rows in total. Each row gives three things: ' +
      'the source repository, the audit reports, and the deployment.',
  },
  {
    title: 'Anchor every entry to the address it was deployed at',
    detail:
      'An audit report only means something if you can tell which bytecode it covers. ' +
      'Printing the deployment address beside the report lets a reader pull the on-chain code ' +
      'themselves and check that the reviewed contract is the one actually running, instead of ' +
      'taking the mapping on trust.',
    evidence:
      'All 23 rows carry a Polygon mainnet address linked through to its Polygonscan page, ' +
      'under a header line stating that every deployment is on Polygon mainnet.',
  },
  {
    title: 'Commit the reports next to the claim',
    detail:
      'Findings that sit behind a contact form or a conference slide cannot be checked by the ' +
      'people carrying the risk. Storing the reports in the same repository as the index makes ' +
      'the evidence part of the record: it is versioned, it cannot quietly change, and every ' +
      'link resolves without asking anyone for access.',
    evidence:
      'Every audit link in the README is a relative path into the repository’s own ' +
      'audit-reports directory, which holds 24 committed files — 23 PDFs and one Markdown ' +
      'report.',
  },
  {
    title: 'Put the same code in front of several independent firms',
    detail:
      'Review teams differ in speciality, tooling and blind spots, so a second and third pass ' +
      'over identical code reliably surfaces what the first missed. Independence is what does ' +
      'the work here — more reviewers from one firm share one set of habits.',
    evidence:
      '17 of the 23 rows name two or more firms and 11 name three or more. Each of the eight ' +
      'Polymarket V2 contracts lists four — Cantina, Certora, Quantstamp and Pashov — and ' +
      'seven firms appear across the registry overall, adding ChainSecurity, OpenZeppelin ' +
      'and Zellic.',
  },
  {
    title: 'Book a fresh review for every change set, including upgrades',
    detail:
      'An audit describes one commit. Anything merged afterwards — a fix, a new module, a new ' +
      'implementation behind a proxy — runs unreviewed under the reputation of the original ' +
      'report, and upgradeable deployments make that worse because the behaviour changes while ' +
      'the address does not. Scope a review to the delta and the gap stays small and legible.',
    evidence:
      'A June 2026 Cantina diff review is linked from all eight Polymarket V2 rows, sitting on ' +
      'top of baseline audits dated April 2026 (Cantina, Certora) and May 2026 (Quantstamp, ' +
      'Pashov); seven of those rows add a further May 2026 Certora report covering a later set ' +
      'of additional changes. Both Deposit Wallet rows do the same for an upgrade: a March 2026 ' +
      'baseline from Certora and Zellic, then two May 2026 reports — one Cantina, one Certora ' +
      '— scoped to the beacon upgrade alone.',
  },
  {
    title: 'Keep one firm constant across the codebase and rotate others through it',
    detail:
      'A reviewer who has seen every contract carries context between engagements and can spot ' +
      'interactions that a first-time reader has no way to notice. Rotating other firms around ' +
      'that fixed point buys fresh eyes at the same time, so continuity and independence stop ' +
      'competing with each other.',
    evidence:
      'Certora is named on all 11 rows outside the V1 tables — the eight Polymarket V2 ' +
      'contracts, both Deposit Wallet entries and Perps — while the firms beside it change: ' +
      'Cantina, Quantstamp and Pashov on V2, Zellic on Deposit Wallet, Quantstamp and Cantina ' +
      'on Perps.',
  },
  {
    title: 'Cover the periphery, not just the flagship contract',
    detail:
      'Factories, adapters, routers and pluggable modules move or hold the same value as the ' +
      'core contract, yet they read as plumbing and routinely carry the weaker access control. ' +
      'List and review them as first-class contracts in their own right.',
    evidence:
      'Separate rows exist for the Proxy Factory and Safe Factory, the Deposit Wallet Factory, ' +
      'the NegRisk adapter, operator, fee module and wrapped collateral, and the V2 Router, ' +
      'Binary Module, NegRisk Module, Combinatorial Module and Auto Redeemer. The Combinatorial ' +
      'Module carries three May 2026 reports of its own — Cantina, Certora and Quantstamp — ' +
      'rather than being folded into the V2 baseline.',
  },
  {
    title: 'Put inherited third-party code in scope',
    detail:
      'Code you did not write but did deploy is still yours operationally, and "it is a ' +
      'well-known library" is not a review. Give external dependencies you deploy their own ' +
      'entry, pointed at the upstream repository, with whatever review actually covers them.',
    evidence:
      'The Gnosis Conditional Tokens contracts appear as a Polymarket deployment in their own ' +
      'right, linked to the upstream gnosis repository and carrying a ChainSecurity report.',
  },
  {
    title: 'Leave the gaps visible',
    detail:
      'A registry that lists only the reviewed contracts quietly implies everything is ' +
      'reviewed. Keeping an unaudited deployment in the table with an empty audit cell is far ' +
      'more useful than dropping the row: readers can price the gap instead of assuming it away.',
    evidence:
      'The V1 FeeModule row lists its source repository and its Polygon address with the Audit ' +
      'column left empty — the one row of 23 with no report attached.',
  },
];

export const SOURCE = {
  label: 'Polymarket contract-security registry',
  url: 'https://github.com/Polymarket/contract-security',
};

# Smart Contract Security Tab — Design

**Date:** 2026-08-07
**Status:** Approved
**Scope:** Add a public `/security` page to the CertifiedBlockchain DApp documenting smart contract vulnerabilities, organized around the 41 levels of the Ethernaut wargame (https://ethernaut.openzeppelin.com/).

## Purpose

The app is a portfolio of working DApps. It demonstrates what can be built on-chain but says nothing about how on-chain code fails. This page adds that dimension: a reference of the vulnerability classes every Solidity developer must recognize, each grounded in a concrete Ethernaut level with a vulnerable/fixed code pair.

Success criteria:

1. A visitor without MetaMask can read the entire page.
2. All 41 Ethernaut levels are covered, each with an attack explanation, a prevention takeaway, and a vulnerable/fixed Solidity pair.
3. Levels are findable by vulnerability class and by text search.
4. `npm run build` passes and the page conforms to the design token system in `src/components/css/index.css`.

## Architecture

Data-driven catalog plus thin presentational components — the pattern already used by `src/tokenforge/catalog.js`. Content lives in a data module; components never embed prose or code snippets.

```
src/security/
  catalog.js       data: CATEGORIES (10), LEVELS (41)
  Security.jsx     page shell: hero, stats, search + filters, category sections
  LevelCard.jsx    one level: collapsed summary -> expanded detail
  SolidityCode.jsx regex Solidity tokenizer + copy button
  security.css     page layout only
```

Rationale: content edits never touch component logic, the catalog is greppable and independently verifiable, and each component stays small enough to reason about in one pass.

### Route and navigation

- `App.jsx`: `const Security = lazy(() => import('./security/Security'))`, route `/security` inside the existing container route group, matching how every other page is registered.
- `navBar.jsx`: a top-level `NavLink` to `/security` labelled "Security" with a `fa-shield` icon. Not a dropdown — it is a single destination, and the nav already carries six dropdowns.

### Wallet gating

Every route currently sits behind the connect modal: `App.jsx` renders `<ModalForm>` when `modalNeed` is true and applies `blurred-content` to the page. The Security page has no contract calls and must be readable without a wallet.

Change: `App.jsx` declares `const PUBLIC_ROUTES = ['/security']` and derives `isPublicRoute` from `useLocation()` (`App` already renders inside `HashRouter`). Both the modal render condition and the `blurred-content` class become `modalNeed && !isPublicRoute`.

Wallet detection, account handling, chain handling, and every listener stay untouched — only the two render conditions change. All other routes keep their current gating behavior.

### Data model

`catalog.js` exports:

```js
export const CATEGORIES = [
  { id: 'access-control', name: 'Access Control', icon: 'fa-lock', blurb: '…' },
  // …10 total
];

export const LEVELS = [
  {
    id: 11,                       // Ethernaut level number
    slug: 're-entrancy',
    name: 'Re-entrancy',
    difficulty: 6,                // 0-8, from Ethernaut gamedata
    category: 'reentrancy',       // CATEGORIES[].id
    summary: 'One line: what the level teaches.',
    attack: 'How the exploit works, 2-4 sentences.',
    prevention: 'The defensive pattern, 1-3 sentences.',
    vulnerable: '…solidity…',     // short illustrative snippet
    fixed: '…solidity…',          // same logic, defended
    refs: [{ label: 'Play level 11', url: 'https://ethernaut.openzeppelin.com/level/11' }],
  },
  // …41 total
];
```

The ten categories: Access Control, Reentrancy, Delegatecall & Storage Collision, Randomness & Predictability, Arithmetic & Type Safety, Low-Level Calls & Fallbacks, Denial of Service, Proxy & Upgradeability, DEX & Economic Logic, Cryptography & Signatures.

Level names, numbers, and difficulty values come from the Ethernaut game data
(`OpenZeppelin/ethernaut` → `client/src/gamedata/gamedata.json`), so the page's
level list and ordering match the live site.

Every level in `LEVELS` must carry a `category` that exists in `CATEGORIES`, and every category must contain at least one level.

### Components

**`Security.jsx`** — renders its own page header, a stats strip (41 levels, 10 vulnerability classes), a search input, a row of category filter chips, then one section per category containing its `LevelCard`s. Holds all page state.

The shared `HeroSection` component is deliberately **not** used here: it requires a `contractName`, renders a "Contract not configured" warning badge whenever `contractAddress` is absent, and appends Sepolia faucet guidance — all three are wrong for a page with no contract. The Security header instead reuses the global `.hero-section` / `.hero-content` / `.hero-title-row` classes from `index.css` directly, so the visual treatment still matches every other page while the content stays appropriate (title, description, and an Ethernaut/OpenZeppelin credit line with an outbound link).

**`LevelCard.jsx`** — collapsed by default: level number, name, difficulty indicator, one-line summary. Expanded: attack, prevention, the vulnerable/fixed code pair, and the Ethernaut link. The toggle is a real `<button>` carrying `aria-expanded` and `aria-controls`; the panel has a matching `id`.

**`SolidityCode.jsx`** — takes `code` and a `variant` of `'vulnerable' | 'fixed'`, tokenizes with a single ordered regex pass (comments, strings, keywords, types, numbers, function names, everything else) and emits `<span>`s colored from design tokens. A copy-to-clipboard button sits in the header. The tokenizer escapes nothing by hand — it builds React elements, never `dangerouslySetInnerHTML`.

Variant only changes the frame (a danger-tinted vs. success-tinted border and label), never the token colors.

### State and data flow

Local `useState` in `Security.jsx` only:

- `query` — search string, matched case-insensitively against level name, summary, and category name.
- `activeCategory` — a category id or `'all'` (default).

Derived with `useMemo`: the filtered level list, then grouped by category for rendering. No Redux, no URL state, no persistence — the page has no cross-session state worth keeping.

### Error handling

No async work and no contract calls, so the failure surface is small:

- **Clipboard denied or unavailable** — `navigator.clipboard.writeText` is wrapped in try/catch; on failure the button label shows "Copy failed" for two seconds instead of "Copied". Never throws into render.
- **Empty filter result** — an explicit empty state ("No levels match …") with a button that clears both the search and the category filter.
- **Catalog integrity** — a level referencing an unknown category would silently vanish from the grouped render. Prevented by the verification step below rather than runtime code.

### Design system compliance

Consumes only tokens from `src/components/css/index.css`:

- Dark surfaces (`--color-bg-elevated`, `--color-surface`), violet primary for active filters and expanded cards, `--font-mono` for all code.
- Difficulty shown as both a numeric label and a colored meter — never color alone (WCAG 1.4.1).
- Category and status colors use the `-text` variants for text on dark backgrounds.
- 44px minimum touch targets on the toggle, filter chips, and copy button; visible focus rings inherited from the global `:focus-visible` rule.
- Expand/collapse transition 200-250ms, disabled under `prefers-reduced-motion` via the existing global block.
- Font Awesome icons only, no emoji as icons.
- Responsive at 375px, 768px, 1024px, 1440px; code blocks scroll inside their own `overflow-x: auto` container so the page body never scrolls horizontally.

`security.css` carries page layout only. Cards, buttons, and form controls inherit the global Bootstrap bridge; the file must not redefine `.hero-section`, `.hero-content`, or `.hero-title-row`.

### Content sourcing

Explanations and code snippets are written from the publicly known characteristics of each vulnerability class, as short illustrative examples — not copies of Ethernaut's level contracts. Each card links to the corresponding level on ethernaut.openzeppelin.com so readers can play the original. The page credits Ethernaut and OpenZeppelin in the hero.

Snippets are illustrative, not deployable: each is a minimal contract or function fragment that isolates the flaw, typically under 25 lines.

## Verification

The repo has no test framework, so verification is explicit and manual:

1. `npm run build` passes.
2. `catalog.js` contains exactly 41 levels with unique `id` and `slug`; every `category` matches a `CATEGORIES` entry; every category has at least one level. Checked with a throwaway node script, not shipped code.
3. The page renders all 41 levels; each expands to show attack, prevention, and both code blocks.
4. Search and category filters narrow correctly and the empty state appears when nothing matches.
5. `/security` renders fully with MetaMask disabled or absent; no connect modal, no blur.
6. Every other route still shows the connect modal when no wallet is connected — the gating change must not leak.
7. Keyboard: tab to a card toggle, activate with Enter/Space, focus ring visible, `aria-expanded` flips.
8. Layout holds at 375px with no horizontal page scroll.

## Out of scope

- Progress tracking or "mark as read" state.
- Any on-chain interaction, wallet reads, or live contract analysis.
- Solutions or exploit code for the levels — the page teaches the vulnerability and its fix, and defers the challenge itself to Ethernaut.
- Changes to any existing page's styling or logic beyond the two `App.jsx` render conditions and the one `navBar.jsx` link.

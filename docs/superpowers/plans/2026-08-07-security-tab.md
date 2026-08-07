# Smart Contract Security Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `/security` page documenting smart contract vulnerabilities through the 41 Ethernaut levels, each with an attack explanation, a prevention takeaway, and a vulnerable/fixed Solidity pair.

**Architecture:** A data module (`src/security/catalog.js`) holds all content; three thin components render it (`Security.jsx` page shell, `LevelCard.jsx` per level, `SolidityCode.jsx` code block). Syntax highlighting comes from a pure, dependency-free tokenizer in its own module so it can be unit-tested without React. The route is registered lazily in `App.jsx` and exempted from the wallet-connect gate.

**Tech Stack:** React 18, Vite 6, React Router 6 (HashRouter), Bootstrap 5.3 (dark mode), Font Awesome 4.7, plain CSS with the design tokens from `src/components/css/index.css`. No new npm dependencies.

**Spec:** `docs/superpowers/specs/2026-08-07-security-tab-design.md`

## Global Constraints

- **No new npm dependencies.** The bundle is already flagged >500KB.
- **Design tokens only.** Every color, font, radius, shadow, and transition comes from a CSS variable defined in `src/components/css/index.css`. No raw hex values except inside the tokenizer's own token-color mapping, which must reference variables too.
- **Do not redefine** `.hero-section`, `.hero-content`, or `.hero-title-row` in `security.css` — they are global in `index.css` and page CSS loads later, so a redefinition would override every page.
- **No emoji as icons.** Font Awesome 4.7 (`fa fa-*`) only.
- **Accessibility:** 44×44px minimum touch targets; never remove focus outlines; difficulty conveyed by number *and* color, never color alone; transitions 150–300ms; `prefers-reduced-motion` handled by the existing global block in `index.css` (do not override it).
- **Responsive:** must hold at 375px, 768px, 1024px, 1440px with no horizontal scroll on `<body>`; code blocks scroll inside their own `overflow-x: auto` container.
- **ESM:** `package.json` sets `"type": "module"`; all new files use `import`/`export`.
- **No test framework exists in this repo.** Do not add one. Pure-function tests run as throwaway `node` scripts written to the scratchpad, never committed. Component and page verification is `npm run build` plus the explicit manual checks in each task.
- **Content rule:** snippets are short original illustrations of the flaw (under ~25 lines), not copies of Ethernaut's level contracts. Every level links to its page on ethernaut.openzeppelin.com.
- **Commit after every task**, using the `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` trailer.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/security/tokenizeSolidity.js` | Create. Pure function: Solidity source → array of `{type, value}` tokens. No React. |
| `src/security/SolidityCode.jsx` | Create. Renders tokens as colored spans; copy-to-clipboard button; vulnerable/fixed frame. |
| `src/security/catalog.js` | Create. Declares `CATEGORIES` (10), imports the ten level modules, concatenates them into `LEVELS` sorted by id. Small aggregator, no content. |
| `src/security/levels/<category>.js` | Create ×10. One module per vulnerability class, each exporting a `LEVELS` array for its own levels. Keeps every content file focused and independently editable. |
| `src/security/LevelCard.jsx` | Create. One level: collapsed summary → expanded attack/prevention/code pair. |
| `src/security/Security.jsx` | Create. Page shell: header, stats, search, category filters, grouped sections. |
| `src/security/security.css` | Create. Page layout only; components inherit the global bridge. |
| `src/App.jsx` | Modify. Lazy-import `Security`, add `/security` route, exempt it from the wallet gate. |
| `src/navBar.jsx` | Modify. Add a top-level `Security` nav link with `fa-shield`. |

---

### Task 1: Solidity tokenizer (pure function)

**Files:**
- Create: `src/security/tokenizeSolidity.js`
- Test: throwaway script at `/tmp/claude-1000/-home-farid-certifiedBlockchain/0f14b5d7-ecaa-4681-8998-df9b2386543b/scratchpad/test-tokenizer.mjs` (never committed)

**Interfaces:**
- Consumes: nothing.
- Produces: `tokenizeSolidity(code: string) => Array<{type: string, value: string}>` where `type` is one of `comment`, `string`, `keyword`, `type`, `number`, `function`, `plain`. Concatenating every `value` in order reconstructs the input exactly. Task 2 consumes this.

- [ ] **Step 1: Write the failing test**

Write to the scratchpad path above:

```js
import { tokenizeSolidity } from '/home/farid/certifiedBlockchain/src/security/tokenizeSolidity.js';

let failures = 0;
const check = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) { failures++; console.log(`FAIL ${name}\n  actual:   ${JSON.stringify(actual)}\n  expected: ${JSON.stringify(expected)}`); }
  else console.log(`pass ${name}`);
};

// 1. Lossless round-trip is the core invariant.
const samples = [
  'function foo() public {}',
  '// a comment\nuint256 x = 1;',
  'string memory s = "hi // not a comment";',
  '/* block\n comment */ address owner;',
  'require(msg.sender == owner, "not owner");',
  '',
];
for (const src of samples) {
  check(`round-trip ${JSON.stringify(src.slice(0, 20))}`,
    tokenizeSolidity(src).map(t => t.value).join(''), src);
}

// 2. Classification.
const typeOf = (src, needle) =>
  (tokenizeSolidity(src).find(t => t.value === needle) || {}).type;

check('keyword function', typeOf('function foo() public {}', 'function'), 'keyword');
check('keyword public', typeOf('function foo() public {}', 'public'), 'keyword');
check('type uint256', typeOf('uint256 x = 1;', 'uint256'), 'type');
check('type address', typeOf('address owner;', 'address'), 'type');
check('number literal', typeOf('uint256 x = 42;', '42'), 'number');
check('line comment', typeOf('// hi\n', '// hi'), 'comment');
check('block comment', typeOf('/* hi */', '/* hi */'), 'comment');
check('string literal', typeOf('"not owner"', '"not owner"'), 'string');
check('function name', typeOf('function transfer() {}', 'transfer'), 'function');

// 3. Comments and strings must swallow their contents.
check('url inside comment stays one token',
  tokenizeSolidity('// see https://x.com/a').filter(t => t.type === 'comment').length, 1);
check('keyword inside string is not a keyword',
  typeOf('"function"', '"function"'), 'string');

// 4. Must not hang or throw on unterminated constructs.
for (const src of ['"unterminated', '/* unterminated', "'unterminated"]) {
  const out = tokenizeSolidity(src);
  check(`unterminated round-trip ${JSON.stringify(src)}`, out.map(t => t.value).join(''), src);
}

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
node "/tmp/claude-1000/-home-farid-certifiedBlockchain/0f14b5d7-ecaa-4681-8998-df9b2386543b/scratchpad/test-tokenizer.mjs"
```

Expected: FAIL — `ERR_MODULE_NOT_FOUND` for `tokenizeSolidity.js`.

- [ ] **Step 3: Write the implementation**

Create `src/security/tokenizeSolidity.js`:

```js
/**
 * @file tokenizeSolidity.js
 * @description Minimal Solidity tokenizer for read-only syntax highlighting.
 *
 * Deliberately not a parser: it classifies enough for short teaching snippets
 * (comments, strings, keywords, value types, numbers, call sites) and leaves
 * everything else as plain text. Concatenating the token values always
 * reproduces the input exactly, so nothing can be silently dropped.
 */

const KEYWORDS = new Set([
  'contract', 'interface', 'library', 'function', 'modifier', 'constructor',
  'event', 'emit', 'struct', 'enum', 'mapping', 'returns', 'return',
  'public', 'private', 'internal', 'external', 'pure', 'view', 'payable',
  'memory', 'storage', 'calldata', 'immutable', 'constant', 'override',
  'virtual', 'if', 'else', 'for', 'while', 'do', 'break', 'continue',
  'require', 'revert', 'assert', 'new', 'delete', 'using', 'is', 'try',
  'catch', 'import', 'pragma', 'solidity', 'assembly', 'unchecked',
  'indexed', 'anonymous', 'receive', 'fallback', 'abstract', 'type',
]);

const TYPES = new Set([
  'address', 'bool', 'string', 'bytes', 'byte', 'uint', 'int', 'fixed', 'ufixed',
  // sized variants are matched by the regex below, these cover the bare forms
]);

const SIZED_TYPE = /^(u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?|bytes([1-9]|[12][0-9]|3[0-2])?)$/;

/**
 * Ordered alternation. Order matters: comments and strings come first so their
 * contents can never be re-classified, and identifiers come before punctuation.
 */
const PATTERN = new RegExp(
  [
    '\\/\\*[\\s\\S]*?(?:\\*\\/|$)', // block comment (unterminated runs to EOF)
    '\\/\\/[^\\n]*', // line comment
    '"(?:\\\\.|[^"\\\\\\n])*(?:"|$)', // double-quoted string
    "'(?:\\\\.|[^'\\\\\\n])*(?:'|$)", // single-quoted string
    '\\b\\d[\\d_]*(?:\\.\\d+)?(?:e[+-]?\\d+)?\\b', // number
    '\\b0x[0-9a-fA-F]+\\b', // hex literal
    '[A-Za-z_$][A-Za-z0-9_$]*', // identifier
  ].join('|'),
  'g'
);

export function tokenizeSolidity(code) {
  const source = typeof code === 'string' ? code : '';
  const tokens = [];
  let lastIndex = 0;

  const pushPlain = (value) => {
    if (!value) return;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.type === 'plain') prev.value += value;
    else tokens.push({ type: 'plain', value });
  };

  PATTERN.lastIndex = 0;
  let match;
  while ((match = PATTERN.exec(source)) !== null) {
    // Zero-length matches would loop forever; the patterns above can't produce
    // one, but guard anyway since a future edit might.
    if (match[0] === '') { PATTERN.lastIndex += 1; continue; }

    pushPlain(source.slice(lastIndex, match.index));
    const value = match[0];
    const first = value[0];

    let type;
    if (value.startsWith('//') || value.startsWith('/*')) type = 'comment';
    else if (first === '"' || first === "'") type = 'string';
    else if (first >= '0' && first <= '9') type = 'number';
    else if (KEYWORDS.has(value)) type = 'keyword';
    else if (TYPES.has(value) || SIZED_TYPE.test(value)) type = 'type';
    else if (source[match.index + value.length] === '(') type = 'function';
    else type = 'plain';

    if (type === 'plain') pushPlain(value);
    else tokens.push({ type, value });

    lastIndex = match.index + value.length;
  }

  pushPlain(source.slice(lastIndex));
  return tokens;
}

export default tokenizeSolidity;
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
node "/tmp/claude-1000/-home-farid-certifiedBlockchain/0f14b5d7-ecaa-4681-8998-df9b2386543b/scratchpad/test-tokenizer.mjs"
```

Expected: every line `pass …`, final line `ALL PASS`, exit 0. If `require`/`revert` classify as `function` instead of `keyword`, the keyword check must run before the followed-by-paren check — verify the order in Step 3 is preserved.

- [ ] **Step 5: Commit**

```bash
git add src/security/tokenizeSolidity.js
git commit -m "feat(security): add dependency-free Solidity tokenizer

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: SolidityCode component

**Files:**
- Create: `src/security/SolidityCode.jsx`
- Modify: none

**Interfaces:**
- Consumes: `tokenizeSolidity(code)` from Task 1.
- Produces: default export `<SolidityCode code={string} variant={'vulnerable'|'fixed'} label={string} />`. Tasks 4 and 5 render it. CSS class names it depends on (`.sol-code`, `.sol-code-header`, `.sol-code-label`, `.sol-copy-btn`, `.sol-pre`, `.tok-comment`, `.tok-string`, `.tok-keyword`, `.tok-type`, `.tok-number`, `.tok-function`) are styled in Task 6.

- [ ] **Step 1: Write the component**

Create `src/security/SolidityCode.jsx`:

```jsx
/**
 * @file SolidityCode.jsx
 * @description Read-only Solidity code block with token highlighting and a
 *              copy button. Highlighting is structural only — the `variant`
 *              changes the frame (vulnerable vs. fixed), never token colors,
 *              so the same code reads identically in both frames.
 */

import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { tokenizeSolidity } from './tokenizeSolidity';

const COPY_RESET_MS = 2000;

const SolidityCode = ({ code, variant = 'vulnerable', label }) => {
  const [copyState, setCopyState] = useState('idle'); // idle | copied | failed
  const tokens = useMemo(() => tokenizeSolidity(code), [code]);

  const handleCopy = useCallback(async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(code);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    setTimeout(() => setCopyState('idle'), COPY_RESET_MS);
  }, [code]);

  const defaultLabel = variant === 'fixed' ? 'Secure pattern' : 'Vulnerable pattern';
  const copyLabel =
    copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy';

  return (
    <div className={`sol-code sol-code--${variant}`}>
      <div className="sol-code-header">
        <span className="sol-code-label">
          <i
            className={`fa ${variant === 'fixed' ? 'fa-shield' : 'fa-exclamation-triangle'}`}
            aria-hidden="true"
          />
          {label || defaultLabel}
        </span>
        <button
          type="button"
          className="sol-copy-btn"
          onClick={handleCopy}
          aria-label={`Copy ${(label || defaultLabel).toLowerCase()} code to clipboard`}
        >
          <i className="fa fa-clipboard" aria-hidden="true" />
          {copyLabel}
        </button>
      </div>
      <pre className="sol-pre">
        <code>
          {tokens.map((token, i) =>
            token.type === 'plain' ? (
              <React.Fragment key={i}>{token.value}</React.Fragment>
            ) : (
              <span key={i} className={`tok-${token.type}`}>
                {token.value}
              </span>
            )
          )}
        </code>
      </pre>
    </div>
  );
};

SolidityCode.propTypes = {
  code: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['vulnerable', 'fixed']),
  label: PropTypes.string,
};

export default SolidityCode;
```

- [ ] **Step 2: Verify it compiles**

```bash
npx esbuild src/security/SolidityCode.jsx --loader:.jsx=jsx --bundle --external:react --external:prop-types --outfile=/dev/null
```

Expected: no output, exit 0. (`prop-types` is already a transitive dependency used by `src/components/HeroSection.jsx`; confirm with `node -e "import('prop-types').then(()=>console.log('ok'))"` — if it resolves, the import is safe.)

- [ ] **Step 3: Commit**

```bash
git add src/security/SolidityCode.jsx
git commit -m "feat(security): add SolidityCode block with copy button

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Catalog — categories and levels 1–20

**Files:**
- Create: `src/security/catalog.js`
- Test: throwaway script at `…/scratchpad/test-catalog.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `export const CATEGORIES` and `export const LEVELS`. Tasks 4 and 5 consume both. Shapes are fixed here and must not change in Task 4.

**Category set (exactly these ten, in this order):**

| id | name | icon | blurb (one sentence, write during implementation) |
|---|---|---|---|
| `access-control` | Access Control & Authorization | `fa-lock` | who may call what, and how that check gets bypassed |
| `reentrancy` | Reentrancy | `fa-refresh` | external calls that re-enter before state settles |
| `storage-layout` | Storage Layout & Delegatecall | `fa-database` | slot collisions, `delegatecall` context, "private" data |
| `randomness` | Randomness & Predictability | `fa-random` | on-chain entropy that the caller can compute first |
| `arithmetic` | Arithmetic & Type Safety | `fa-calculator` | overflow, underflow, truncating casts |
| `low-level` | Contract Interaction & Low-Level Calls | `fa-code` | raw calls, fallbacks, gas, calldata, bytecode |
| `dos` | Denial of Service | `fa-ban` | making a contract permanently unusable |
| `proxy` | Proxy & Upgradeability | `fa-clone` | initializers, implementation hijacking, delegate wallets |
| `economic` | DEX & Economic Logic | `fa-line-chart` | pricing, accounting, and incentive flaws |
| `crypto` | Cryptography & Signatures | `fa-key` | ECDSA malleability, replay, forged signatures |

**Level metadata for this task (id, name, difficulty, category) — these values come from the Ethernaut game data and must be used verbatim:**

| id | slug | name | difficulty | category |
|---|---|---|---|---|
| 0 | `hello-ethernaut` | Hello Ethernaut | 0 | `low-level` |
| 1 | `fallback` | Fallback | 1 | `access-control` |
| 2 | `fallout` | Fallout | 2 | `access-control` |
| 3 | `coin-flip` | Coin Flip | 3 | `randomness` |
| 4 | `telephone` | Telephone | 1 | `access-control` |
| 5 | `token` | Token | 3 | `arithmetic` |
| 6 | `delegation` | Delegation | 4 | `storage-layout` |
| 7 | `force` | Force | 5 | `low-level` |
| 8 | `vault` | Vault | 3 | `storage-layout` |
| 9 | `king` | King | 6 | `dos` |
| 10 | `re-entrancy` | Re-entrancy | 6 | `reentrancy` |
| 11 | `elevator` | Elevator | 4 | `low-level` |
| 12 | `privacy` | Privacy | 6 | `storage-layout` |
| 13 | `gatekeeper-one` | Gatekeeper One | 8 | `low-level` |
| 14 | `gatekeeper-two` | Gatekeeper Two | 6 | `low-level` |
| 15 | `naught-coin` | Naught Coin | 5 | `access-control` |
| 16 | `preservation` | Preservation | 8 | `storage-layout` |
| 17 | `recovery` | Recovery | 6 | `low-level` |
| 18 | `magic-number` | MagicNumber | 6 | `low-level` |
| 19 | `alien-codex` | Alien Codex | 7 | `arithmetic` |

Note on numbering: Ethernaut's URLs are zero-based (`/level/0` is Hello Ethernaut), while its list displays them 1-based. Store the zero-based `id` and build URLs from it; display `id + 1` as the level number so the page matches the site's own list.

- [ ] **Step 1: Write the failing integrity test**

Write to `…/scratchpad/test-catalog.mjs`:

```js
import { CATEGORIES, LEVELS } from '/home/farid/certifiedBlockchain/src/security/catalog.js';

let failures = 0;
const check = (name, cond, detail = '') => {
  if (cond) console.log(`pass ${name}`);
  else { failures++; console.log(`FAIL ${name} ${detail}`); }
};

const EXPECTED_LEVELS = Number(process.env.EXPECT_LEVELS || 41);
const catIds = new Set(CATEGORIES.map(c => c.id));

check('10 categories', CATEGORIES.length === 10, `got ${CATEGORIES.length}`);
check(`${EXPECTED_LEVELS} levels`, LEVELS.length === EXPECTED_LEVELS, `got ${LEVELS.length}`);
check('unique category ids', catIds.size === CATEGORIES.length);
check('unique level ids', new Set(LEVELS.map(l => l.id)).size === LEVELS.length);
check('unique slugs', new Set(LEVELS.map(l => l.slug)).size === LEVELS.length);

for (const c of CATEGORIES) {
  check(`category ${c.id} fields`,
    Boolean(c.id && c.name && c.icon && c.blurb) && c.icon.startsWith('fa-'));
}

for (const l of LEVELS) {
  const label = `level ${l.id} (${l.slug})`;
  check(`${label} category valid`, catIds.has(l.category), `-> ${l.category}`);
  check(`${label} difficulty 0-8`, Number.isInteger(l.difficulty) && l.difficulty >= 0 && l.difficulty <= 8);
  for (const field of ['name', 'summary', 'attack', 'prevention', 'vulnerable', 'fixed']) {
    check(`${label} has ${field}`, typeof l[field] === 'string' && l[field].trim().length > 0);
  }
  check(`${label} summary is one line`, !l.summary.includes('\n'));
  check(`${label} snippets differ`, l.vulnerable !== l.fixed);
  check(`${label} snippets under 30 lines`,
    l.vulnerable.split('\n').length <= 30 && l.fixed.split('\n').length <= 30);
  check(`${label} has ethernaut ref`,
    Array.isArray(l.refs) && l.refs.some(r => r.url.includes('ethernaut.openzeppelin.com')));
  check(`${label} ref url matches id`,
    l.refs.some(r => r.url.endsWith(`/level/${l.id}`)));
}

const used = new Set(LEVELS.map(l => l.category));
for (const c of CATEGORIES) check(`category ${c.id} non-empty`, used.has(c.id));

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
EXPECT_LEVELS=20 node "/tmp/claude-1000/-home-farid-certifiedBlockchain/0f14b5d7-ecaa-4681-8998-df9b2386543b/scratchpad/test-catalog.mjs"
```

Expected: FAIL — `ERR_MODULE_NOT_FOUND` for `catalog.js`.

- [ ] **Step 3: Write the aggregator and the ten empty level modules**

Create `src/security/catalog.js` — it holds the category declarations and stitches the content modules together, but contains no level content itself:

```js
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

import { LEVELS as accessControl } from './levels/accessControl';
import { LEVELS as reentrancy } from './levels/reentrancy';
import { LEVELS as storageLayout } from './levels/storageLayout';
import { LEVELS as randomness } from './levels/randomness';
import { LEVELS as arithmetic } from './levels/arithmetic';
import { LEVELS as lowLevel } from './levels/lowLevel';
import { LEVELS as dos } from './levels/dos';
import { LEVELS as proxy } from './levels/proxy';
import { LEVELS as economic } from './levels/economic';
import { LEVELS as crypto } from './levels/crypto';

export const CATEGORIES = [
  {
    id: 'access-control',
    name: 'Access Control & Authorization',
    icon: 'fa-lock',
    blurb: 'Who is allowed to call what — and every way that check gets sidestepped.',
  },
  // …nine more, in the order given in the task table
];

export const LEVELS = [
  ...accessControl, ...reentrancy, ...storageLayout, ...randomness, ...arithmetic,
  ...lowLevel, ...dos, ...proxy, ...economic, ...crypto,
].sort((a, b) => a.id - b.id);
```

Module-to-category mapping (file name → `category` id every entry in it must carry):
`accessControl.js` → `access-control`, `reentrancy.js` → `reentrancy`,
`storageLayout.js` → `storage-layout`, `randomness.js` → `randomness`,
`arithmetic.js` → `arithmetic`, `lowLevel.js` → `low-level`, `dos.js` → `dos`,
`proxy.js` → `proxy`, `economic.js` → `economic`, `crypto.js` → `crypto`.

Each level module starts with a file comment naming its class and exports one array:

```js
/**
 * @file accessControl.js
 * @description Access control & authorization failures (Ethernaut levels 1, 2,
 *              4, 15, 26, 28). Snippets are original minimal illustrations of
 *              each flaw, not copies of the level contracts.
 */

export const LEVELS = [
  {
    id: 1,
    slug: 'fallback',
    name: 'Fallback',
    difficulty: 1,
    category: 'access-control',
    summary: 'A payable fallback hands ownership to anyone who sends wei directly.',
    attack:
      'The contract guards its withdraw function with an owner check, but its receive/fallback ' +
      'function reassigns owner to msg.sender for any direct transfer that meets a trivial ' +
      'condition. An attacker satisfies the contribution precondition, sends 1 wei with no ' +
      'calldata to trigger the fallback, becomes owner, and drains the balance.',
    prevention:
      'Treat receive() and fallback() as untrusted public entry points: they should never mutate ' +
      'privileged state. Keep ownership transfer in one explicit function guarded by onlyOwner, ' +
      'and prefer a two-step transfer so a mistake is recoverable.',
    vulnerable: `contract Vault {
    address public owner = msg.sender;

    // Any direct transfer can seize ownership.
    receive() external payable {
        require(msg.value > 0);
        owner = msg.sender;
    }

    function withdraw() external {
        require(msg.sender == owner, "not owner");
        payable(owner).transfer(address(this).balance);
    }
}`,
    fixed: `contract Vault {
    address public owner = msg.sender;
    address public pendingOwner;

    // Accepts ether, touches no privileged state.
    receive() external payable {}

    function transferOwnership(address next) external {
        require(msg.sender == owner, "not owner");
        pendingOwner = next;
    }

    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "not pending owner");
        owner = pendingOwner;
        pendingOwner = address(0);
    }

    function withdraw() external {
        require(msg.sender == owner, "not owner");
        payable(owner).transfer(address(this).balance);
    }
}`,
    refs: [{ label: 'Play Fallback on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/1' }],
  },
  // …the remaining entries belonging to this category
];
```

For this task, author only the levels with ids 0–19 into their respective
modules; the remaining modules may start as `export const LEVELS = [];` and are
filled in Task 4. `catalog.js` and all ten module files must exist after this
step so the aggregator imports resolve.

Authoring rules for every entry, applied uniformly:
- `summary`: a single line, no newline, under ~110 characters.
- `attack`: 2–4 sentences naming the concrete mechanism (which opcode, which
  missing check, which storage slot). No "an attacker could somehow".
- `prevention`: 1–3 sentences giving the defensive pattern by name
  (checks-effects-interactions, pull-over-push, `msg.sender` over `tx.origin`,
  OpenZeppelin `ReentrancyGuard`, `Initializable`, and so on).
- `vulnerable` / `fixed`: the same scenario, minimal, under 25 lines each,
  compilable-looking Solidity ^0.8 with the flaw isolated. The pair must differ.
- `refs`: at minimum `https://ethernaut.openzeppelin.com/level/<id>`.

- [ ] **Step 4: Run the integrity test for the partial catalog**

```bash
EXPECT_LEVELS=20 node "/tmp/claude-1000/-home-farid-certifiedBlockchain/0f14b5d7-ecaa-4681-8998-df9b2386543b/scratchpad/test-catalog.mjs"
```

Expected: `ALL PASS` except the "category non-empty" checks for categories that only receive levels in Task 4 (`dos` has level 9, `reentrancy` has 10, `storage-layout` has 6/8/12/16, `randomness` has 3, so at this point only `proxy`, `economic`, and `crypto` may legitimately fail). Note which ones fail and confirm they are exactly those three; anything else is a real error to fix now.

- [ ] **Step 5: Commit**

```bash
git add src/security/catalog.js src/security/levels/
git commit -m "feat(security): add vulnerability catalog structure and levels 0-19

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Catalog — levels 20–40

**Files:**
- Modify: `src/security/levels/*.js` (append entries to the module matching each level's category)

**Interfaces:**
- Consumes: the entry shape defined in Task 3 — identical field names and authoring rules, no new fields. No change to `catalog.js` is needed; the aggregator already imports every module.
- Produces: a complete 41-entry `LEVELS` array once aggregated. Tasks 5 and 6 consume it.

| id | slug | name | difficulty | category |
|---|---|---|---|---|
| 20 | `denial` | Denial | 5 | `dos` |
| 21 | `shop` | Shop | 4 | `low-level` |
| 22 | `dex` | Dex | 3 | `economic` |
| 23 | `dex-two` | Dex Two | 4 | `economic` |
| 24 | `puzzle-wallet` | Puzzle Wallet | 7 | `proxy` |
| 25 | `motorbike` | Motorbike | 6 | `proxy` |
| 26 | `double-entry-point` | DoubleEntryPoint | 4 | `access-control` |
| 27 | `good-samaritan` | Good Samaritan | 5 | `low-level` |
| 28 | `gatekeeper-three` | Gatekeeper Three | 6 | `access-control` |
| 29 | `switch` | Switch | 8 | `low-level` |
| 30 | `higher-order` | HigherOrder | 8 | `low-level` |
| 31 | `stake` | Stake | 6 | `economic` |
| 32 | `impersonator` | Impersonator | 8 | `crypto` |
| 33 | `magic-animal-carousel` | Magic Animal Carousel | 6 | `storage-layout` |
| 34 | `bet-house` | Bet House | 4 | `economic` |
| 35 | `elliptic-token` | Elliptic Token | 8 | `crypto` |
| 36 | `cashback` | Cashback | 8 | `economic` |
| 37 | `impersonator-two` | Impersonator Two | 8 | `crypto` |
| 38 | `unique-nft` | UniqueNFT | 5 | `economic` |
| 39 | `forger` | Forger | 5 | `crypto` |
| 40 | `not-optimistic-portal` | NotOptimisticPortal | 8 | `proxy` |

- [ ] **Step 1: Verify the mechanic of each level from 32 onward before writing**

The category assignments for ids 0–31 are well established. Ids 32–40 are recent
additions; confirm each one's actual mechanic before writing its content:

```bash
curl -s https://raw.githubusercontent.com/OpenZeppelin/ethernaut/master/contracts/src/levels/Impersonator.sol | head -60
```

Repeat for `EllipticToken.sol`, `Cashback.sol`, `ImpersonatorTwo.sol`, `UniqueNFT.sol`, `Forger.sol`, `NotOptimisticPortal.sol`, `Stake.sol`, `BetHouse.sol`, and `MagicAnimalCarousel.sol` (exact filenames may differ — list the directory with
`curl -s https://api.github.com/repos/OpenZeppelin/ethernaut/contents/contracts/src/levels | grep '"name"'`).
If a level's real mechanic contradicts the category in the table, use the correct
category and record the change in the commit message. Do not guess.

- [ ] **Step 2: Append the 21 entries to their category modules**

Same shape and authoring rules as Task 3 — `id`, `slug`, `name`, `difficulty`,
`category`, `summary`, `attack`, `prevention`, `vulnerable`, `fixed`, `refs`
with `https://ethernaut.openzeppelin.com/level/<id>`. Each entry goes in the
module matching its `category` (e.g. level 24 Puzzle Wallet → `levels/proxy.js`),
replacing that module's placeholder empty array where one was left in Task 3.

- [ ] **Step 3: Run the full integrity test**

```bash
node "/tmp/claude-1000/-home-farid-certifiedBlockchain/0f14b5d7-ecaa-4681-8998-df9b2386543b/scratchpad/test-catalog.mjs"
```

Expected: `ALL PASS` with 41 levels and every category non-empty. Fix any failure before committing.

- [ ] **Step 4: Commit**

```bash
git add src/security/levels/
git commit -m "feat(security): add catalog levels 20-40, completing all 41

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: LevelCard and Security page

**Files:**
- Create: `src/security/LevelCard.jsx`
- Create: `src/security/Security.jsx`

**Interfaces:**
- Consumes: `CATEGORIES`, `LEVELS` (Tasks 3–4); `SolidityCode` (Task 2).
- Produces: `LevelCard` default export taking `{ level, category }`; `Security` default export taking no props (lazy-loaded as a route element in Task 7). CSS classes styled in Task 6: `.security-page`, `.security-stats`, `.security-stat`, `.security-controls`, `.security-search`, `.category-chips`, `.category-chip`, `.category-section`, `.category-head`, `.level-grid`, `.level-card`, `.level-card-toggle`, `.level-meta`, `.level-num`, `.difficulty`, `.difficulty-meter`, `.difficulty-fill`, `.level-body`, `.level-detail-block`, `.code-pair`, `.security-empty`.

- [ ] **Step 1: Write LevelCard.jsx**

```jsx
/**
 * @file LevelCard.jsx
 * @description One Ethernaut level: collapsed to a summary, expandable to the
 *              attack, the prevention, and the vulnerable/secure code pair.
 */

import React, { useState, useId } from 'react';
import PropTypes from 'prop-types';
import SolidityCode from './SolidityCode';

// Difficulty is shown as a number AND a meter; color alone never carries it.
const difficultyTone = (d) => (d <= 2 ? 'easy' : d <= 5 ? 'medium' : 'hard');

const LevelCard = ({ level, category }) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const tone = difficultyTone(level.difficulty);

  return (
    <article className={`level-card ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="level-card-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="level-meta">
          <span className="level-num">{String(level.id + 1).padStart(2, '0')}</span>
          <span className="level-name">{level.name}</span>
        </span>
        <span className="level-summary">{level.summary}</span>
        <span className={`difficulty difficulty--${tone}`}>
          <span className="difficulty-label">Difficulty {level.difficulty}/8</span>
          <span className="difficulty-meter" aria-hidden="true">
            <span className="difficulty-fill" style={{ width: `${(level.difficulty / 8) * 100}%` }} />
          </span>
        </span>
        <i className={`fa fa-chevron-${open ? 'up' : 'down'} level-chevron`} aria-hidden="true" />
      </button>

      <div id={panelId} className="level-body" hidden={!open}>
        <div className="level-detail-block">
          <h4><i className="fa fa-crosshairs" aria-hidden="true" /> How the attack works</h4>
          <p>{level.attack}</p>
        </div>
        <div className="level-detail-block">
          <h4><i className="fa fa-shield" aria-hidden="true" /> How to prevent it</h4>
          <p>{level.prevention}</p>
        </div>
        <div className="code-pair">
          <SolidityCode code={level.vulnerable} variant="vulnerable" />
          <SolidityCode code={level.fixed} variant="fixed" />
        </div>
        <div className="level-refs">
          <span className="level-category-tag">
            <i className={`fa ${category?.icon || 'fa-tag'}`} aria-hidden="true" />
            {category?.name || level.category}
          </span>
          {level.refs.map((ref) => (
            <a key={ref.url} href={ref.url} target="_blank" rel="noopener noreferrer">
              {ref.label} <i className="fa fa-external-link" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </article>
  );
};

LevelCard.propTypes = {
  level: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    difficulty: PropTypes.number.isRequired,
    category: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
    attack: PropTypes.string.isRequired,
    prevention: PropTypes.string.isRequired,
    vulnerable: PropTypes.string.isRequired,
    fixed: PropTypes.string.isRequired,
    refs: PropTypes.arrayOf(
      PropTypes.shape({ label: PropTypes.string.isRequired, url: PropTypes.string.isRequired })
    ).isRequired,
  }).isRequired,
  category: PropTypes.shape({ name: PropTypes.string, icon: PropTypes.string }),
};

export default LevelCard;
```

- [ ] **Step 2: Write Security.jsx**

Header note: this page does **not** use the shared `HeroSection` — that
component requires a `contractName`, renders a "Contract not configured" badge
when no address is passed, and appends Sepolia faucet guidance, all wrong here.
It reuses the global hero classes directly instead.

```jsx
/**
 * @file Security.jsx
 * @description Smart contract security reference built around the levels of
 *              OpenZeppelin's Ethernaut wargame. Pure content — no wallet, no
 *              contract calls — so it renders without MetaMask.
 */

import React, { useState, useMemo } from 'react';
import { CATEGORIES, LEVELS } from './catalog';
import LevelCard from './LevelCard';
import './security.css';

const ETHERNAUT_URL = 'https://ethernaut.openzeppelin.com/';

const Security = () => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categoryById = useMemo(
    () => Object.fromEntries(CATEGORIES.map((c) => [c.id, c])),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LEVELS.filter((level) => {
      if (activeCategory !== 'all' && level.category !== activeCategory) return false;
      if (!q) return true;
      const haystack = `${level.name} ${level.summary} ${categoryById[level.category]?.name || ''}`;
      return haystack.toLowerCase().includes(q);
    });
  }, [query, activeCategory, categoryById]);

  const grouped = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        levels: filtered.filter((l) => l.category === category.id),
      })).filter((group) => group.levels.length > 0),
    [filtered]
  );

  const clearFilters = () => {
    setQuery('');
    setActiveCategory('all');
  };

  return (
    <div className="security-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-title-row">
            <h1>Smart Contract Security</h1>
            <span className="security-hero-badge">
              <i className="fa fa-shield" aria-hidden="true" /> {LEVELS.length} vulnerabilities
            </span>
          </div>
          <p className="lead">
            Every way a Solidity contract can betray you, organised by failure class. Each entry
            explains the attack, the defence, and shows the vulnerable and secure code side by side.
          </p>
          <p className="network-info">
            Built around{' '}
            <a href={ETHERNAUT_URL} target="_blank" rel="noopener noreferrer">
              The Ethernaut
            </a>
            , OpenZeppelin&rsquo;s smart contract wargame. Each card links to its level so you can
            exploit it yourself.
          </p>
        </div>
      </section>

      <div className="security-stats">
        <div className="security-stat">
          <span className="security-stat-value">{LEVELS.length}</span>
          <span className="security-stat-label">Levels covered</span>
        </div>
        <div className="security-stat">
          <span className="security-stat-value">{CATEGORIES.length}</span>
          <span className="security-stat-label">Vulnerability classes</span>
        </div>
        <div className="security-stat">
          <span className="security-stat-value">{LEVELS.length * 2}</span>
          <span className="security-stat-label">Code examples</span>
        </div>
      </div>

      <div className="security-controls">
        <label className="security-search">
          <span className="visually-hidden">Search vulnerabilities</span>
          <i className="fa fa-search" aria-hidden="true" />
          <input
            type="search"
            className="form-control"
            placeholder="Search by name, symptom, or class…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <div className="category-chips" role="group" aria-label="Filter by vulnerability class">
          <button
            type="button"
            className={`category-chip ${activeCategory === 'all' ? 'is-active' : ''}`}
            aria-pressed={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
          >
            All classes
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`category-chip ${activeCategory === category.id ? 'is-active' : ''}`}
              aria-pressed={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
            >
              <i className={`fa ${category.icon}`} aria-hidden="true" />
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="security-empty">
          <i className="fa fa-search" aria-hidden="true" />
          <p>No levels match &ldquo;{query}&rdquo;.</p>
          <button type="button" className="btn btn-primary" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        grouped.map(({ category, levels }) => (
          <section key={category.id} className="category-section">
            <header className="category-head">
              <h2>
                <i className={`fa ${category.icon}`} aria-hidden="true" /> {category.name}
              </h2>
              <p>{category.blurb}</p>
              <span className="category-count">{levels.length} levels</span>
            </header>
            <div className="level-grid">
              {levels.map((level) => (
                <LevelCard key={level.slug} level={level} category={category} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
};

export default Security;
```

- [ ] **Step 3: Verify both compile**

```bash
npx esbuild src/security/Security.jsx --loader:.jsx=jsx --bundle --external:react --external:prop-types --external:./security.css --outfile=/dev/null
```

Expected: exit 0. A CSS-resolution error here is expected only if `security.css` does not exist yet — create it as an empty file in Task 6's first step if so, or run this check after Task 6.

- [ ] **Step 4: Commit**

```bash
git add src/security/LevelCard.jsx src/security/Security.jsx
git commit -m "feat(security): add LevelCard and Security page components

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Page styling

**Files:**
- Create: `src/security/security.css`

**Interfaces:**
- Consumes: every class name listed in Tasks 2 and 5, plus design tokens from `src/components/css/index.css`.
- Produces: no JS interface.

- [ ] **Step 1: Write security.css**

Required rules, all using tokens:

- `.security-page` — page rhythm using `--space-*`.
- `.security-hero-badge` — pill using `--color-primary-soft` background, `--color-link` text.
- `.security-stats` / `.security-stat` — responsive grid (3 columns desktop, 1 column at 480px) of dark panels: `--color-bg-elevated`, `1px solid var(--color-border)`, `--radius-lg`. `.security-stat-value` uses `--font-display` at ~2rem; `.security-stat-label` uses `--color-text-muted`.
- `.security-controls` — sticky below the navbar (`position: sticky; top: 72px; z-index: 5`) with a `--color-bg` backdrop so cards scroll under it cleanly. Drop the stickiness under 768px.
- `.security-search` — the icon sits inside the field: relative wrapper, absolutely positioned `<i>`, input with `padding-left: 40px`. The input inherits the global `.form-control` bridge.
- `.category-chips` / `.category-chip` — wrapping flex row; chips are `--color-surface` with `1px solid var(--color-border)`, `--radius-full`, `min-height: 44px`; `.is-active` becomes `--color-primary-soft` with `--color-primary` border and `--color-link` text.
- `.category-section` / `.category-head` — section heading in `--font-display`, blurb in `--color-text-secondary`, count badge in `--color-text-muted`.
- `.level-grid` — single column (cards are wide because they hold code).
- `.level-card` — `--color-bg-elevated`, `--color-border`, `--radius-lg`; `.is-open` gets `--color-primary` border and `--shadow-glow`.
- `.level-card-toggle` — full-width `<button>`, transparent background, text aligned left, `min-height: 44px`, `cursor: pointer`, grid layout `auto 1fr auto auto` collapsing to two rows under 768px. Hover: `--color-surface-hover`.
- `.level-num` — `--font-mono`, `--color-text-muted`.
- `.difficulty-meter` — 60px track in `--color-surface`, `.difficulty-fill` colored by tone: `--color-success` (easy), `--color-warning` (medium), `--color-danger` (hard). `.difficulty-label` stays visible text, never `display:none`.
- `.level-body` — padding and a `1px solid var(--color-border)` top rule. Uses the `hidden` attribute for state, so add `.level-body[hidden] { display: none; }` because Bootstrap's reboot can otherwise leave `display: block` winning.
- `.code-pair` — two columns above 1024px, one column below.
- `.sol-code` — `--color-surface-solid` background, `--radius-md`, `overflow: hidden`. `.sol-code--vulnerable` gets a `--color-danger` left border, `.sol-code--fixed` a `--color-accent` left border.
- `.sol-code-header` — flex row, `--color-surface` background, label in `--color-text-secondary`.
- `.sol-copy-btn` — `min-height: 44px`, `--color-text-secondary`, hover `--color-text` on `--color-surface-hover`.
- `.sol-pre` — `--font-mono`, `font-size: 0.85rem`, `line-height: 1.6`, `overflow-x: auto`, `margin: 0`, `padding: var(--space-4)`, `tab-size: 4`.
- Token colors (all AA on `--color-surface-solid`): `.tok-comment` `--color-text-muted` italic; `.tok-string` `#86EFAC`; `.tok-keyword` `#C4B5FD`; `.tok-type` `#7DD3FC`; `.tok-number` `#FCD34D`; `.tok-function` `#F0ABFC`.
- `.security-empty` — centered dark panel with icon, message, and the clear button.
- `.visually-hidden` — the standard clip-rect pattern, for the search label.
- Media queries at 1024px, 768px, and 480px covering: `.code-pair` to one column, `.security-controls` non-sticky, `.level-card-toggle` two-row layout, `.security-stats` to one column.

Do not define `.hero-section`, `.hero-content`, or `.hero-title-row`.

- [ ] **Step 2: Verify no forbidden selectors and no raw hex outside the token map**

```bash
grep -nE '^\.hero-(section|content|title-row)' src/security/security.css
grep -nE '#[0-9a-fA-F]{6}' src/security/security.css
```

Expected: the first returns nothing. The second returns only the six syntax-token colors listed above.

- [ ] **Step 3: Commit**

```bash
git add src/security/security.css
git commit -m "feat(security): style the security page with design tokens

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Route, navigation, and public access

**Files:**
- Modify: `src/App.jsx` (imports ~line 36, lazy block ~line 64, render ~lines 319–338)
- Modify: `src/navBar.jsx` (after the Games dropdown, ~line 458)

**Interfaces:**
- Consumes: `Security` default export (Task 5).
- Produces: the `/security` route, reachable from the navbar without a wallet.

- [ ] **Step 1: Add the router import and the lazy component in App.jsx**

Change the router import:

```jsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
```

Add after the other lazy imports (after `const TokenForge = …`):

```jsx
const Security = lazy(() => import('./security/Security'));
```

- [ ] **Step 2: Add the public-route exemption**

Add above `function App() {`:

```jsx
// Content-only routes that must render without a wallet. The connect modal and
// the blur gate are skipped for these; every other route stays gated.
const PUBLIC_ROUTES = ['/security'];
```

Inside `App()`, after the `useRef` declarations:

```jsx
const location = useLocation();
const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
```

- [ ] **Step 3: Apply the exemption to the two render conditions**

Replace `{modalNeed && (` with:

```jsx
{modalNeed && !isPublicRoute && (
```

Replace the content wrapper class expression:

```jsx
<div className={`fade-in app-content ${modalNeed && !isPublicRoute ? 'blurred-content' : ''}`}>
```

- [ ] **Step 4: Register the route**

Inside the inner `<Routes>`, in the Services group next to `/certificate`:

```jsx
<Route path="/security" element={<Security />} />
```

- [ ] **Step 5: Add the navbar link**

In `src/navBar.jsx`, after the closing `</li>` of the Games dropdown and before `</ul>`:

```jsx
{/* Security - public reference page, no wallet required */}
<li className="nav-item">
  <NavLink className="nav-link" to="/security">
    <i className="nav-icon fa fa-shield" aria-hidden="true"></i>
    Security
  </NavLink>
</li>
```

- [ ] **Step 6: Build**

```bash
npm run build
```

Expected: `✓ built in …`. The pre-existing >500KB chunk warning is fine; any error is not.

- [ ] **Step 7: Verify the gate did not leak**

```bash
grep -n "isPublicRoute\|PUBLIC_ROUTES" src/App.jsx
```

Expected: exactly four hits — the constant, the derivation, the modal condition, and the blur condition. If `blurred-content` still reads `${modalNeed ?`, Step 3 was applied only partially.

- [ ] **Step 8: Commit**

```bash
git add src/App.jsx src/navBar.jsx
git commit -m "feat(security): add /security route and public access

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Verification pass

**Files:** none modified unless a defect is found.

- [ ] **Step 1: Build and catalog integrity together**

```bash
npm run build && node "/tmp/claude-1000/-home-farid-certifiedBlockchain/0f14b5d7-ecaa-4681-8998-df9b2386543b/scratchpad/test-catalog.mjs"
```

Expected: build succeeds, catalog reports `ALL PASS` at 41 levels.

- [ ] **Step 2: Design-system compliance sweep**

```bash
grep -rnE '#(667eea|764ba2)|--clr-' src/security/
grep -rnE '^\.hero-(section|content|title-row)' src/security/security.css
grep -rn "emoji\|🛡\|🔒\|⚠️" src/security/*.jsx
```

Expected: no output from any of the three.

- [ ] **Step 3: Run the dev server and check the page manually**

```bash
npm run dev
```

Then verify, with MetaMask disabled or absent:
1. `/#/security` renders fully — no connect modal, no blur.
2. All 41 levels appear across 10 category sections; counts in the section headers sum to 41.
3. Expanding a card reveals attack, prevention, and both code blocks with visible highlighting.
4. The copy button reports "Copied" (or "Copy failed" without throwing, if the browser blocks clipboard on a non-secure origin).
5. Search narrows results; a nonsense query shows the empty state and "Clear filters" restores everything.
6. Category chips filter to a single section and show the pressed state.
7. Keyboard: Tab reaches a card toggle, Enter/Space expands it, the focus ring is visible, and `aria-expanded` flips in the inspector.
8. At 375px width there is no horizontal page scroll; long code lines scroll inside their own block.

- [ ] **Step 4: Confirm other routes are still gated**

Still without a wallet, visit `/#/token` and `/#/certificate`. Both must show the connect modal over blurred content. If either renders unblurred, `PUBLIC_ROUTES` is matching too broadly — it must be an exact `includes` on `location.pathname`, not a `startsWith`.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A && git commit -m "fix(security): address verification findings

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

If nothing needed fixing, skip this step.

---

## Self-Review

**Spec coverage:** Route and nav → Task 7. Wallet gating → Task 7 (steps 2–3) and verified in Task 8 (step 4). Data model → Tasks 3–4. Components → Tasks 1, 2, 5. State and filtering → Task 5. Error handling: clipboard → Task 2; empty state → Task 5; catalog integrity → Tasks 3–4 test script. Design system compliance → Task 6 and Task 8 step 2. Content sourcing → authoring rules in Task 3, verified for newer levels in Task 4 step 1. All eight spec verification points map to Task 8. The spec's `HeroSection` exclusion is carried into Task 5 step 2.

**Placeholder scan:** No TBD/TODO. The catalog tasks specify per-level metadata exactly (id, slug, name, difficulty, category) and give one fully worked entry plus explicit authoring rules for the prose and snippets — content that must be written, not a deferred decision.

**Type consistency:** `tokenizeSolidity` returns `{type, value}` in Task 1 and is consumed with those field names in Task 2. Token types `comment|string|keyword|type|number|function|plain` map to the `.tok-*` classes styled in Task 6 — `plain` correctly has no class since Task 2 renders it as a bare fragment. `LEVELS` fields defined in Task 3 match the `LevelCard` propTypes in Task 5 and the assertions in the Task 3 test script. `CATEGORIES` fields (`id`, `name`, `icon`, `blurb`) are used consistently in Tasks 3, 5, and 6. `SolidityCode` prop names (`code`, `variant`, `label`) match between Tasks 2 and 5.

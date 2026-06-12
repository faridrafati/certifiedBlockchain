/**
 * @file catalog.js
 * @description TokenForge feature catalog, category presets, pricing, and the
 *              dependency/conflict rules. This is the single source of truth for
 *              the builder UI and MUST stay in sync with the on-chain
 *              Features library / validateConfig in the TokenFactory contract.
 *
 * Feature id == bit position in the uint256 feature bitmap (bit = 1 << id), so
 * encodeBitmap() here produces exactly what the contract prices and validates.
 */

// Feature ids (mirror ForgeTypes.Features)
export const FID = {
  REMOVE_CREDITS: 1, CUSTOM_DECIMALS: 2, SUPPLY_CAPPED: 3, SUPPLY_UNLIMITED: 4,
  ACCESS_OWNABLE: 5, ACCESS_ROLES: 6, PAUSABLE: 7, BURNABLE: 8, MINTABLE: 9,
  BATCH_OPS: 10, WHITELIST: 11, BLACKLIST: 12, CONTROLLED: 13, REFLECTION: 14,
  TAXABLE: 15, ANTI_WHALE: 16, LP_SETUP: 17, DEFLATIONARY: 18, CALLBACK: 19,
  PERMIT: 20, AUTH_3009: 21, URWA: 22, TOKEN_RECOVER: 23,
};

// Features deployed in a later release; disabled in the UI and rejected on-chain.
export const PHASE2_IDS = new Set([
  FID.REFLECTION, FID.URWA, FID.AUTH_3009, FID.LP_SETUP,
]);

// Default mainnet price chart (ETH). The real charged amount comes from the
// contract's requiredFee(); these drive the live per-line-item breakdown.
export const BASE_PRICE = 0.05;

// Dropdown groups (the default option is free; non-default options set a bit)
export const SUPPLY_OPTIONS = [
  { value: 'fixed', label: 'Fixed', id: null, price: 0, hint: 'Total supply minted once at creation; can never grow.' },
  { value: 'capped', label: 'Capped', id: FID.SUPPLY_CAPPED, price: 0.10, hint: 'Mintable up to a hard maximum you set.' },
  { value: 'unlimited', label: 'Unlimited', id: FID.SUPPLY_UNLIMITED, price: 0.10, hint: 'Mintable with no maximum.' },
];
export const ACCESS_OPTIONS = [
  { value: 'none', label: 'None', id: null, price: 0, hint: 'No owner. No admin powers exist — fully immutable.' },
  { value: 'ownable', label: 'Ownable', id: FID.ACCESS_OWNABLE, price: 0.05, hint: 'A single owner controls admin functions (2-step transfer).' },
  { value: 'roles', label: 'Role Based', id: FID.ACCESS_ROLES, price: 0.20, hint: 'Granular roles (minter, pauser, compliance) instead of one owner.' },
];
export const TRANSFER_OPTIONS = [
  { value: 'standard', label: 'Standard', id: null, price: 0, hint: 'Transfers are always enabled.' },
  { value: 'pausable', label: 'Pausable', id: FID.PAUSABLE, price: 0.15, hint: 'Owner can freeze all transfers in an emergency.' },
];

// Toggle features (everything not handled by the three dropdowns)
export const TOGGLE_FEATURES = [
  { id: FID.REMOVE_CREDITS, name: 'Remove Credits', price: 0.20, tooltip: 'Strips the "Created with TokenForge" badge and on-chain credit. Buy this for a clean, unbranded contract.' },
  { id: FID.CUSTOM_DECIMALS, name: 'Customizable Decimals', price: 0.05, tooltip: 'Set decimals to any value 0–18 instead of the default 18. Useful for stablecoins (6) or whole-unit tokens (0).' },
  { id: FID.BURNABLE, name: 'Burnable', price: 0.10, tooltip: 'Holders can permanently destroy their own tokens, reducing total supply. Common for buy-back-and-burn models.' },
  { id: FID.MINTABLE, name: 'Mintable', price: 0.15, tooltip: 'The owner can create new tokens after launch. Required for capped/unlimited supply.' },
  { id: FID.BATCH_OPS, name: 'Batch Operations', price: 0.15, tooltip: 'Send (and mint/burn) to many addresses in one transaction. Cheaper airdrops.' },
  { id: FID.WHITELIST, name: 'Whitelist', price: 0.25, tooltip: 'Only approved addresses can hold/transfer when enabled. For private sales or regulated assets.' },
  { id: FID.BLACKLIST, name: 'Blacklist', price: 0.25, tooltip: 'The owner can block specific addresses from transferring. For freezing known bad actors.' },
  { id: FID.CONTROLLED, name: 'Controlled', price: 0.25, tooltip: 'The owner can move any holder\'s tokens without approval. Buyers see this as a rug risk — only for compliance/RWA use.', danger: true },
  { id: FID.REFLECTION, name: 'Reflection', price: 0.50, tooltip: 'A % of every transfer is redistributed to all holders automatically. Rewards holding.' },
  { id: FID.TAXABLE, name: 'Taxable', price: 0.40, tooltip: 'Charge a fee (capped at 10%) on buys/sells/transfers, routed to a wallet you choose.' },
  { id: FID.ANTI_WHALE, name: 'Anti Whale Protection', price: 0.30, tooltip: 'Limit max transaction and wallet size (never below 0.1% of supply). Discourages dumps.' },
  { id: FID.LP_SETUP, name: 'Liquidity Pool Setup', price: 0.30, tooltip: 'Create a DEX liquidity pool in the same transaction as deployment.' },
  { id: FID.DEFLATIONARY, name: 'Deflationary', price: 0.30, tooltip: 'Auto-burn a % (capped at 10%) of every transfer, permanently shrinking supply.' },
  { id: FID.CALLBACK, name: 'Callback (ERC-1363)', price: 0.20, tooltip: 'Pay-and-notify: transfer tokens and trigger a contract in one transaction.' },
  { id: FID.PERMIT, name: 'Permit (ERC-2612)', price: 0.15, tooltip: 'Gasless approvals via signatures — users approve without paying gas.' },
  { id: FID.AUTH_3009, name: 'Authorization (ERC-3009)', price: 0.25, tooltip: 'USDC-style gasless transfers authorized by signature.' },
  { id: FID.URWA, name: 'uRWA (ERC-7943)', price: 0.60, tooltip: 'Regulated real-world-asset controls: freeze balances and force transfers for compliance.', danger: true },
  { id: FID.TOKEN_RECOVER, name: 'Token Recover', price: 0.10, tooltip: 'Rescue tokens/ETH accidentally sent to the contract. Cannot touch holder balances.' },
];

const ALL_PRICE_BY_ID = (() => {
  const m = { [FID.SUPPLY_CAPPED]: 0.10, [FID.SUPPLY_UNLIMITED]: 0.10, [FID.ACCESS_OWNABLE]: 0.05, [FID.ACCESS_ROLES]: 0.20, [FID.PAUSABLE]: 0.15 };
  TOGGLE_FEATURES.forEach(f => { m[f.id] = f.price; });
  return m;
})();

// Category presets (UI bundles, not separate contracts). Each lists the builder
// state it pre-selects; price is computed live from the chart above.
export const CATEGORIES = [
  { key: 'basic', name: 'Basic', badge: '', desc: 'A clean, standard ERC-20. Fixed supply, no admin.', supplyType: 'fixed', accessType: 'none', transferType: 'standard', toggles: [] },
  { key: 'essential', name: 'Essential', badge: 'Popular', desc: 'Owner-managed token with capped minting, burning, pause and blacklist.', supplyType: 'capped', accessType: 'ownable', transferType: 'pausable', toggles: [FID.MINTABLE, FID.BURNABLE, FID.BLACKLIST] },
  { key: 'taxable', name: 'Taxable', badge: '', desc: 'Essential plus a configurable fee-on-transfer.', supplyType: 'capped', accessType: 'ownable', transferType: 'pausable', toggles: [FID.MINTABLE, FID.BURNABLE, FID.BLACKLIST, FID.TAXABLE] },
  { key: 'ultimate', name: 'Ultimate', badge: 'Most Popular', desc: 'Everything in Essential plus permit, batch ops, custom decimals and recovery.', supplyType: 'capped', accessType: 'ownable', transferType: 'pausable', toggles: [FID.MINTABLE, FID.BURNABLE, FID.BLACKLIST, FID.CUSTOM_DECIMALS, FID.PERMIT, FID.BATCH_OPS, FID.TOKEN_RECOVER] },
  { key: 'deflationary', name: 'Deflationary', badge: '', desc: 'Taxable plus auto-burn and anti-whale limits.', supplyType: 'capped', accessType: 'ownable', transferType: 'pausable', toggles: [FID.MINTABLE, FID.BURNABLE, FID.BLACKLIST, FID.TAXABLE, FID.DEFLATIONARY, FID.ANTI_WHALE] },
  { key: 'reflection', name: 'Reflection', badge: 'Soon', desc: 'RFI-style holder rewards on every transfer.', supplyType: 'fixed', accessType: 'ownable', transferType: 'standard', toggles: [FID.REFLECTION, FID.BURNABLE, FID.ANTI_WHALE, FID.BLACKLIST], phase2: true },
  { key: 'rwa', name: 'PRO / Compliance', badge: 'Advanced', desc: 'Regulated real-world asset: roles, whitelist, forced transfers, uRWA.', supplyType: 'fixed', accessType: 'roles', transferType: 'pausable', toggles: [FID.WHITELIST, FID.CONTROLLED, FID.URWA, FID.TOKEN_RECOVER, FID.PERMIT, FID.AUTH_3009], phase2: true },
  { key: 'custom', name: 'Custom', badge: '', desc: 'Start from scratch and pick exactly what you need.', supplyType: 'fixed', accessType: 'none', transferType: 'standard', toggles: [] },
];

// ---- default builder state ----
export function blankState() {
  return {
    name: '', symbol: '', decimals: 18, initialSupply: '1000000', maxSupply: '',
    supplyType: 'fixed', accessType: 'none', transferType: 'standard',
    toggles: {}, // id -> true
    buyTax: 0, sellTax: 0, transferTax: 0, taxWallet: '',
    burnFee: 0, maxTxPercent: 1, maxWalletPercent: 2, reflectionFee: 0,
    category: 'custom',
  };
}

export function stateFromCategory(cat, prev) {
  const base = blankState();
  return {
    ...base,
    name: prev?.name || '', symbol: prev?.symbol || '',
    supplyType: cat.supplyType, accessType: cat.accessType, transferType: cat.transferType,
    toggles: Object.fromEntries(cat.toggles.map(id => [id, true])),
    category: cat.key,
  };
}

// ---- helpers ----
const hasToggle = (s, id) => !!s.toggles[id];
const accessIsNone = (s) => s.accessType === 'none';

/** Selected feature ids (dropdowns + toggles), excluding free defaults. */
export function selectedIds(s) {
  const ids = [];
  const sup = SUPPLY_OPTIONS.find(o => o.value === s.supplyType);
  if (sup?.id) ids.push(sup.id);
  const acc = ACCESS_OPTIONS.find(o => o.value === s.accessType);
  if (acc?.id) ids.push(acc.id);
  const tr = TRANSFER_OPTIONS.find(o => o.value === s.transferType);
  if (tr?.id) ids.push(tr.id);
  Object.keys(s.toggles).forEach(id => { if (s.toggles[id]) ids.push(Number(id)); });
  return ids;
}

/** uint256 feature bitmap as a BigInt (bit = 1 << id). */
export function encodeBitmap(s) {
  return selectedIds(s).reduce((m, id) => m | (1n << BigInt(id)), 0n);
}

/** Live line items for the order summary. */
export function lineItems(s) {
  const items = [{ label: 'Base deployment fee', price: BASE_PRICE }];
  const sup = SUPPLY_OPTIONS.find(o => o.value === s.supplyType);
  if (sup?.id) items.push({ label: `Supply: ${sup.label}`, price: sup.price });
  const acc = ACCESS_OPTIONS.find(o => o.value === s.accessType);
  if (acc?.id) items.push({ label: `Access: ${acc.label}`, price: acc.price });
  const tr = TRANSFER_OPTIONS.find(o => o.value === s.transferType);
  if (tr?.id) items.push({ label: `Transfer: ${tr.label}`, price: tr.price });
  TOGGLE_FEATURES.forEach(f => { if (s.toggles[f.id]) items.push({ label: f.name, price: f.price }); });
  return items;
}

export function totalEth(s, multiplierBps = 10000) {
  const sum = lineItems(s).reduce((a, b) => a + b.price, 0);
  return (sum * multiplierBps) / 10000;
}

/**
 * Apply auto-requirements: returns a new state plus a list of human notes for
 * anything that was auto-added. Mirrors the contract's required dependencies so
 * the user never builds a config the factory would reject.
 */
export function applyDependencies(s) {
  const next = { ...s, toggles: { ...s.toggles } };
  const notes = [];
  const needAccess = (label) => {
    if (accessIsNone(next)) { next.accessType = 'ownable'; notes.push(`Access set to Ownable — required by ${label}`); }
  };
  if (next.supplyType === 'capped' || next.supplyType === 'unlimited') {
    if (!hasToggle(next, FID.MINTABLE)) { next.toggles[FID.MINTABLE] = true; notes.push('Mintable added — required by this supply type'); }
    needAccess('this supply type');
  }
  if (hasToggle(next, FID.MINTABLE)) needAccess('Mintable');
  if (next.transferType === 'pausable') needAccess('Pausable');
  [FID.WHITELIST, FID.BLACKLIST, FID.CONTROLLED, FID.TAXABLE, FID.ANTI_WHALE, FID.DEFLATIONARY, FID.TOKEN_RECOVER].forEach(id => {
    if (hasToggle(next, id)) {
      const f = TOGGLE_FEATURES.find(x => x.id === id);
      needAccess(f.name);
    }
  });
  if (hasToggle(next, FID.URWA)) {
    if (next.accessType !== 'roles') { next.accessType = 'roles'; notes.push('Access set to Role Based — required by uRWA'); }
    if (!hasToggle(next, FID.WHITELIST)) { next.toggles[FID.WHITELIST] = true; notes.push('Whitelist added — required by uRWA'); }
  }
  if (hasToggle(next, FID.REFLECTION) && next.supplyType !== 'fixed') {
    next.supplyType = 'fixed'; notes.push('Supply set to Fixed — required by Reflection');
  }
  return { next, notes };
}

/**
 * Which toggle ids are currently disabled (conflicts) given the state, mapped to
 * a reason string. Mirrors the conflict half of the matrix + Phase-2 gating.
 */
export function disabledToggles(s) {
  const d = {};
  PHASE2_IDS.forEach(id => { d[id] = 'Coming soon'; });
  const reflectionOn = hasToggle(s, FID.REFLECTION);
  if (reflectionOn) {
    [FID.MINTABLE, FID.TAXABLE, FID.DEFLATIONARY, FID.URWA].forEach(id => { d[id] = 'Conflicts with Reflection'; });
  }
  if (hasToggle(s, FID.TAXABLE) || hasToggle(s, FID.DEFLATIONARY) || hasToggle(s, FID.MINTABLE)) {
    if (!PHASE2_IDS.has(FID.REFLECTION)) d[FID.REFLECTION] = 'Conflicts with this selection';
  }
  return d;
}

/** Validation errors that block deploy (token-detail level). */
export function validate(s) {
  const errors = {};
  if (!s.name || s.name.length < 1 || s.name.length > 50) errors.name = 'Name must be 1–50 characters';
  if (!s.symbol || s.symbol.length < 1 || s.symbol.length > 11) errors.symbol = 'Symbol must be 1–11 characters';
  const supply = Number(String(s.initialSupply).replace(/,/g, ''));
  if (!supply || supply <= 0) errors.initialSupply = 'Initial supply must be greater than 0';
  if (hasToggle(s, FID.CUSTOM_DECIMALS)) {
    if (s.decimals < 0 || s.decimals > 18) errors.decimals = 'Decimals must be 0–18';
  }
  if (s.supplyType === 'capped') {
    const max = Number(String(s.maxSupply).replace(/,/g, ''));
    if (!max || max < supply) errors.maxSupply = 'Max supply must be ≥ initial supply';
  }
  return errors;
}

export const PHASE2 = (id) => PHASE2_IDS.has(id);

/**
 * @file TokenForge.jsx
 * @description À-la-carte ERC-20 token generator. Users pick a category preset
 *              and/or individual features (each priced on-chain), then pay the
 *              factory the native-coin total, which validates the payment against
 *              the feature bitmap and deploys the token to them in one tx.
 *
 * Built on the repo's stack: web3.js v4 + MUI + the shared HeroSection /
 * useWalletEvents helpers. Mirrors src/tokenforge/catalog.js, which mirrors the
 * on-chain Features library and validateConfig.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Web3 from 'web3';
import { toast } from 'react-toastify';
import {
  Card, CardContent, TextField, MenuItem, Checkbox, FormControlLabel,
  Button, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Chip, CircularProgress, IconButton,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import HeroSection from './components/HeroSection';
import useWalletEvents from './components/useWalletEvents';
import './components/css/tokenforge.css';
import {
  TOKENFORGE_FACTORY_ADDRESS, TOKENFORGE_FACTORY_ABI,
} from './components/config/TokenForgeConfig';
import {
  FID, CATEGORIES, SUPPLY_OPTIONS, ACCESS_OPTIONS, TRANSFER_OPTIONS,
  TOGGLE_FEATURES, blankState, stateFromCategory, applyDependencies,
  disabledToggles, lineItems, totalEth, validate, encodeBitmap, selectedIds, PHASE2,
} from './tokenforge/catalog';

const ZERO = '0x0000000000000000000000000000000000000000';
const EXPLORER = 'https://eth-sepolia.blockscout.com';
const cleanInt = (v) => String(v).replace(/[^0-9]/g, '');
const fmt = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 4 });

export default function TokenForge() {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [factory, setFactory] = useState(null);
  const [multiplierBps, setMultiplierBps] = useState(10000);
  const [chainFee, setChainFee] = useState(null); // wei string from contract
  const [state, setState] = useState(blankState());
  const [autoNotes, setAutoNotes] = useState([]);
  const [tab, setTab] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ack, setAck] = useState(false);
  const [agree, setAgree] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [usdPerEth, setUsdPerEth] = useState(null);
  const [result, setResult] = useState(null); // { address, hash }
  const [factoryOwner, setFactoryOwner] = useState('');
  const [factoryBalance, setFactoryBalance] = useState(null); // wei string
  const [withdrawing, setWithdrawing] = useState(false);

  useWalletEvents();

  // ---- init wallet + factory ----
  const init = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      const w3 = new Web3(window.ethereum);
      setWeb3(w3);
      const accounts = await w3.eth.getAccounts();
      setAccount(accounts[0] || '');
      if (TOKENFORGE_FACTORY_ADDRESS) {
        const f = new w3.eth.Contract(TOKENFORGE_FACTORY_ABI, TOKENFORGE_FACTORY_ADDRESS);
        setFactory(f);
        try {
          const m = await f.methods.networkMultiplierBps().call();
          setMultiplierBps(Number(m));
        } catch { /* keep default */ }
        try {
          const o = await f.methods.owner().call();
          setFactoryOwner(o);
        } catch { /* no admin panel */ }
        try {
          const bal = await w3.eth.getBalance(TOKENFORGE_FACTORY_ADDRESS);
          setFactoryBalance(String(bal));
        } catch { /* no balance display */ }
      }
    } catch (e) {
      console.error('TokenForge init failed', e);
    }
  }, []);

  const refreshFactoryBalance = useCallback(async () => {
    if (!web3 || !TOKENFORGE_FACTORY_ADDRESS) return;
    try {
      const bal = await web3.eth.getBalance(TOKENFORGE_FACTORY_ADDRESS);
      setFactoryBalance(String(bal));
    } catch { /* ignore */ }
  }, [web3]);

  const handleWithdraw = async () => {
    if (!factory || !account) return;
    try {
      setWithdrawing(true);
      toast.info('Confirm the withdrawal in MetaMask…');
      await factory.methods.withdraw().send({ from: account });
      toast.success('Fees withdrawn to the treasury.');
      await refreshFactoryBalance();
    } catch (e) {
      console.error('Withdraw failed', e);
      if (e?.code === 4001) toast.warning('Transaction rejected.');
      else toast.error('Withdraw failed. See console for details.');
    } finally {
      setWithdrawing(false);
    }
  };

  useEffect(() => { init(); }, [init]);

  // Live USD estimate (CoinGecko, best-effort; UI works fine without it)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const j = await r.json();
        if (!cancelled && j?.ethereum?.usd) setUsdPerEth(Number(j.ethereum.usd));
      } catch { /* no USD display */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const bitmap = useMemo(() => encodeBitmap(state), [state]);
  const errors = useMemo(() => validate(state), [state]);
  const disabled = useMemo(() => disabledToggles(state), [state]);
  const items = useMemo(() => lineItems(state), [state]);
  const offlineTotal = useMemo(() => totalEth(state, multiplierBps), [state, multiplierBps]);

  // ---- read the real fee from the contract whenever the bitmap changes ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!factory) { setChainFee(null); return; }
      try {
        const fee = await factory.methods.requiredFee(bitmap.toString()).call();
        if (!cancelled) setChainFee(String(fee));
      } catch {
        if (!cancelled) setChainFee(null);
      }
    })();
    return () => { cancelled = true; };
  }, [factory, bitmap]);

  // ---- handlers ----
  const applyState = (next) => {
    const { next: resolved, notes } = applyDependencies(next);
    setState(resolved);
    setAutoNotes(notes);
  };

  const pickCategory = (cat) => {
    if (cat.phase2) { toast.info(`${cat.name} template is coming soon.`); return; }
    applyState(stateFromCategory(cat, state));
  };

  const setField = (k, v) => applyState({ ...state, [k]: v, category: relabel(state.category) });
  const setDropdown = (k, v) => applyState({ ...state, [k]: v, category: relabel(state.category) });
  const toggle = (id) => {
    if (disabled[id]) return;
    applyState({ ...state, toggles: { ...state.toggles, [id]: !state.toggles[id] }, category: relabel(state.category) });
  };

  // any manual edit relabels a preset as "custom based on X"
  const relabel = (cat) => (cat && cat !== 'custom' && !cat.startsWith('custom:')) ? `custom:${cat}` : cat;
  const categoryLabel = () => {
    if (state.category === 'custom') return 'Custom';
    if (state.category.startsWith('custom:')) {
      const base = CATEGORIES.find(c => c.key === state.category.slice(7));
      return `Custom (based on ${base ? base.name : 'preset'})`;
    }
    return CATEGORIES.find(c => c.key === state.category)?.name || 'Custom';
  };

  const decimals = state.toggles[FID.CUSTOM_DECIMALS] ? Number(state.decimals) : 18;
  const formValid = Object.keys(errors).length === 0;
  const taxable = !!state.toggles[FID.TAXABLE];
  const antiWhale = !!state.toggles[FID.ANTI_WHALE];
  const deflationary = !!state.toggles[FID.DEFLATIONARY];

  // ---- pricing breakdown for the order summary ----
  // Line items show the full reference (mainnet) chart; the on-chain total is
  // that subtotal scaled by the network multiplier. We surface the multiplier as
  // an explicit discount line so the subtotal and total always reconcile.
  const subtotal = items.reduce((a, b) => a + b.price, 0);
  const displayTotal = (chainFee != null && web3?.utils)
    ? Number(web3.utils.fromWei(chainFee, 'ether'))
    : offlineTotal;
  const networkAdjustment = subtotal - displayTotal; // amount waived/added by the multiplier
  const multiplierLabel = `${(multiplierBps / 10000)}×`;

  // ---- deploy ----
  const buildCfgArray = () => {
    const supplyScaled = (BigInt(cleanInt(state.initialSupply) || '0') * (10n ** BigInt(decimals))).toString();
    const maxScaled = state.supplyType === 'capped'
      ? (BigInt(cleanInt(state.maxSupply) || '0') * (10n ** BigInt(decimals))).toString()
      : '0';
    const bps = (p) => Math.max(0, Math.min(1000, Math.round(Number(p) * 100))); // percent -> bps, capped 10%
    const tw = taxable && state.taxWallet ? state.taxWallet : ZERO;
    return [
      state.name, state.symbol.toUpperCase(), decimals, supplyScaled, maxScaled,
      bitmap.toString(), account,
      taxable ? bps(state.buyTax) : 0,
      taxable ? bps(state.sellTax) : 0,
      taxable ? bps(state.transferTax) : 0,
      tw,
      deflationary ? bps(state.burnFee) : 0,
      antiWhale ? Math.round(Number(state.maxTxPercent) * 100) : 0,
      antiWhale ? Math.round(Number(state.maxWalletPercent) * 100) : 0,
      0, // reflectionFeeBps (phase 2)
    ];
  };

  const doDeploy = async () => {
    if (!factory || !account) { toast.error('Connect your wallet first'); return; }
    setConfirmOpen(false);
    setDeploying(true);
    try {
      const value = chainFee != null ? chainFee : web3.utils.toWei(String(offlineTotal), 'ether');
      const cfg = buildCfgArray();
      const lp = ['0', '0'];
      toast.info('Confirm the deployment in MetaMask…');
      const receipt = await factory.methods.createToken(cfg, lp).send({ from: account, value });
      const token = receipt?.events?.TokenCreated?.returnValues?.token;
      setResult({ address: token, hash: receipt.transactionHash });
      toast.success('Token deployed!');
      refreshFactoryBalance(); // fees just accrued to the factory
    } catch (e) {
      console.error('Deploy failed', e);
      const msg = e?.message || 'Deployment failed';
      if (msg.includes('User denied') || e?.code === 4001) toast.warning('Transaction rejected.');
      else toast.error(parseRevert(msg));
    } finally {
      setDeploying(false);
    }
  };

  const parseRevert = (msg) => {
    const known = ['InsufficientFee', 'InvalidConfig', 'FeeTooHigh', 'CapExceeded', 'ZeroAddress'];
    const hit = known.find((k) => msg.includes(k));
    return hit ? `Rejected on-chain: ${hit}` : 'Deployment failed. See console for details.';
  };

  const copy = (text) => { navigator.clipboard?.writeText(text); toast.success('Copied'); };

  const addToMetamask = async () => {
    if (!result?.address || !window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: { type: 'ERC20', options: { address: result.address, symbol: state.symbol.toUpperCase().slice(0, 11), decimals } },
      });
    } catch (e) { console.error(e); }
  };

  const solidityPreview = useMemo(() => buildPreview(state, bitmap, decimals), [state, bitmap, decimals]);

  // ---- success screen ----
  if (result) {
    return (
      <div className="tf-container">
        <HeroSection title="TokenForge" description="Your token is live." contractAddress={TOKENFORGE_FACTORY_ADDRESS} contractName="TokenForge Factory" account={account} />
        <Card className="tf-success"><CardContent>
          <h2><i className="fa fa-check-circle" aria-hidden="true" />{state.name} ({state.symbol.toUpperCase()}) deployed!</h2>
          <div className="tf-addr">
            <code>{result.address}</code>
            <IconButton size="small" onClick={() => copy(result.address)}><ContentCopyIcon fontSize="inherit" /></IconButton>
          </div>
          <div className="tf-success-actions">
            <Button variant="contained" onClick={addToMetamask}>Add to MetaMask</Button>
            <Button variant="outlined" href={`${EXPLORER}/address/${result.address}`} target="_blank" rel="noreferrer">View on Explorer</Button>
            <Button variant="outlined" href={`${EXPLORER}/tx/${result.hash}`} target="_blank" rel="noreferrer">View Transaction</Button>
            <Button variant="text" onClick={() => { setResult(null); setState(blankState()); setAck(false); }}>Create another</Button>
          </div>
          <p className="tf-muted">Verification on the explorer can take a few minutes. The token's source matches the audited ForgeToken family.</p>
        </CardContent></Card>
      </div>
    );
  }

  const notConfigured = !TOKENFORGE_FACTORY_ADDRESS;
  const isOwner = account && factoryOwner && account.toLowerCase() === factoryOwner.toLowerCase();
  const factoryBalanceEth = factoryBalance != null && web3?.utils ? web3.utils.fromWei(factoryBalance, 'ether') : null;

  return (
    <div className="tf-container">
      <HeroSection
        title="TokenForge"
        description="Create your own ERC-20 token — pick a template or build feature-by-feature. You only pay for what you select."
        contractAddress={TOKENFORGE_FACTORY_ADDRESS}
        contractName="TokenForge Factory"
        account={account}
      />

      {notConfigured && (
        <div className="tf-banner tf-warn">
          The TokenForge factory isn't deployed on this network yet. You can design a token and preview pricing &amp; Solidity below;
          deploy the factory (<code>scripts/deploy-tokenforge.js</code>) and set <code>VITE_TOKENFORGE_FACTORY_ADDRESS</code> to enable creation.
        </div>
      )}

      {isOwner && (
        <div className="tf-admin">
          <div className="tf-admin-info">
            <span className="tf-admin-tag">Admin</span>
            <span>Fees collected: <strong>{factoryBalanceEth != null ? `${fmt(factoryBalanceEth)} ETH` : '…'}</strong></span>
          </div>
          <Button variant="contained" size="small" className="tf-admin-btn"
            disabled={withdrawing || !factoryBalance || factoryBalance === '0'}
            onClick={handleWithdraw}>
            {withdrawing ? <CircularProgress size={18} /> : 'Withdraw to treasury'}
          </Button>
        </div>
      )}

      {/* Template strip (presets pre-fill the builder below) */}
      <div className="tf-strip-head">
        <h3 className="tf-section-head">Templates</h3>
        <span className="tf-active-label">Selected: <strong>{categoryLabel()}</strong></span>
      </div>
      <div className="tf-template-strip">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className={`tf-template-chip ${state.category === cat.key || state.category === `custom:${cat.key}` ? 'active' : ''} ${cat.phase2 ? 'soon' : ''}`}
            onClick={() => pickCategory(cat)}
            title={cat.desc}
          >
            <span className="tf-chip-name">{cat.name}</span>
            {cat.badge && <span className={`tf-badge ${cat.badge === 'Soon' ? 'soon' : ''}`}>{cat.badge}</span>}
            <span className="tf-chip-price">{cat.key === 'custom' ? 'blank' : `${fmt(totalEth(stateFromCategory(cat, state), multiplierBps))} ETH`}</span>
          </div>
        ))}
      </div>

      {/* smartcontracts.tools layout: form left, sticky order summary right */}
      <div className="tf-builder">
        <div className="tf-form">
          <Card className="tf-form-card"><CardContent>
            <div className="tf-section">
              <h3 className="tf-section-title">Token Details</h3>
              <div className="tf-grid2">
                <TextField label="Token Name" size="small" value={state.name} onChange={(e) => setField('name', e.target.value)}
                  error={!!errors.name} helperText={errors.name || 'e.g. My Awesome Token'} inputProps={{ maxLength: 50 }} />
                <TextField label="Token Symbol" size="small" value={state.symbol}
                  onChange={(e) => setField('symbol', e.target.value.toUpperCase())}
                  error={!!errors.symbol} helperText={errors.symbol || 'e.g. MAT'} inputProps={{ maxLength: 11 }} />
                <TextField label="Initial Supply" size="small" value={state.initialSupply}
                  onChange={(e) => setField('initialSupply', cleanInt(e.target.value))}
                  error={!!errors.initialSupply} helperText={errors.initialSupply || `${fmt(cleanInt(state.initialSupply) || 0)} tokens to your wallet`} />
                <TextField label="Token Decimals" size="small" type="number" value={decimals}
                  disabled={!state.toggles[FID.CUSTOM_DECIMALS]}
                  onChange={(e) => setField('decimals', e.target.value)}
                  error={!!errors.decimals}
                  helperText={errors.decimals || (state.toggles[FID.CUSTOM_DECIMALS] ? '0–18' : 'Enable "Customizable Decimals" to change')}
                  inputProps={{ min: 0, max: 18 }} />
                {state.supplyType === 'capped' && (
                  <TextField label="Max Supply" size="small" value={state.maxSupply}
                    onChange={(e) => setField('maxSupply', cleanInt(e.target.value))}
                    error={!!errors.maxSupply} helperText={errors.maxSupply || 'Hard cap — minting can never exceed this'} />
                )}
              </div>
            </div>

            <div className="tf-section">
              <h3 className="tf-section-title">Token Type</h3>
              <div className="tf-grid3">
                <TextField select size="small" label="Supply Type" value={state.supplyType} onChange={(e) => setDropdown('supplyType', e.target.value)}
                  helperText={SUPPLY_OPTIONS.find(o => o.value === state.supplyType)?.hint}>
                  {SUPPLY_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}{o.price ? ` · +${o.price} ETH` : ' · Free'}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Access Type" value={state.accessType} onChange={(e) => setDropdown('accessType', e.target.value)}
                  helperText={ACCESS_OPTIONS.find(o => o.value === state.accessType)?.hint}>
                  {ACCESS_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}{o.price ? ` · +${o.price} ETH` : ' · Free'}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Transfer Type" value={state.transferType} onChange={(e) => setDropdown('transferType', e.target.value)}
                  helperText={TRANSFER_OPTIONS.find(o => o.value === state.transferType)?.hint}>
                  {TRANSFER_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}{o.price ? ` · +${o.price} ETH` : ' · Free'}</MenuItem>)}
                </TextField>
              </div>
            </div>

            <div className="tf-section">
              <h3 className="tf-section-title">Token Features</h3>
              {/* Always-included rows, like the reference generator */}
              <div className="tf-feature-row included">
                <FormControlLabel control={<Checkbox checked disabled size="small" />}
                  label={<span className="tf-feat-name">ERC20 Compliant</span>} />
                <Tooltip title="Full EIP-20 standard: transfers, allowances, events. Always included." placement="top">
                  <InfoOutlinedIcon fontSize="small" className="tf-info" />
                </Tooltip>
                <span className="tf-pill free">Free</span>
              </div>
              <div className="tf-feature-row included">
                <FormControlLabel control={<Checkbox checked disabled size="small" />}
                  label={<span className="tf-feat-name">Verified Source Code</span>} />
                <Tooltip title="Deployed from the audited, source-verified ForgeToken family. Always included." placement="top">
                  <InfoOutlinedIcon fontSize="small" className="tf-info" />
                </Tooltip>
                <span className="tf-pill free">Free</span>
              </div>
              {TOGGLE_FEATURES.map((f) => {
                const isDisabled = !!disabled[f.id];
                const checked = !!state.toggles[f.id] && !isDisabled;
                return (
                  <div key={f.id} className={`tf-feature-row ${isDisabled ? 'disabled' : ''} ${f.danger ? 'danger' : ''} ${checked ? 'checked' : ''}`}>
                    <FormControlLabel
                      control={<Checkbox checked={checked} disabled={isDisabled} onChange={() => toggle(f.id)} size="small" />}
                      label={<span className="tf-feat-name">{f.name}{f.danger && <span className="tf-risk">risk</span>}</span>}
                    />
                    <Tooltip title={isDisabled ? disabled[f.id] : f.tooltip} placement="top">
                      <InfoOutlinedIcon fontSize="small" className="tf-info" />
                    </Tooltip>
                    <span className={`tf-pill ${PHASE2(f.id) ? 'soon' : 'paid'}`}>{PHASE2(f.id) ? 'Soon' : `+${f.price} ETH`}</span>
                  </div>
                );
              })}
            </div>

            {/* Feature-specific extras */}
            {taxable && (
              <div className="tf-extra">
                <h4>Tax settings (max 10% each)</h4>
                <div className="tf-grid3">
                  <TextField label="Buy %" size="small" type="number" value={state.buyTax} onChange={(e) => setField('buyTax', e.target.value)} inputProps={{ min: 0, max: 10, step: 0.5 }} />
                  <TextField label="Sell %" size="small" type="number" value={state.sellTax} onChange={(e) => setField('sellTax', e.target.value)} inputProps={{ min: 0, max: 10, step: 0.5 }} />
                  <TextField label="Transfer %" size="small" type="number" value={state.transferTax} onChange={(e) => setField('transferTax', e.target.value)} inputProps={{ min: 0, max: 10, step: 0.5 }} />
                </div>
                <TextField label="Tax wallet (defaults to you)" size="small" fullWidth value={state.taxWallet} onChange={(e) => setField('taxWallet', e.target.value)} placeholder={account} sx={{ mt: 1 }} />
              </div>
            )}
            {deflationary && (
              <div className="tf-extra">
                <h4>Auto-burn (max 10%)</h4>
                <TextField label="Burn %" size="small" type="number" value={state.burnFee} onChange={(e) => setField('burnFee', e.target.value)} inputProps={{ min: 0, max: 10, step: 0.5 }} />
              </div>
            )}
            {antiWhale && (
              <div className="tf-extra">
                <h4>Anti-whale limits (% of supply, floor 0.1%)</h4>
                <div className="tf-grid2">
                  <TextField label="Max Tx %" size="small" type="number" value={state.maxTxPercent} onChange={(e) => setField('maxTxPercent', e.target.value)} inputProps={{ min: 0.1, step: 0.1 }} />
                  <TextField label="Max Wallet %" size="small" type="number" value={state.maxWalletPercent} onChange={(e) => setField('maxWalletPercent', e.target.value)} inputProps={{ min: 0.1, step: 0.1 }} />
                </div>
              </div>
            )}
            {(state.toggles[FID.CONTROLLED] || state.toggles[FID.URWA]) && (
              <div className="tf-disclosure">
                <i className="fa fa-exclamation-triangle" aria-hidden="true" /> You selected a feature that lets the owner move or freeze holders' tokens. Buyers will see this as a rug risk — only use it for genuine compliance / regulated-asset cases.
              </div>
            )}
          </CardContent></Card>
        </div>

        {/* Right: sticky order summary (checkout) */}
        <div className="tf-summary">
          <Card className="tf-summary-card"><CardContent>
            <div className="tf-sum-head">
              <span className="tf-sum-title">Order Summary</span>
              <span className="tf-network-chip"><span className="tf-net-dot" />Sepolia</span>
            </div>
            <div className="tf-token-preview">
              <div className="tf-token-avatar">{(state.symbol || 'TKN').slice(0, 4)}</div>
              <div className="tf-token-id">
                <span className="tf-token-name">{state.name || 'Your Token'}</span>
                <span className="tf-token-sub">{fmt(cleanInt(state.initialSupply) || 0)} · {decimals} decimals</span>
              </div>
            </div>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 1, minHeight: 36 }}>
              <Tab label="Summary" sx={{ minHeight: 36 }} />
              <Tab label="Solidity" sx={{ minHeight: 36 }} />
            </Tabs>

            {tab === 0 ? (
              <>
                {autoNotes.length > 0 && (
                  <div className="tf-notes">
                    {autoNotes.map((n, i) => <div key={i} className="tf-note"><i className="fa fa-info-circle" aria-hidden="true" /> {n}</div>)}
                  </div>
                )}
                <div className="tf-lines">
                  {items.map((it, i) => (
                    <div key={i} className="tf-line">
                      <span>{it.label}</span>
                      <span className={it.price === 0 ? 'tf-line-free' : ''}>{it.price === 0 ? 'Free' : `${it.price} ETH`}</span>
                    </div>
                  ))}
                </div>
                {multiplierBps !== 10000 && (
                  <div className="tf-adjust-block">
                    <div className="tf-line tf-subtotal"><span>Subtotal</span><span>{fmt(subtotal)} ETH</span></div>
                    <div className="tf-line tf-adjust">
                      <span>{multiplierBps === 0 ? 'Sepolia testnet — fee waived' : `Network multiplier (${multiplierLabel})`}</span>
                      <span>{networkAdjustment > 0 ? `−${fmt(networkAdjustment)} ETH` : `${fmt(networkAdjustment)} ETH`}</span>
                    </div>
                  </div>
                )}
                <div className="tf-total">
                  <span>Total</span>
                  <span className="tf-total-val">{fmt(displayTotal)} ETH</span>
                </div>
                {multiplierBps === 0 ? (
                  <div className="tf-usd">You only pay network gas to deploy on Sepolia.</div>
                ) : (usdPerEth != null && displayTotal > 0 && (
                  <div className="tf-usd">≈ ${fmt(displayTotal * usdPerEth)} USD</div>
                ))}

                <FormControlLabel
                  className="tf-agree"
                  control={<Checkbox size="small" checked={agree} onChange={(e) => setAgree(e.target.checked)} />}
                  label={<span className="tf-agree-text">I have read and agree that tokens are deployed exactly as configured and I am responsible for their use.</span>}
                />

                <div className="tf-deploy">
                  {!account ? (
                    <Button variant="contained" fullWidth disabled className="tf-cta">Connect wallet (top right)</Button>
                  ) : (
                    <Tooltip title={notConfigured ? 'Factory not deployed on this network' : (!formValid ? 'Fix the highlighted fields' : (!agree ? 'Accept the agreement above' : ''))}>
                      <span>
                        <Button variant="contained" fullWidth className="tf-cta" disabled={notConfigured || !formValid || !agree || deploying}
                          onClick={() => { setAck(false); setConfirmOpen(true); }}>
                          {deploying ? <CircularProgress size={22} /> : 'Create Token'}
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </div>
                <p className="tf-muted">Overpayment is automatically refunded. Ownership is transferred to your wallet in the same transaction.</p>
              </>
            ) : (
              <pre className="tf-solidity">{solidityPreview}</pre>
            )}
          </CardContent></Card>
        </div>
      </div>

      {/* Confirm modal */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm deployment</DialogTitle>
        <DialogContent>
          <p><strong>{state.name}</strong> ({state.symbol.toUpperCase()}), {fmt(cleanInt(state.initialSupply))} supply, {decimals} decimals.</p>
          <div className="tf-recap">
            {selectedIds(state).length === 0 ? <Chip size="small" label="Plain ERC-20" /> :
              items.filter(i => i.label !== 'Base deployment fee').map((it, i) => <Chip key={i} size="small" label={it.label} sx={{ m: 0.3 }} />)}
          </div>
          {(state.toggles[FID.CONTROLLED] || state.toggles[FID.URWA] || state.accessType !== 'none') && (
            <div className="tf-disclosure">
              This token grants the owner powers (e.g. {[
                state.transferType === 'pausable' && 'pause transfers',
                state.toggles[FID.BLACKLIST] && 'blacklist addresses',
                state.toggles[FID.CONTROLLED] && 'force-move tokens',
                state.toggles[FID.TAXABLE] && 'charge fees up to 10%',
                state.toggles[FID.MINTABLE] && 'mint new tokens',
              ].filter(Boolean).join(', ') || 'admin control'}). Deployment is irreversible.
            </div>
          )}
          <FormControlLabel control={<Checkbox checked={ack} onChange={(e) => setAck(e.target.checked)} />}
            label="I understand this deploys an immutable contract and the configuration cannot be changed." />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!ack} onClick={doDeploy}>Deploy</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

// ---- Solidity preview (illustrative) ----
function buildPreview(s, bitmap, decimals) {
  const sup = s.supplyType === 'capped' ? 'Capped' : s.supplyType === 'unlimited' ? 'Unlimited' : 'Fixed';
  const acc = s.accessType === 'roles' ? 'Role Based' : s.accessType === 'ownable' ? 'Ownable2Step' : 'None';
  const feats = TOGGLE_FEATURES.filter(f => s.toggles[f.id]).map(f => f.name);
  return `// Deployed from the audited ForgeToken family
// featureBitmap = ${bitmap.toString()}
TokenConfig({
  name: "${s.name}",
  symbol: "${s.symbol.toUpperCase()}",
  decimals: ${decimals},
  initialSupply: ${cleanInt(s.initialSupply) || 0} * 10**${decimals},
  supplyType: ${sup},
  accessType: ${acc},
  transferType: ${s.transferType === 'pausable' ? 'Pausable' : 'Standard'},
  features: [${feats.join(', ') || '—'}]
});`;
}

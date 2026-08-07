/**
 * @file Security.jsx
 * @description Smart contract security reference. Five views behind a tab bar,
 *              each answering a different question and each backed by a
 *              different public source: the Ethernaut levels (vulnerability
 *              classes), solidity-by-example hack patterns (the attack as
 *              code), the Secureum pitfalls run (the pre-ship checklist),
 *              Slither's detectors (what a scanner flags), and the EEA
 *              EthTrust levels (what certification demands).
 *
 *              Pure content — no wallet, no contract calls — so it renders
 *              without MetaMask.
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { CATEGORIES, LEVELS } from './catalog';
import LevelCard from './LevelCard';
import HackCard from './HackCard';
import DetectorTable from './DetectorTable';
import PitfallList from './PitfallList';
import StandardsView from './StandardsView';
import {
  HACKS,
  PITFALLS,
  DETECTORS,
  REQUIREMENTS,
  LEVELS_INFO,
  PRACTICES,
} from './data/index.js';
import './security.css';

const ETHERNAUT_URL = 'https://ethernaut.openzeppelin.com/';
const HACKS_URL = 'https://solidity-by-example.org/hacks/';

const TABS = [
  { id: 'ethernaut', label: 'Ethernaut Levels', icon: 'fa-gamepad' },
  { id: 'hacks', label: 'Hack Patterns', icon: 'fa-bug' },
  { id: 'pitfalls', label: 'Pitfalls Checklist', icon: 'fa-check-square-o' },
  { id: 'detectors', label: 'Static Analysis', icon: 'fa-search' },
  { id: 'standards', label: 'Standards', icon: 'fa-certificate' },
];

const tabId = (id) => `security-tab-${id}`;
const panelId = (id) => `security-panel-${id}`;

// Every number here is counted off the dataset the active tab renders, so the
// strip can never claim something the panel below it contradicts.
const statsFor = (tab) => {
  switch (tab) {
    case 'hacks':
      return [
        { value: HACKS.length, label: 'Hack patterns' },
        { value: new Set(HACKS.map((h) => h.category)).size, label: 'Vulnerability classes' },
        { value: HACKS.length * 3, label: 'Code examples' },
      ];
    case 'pitfalls':
      return [
        { value: PITFALLS.length, label: 'Checklist items' },
        {
          value: PITFALLS.filter((p) => p.severity === 'high').length,
          label: 'Rated high severity',
        },
        { value: new Set(PITFALLS.flatMap((p) => p.tags)).size, label: 'Topic tags' },
      ];
    case 'detectors':
      return [
        { value: DETECTORS.length, label: 'Slither detectors' },
        { value: DETECTORS.filter((d) => d.severity === 'High').length, label: 'High severity' },
        { value: new Set(DETECTORS.map((d) => d.severity)).size, label: 'Severity tiers' },
      ];
    case 'standards':
      return [
        { value: REQUIREMENTS.length, label: 'EthTrust requirements' },
        { value: LEVELS_INFO.length, label: 'Certification levels' },
        { value: PRACTICES.length, label: 'Audit practices' },
      ];
    case 'ethernaut':
    default:
      return [
        { value: LEVELS.length, label: 'Levels covered' },
        { value: CATEGORIES.length, label: 'Vulnerability classes' },
        { value: LEVELS.length * 2, label: 'Code examples' },
      ];
  }
};

const Security = () => {
  const [activeTab, setActiveTab] = useState('ethernaut');
  // Tabs that have been opened at least once. A panel mounts on first visit and
  // then stays mounted (hidden), so the filters and open cards inside every tab
  // survive a tab switch the same way the Ethernaut filters below always have.
  const [visitedTabs, setVisitedTabs] = useState(() => new Set(['ethernaut']));
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const tabRefs = useRef([]);

  const selectTab = useCallback((id) => {
    setActiveTab(id);
    setVisitedTabs((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

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

  const stats = useMemo(() => statsFor(activeTab), [activeTab]);

  // Standard tabs pattern: one tab stop for the whole list, arrows move between
  // tabs and activate on move, Home/End jump to the ends. The origin index comes
  // from the tab that received the key, not from `activeTab`, so this stays
  // correct if activation is ever decoupled from focus.
  const handleTabKeyDown = useCallback(
    (event, current) => {
      let next = null;
      if (event.key === 'ArrowRight') next = (current + 1) % TABS.length;
      else if (event.key === 'ArrowLeft') next = (current - 1 + TABS.length) % TABS.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = TABS.length - 1;
      if (next === null) return;
      event.preventDefault();
      selectTab(TABS[next].id);
      tabRefs.current[next]?.focus();
    },
    [selectTab]
  );

  const renderEthernaut = () => (
    <>
      <p className="source-note">
        <i className="fa fa-book" aria-hidden="true" />
        <span>
          Level names, numbers and difficulty ratings from{' '}
          <a href={ETHERNAUT_URL} target="_blank" rel="noopener noreferrer">
            The Ethernaut by OpenZeppelin
            <i className="fa fa-external-link" aria-hidden="true" />
          </a>
          . Explanations and snippets are written for this page as minimal illustrations, not
          copies of the level contracts.
        </span>
      </p>

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
    </>
  );

  const renderHacks = () => (
    <section className="security-view">
      <div className="view-head">
        <h2>
          <i className="fa fa-bug" aria-hidden="true" /> Hack patterns
        </h2>
        <p className="view-lede">
          The same failure classes seen from the attacker&rsquo;s side. Each entry expands to three
          contracts: the victim, the exploit that drains it, and the hardened rewrite.
        </p>
        <p className="source-note">
          <i className="fa fa-book" aria-hidden="true" />
          <span>
            Pattern selection follows the hack write-ups on{' '}
            <a href={HACKS_URL} target="_blank" rel="noopener noreferrer">
              Solidity by Example
              <i className="fa fa-external-link" aria-hidden="true" />
            </a>
            . Prose is summarized in our own words and the three snippets on each entry are
            original minimal illustrations pinned to Solidity ^0.8 — teaching fragments, not
            deployable code.
          </span>
        </p>
      </div>
      <div className="level-grid">
        {HACKS.map((hack) => (
          <HackCard key={hack.slug} hack={hack} category={categoryById[hack.category]} />
        ))}
      </div>
    </section>
  );

  const renderPanel = (id) => {
    switch (id) {
      case 'hacks':
        return renderHacks();
      case 'pitfalls':
        return <PitfallList />;
      case 'detectors':
        return <DetectorTable />;
      case 'standards':
        return <StandardsView />;
      case 'ethernaut':
      default:
        return renderEthernaut();
    }
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
        {stats.map((stat) => (
          <div key={stat.label} className="security-stat">
            <span className="security-stat-value">{stat.value}</span>
            <span className="security-stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Scroll container, not wrap: five tabs stay on one line at 375px and the
          strip scrolls sideways on its own instead of widening the page. */}
      <div className="security-tabs-wrap">
        <div className="security-tabs" role="tablist" aria-label="Security reference views">
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={tabId(tab.id)}
              aria-selected={activeTab === tab.id}
              aria-controls={panelId(tab.id)}
              tabIndex={activeTab === tab.id ? 0 : -1}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              className={`security-tab ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              <i className={`fa ${tab.icon}`} aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* All five panels exist so every aria-controls resolves, but a panel
          stays empty until its tab is first opened — nothing builds 100 detector
          rows for a tab nobody visited. Once built it stays mounted behind
          `hidden`, which is what keeps each view's filters where the reader left
          them. */}
      {TABS.map((tab) => (
        <div
          key={tab.id}
          id={panelId(tab.id)}
          className="security-panel"
          role="tabpanel"
          aria-labelledby={tabId(tab.id)}
          tabIndex={0}
          hidden={activeTab !== tab.id}
        >
          {visitedTabs.has(tab.id) ? renderPanel(tab.id) : null}
        </div>
      ))}
    </div>
  );
};

export default Security;

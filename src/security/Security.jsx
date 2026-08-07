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

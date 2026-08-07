/**
 * @file PitfallList.jsx
 * @description Pitfalls Checklist view — the Secureum "Security Pitfalls &
 *              Best Practices 101" run, rendered dense rather than as cards
 *              because it is meant to be read top to bottom before a ship.
 *
 * The visible number on each row is the source's own item number, not a render
 * index, so it stays correct under filtering and a reader can look the item up
 * in the original article. Severity and tags are authored judgements — the
 * source assigns neither — which the attribution line states outright.
 */

import React, { useState, useMemo, useEffect, useId } from 'react';
import { PITFALLS } from './data/index.js';

const SOURCE_URL = 'https://secureum.substack.com/p/security-pitfalls-and-best-practices-101';

// Worst first, filtered against the data so no dead option appears.
const SEVERITY_ORDER = ['high', 'medium', 'low', 'info'];
const SEVERITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low', info: 'Info' };

const PitfallList = () => {
  const [severity, setSeverity] = useState('all');
  const [query, setQuery] = useState('');
  const severityId = useId();
  const queryId = useId();

  const severities = useMemo(
    () => SEVERITY_ORDER.filter((s) => PITFALLS.some((p) => p.severity === s)),
    []
  );

  const counts = useMemo(() => {
    const tally = {};
    PITFALLS.forEach((p) => {
      tally[p.severity] = (tally[p.severity] || 0) + 1;
    });
    return tally;
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PITFALLS.filter((p) => {
      if (severity !== 'all' && p.severity !== severity) return false;
      if (!q) return true;
      return `${p.title} ${p.text} ${p.tags.join(' ')}`.toLowerCase().includes(q);
    });
  }, [severity, query]);

  const clearFilters = () => {
    setSeverity('all');
    setQuery('');
  };

  // The visible count updates on every keystroke; the announcement waits for a
  // pause. Without this a screen reader reads a fresh count per typed character.
  const [announced, setAnnounced] = useState(rows.length);
  useEffect(() => {
    const timer = setTimeout(() => setAnnounced(rows.length), 500);
    return () => clearTimeout(timer);
  }, [rows.length]);

  return (
    <section className="security-view">
      <div className="view-head">
        <h2>
          <i className="fa fa-check-square-o" aria-hidden="true" /> Pre-ship pitfalls checklist
        </h2>
        <p className="view-lede">
          The pass to make over a contract before it leaves your hands. Numbering follows the
          source list, so item 47 here is item 47 there. Search matches titles, text and tags.
        </p>
        <p className="source-note">
          <i className="fa fa-book" aria-hidden="true" />
          <span>
            Item numbering and subject matter from{' '}
            <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
              Secureum&rsquo;s &ldquo;Security Pitfalls &amp; Best Practices 101&rdquo;
              <i className="fa fa-external-link" aria-hidden="true" />
            </a>
            . Each entry is summarized in our own words; the severity ratings and tags are our
            additions, not the source&rsquo;s.
          </span>
        </p>
      </div>

      <div className="view-filters">
        <div className="view-filter">
          <label className="view-filter-label" htmlFor={severityId}>
            Severity
          </label>
          <select
            id={severityId}
            className="form-select"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option value="all">All severities ({PITFALLS.length})</option>
            {severities.map((s) => (
              <option key={s} value={s}>
                {SEVERITY_LABEL[s]} ({counts[s]})
              </option>
            ))}
          </select>
        </div>

        <div className="view-filter view-filter--grow">
          <label className="view-filter-label" htmlFor={queryId}>
            Search checklist
          </label>
          <input
            id={queryId}
            type="search"
            className="form-control"
            placeholder="Topic, tag, or phrase…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <p className="view-result-count">
          {rows.length} of {PITFALLS.length} items
        </p>
        <p className="visually-hidden" role="status">
          {announced} of {PITFALLS.length} checklist items match.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="security-empty">
          <i className="fa fa-search" aria-hidden="true" />
          <p>No checklist item matches the current filters.</p>
          <button type="button" className="btn btn-primary" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        /* role="list" is redundant on paper, but `list-style: none` strips list
           semantics in Safari/VoiceOver; restating the role puts them back. */
        <ol className="pitfall-list" role="list">
          {rows.map((p) => (
            <li key={p.id} className="pitfall-item">
              {/* The marker is suppressed and the number printed by hand: an
                  <ol> would renumber 1..n under a filter, which would break the
                  one thing this list promises — that the number is the source's. */}
              <span className="pitfall-num" aria-hidden="true">
                {p.id}
              </span>
              <div className="pitfall-body">
                <h3 className="pitfall-title">
                  <span className="visually-hidden">Item {p.id}. </span>
                  {p.title}
                </h3>
                <p className="pitfall-text">{p.text}</p>
                <div className="pitfall-tags">
                  <span className={`sev-badge sev-badge--${p.severity}`}>
                    {SEVERITY_LABEL[p.severity]} severity
                  </span>
                  {p.tags.map((tag) => (
                    <span key={tag} className="pitfall-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

/* Takes no props, and its panel stays mounted once opened, so memo keeps a
   keystroke in another tab's search box from re-rendering 101 items. */
export default React.memo(PitfallList);

/**
 * @file DetectorTable.jsx
 * @description Static Analysis view — the Slither detector set as a sortable,
 *              filterable table. A table, not cards: every row carries the same
 *              five fields and readers scan this list looking for one check id,
 *              so column alignment is the whole point.
 *
 * `check`, `severity` and `confidence` are the source's own identifiers and are
 * shown verbatim; the prose columns are paraphrases written for this page.
 */

import React, { useState, useMemo, useEffect, useId } from 'react';
import { DETECTORS } from './data/index.js';

const SOURCE_URL = 'https://github.com/crytic/slither/wiki/Detector-Documentation';

// Worst first. Filtered against the data so a severity that is not actually
// present never appears as a dead option in the select.
const SEVERITY_ORDER = ['High', 'Medium', 'Low', 'Informational', 'Optimization'];
const CONFIDENCE_ORDER = ['High', 'Medium', 'Low'];

const rankIn = (order) => (value) => {
  const i = order.indexOf(value);
  // Anything the source adds later sorts after everything we know about rather
  // than colliding with the first bucket.
  return i === -1 ? order.length : i;
};
const severityRank = rankIn(SEVERITY_ORDER);
const confidenceRank = rankIn(CONFIDENCE_ORDER);

// Severity and confidence are ranked words, not words: alphabetical order would
// put High between Low and Medium, which is exactly backwards for triage.
// Exported so the ranking can be checked directly against the dataset — the
// view itself has no other way to prove High sorts above Medium.
export const COLUMNS = [
  { key: 'check', label: 'Check id', compare: (a, b) => a.check.localeCompare(b.check) },
  { key: 'title', label: 'Detector', compare: (a, b) => a.title.localeCompare(b.title) },
  {
    key: 'severity',
    label: 'Severity',
    compare: (a, b) => severityRank(a.severity) - severityRank(b.severity),
  },
  {
    key: 'confidence',
    label: 'Confidence',
    compare: (a, b) => confidenceRank(a.confidence) - confidenceRank(b.confidence),
  },
];

const DetectorTable = () => {
  const [severity, setSeverity] = useState('all');
  const [query, setQuery] = useState('');
  // `key: null` is the dataset's own worst-severity-first order, which is the
  // useful default; clicking a header opts into an explicit sort.
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const severityId = useId();
  const queryId = useId();

  const severities = useMemo(
    () => SEVERITY_ORDER.filter((s) => DETECTORS.some((d) => d.severity === s)),
    []
  );

  const counts = useMemo(() => {
    const tally = {};
    DETECTORS.forEach((d) => {
      tally[d.severity] = (tally[d.severity] || 0) + 1;
    });
    return tally;
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = DETECTORS.filter((d) => {
      if (severity !== 'all' && d.severity !== severity) return false;
      if (!q) return true;
      return `${d.check} ${d.title} ${d.description} ${d.recommendation}`.toLowerCase().includes(q);
    });
    if (!sort.key) return matched;
    const column = COLUMNS.find((c) => c.key === sort.key);
    if (!column) return matched;
    // Copy first: DETECTORS is module state shared with the stats strip, and
    // sort() mutates in place. Ties fall back to the check id so equal severities
    // keep one stable, predictable order instead of drifting between renders.
    return [...matched].sort((a, b) => {
      const primary = column.compare(a, b);
      const ordered = primary !== 0 ? primary : a.check.localeCompare(b.check);
      return sort.dir === 'asc' ? ordered : -ordered;
    });
  }, [severity, query, sort]);

  // First click on a column sorts ascending, a second flips it, a third returns
  // to the source ordering — so there is always a way back without a reload.
  const toggleSort = (key) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return { key: null, dir: 'asc' };
    });
  };

  const ariaSortFor = (key) => {
    if (sort.key !== key) return 'none';
    return sort.dir === 'asc' ? 'ascending' : 'descending';
  };

  // The arrow is decorative; the state it shows is carried for assistive tech by
  // aria-sort on the header cell and repeated as text for anything that does not
  // support it.
  const sortIconFor = (key) => {
    if (sort.key !== key) return 'fa-sort';
    return sort.dir === 'asc' ? 'fa-sort-asc' : 'fa-sort-desc';
  };

  const sortStateLabel = (key) => {
    if (sort.key !== key) return ', not sorted';
    return sort.dir === 'asc' ? ', sorted ascending' : ', sorted descending';
  };

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
          <i className="fa fa-search" aria-hidden="true" /> Static analysis detectors
        </h2>
        <p className="view-lede">
          What an automated scanner flags before a human ever reads the code. Each row is one
          Slither detector: the id you would pass to <code>--detect</code>, the severity and
          confidence it reports, what it looks for, and what to do when it fires. Filter by
          severity or text, and sort on any of the first four columns.
        </p>
        <p className="source-note">
          <i className="fa fa-book" aria-hidden="true" />
          <span>
            Detector list, check ids, severities and confidences from the{' '}
            <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
              crytic/slither detector documentation
              <i className="fa fa-external-link" aria-hidden="true" />
            </a>
            . Descriptions and fixes are summarized here in our own words — the wiki holds the
            authoritative text.
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
            <option value="all">All severities ({DETECTORS.length})</option>
            {severities.map((s) => (
              <option key={s} value={s}>
                {s} ({counts[s]})
              </option>
            ))}
          </select>
        </div>

        <div className="view-filter view-filter--grow">
          <label className="view-filter-label" htmlFor={queryId}>
            Search detectors
          </label>
          <input
            id={queryId}
            type="search"
            className="form-control"
            placeholder="Check id, title, or symptom…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <p className="view-result-count">
          {rows.length} of {DETECTORS.length} detectors
        </p>
        <p className="visually-hidden" role="status">
          {announced} of {DETECTORS.length} detectors match.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="security-empty">
          <i className="fa fa-search" aria-hidden="true" />
          <p>No detector matches the current filters.</p>
          <button type="button" className="btn btn-primary" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        /* The table is wider than a phone; it scrolls inside this container so
           the page body never scrolls sideways. tabindex keeps that scroll
           reachable from the keyboard (WCAG 2.1.1). */
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Slither detectors">
          <table className="detector-table">
            <caption>
              Slither detectors, {sort.key ? 'sorted by the column you chose' : 'ordered worst severity first'}.
              Showing {rows.length} of {DETECTORS.length}. The first four column headings are
              buttons that sort the table.
            </caption>
            <thead>
              <tr>
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="col-sortable"
                    aria-sort={ariaSortFor(column.key)}
                  >
                    <button
                      type="button"
                      className={`col-sort ${sort.key === column.key ? 'is-sorted' : ''}`}
                      onClick={() => toggleSort(column.key)}
                    >
                      <span>{column.label}</span>
                      <span className="visually-hidden">{sortStateLabel(column.key)}</span>
                      <i className={`fa ${sortIconFor(column.key)}`} aria-hidden="true" />
                    </button>
                  </th>
                ))}
                <th scope="col">What it flags, and the fix</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.check}>
                  <th scope="row" className="detector-check">
                    {d.check}
                  </th>
                  <td>{d.title}</td>
                  <td>
                    {/* Word first, color second — the severity is never carried
                        by the border color alone (WCAG 1.4.1). */}
                    <span className={`sev-badge sev-badge--${d.severity.toLowerCase()}`}>
                      {d.severity}
                    </span>
                  </td>
                  <td>
                    <span className="detector-confidence">{d.confidence}</span>
                  </td>
                  <td>
                    <p className="detector-desc">{d.description}</p>
                    <p className="detector-fix">
                      <span className="detector-fix-label">Fix</span>
                      {d.recommendation}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

/* Takes no props, and its panel stays mounted once opened, so memo keeps a
   keystroke in another tab's search box from re-rendering 100 rows. */
export default React.memo(DetectorTable);

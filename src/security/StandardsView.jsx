/**
 * @file StandardsView.jsx
 * @description Standards view — the EEA EthTrust Security Levels requirements
 *              grouped by certification level, followed by an Audit Practice
 *              subsection drawn from a live protocol's public audit registry.
 *
 * Requirement ids are the spec's own anchor ids and are printed verbatim so a
 * reader can jump to the normative text. Each `statement` restates that
 * requirement's normative sentence and stays close to the spec's wording on
 * purpose — paraphrasing a MUST changes what it demands — while `rationale` is
 * our own. Neither is a substitute for the spec; the source note in the view
 * says so to the reader.
 */

import React, { useMemo } from 'react';
import { LEVELS_INFO, REQUIREMENTS, PRACTICES, AUDIT_SOURCE } from './data/index.js';

const SPEC_URL = 'https://entethalliance.org/specs/ethtrust-sl/';

const StandardsView = () => {
  const groups = useMemo(
    () =>
      LEVELS_INFO.map((info) => ({
        info,
        requirements: REQUIREMENTS.filter((r) => r.level === info.level),
      })).filter((g) => g.requirements.length > 0),
    []
  );

  return (
    <section className="security-view">
      <div className="view-head">
        <h2>
          <i className="fa fa-certificate" aria-hidden="true" /> Certification standards
        </h2>
        <p className="view-lede">
          Everything above tells you what goes wrong. This tells you what has to hold before anyone
          will sign off. The EEA EthTrust Security Levels define three stacked tiers — each level
          assumes the one below it — and {REQUIREMENTS.length} requirements spread across them.
        </p>
        <p className="source-note">
          <i className="fa fa-book" aria-hidden="true" />
          <span>
            Requirement ids and level structure from the{' '}
            <a href={SPEC_URL} target="_blank" rel="noopener noreferrer">
              EEA EthTrust Security Levels Specification, Version 3
              <i className="fa fa-external-link" aria-hidden="true" />
            </a>
            , snapshot 2026-08-07. Each statement restates that requirement&rsquo;s normative
            sentence and deliberately stays close to the spec&rsquo;s wording, since rewording a
            MUST shifts what it demands; the rationales are our own. Follow any id for the
            authoritative text. The spec&rsquo;s {REQUIREMENTS.length} normative requirements are
            listed — its non-normative &ldquo;Recommended Good Practices&rdquo; are not, since they
            are advisory rather than required. A superseding version is expected during 2026.
          </span>
        </p>
      </div>

      <div className="standards-block">
        <h3 className="standards-subhead">
          <i className="fa fa-sitemap" aria-hidden="true" /> What the levels mean
        </h3>
        <div className="level-explainer">
          {LEVELS_INFO.map((info) => (
            <div key={info.level} className="level-info-card">
              <h4>
                <span className="level-badge">[{info.level}]</span>
                {info.name}
              </h4>
              <p>{info.blurb}</p>
            </div>
          ))}
        </div>
      </div>

      {groups.map(({ info, requirements }) => (
        <div key={info.level} className="req-group">
          <div className="req-group-head">
            <h3 className="standards-subhead">
              <span className="level-badge">[{info.level}]</span> {info.name}
            </h3>
            <span className="req-group-count">{requirements.length} requirements</span>
          </div>
          {/* role="list" is redundant on paper, but `list-style: none` strips
              list semantics in Safari/VoiceOver; restating it puts them back. */}
          <ul className="req-list" role="list">
            {requirements.map((r) => (
              <li key={r.id} className="req-item">
                <div className="req-head">
                  <a
                    className="req-id"
                    href={r.anchor}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open requirement ${r.id} in the EthTrust specification`}
                  >
                    {r.id} <i className="fa fa-external-link" aria-hidden="true" />
                  </a>
                  <h4>{r.title}</h4>
                </div>
                <p className="req-statement">{r.statement}</p>
                <p className="req-rationale">
                  <span className="req-rationale-label">Why</span>
                  {r.rationale}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="req-group">
        <div className="req-group-head">
          <h3 className="standards-subhead">
            <i className="fa fa-file-text-o" aria-hidden="true" /> Audit practice
          </h3>
          <span className="req-group-count">{PRACTICES.length} practices</span>
        </div>
        <p className="view-lede">
          A standard says what must be true. This is what publishing the evidence looks like in
          practice, read off one protocol&rsquo;s public audit registry.
        </p>
        <p className="source-note">
          <i className="fa fa-github" aria-hidden="true" />
          <span>
            Observed in the{' '}
            <a href={AUDIT_SOURCE.url} target="_blank" rel="noopener noreferrer">
              {AUDIT_SOURCE.label}
              <i className="fa fa-external-link" aria-hidden="true" />
            </a>
            , snapshot 2026-08-07. Every note below is our own summary; nothing is reproduced from
            the registry, and Polymarket neither reviewed nor endorsed this page.
          </span>
        </p>
        <div className="practice-grid">
          {PRACTICES.map((practice) => (
            <div key={practice.title} className="practice-card">
              <h4>{practice.title}</h4>
              <p className="practice-detail">{practice.detail}</p>
              <p className="practice-evidence">
                <span className="practice-evidence-label">In the registry</span>
                {practice.evidence}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* Takes no props, and its panel stays mounted once opened, so memo keeps a
   keystroke in another tab's search box from re-rendering 70 requirements. */
export default React.memo(StandardsView);

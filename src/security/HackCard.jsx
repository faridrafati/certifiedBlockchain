/**
 * @file HackCard.jsx
 * @description One entry from the Hack Patterns view. Collapsed it reads like a
 *              LevelCard — name, class, one-line summary — but expanded it
 *              carries three Solidity blocks instead of two, because these
 *              write-ups only make sense once you can see the attacking
 *              contract next to the victim.
 *
 * The attacker block reuses SolidityCode's `vulnerable` variant (the danger
 * frame is the right signal for exploit code) with an explicit label, since the
 * component's default label for that variant reads "Vulnerable pattern".
 */

import React, { useState, useId } from 'react';
import PropTypes from 'prop-types';
import SolidityCode from './SolidityCode';

const HackCard = ({ hack, category }) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <article className={`level-card hack-card ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="level-card-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="level-meta">
          <i className={`fa ${category?.icon || 'fa-bug'} hack-icon`} aria-hidden="true" />
          <span className="level-name">{hack.name}</span>
        </span>
        <span className="level-summary">{hack.summary}</span>
        <span className="hack-class">{category?.name || hack.category}</span>
        <i className={`fa fa-chevron-${open ? 'up' : 'down'} level-chevron`} aria-hidden="true" />
      </button>

      <div id={panelId} className="level-body" hidden={!open}>
        <div className="level-detail-block">
          <h3>
            <i className="fa fa-crosshairs" aria-hidden="true" /> How the attack works
          </h3>
          <p>{hack.mechanism}</p>
        </div>
        <div className="level-detail-block">
          <h3>
            <i className="fa fa-shield" aria-hidden="true" /> How to prevent it
          </h3>
          <p>{hack.prevention}</p>
        </div>
        {/* Victim and attacker sit side by side; the hardened version spans the
            full width underneath so the fix reads as the conclusion. */}
        <div className="code-triple">
          <SolidityCode code={hack.vulnerable} variant="vulnerable" label="Vulnerable contract" />
          <SolidityCode code={hack.attacker} variant="vulnerable" label="Attacker contract" />
          <SolidityCode code={hack.fixed} variant="fixed" label="Hardened contract" />
        </div>
        <div className="level-refs">
          <span className="level-category-tag">
            <i className={`fa ${category?.icon || 'fa-tag'}`} aria-hidden="true" />
            {category?.name || hack.category}
          </span>
          {hack.refs.map((ref) => (
            <a key={ref.url} href={ref.url} target="_blank" rel="noopener noreferrer">
              {ref.label} <i className="fa fa-external-link" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </article>
  );
};

HackCard.propTypes = {
  hack: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
    mechanism: PropTypes.string.isRequired,
    prevention: PropTypes.string.isRequired,
    vulnerable: PropTypes.string.isRequired,
    attacker: PropTypes.string.isRequired,
    fixed: PropTypes.string.isRequired,
    refs: PropTypes.arrayOf(
      PropTypes.shape({ label: PropTypes.string.isRequired, url: PropTypes.string.isRequired })
    ).isRequired,
  }).isRequired,
  category: PropTypes.shape({ name: PropTypes.string, icon: PropTypes.string }),
};

export default HackCard;

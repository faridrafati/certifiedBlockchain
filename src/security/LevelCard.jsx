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

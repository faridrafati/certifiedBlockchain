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
        {/* The visible label changes with state, so the accessible name has to
            carry that word too — otherwise the name stops containing the visible
            label once it reads "Copied" (WCAG 2.5.3, Label in Name). */}
        <button
          type="button"
          className="sol-copy-btn"
          onClick={handleCopy}
          aria-label={`${copyLabel} ${(label || defaultLabel).toLowerCase()} code to clipboard`}
        >
          <i className="fa fa-clipboard" aria-hidden="true" />
          {copyLabel}
        </button>
        {/* A changed accessible name is not reliably announced; a live status
            node is. Empty while idle so nothing is spoken on first render. */}
        <span className="visually-hidden" role="status">
          {copyState === 'copied'
            ? 'Copied to clipboard'
            : copyState === 'failed'
              ? 'Copy failed'
              : ''}
        </span>
      </div>
      {/* tabIndex keeps the horizontally scrollable block reachable by keyboard
          (WCAG 2.1.1); without it, only a mouse can reach overflowing lines. */}
      <pre className="sol-pre" tabIndex={0}>
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

/**
 * @file like.jsx
 * @description Star/favorite toggle icon component
 * @author CertifiedBlockchain
 *
 * Clickable star icon that toggles between filled (liked)
 * and outline (not liked) states. Uses Font Awesome icons.
 *
 * Features:
 * - Font Awesome star icons (solid/outline)
 * - Gold color (#d4af47)
 * - Pointer cursor for interactivity
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.liked - Current liked state
 * @param {Function} props.onClick - Click handler callback
 *
 * @example
 * <Like liked={isLiked} onClick={() => setIsLiked(!isLiked)} />
 */

import React from "react";

const Like = props => {
  let classes = "fa fa-lg fa-star";
  if (!props.liked) classes += "-o";

  return (
    <i
      onClick={props.onClick}
      style={{ cursor: "pointer" , color: "#d4af47"}}
      className={classes}
      aria-hidden="true"
    />
  );
};

export default Like;

/**
 * @file tokenizeSolidity.js
 * @description Minimal Solidity tokenizer for read-only syntax highlighting.
 *
 * Deliberately not a parser: it classifies enough for short teaching snippets
 * (comments, strings, keywords, value types, numbers, call sites) and leaves
 * everything else as plain text. Concatenating the token values always
 * reproduces the input exactly, so nothing can be silently dropped.
 */

const KEYWORDS = new Set([
  'contract', 'interface', 'library', 'function', 'modifier', 'constructor',
  'event', 'emit', 'struct', 'enum', 'mapping', 'returns', 'return',
  'public', 'private', 'internal', 'external', 'pure', 'view', 'payable',
  'memory', 'storage', 'calldata', 'immutable', 'constant', 'override',
  'virtual', 'if', 'else', 'for', 'while', 'do', 'break', 'continue',
  'require', 'revert', 'assert', 'new', 'delete', 'using', 'is', 'try',
  'catch', 'import', 'pragma', 'solidity', 'assembly', 'unchecked',
  'indexed', 'anonymous', 'receive', 'fallback', 'abstract', 'type',
]);

const TYPES = new Set([
  'address', 'bool', 'string', 'bytes', 'byte', 'uint', 'int', 'fixed', 'ufixed',
  // sized variants are matched by the regex below, these cover the bare forms
]);

const SIZED_TYPE = /^(u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?|bytes([1-9]|[12][0-9]|3[0-2])?)$/;

/**
 * Ordered alternation. Order matters: comments and strings come first so their
 * contents can never be re-classified, and identifiers come before punctuation.
 */
const PATTERN = new RegExp(
  [
    '\\/\\*[\\s\\S]*?(?:\\*\\/|$)', // block comment (unterminated runs to EOF)
    '\\/\\/[^\\n]*', // line comment
    '"(?:\\\\.|[^"\\\\\\n])*(?:"|$)', // double-quoted string
    "'(?:\\\\.|[^'\\\\\\n])*(?:'|$)", // single-quoted string
    '\\b\\d[\\d_]*(?:\\.\\d+)?(?:e[+-]?\\d+)?\\b', // number
    '\\b0x[0-9a-fA-F]+\\b', // hex literal
    '[A-Za-z_$][A-Za-z0-9_$]*', // identifier
  ].join('|'),
  'g'
);

export function tokenizeSolidity(code) {
  const source = typeof code === 'string' ? code : '';
  const tokens = [];
  let lastIndex = 0;

  const pushPlain = (value) => {
    if (!value) return;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.type === 'plain') prev.value += value;
    else tokens.push({ type: 'plain', value });
  };

  PATTERN.lastIndex = 0;
  let match;
  while ((match = PATTERN.exec(source)) !== null) {
    // Zero-length matches would loop forever; the patterns above can't produce
    // one, but guard anyway since a future edit might.
    if (match[0] === '') { PATTERN.lastIndex += 1; continue; }

    pushPlain(source.slice(lastIndex, match.index));
    const value = match[0];
    const first = value[0];

    let type;
    if (value.startsWith('//') || value.startsWith('/*')) type = 'comment';
    else if (first === '"' || first === "'") type = 'string';
    else if (first >= '0' && first <= '9') type = 'number';
    else if (KEYWORDS.has(value)) type = 'keyword';
    else if (TYPES.has(value) || SIZED_TYPE.test(value)) type = 'type';
    else if (source[match.index + value.length] === '(') type = 'function';
    else type = 'plain';

    if (type === 'plain') pushPlain(value);
    else tokens.push({ type, value });

    lastIndex = match.index + value.length;
  }

  pushPlain(source.slice(lastIndex));
  return tokens;
}

export default tokenizeSolidity;

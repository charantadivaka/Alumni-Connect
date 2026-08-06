'use strict';

/**
 * Escapes all special regex metacharacters in a string so it can be safely
 * embedded in a MongoDB `$regex` query without risk of ReDoS or unintended
 * pattern matching.
 *
 * Characters escaped: . * + ? ^ $ { } ( ) | [ ] \
 *
 * @param {string} str - Raw user input to be used as a literal search string
 * @returns {string}   - Safe, escaped string suitable for `new RegExp(result)`
 *
 * @example
 * // User types "C++ Developer"
 * const safe = escapeRegex("C++ Developer");
 * // safe = "C\\+\\+ Developer"
 * User.find({ title: { $regex: safe, $options: 'i' } });
 */
const escapeRegex = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = { escapeRegex };

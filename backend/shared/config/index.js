'use strict';

/**
 * Shared Config Index
 * ───────────────────
 * Single import point for all application configuration.
 *
 * Usage:
 *   const { server, database, jwt, email } = require('../shared/config');
 *   // or
 *   const config = require('../shared/config');
 */

module.exports = require('./app');

'use strict';

/**
 * Standardized API Response Helpers
 * ───────────────────────────────────
 * All controllers use these helpers so every API response
 * has exactly the same shape regardless of where it originates.
 *
 * Success shape:
 * {
 *   success:   true,
 *   message:   "...",        ← also kept at top-level for backward compat
 *   data:      {},
 *   timestamp: "...",
 *   requestId: "..."
 * }
 *
 * Error shape:
 * {
 *   success: false,
 *   message: "...",          ← top-level for backward compat (old frontend reads this)
 *   error: {
 *     code:    "...",
 *     message: "...",
 *     details: []
 *   },
 *   timestamp: "...",
 *   requestId: "..."
 * }
 */

/**
 * Send a successful JSON response.
 * @param {import('express').Response} res
 * @param {*}      data       - the payload (object, array, or null)
 * @param {string} message    - human-readable success message
 * @param {number} statusCode - HTTP status code (default 200)
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success:   true,
        message,                       // top-level for legacy frontend compatibility
        data,
        timestamp: new Date().toISOString(),
        requestId: res.req?.requestId || null,
    });
};

/**
 * Send an error JSON response.
 * @param {import('express').Response} res
 * @param {string}   code       - machine-readable error code (e.g. 'VALIDATION_ERROR')
 * @param {string}   message    - human-readable error message
 * @param {number}   statusCode - HTTP status code (default 500)
 * @param {Array}    details    - optional array of field-level error detail objects
 */
const sendError = (res, code, message, statusCode = 500, details = []) => {
    return res.status(statusCode).json({
        success: false,
        message,                       // top-level for legacy frontend compatibility
        error: {
            code,
            message,
            details,
        },
        timestamp: new Date().toISOString(),
        requestId: res.req?.requestId || null,
    });
};

module.exports = { sendSuccess, sendError };

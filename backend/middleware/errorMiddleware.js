'use strict';

const { server } = require('../shared/config');

// Logger is optional — falls back gracefully if Winston is not installed
let logger;
try { logger = require('../config/logger'); } catch (_) { logger = console; }

/**
 * Centralized Error Handler
 * ─────────────────────────
 * Must be the LAST middleware registered in server.js.
 * Catches all errors forwarded via next(err).
 *
 * Converts known error types into appropriate HTTP responses
 * so controllers never need to handle infrastructure errors.
 */
const errorHandler = (err, req, res, next) => {
    // Determine status code — prefer err.statusCode, then res.statusCode if already set
    let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
    let code    = err.code    || 'INTERNAL_ERROR';
    let message = err.message || 'An unexpected error occurred';
    let details = [];

    // ── Mongoose Validation Error ────────────────────────────────────────────────
    if (err.name === 'ValidationError') {
        statusCode = 400;
        code       = 'VALIDATION_ERROR';
        message    = 'Validation failed';
        details    = Object.values(err.errors).map(e => ({
            field:   e.path,
            message: e.message,
        }));
    }

    // ── Mongoose Cast Error (bad ObjectId format) ────────────────────────────────
    else if (err.name === 'CastError') {
        statusCode = 400;
        code       = 'INVALID_ID';
        message    = `Invalid ${err.path}: ${err.value}`;
    }

    // ── Mongoose Duplicate Key ────────────────────────────────────────────────────
    else if (err.code === 11000) {
        statusCode = 400;
        code       = 'DUPLICATE_KEY';
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        message    = `${field} is already taken`;
    }

    // ── JWT Errors ────────────────────────────────────────────────────────────────
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        code       = 'INVALID_TOKEN';
        message    = 'Invalid or malformed token';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        code       = 'TOKEN_EXPIRED';
        message    = 'Token has expired. Please log in again.';
    }

    // ── Log server-side errors ────────────────────────────────────────────────────
    if (statusCode >= 500) {
        logger.error(`[${req.requestId || 'no-id'}] ${err.stack || err.message}`, {
            method: req.method,
            url:    req.originalUrl,
            status: statusCode,
        });
    }

    return res.status(statusCode).json({
        success: false,
        message,                              // top-level for backward compat
        error: {
            code,
            message,
            details,
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId || null,
        // Only expose stack trace in development
        ...(server.isDevelopment && statusCode >= 500 && { stack: err.stack }),
    });
};

module.exports = { errorHandler };


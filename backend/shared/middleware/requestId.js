'use strict';

/**
 * Request ID Middleware
 * ─────────────────────
 * Attaches a unique request ID to every incoming request.
 * The ID is included in all API responses and log entries,
 * making it easy to trace a request end-to-end.
 *
 * The ID is read from the `X-Request-ID` header if the client
 * provides one (useful for tracing across services), otherwise
 * a random one is generated.
 */

const { randomUUID } = require('crypto');

const requestId = (req, res, next) => {
    // Honour client-provided ID (allows distributed tracing) or generate one
    req.requestId = req.headers['x-request-id'] || randomUUID();

    // Echo it back in the response so clients can correlate
    res.setHeader('X-Request-ID', req.requestId);

    next();
};

module.exports = requestId;

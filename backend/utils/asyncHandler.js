/**
 * Utility: asyncHandler
 * Wraps async route handlers so any thrown error is forwarded to
 * Express's global error handler rather than causing an unhandled rejection.
 *
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;

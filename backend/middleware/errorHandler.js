/**
 * Middleware: errorHandler
 * Global error handler — must be registered LAST in Express.
 * Returns a consistent JSON error shape across all failures.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;

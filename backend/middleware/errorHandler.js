/**
 * Middleware: errorHandler
 * Global error handler — must be registered LAST in Express.
 * Returns a consistent JSON error shape across all failures.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Firestore/GCP Quota Exceeded (gRPC code 8)
  if (err.message && (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('Quota exceeded'))) {
    statusCode = 429; // Too Many Requests
    message = 'Service quota exceeded. This usually means the free tier limit for Firestore has been reached. Please check the Firebase Console or try again tomorrow.';
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;

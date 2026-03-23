const router = require('express').Router();
const { generateQR, verifyTicket } = require('../controllers/ticketController');
const verifyAuth = require('../middleware/auth');

// Generate QR — auth required (only ticket owner)
router.get('/:bookingId/qr', verifyAuth, generateQR);

// Verify ticket — can be hit by scanner (no user auth required; scanner uses its own auth in production)
router.post('/verify', verifyTicket);

module.exports = router;

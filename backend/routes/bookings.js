const router = require('express').Router();
const {
  holdSeats,
  releaseSeats,
  confirmBooking,
  getMyBookings,
  cancelBooking,
  getBookingById,
} = require('../controllers/bookingController');
const verifyAuth = require('../middleware/auth');

// Protected routes
router.post('/hold',              verifyAuth, holdSeats);      // POST /api/bookings/hold
router.post('/release',           verifyAuth, releaseSeats);   // POST /api/bookings/release
router.post('/confirm',           verifyAuth, confirmBooking); // POST /api/bookings/confirm
router.get('/my',                 verifyAuth, getMyBookings);  // GET  /api/bookings/my
router.post('/:bookingId/cancel', verifyAuth, cancelBooking);  // POST /api/bookings/:id/cancel

// Public route for ticket verification (QR scan)
// Placed at the bottom to avoid capturing other specific routes like /my or /confirm
router.get('/:bookingId', getBookingById);

module.exports = router;

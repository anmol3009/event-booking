const { db } = require('../config/firebase');
const asyncHandler = require('../utils/asyncHandler');
const QRCode = require('qrcode');

/**
 * GET /api/tickets/:bookingId/qr
 * Generates a base64 PNG QR code for a confirmed booking.
 * The QR payload contains: bookingId, eventId, userId — enough for scanner verification.
 */
const generateQR = asyncHandler(async (req, res) => {
  const { uid } = req.user;
  const { bookingId } = req.params;

  const bookingSnap = await db.collection('bookings').doc(bookingId).get();
  if (!bookingSnap.exists) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const booking = bookingSnap.data();

  // Only the ticket owner can generate their QR
  if (booking.userId !== uid) {
    return res.status(403).json({ success: false, message: 'Forbidden: not your booking' });
  }

  if (booking.status === 'cancelled') {
    return res.status(400).json({ success: false, message: 'Cannot generate QR for a cancelled booking' });
  }

  // Payload embedded in the QR code
  const payload = JSON.stringify({
    bookingId: booking.bookingId,
    eventId:   booking.eventId,
    userId:    booking.userId,
    // seats:     booking.seats,
  });

  // Generate QR as base64 PNG data URL
  const qrDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
    color: { dark: '#1a1a2e', light: '#ffffff' },
  });

  res.status(200).json({
    success: true,
    bookingId,
    qrCode: qrDataUrl, // Base64 PNG — frontend renders as <img src={qrCode} />
  });
});

/**
 * POST /api/tickets/verify
 * Scans and verifies a ticket using a static QR.
 */
const verifyTicket = asyncHandler(async (req, res) => {
  const { bookingId, eventId, userId } = req.body;

  if (!bookingId || !eventId || !userId) {
    return res.status(400).json({ success: false, message: 'bookingId, eventId and userId are required' });
  }

  const bookingSnap = await db.collection('bookings').doc(bookingId).get();
  if (!bookingSnap.exists) {
    return res.status(404).json({ success: false, valid: false, message: 'Booking not found' });
  }

  const booking = bookingSnap.data();

  // Cross-check QR fields with stored booking
  if (booking.userId !== userId || booking.eventId !== eventId) {
    return res.status(400).json({ success: false, valid: false, message: 'QR data mismatch' });
  }

  if (booking.status === 'cancelled') {
    return res.status(200).json({ success: true, valid: false, message: 'Booking has been cancelled', booking });
  }

  // Fetch event details for the response
  const eventSnap = await db.collection('events').doc(eventId).get();
  const event = eventSnap.exists ? eventSnap.data() : null;

  res.status(200).json({
    success: true,
    valid: true,
    message: 'Valid ticket ✅',
    booking: {
      bookingId:   booking.bookingId,
      userId:      booking.userId,
      eventId:     booking.eventId,
      seats:       booking.seats,
      status:      booking.status,
      totalAmount: booking.totalAmount,
      createdAt:   booking.createdAt,
    },
    event: event ? { title: event.title, date: event.date, venue: event.venue } : null,
  });
});

module.exports = { generateQR, verifyTicket };

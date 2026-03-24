const { db } = require('../config/firebase');
const asyncHandler = require('../utils/asyncHandler');
const { assignFromWaitlist } = require('../services/waitlistService');
const { sendBookingConfirmation } = require('../services/emailService');
const { broadcastSeatUpdate } = require('../socket');

const HOLD_DURATION_MS = 2 * 60 * 1000; // 2 minutes

// ─── Helper: get seat ref ────────────────────────────────────────────────────
const seatRef = (eventId, seatId) =>
  db.collection('events').doc(eventId).collection('seats').doc(seatId);

/**
 * POST /api/bookings/hold
 * Marks selected seats as "held" for 8 minutes.
 * Body: { eventId, seatIds: ["A1","A2",...] }
 */
const holdSeats = asyncHandler(async (req, res) => {
  const { uid } = req.user;
  const { eventId, seatIds } = req.body;

  if (!eventId || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ success: false, message: 'eventId and seatIds[] are required' });
  }

  // Enforce 4-seat maximum per booking
  if (seatIds.length > 4) {
    return res.status(400).json({ success: false, message: 'Maximum 4 seats allowed per booking' });
  }

  const holdExpiry = new Date(Date.now() + HOLD_DURATION_MS).toISOString();

  // Use a Firestore transaction to atomically check + hold all seats
  await db.runTransaction(async (t) => {
    const reads = seatIds.map(id => t.get(seatRef(eventId, id)));
    const snaps = await Promise.all(reads);

    for (const snap of snaps) {
      if (!snap.exists) throw Object.assign(new Error(`Seat ${snap.id} not found`), { statusCode: 404 });

      const data = snap.data();
      const { status, holdExpiry: existingExpiry } = data;

      // A "held" seat whose expiry has passed is effectively available
      const isExpiredHold = status === 'held' && existingExpiry && new Date(existingExpiry) < new Date();

      if (status === 'booked') {
        throw Object.assign(new Error(`Seat ${snap.id} is already booked`), { statusCode: 409 });
      }
      // Only block if held by ANOTHER user AND not expired
      if (status === 'held' && !isExpiredHold && data.heldBy !== uid) {
        throw Object.assign(new Error(`Seat ${snap.id} is currently held by someone else`), { statusCode: 409 });
      }
    }

    // All clear — apply holds
    for (const snap of snaps) {
      t.update(snap.ref, { status: 'held', heldBy: uid, holdExpiry });
    }
  });

  // Broadcast after successful transaction
  seatIds.forEach(id => {
    broadcastSeatUpdate(eventId, { seatId: id, status: 'held', heldBy: uid, holdExpiry });
  });

  res.status(200).json({
    success: true,
    message: 'Seats held for 8 minutes',
    holdExpiry,
    seatIds,
  });
});

/**
 * POST /api/bookings/confirm
 * Finalises the booking. Verifies hold is still valid, marks seats "booked",
 * creates booking doc. Uses Firestore transaction to prevent race conditions.
 * Body: { eventId, seatIds: ["A1","A2"], totalAmount }
 */
const confirmBooking = asyncHandler(async (req, res) => {
  const { uid } = req.user;
  const { eventId, seatIds, totalAmount, coinsToUse } = req.body;

  if (!eventId || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ success: false, message: 'eventId and seatIds[] are required' });
  }

  // Enforce 4-seat maximum per booking
  if (seatIds.length > 4) {
    return res.status(400).json({ success: false, message: 'Maximum 4 seats allowed per booking' });
  }

  let bookingId;
  let finalCoinBalance;

  await db.runTransaction(async (t) => {
    const userRef = db.collection('users').doc(uid);
    const userSnap = await t.get(userRef);
    if (!userSnap.exists) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    const user = userSnap.data();

    const eventRef = db.collection('events').doc(eventId);
    const eventSnap = await t.get(eventRef);
    if (!eventSnap.exists) throw Object.assign(new Error('Event not found'), { statusCode: 404 });

    const seatReads = seatIds.map(id => t.get(seatRef(eventId, id)));
    const seatSnaps = await Promise.all(seatReads);

    // Read referrer if applicable
    let referrerSnap = null;
    if (!user.hasBooked && user.referredBy) {
      const referrerRef = db.collection('users').doc(user.referredBy);
      referrerSnap = await t.get(referrerRef);
    }

    // ─── VALIDATION (All Reads done) ──────────────────────────────────────────
    for (const snap of seatSnaps) {
      if (!snap.exists) throw Object.assign(new Error(`Seat ${snap.id} not found`), { statusCode: 404 });
      const data = snap.data();
      if (data.status !== 'held' || data.heldBy !== uid) {
        throw Object.assign(new Error(`Seat ${snap.id} is not held by you`), { statusCode: 409 });
      }
      if (new Date(data.holdExpiry) < new Date()) {
        throw Object.assign(new Error(`Hold for seat ${snap.id} has expired`), { statusCode: 409 });
      }
    }

    // ─── Coin Usage Logic ─────────────────────────────────────────────────────
    let finalAmount = parseFloat(totalAmount) || 0;
    const coinsToDeduct = parseInt(coinsToUse, 10) || 0;
    if (coinsToDeduct > 0) {
      if (user.coins < coinsToDeduct) {
        throw Object.assign(new Error(`Insufficient coins. Balance: ${user.coins}`), { statusCode: 400 });
      }
      finalAmount = Math.max(0, finalAmount - coinsToDeduct);
    }

    // ─── Rewards Logic ────────────────────────────────────────────────────────
    let userCoinBalance = (user.coins || 0) - coinsToDeduct;
    if (!user.hasBooked) {
      if (user.referredBy && referrerSnap && referrerSnap.exists) {
        t.update(referrerSnap.ref, { coins: (referrerSnap.data().coins || 0) + 50 });
        userCoinBalance += 50;
      }
      t.update(userRef, { hasBooked: true, coins: userCoinBalance });
    } else if (coinsToDeduct > 0) {
      t.update(userRef, { coins: userCoinBalance });
    }
    finalCoinBalance = userCoinBalance;

    // ─── Document Updates ─────────────────────────────────────────────────────
    const bookingRef = db.collection('bookings').doc();
    bookingId = bookingRef.id;

    t.set(bookingRef, {
      bookingId,
      userId:      uid,
      eventId,
      seats:       seatIds,
      totalAmount: finalAmount,
      coinsUsed:   coinsToDeduct,
      status:      'confirmed',
      createdAt:   new Date().toISOString(),
    });

    for (const snap of seatSnaps) {
      t.update(snap.ref, { status: 'booked', bookedBy: uid, heldBy: null, holdExpiry: null });
    }

    const currentAvailable = eventSnap.data().availableSeats || 0;
    t.update(eventRef, { availableSeats: Math.max(0, currentAvailable - seatIds.length) });
  });

  // Broadcast after successful transaction
  seatIds.forEach(id => {
    broadcastSeatUpdate(eventId, { seatId: id, status: 'booked', userId: uid });
  });

  // Fetch event name for email (outside transaction — fire-and-forget)
  db.collection('events').doc(eventId).get().then(snap => {
    if (snap.exists) {
      sendBookingConfirmation({
        userEmail: req.user.email,
        userName:  req.user.name,
        eventName: snap.data().title,
        seats:     seatIds,
        bookingId,
      });
    }
  }).catch(e => console.error('Email error:', e));

  res.status(201).json({ 
    success: true, 
    message: 'Booking confirmed', 
    bookingId, 
    newCoins: finalCoinBalance 
  });
});

/**
 * POST /api/bookings/release
 * Explicitly releases seats held by the user and broadcasts the update.
 */
const releaseSeats = asyncHandler(async (req, res) => {
  const { uid } = req.user;
  const { eventId, seatIds } = req.body;

  if (!eventId || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ success: false, message: 'eventId and seatIds[] are required' });
  }

  // Use simple batch to clear statuses
  const batch = db.batch();
  for (const seatId of seatIds) {
    batch.update(seatRef(eventId, seatId), { 
      status: 'available', 
      heldBy: null, 
      holdExpiry: null 
    });
  }

  await batch.commit();

  // Broadcast to all users in room
  seatIds.forEach(id => {
    broadcastSeatUpdate(eventId, { seatId: id, status: 'available' });
  });

  res.status(200).json({ success: true, message: 'Seats released' });
});

/**
 * GET /api/bookings/my
 * Returns all bookings for the current user, enriched with event details.
 */
const getMyBookings = asyncHandler(async (req, res) => {
  const { uid } = req.user;

  const bookingsSnap = await db
    .collection('bookings')
    .where('userId', '==', uid)
    .get();

  const bookingDocs = bookingsSnap.docs.sort((a, b) => 
    new Date(b.data().createdAt) - new Date(a.data().createdAt)
  );

  const bookings = await Promise.all(bookingDocs.map(async (doc) => {
    const booking = doc.data();

    // Fetch event details
    const eventSnap = await db.collection('events').doc(booking.eventId).get();
    const event = eventSnap.exists ? eventSnap.data() : null;

    // Fetch individual seat details
    let seatDetails = [];
    if (event) {
      const seatSnaps = await Promise.all(
        booking.seats.map(seatId =>
          db.collection('events').doc(booking.eventId).collection('seats').doc(seatId).get()
        )
      );
      seatDetails = seatSnaps.filter(s => s.exists).map(s => s.data());
    }

    return { ...booking, event, seatDetails };
  }));

  // Sort by newest bookings first (client expects descending createdAt)
  bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.status(200).json({ success: true, bookings });
});

/**
 * POST /api/bookings/:bookingId/cancel
 * Cancels a booking, frees seats, and triggers waitlist assignment.
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const { uid } = req.user;
  const { bookingId } = req.params;

  const bookingRef = db.collection('bookings').doc(bookingId);
  const bookingSnap = await bookingRef.get();

  if (!bookingSnap.exists) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const booking = bookingSnap.data();

  // Only the booking owner can cancel
  if (booking.userId !== uid) {
    return res.status(403).json({ success: false, message: 'Forbidden: not your booking' });
  }

  if (booking.status === 'cancelled') {
    return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
  }
  if (booking.status === 'resold') {
    return res.status(400).json({ success: false, message: 'Booking has already been resold' });
  }

  const { eventId, seats } = booking;

  // Free up all seats and update booking status in a batch
  const batch = db.batch();
  batch.update(bookingRef, { status: 'cancelled', cancelledAt: new Date().toISOString() });

  for (const seatId of seats) {
    batch.update(seatRef(eventId, seatId), {
      status: 'available', bookedBy: null, heldBy: null, holdExpiry: null,
    });
  }

  // Increment avaliable seats on the event
  const eventRef = db.collection('events').doc(eventId);
  const eventSnap = await eventRef.get();
  if (eventSnap.exists) {
    batch.update(eventRef, { availableSeats: eventSnap.data().availableSeats + seats.length });
  }

  await batch.commit();

  // Attempt waitlist assignment (async — non-blocking for the response)
  assignFromWaitlist(eventId, seats).catch(err =>
    console.warn('[WAITLIST] assignFromWaitlist error:', err.message)
  );

  res.status(200).json({ success: true, message: 'Booking cancelled. Freed seats handed to waitlist.' });
});

/**
 * GET /api/bookings/:bookingId
 * Publicly accessible route to view a single ticket (for QR scan).
 */
const getBookingById = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const bookingSnap = await db.collection('bookings').doc(bookingId).get();
  if (!bookingSnap.exists) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const booking = bookingSnap.data();
  const userId = booking.userId;

  // Fetch current owner's name from users collection
  let userName = 'Unknown Customer';
  if (userId) {
    const userSnap = await db.collection('users').doc(userId).get();
    if (userSnap.exists) {
      userName = userSnap.data().name || 'Unknown Customer';
    }
  }

  // Fetch event details
  const eventSnap = await db.collection('events').doc(booking.eventId).get();
  const event = eventSnap.exists ? eventSnap.data() : null;

  // Fetch seat details (to get labels, categories, etc.)
  let seatDetails = [];
  if (event) {
    const seatSnaps = await Promise.all(
      (booking.seats || []).map(seatId =>
        db.collection('events').doc(booking.eventId).collection('seats').doc(seatId).get()
      )
    );
    seatDetails = seatSnaps.filter(s => s.exists).map(s => s.data());
  }

  res.status(200).json({
    success: true,
    booking: { ...booking, event, seatDetails, userName }
  });
});

module.exports = { holdSeats, releaseSeats, confirmBooking, getMyBookings, cancelBooking, getBookingById };

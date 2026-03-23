const { db } = require('../config/firebase');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/resale
 * Create a resale listing for a confirmed booking.
 * Rules:
 *   - Only the booking owner can list
 *   - Price must be ≤ 2× the original price per seat
 * Body: { bookingId, price }
 */
const createListing = asyncHandler(async (req, res) => {
  const { uid } = req.user;
  const { bookingId, price } = req.body;

  if (!bookingId || price == null) {
    return res.status(400).json({ success: false, message: 'bookingId and price are required' });
  }

  const bookingSnap = await db.collection('bookings').doc(bookingId).get();
  if (!bookingSnap.exists) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const booking = bookingSnap.data();

  // Only owner can list
  if (booking.userId !== uid) {
    return res.status(403).json({ success: false, message: 'Forbidden: not your booking' });
  }

  if (booking.status !== 'confirmed') {
    return res.status(400).json({ success: false, message: 'Only confirmed bookings can be listed for resale' });
  }

  // Calculate price-per-seat original price
  const originalPricePerSeat = booking.totalAmount / booking.seats.length;
  const maxAllowedPrice = originalPricePerSeat * 2;

  if (parseFloat(price) > maxAllowedPrice) {
    return res.status(400).json({
      success: false,
      message: `Resale price cannot exceed 2× original price (₹${maxAllowedPrice.toFixed(2)} max)`,
    });
  }

  // Check no active listing already exists for this booking
  const existingSnap = await db
    .collection('resaleListings')
    .where('ticketId', '==', bookingId)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    return res.status(409).json({ success: false, message: 'An active listing already exists for this booking' });
  }

  const listingRef = db.collection('resaleListings').doc();
  const listingData = {
    listingId:     listingRef.id,
    ticketId:      bookingId,
    sellerId:      uid,
    eventId:       booking.eventId,
    seats:         booking.seats,
    price:         parseFloat(price),
    originalPrice: booking.totalAmount,
    status:        'active',
    createdAt:     new Date().toISOString(),
  };
  await listingRef.set(listingData);

  // Update original booking to flag it as being resold
  await db.collection('bookings').doc(bookingId).update({ isReselling: true });

  res.status(201).json({ success: true, listing: listingData });
});

/**
 * GET /api/resale
 * Returns all active resale listings, optionally filtered by eventId.
 * Query: ?eventId=<id>
 */
const getListings = asyncHandler(async (req, res) => {
  const { eventId } = req.query;
  let query = db.collection('resaleListings').where('status', '==', 'active');

  const snap = await query.get();
  let listings = snap.docs.map(d => d.data());

  if (eventId) {
    listings = listings.filter(item => item.eventId === eventId);
  }

  // Sort by newest listings first client-side to match previous behavior.
  listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.status(200).json({ success: true, count: listings.length, listings });
});

/**
 * POST /api/resale/:listingId/buy
 * Directly buys a resale listing at the listed price.
 * Atomically: marks listing "sold", re-assigns booking seats to buyer,
 * cancels the original booking, creates a new booking for the buyer.
 */
const buyListing = asyncHandler(async (req, res) => {
  const { uid } = req.user;
  const { listingId } = req.params;

  let newBookingId;

  await db.runTransaction(async (t) => {
    const listingRef = db.collection('resaleListings').doc(listingId);
    const listingSnap = await t.get(listingRef);

    if (!listingSnap.exists) throw Object.assign(new Error('Listing not found'), { statusCode: 404 });
    const listing = listingSnap.data();

    if (listing.status !== 'active') throw Object.assign(new Error('Listing is no longer active'), { statusCode: 409 });
    if (listing.sellerId === uid) throw Object.assign(new Error('You cannot buy your own listing'), { statusCode: 400 });

    // Mark listing as sold
    t.update(listingRef, { status: 'sold', buyerId: uid, soldAt: new Date().toISOString() });

    // Mark original booking as cancelled
    t.update(db.collection('bookings').doc(listing.ticketId), {
      status: 'cancelled', cancelledAt: new Date().toISOString(), resoldTo: uid,
    });

    // Create new booking for buyer
    const newBookingRef = db.collection('bookings').doc();
    newBookingId = newBookingRef.id;
    t.set(newBookingRef, {
      bookingId:   newBookingId,
      userId:      uid,
      eventId:     listing.eventId,
      seats:       listing.seats,
      totalAmount: listing.price,
      status:      'confirmed',
      fromResale:  true,
      createdAt:   new Date().toISOString(),
    });

    // Re-assign seats to new buyer
    for (const seatId of listing.seats) {
      const sr = db.collection('events').doc(listing.eventId).collection('seats').doc(seatId);
      t.update(sr, { bookedBy: uid });
    }
  });

  res.status(200).json({ success: true, message: 'Listing purchased successfully', bookingId: newBookingId });
});

module.exports = { createListing, getListings, buyListing };

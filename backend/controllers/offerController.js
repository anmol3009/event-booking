const { db } = require('../config/firebase');
const asyncHandler = require('../utils/asyncHandler');
const { sendOfferNotification } = require('../services/emailService');

/**
 * POST /api/resale/:listingId/offer
 * Buyer creates a price offer on a resale listing.
 * Triggers an email notification to the seller.
 * Body: { offerPrice }
 */
const makeOffer = asyncHandler(async (req, res) => {
  const { uid, name, email } = req.user;
  const { listingId } = req.params;
  const { offerPrice } = req.body;

  if (!offerPrice || offerPrice <= 0) {
    return res.status(400).json({ success: false, message: 'A valid offerPrice is required' });
  }

  // Fetch listing
  const listingSnap = await db.collection('resaleListings').doc(listingId).get();
  if (!listingSnap.exists) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }
  const listing = listingSnap.data();

  if (listing.status !== 'active') {
    return res.status(409).json({ success: false, message: 'Listing is no longer active' });
  }
  if (listing.sellerId === uid) {
    return res.status(400).json({ success: false, message: 'You cannot make an offer on your own listing' });
  }

  // Create offer document
  const offerRef = db.collection('offers').doc();
  const offerData = {
    offerId:    offerRef.id,
    listingId,
    eventId:    listing.eventId,
    buyerId:    uid,
    sellerId:   listing.sellerId,
    offerPrice: parseFloat(offerPrice),
    status:     'pending',
    createdAt:  new Date().toISOString(),
  };
  await offerRef.set(offerData);

  // Notify seller via email — fetch event name and seller details
  try {
    const [eventSnap, sellerSnap] = await Promise.all([
      db.collection('events').doc(listing.eventId).get(),
      db.collection('users').doc(listing.sellerId).get(),
    ]);
    const eventName  = eventSnap.exists  ? eventSnap.data().title  : 'the event';
    const seller     = sellerSnap.exists ? sellerSnap.data()       : {};

    await sendOfferNotification({
      sellerEmail: seller.email,
      sellerName:  seller.name  || 'Seller',
      buyerName:   name,
      buyerEmail:  email,
      eventName,
      offerPrice:  parseFloat(offerPrice),
      listingId,
    });
  } catch (emailErr) {
    // Don't fail the request if email fails
    console.warn('[EMAIL] Offer notification failed:', emailErr.message);
  }

  res.status(201).json({ success: true, offer: offerData });
});

/**
 * POST /api/offers/:offerId/respond
 * Seller responds to an offer: accept, reject, or counter.
 * Body: { action: "accept"|"reject"|"counter", counterPrice? }
 */
const respondToOffer = asyncHandler(async (req, res) => {
  const { uid } = req.user;
  const { offerId } = req.params;
  const { action, counterPrice } = req.body;

  if (!['accept', 'reject', 'counter'].includes(action)) {
    return res.status(400).json({ success: false, message: 'action must be accept, reject, or counter' });
  }

  const offerRef  = db.collection('offers').doc(offerId);
  const offerSnap = await offerRef.get();

  if (!offerSnap.exists) {
    return res.status(404).json({ success: false, message: 'Offer not found' });
  }

  const offer = offerSnap.data();

  // Only the seller can respond
  if (offer.sellerId !== uid) {
    return res.status(403).json({ success: false, message: 'Forbidden: only the seller can respond' });
  }

  if (offer.status !== 'pending') {
    return res.status(400).json({ success: false, message: `Offer is already ${offer.status}` });
  }

  if (action === 'counter' && (!counterPrice || counterPrice <= 0)) {
    return res.status(400).json({ success: false, message: 'counterPrice is required for a counter offer' });
  }

  const update = {
    status:      action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'countered',
    respondedAt: new Date().toISOString(),
  };
  if (action === 'counter') {
    update.counterPrice = parseFloat(counterPrice);
  }

  await offerRef.update(update);

  // If accepted: execute the purchase atomically (same logic as buyListing)
  if (action === 'accept') {
    const listingRef  = db.collection('resaleListings').doc(offer.listingId);
    let newBookingId;

    await db.runTransaction(async (t) => {
      const listingSnap = await t.get(listingRef);
      if (!listingSnap.exists || listingSnap.data().status !== 'active') {
        throw Object.assign(new Error('Listing is no longer available'), { statusCode: 409 });
      }
      const listing = listingSnap.data();

      t.update(listingRef, { status: 'sold', buyerId: offer.buyerId, soldAt: new Date().toISOString() });
      t.update(db.collection('bookings').doc(listing.ticketId), {
        status: 'cancelled', cancelledAt: new Date().toISOString(), resoldTo: offer.buyerId,
      });

      const newBookingRef = db.collection('bookings').doc();
      newBookingId = newBookingRef.id;
      t.set(newBookingRef, {
        bookingId:   newBookingId,
        userId:      offer.buyerId,
        eventId:     listing.eventId,
        seats:       listing.seats,
        totalAmount: offer.offerPrice,
        status:      'confirmed',
        fromResale:  true,
        fromOffer:   true,
        createdAt:   new Date().toISOString(),
      });

      for (const seatId of listing.seats) {
        const sr = db.collection('events').doc(listing.eventId).collection('seats').doc(seatId);
        t.update(sr, { bookedBy: offer.buyerId });
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Offer accepted. Booking transferred to buyer.',
      newBookingId,
    });
  }

  res.status(200).json({ success: true, message: `Offer ${update.status}`, update });
});

/**
 * GET /api/offers
 * Returns all offers for listings owned by the current user (seller view)
 * or all offers placed by the current user (buyer view).
 * Query: ?role=seller OR ?role=buyer (default: buyer)
 */
const getOffers = asyncHandler(async (req, res) => {
  const { uid } = req.user;
  const { role } = req.query;

  const field = role === 'seller' ? 'sellerId' : 'buyerId';
  const snap  = await db.collection('offers').where(field, '==', uid).orderBy('createdAt', 'desc').get();
  const offers = snap.docs.map(d => d.data());

  res.status(200).json({ success: true, offers });
});

module.exports = { makeOffer, respondToOffer, getOffers };

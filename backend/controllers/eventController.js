const { db } = require('../config/firebase');
const asyncHandler = require('../utils/asyncHandler');
const { generateSeats } = require('../services/seatService');

/**
 * POST /api/events
 * Auth required. Accepts multipart/form-data with images + event fields.
 * Uploaded images arrive as req.files (handled by multer+cloudinary middleware).
 */
const createEvent = asyncHandler(async (req, res) => {
  const { uid } = req.user;
  const { title, description, date, venue, totalSeats } = req.body;
  let { tiers } = req.body;

  // Basic validation
  if (!title || !description || !date || !venue) {
    return res.status(400).json({ success: false, message: 'title, description, date and venue are required' });
  }

  // Parse tiers if sent as a JSON string (typical for multipart/form-data)
  if (typeof tiers === 'string') {
    try {
      tiers = JSON.parse(tiers);
    } catch (e) {
      tiers = [];
    }
  }

  // Collect Cloudinary URLs from uploaded files (req.files populated by multer)
  const images = (req.files || []).map(f => f.path);

  // Create the event document
  const eventRef = db.collection('events').doc();
  const parsedTotal = parseInt(totalSeats, 10) || 260;

  // Calculate base price (lowest price among tiers)
  let basePrice = 500;
  if (Array.isArray(tiers) && tiers.length > 0) {
    const prices = tiers.map(t => parseFloat(t.price)).filter(p => !isNaN(p));
    if (prices.length > 0) basePrice = Math.min(...prices);
  } else {
    // Fallback if no tiers provided; includes Premium tier now
    const premiumSeats = Math.max(1, Math.floor(parsedTotal * 0.1));
    const vipSeats = Math.max(2, Math.floor(parsedTotal * 0.2));
    const generalSeats = parsedTotal - premiumSeats - vipSeats;
    tiers = [
      { name: 'Premium', price: 2500, seats: premiumSeats },
      { name: 'VIP', price: 1500, seats: vipSeats },
      { name: 'General', price: 500, seats: Math.max(0, generalSeats) }
    ];
  }

  const eventData = {
    eventId:        eventRef.id,
    title,
    description,
    date,
    venue,
    images,
    createdBy:      uid,
    totalSeats:     parsedTotal,
    availableSeats: parsedTotal,
    price:          basePrice,
    tiers:          tiers,
    createdAt:      new Date().toISOString(),
  };
  await eventRef.set(eventData);

  // Auto-generate seats based on tiers if possible, or fallback to default
  const premiumTier = tiers.find(t => t.name.toUpperCase() === 'PREMIUM');
  const vipTier = tiers.find(t => t.name.toUpperCase() === 'VIP');
  const genTier = tiers.find(t => t.name.toUpperCase() === 'GENERAL' || t.name.toUpperCase() === 'STANDARD');
  
  const premiumPrice = premiumTier ? parseFloat(premiumTier.price) : 2500;
  const vipPrice = vipTier ? parseFloat(vipTier.price) : 1500;
  const genPrice = genTier ? parseFloat(genTier.price) : 500;

  let actualAvailable = parsedTotal;
  try {
    await generateSeats(eventRef.id, vipPrice, genPrice, premiumPrice);

    // Update availableSeats to the actual generated count (minus pre-booked demo seats)
    const availableSnap = await db
      .collection('events')
      .doc(eventRef.id)
      .collection('seats')
      .where('status', '==', 'available')
      .get();
    
    actualAvailable = availableSnap.size;
    await eventRef.update({ availableSeats: actualAvailable });
  } catch (err) {
    console.error(`[EventController] Seat generation failed for event ${eventRef.id}:`, err.message);
    // If it's a quota error, we still want the event to exist, but seats might be missing
    if (err.message.includes('RESOURCE_EXHAUSTED')) {
      console.warn('[EventController] Firestore quota exceeded during seat generation.');
    }
  }

  res.status(201).json({
    success: true,
    message: 'Event created successfully' + (actualAvailable === 0 ? ' (Warning: Seat generation failed)' : ''),
    event: { ...eventData, availableSeats: actualAvailable },
  });
});

/**
 * GET /api/events
 * Returns all events, with optional date filtering.
 * Query params: ?date=2025-08-01 or ?startDate=2025-08-01&endDate=2025-08-31
 */
const getEvents = asyncHandler(async (req, res) => {
  const { date, startDate, endDate } = req.query;
  let query = db.collection('events');

  if (date) {
    // Exact date match (events on this day)
    query = query.where('date', '>=', date).where('date', '<', date + 'T23:59:59');
  } else if (startDate && endDate) {
    query = query.where('date', '>=', startDate).where('date', '<=', endDate);
  }

  const snap = await query.get();
  const events = snap.docs
    .map(d => d.data())
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  res.status(200).json({ success: true, count: events.length, events });
});

/**
 * GET /api/events/:eventId
 * Returns full event details plus the complete seat map.
 */
const getEventById = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const eventSnap = await db.collection('events').doc(eventId).get();
  if (!eventSnap.exists) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  // Fetch all seats for this event
  const seatsSnap = await db
    .collection('events')
    .doc(eventId)
    .collection('seats')
    .get();

  const now = new Date();
  const seats = seatsSnap.docs.map(d => {
    const data = d.data();
    // If seat is 'held' but expiry has passed, it's effectively available
    if (data.status === 'held' && data.holdExpiry && new Date(data.holdExpiry) < now) {
      return { ...data, status: 'available', heldBy: null, holdExpiry: null };
    }
    return data;
  });

  res.status(200).json({
    success: true,
    event: eventSnap.data(),
    seats,
  });
});

module.exports = { createEvent, getEvents, getEventById };

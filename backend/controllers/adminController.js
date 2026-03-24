const { db } = require('../config/firebase');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/admin/analytics/:eventId
 * Returns a full analytics summary for an event:
 *   - total seats
 *   - tickets sold (booked)
 *   - unsold (available)
 *   - cancelled bookings
 *   - total revenue
 *   - seat category breakdown
 */
const getEventAnalytics = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  // Verify event exists
  const eventSnap = await db.collection('events').doc(eventId).get();
  if (!eventSnap.exists) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }
  const event = eventSnap.data();

  // Fetch all seats
  const seatsSnap = await db
    .collection('events')
    .doc(eventId)
    .collection('seats')
    .get();

  const seats = seatsSnap.docs.map(d => d.data());

  const totalSeats      = seats.length;
  const bookedSeats     = seats.filter(s => s.status === 'booked').length;
  const availableSeats  = seats.filter(s => s.status === 'available').length;
  const heldSeats       = seats.filter(s => s.status === 'held').length;
  const vipTotal        = seats.filter(s => s.category === 'VIP').length;
  const vipBooked       = seats.filter(s => s.category === 'VIP' && s.status === 'booked').length;
  const generalTotal    = seats.filter(s => s.category === 'General').length;
  const generalBooked   = seats.filter(s => s.category === 'General' && s.status === 'booked').length;

  // Fetch all bookings for this event
  const bookingsSnap = await db
    .collection('bookings')
    .where('eventId', '==', eventId)
    .get();

  const bookings   = bookingsSnap.docs.map(d => d.data());
  const confirmed  = bookings.filter(b => b.status === 'confirmed');
  const cancelled  = bookings.filter(b => b.status === 'cancelled');

  // Accurately count total tickets (seats) sold, not just count of bookings
  const totalTicketsSold = confirmed.reduce((sum, b) => sum + (b.seats?.length || 0), 0);
  const totalRevenue = confirmed.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Daily sales aggregation
  const dailySales = {};
  confirmed.forEach(b => {
    let day = 'unknown';
    try {
      const dayDate = new Date(b.createdAt);
      if (!isNaN(dayDate)) day = dayDate.toISOString().split('T')[0];
    } catch (e) {}
    dailySales[day] = (dailySales[day] || 0) + (b.totalAmount || 0);
  });
  const dailySalesArray = Object.keys(dailySales).sort().map(date => ({ date, revenue: dailySales[date] }));

  // Detailed Sales (flattened for the table)
  // To avoid repeated DB calls, we'll collect unique user IDs first
  const userIds = [...new Set(confirmed.map(b => b.userId))];
  const userMap = {};
  if (userIds.length > 0) {
    const userSnaps = await Promise.all(userIds.map(uid => db.collection('users').doc(uid).get()));
    userSnaps.forEach(snap => {
      if (snap.exists) userMap[snap.id] = snap.data().name || 'Unknown';
    });
  }

  // Create a seat label lookup from the seats we already fetched
  const seatMapData = {};
  seats.forEach(s => { seatMapData[s.seatId] = s; });

  const salesDetails = [];
  confirmed.forEach(b => {
    const ownerName = userMap[b.userId] || 'Unknown';
    (b.seats || []).forEach(sid => {
      const sinfo = seatMapData[sid];
      salesDetails.push({
        bookingId: b.bookingId,
        owner:     ownerName,
        seat:      sinfo?.label || sid,
        type:      sinfo?.category || 'General',
        amount:    sinfo?.price || 0,
        date:      b.createdAt
      });
    });
  });

  // Waitlist count
  const waitlistSnap = await db
    .collection('waitlist')
    .where('eventId', '==', eventId)
    .where('status', '==', 'waiting')
    .get();

  res.status(200).json({
    success: true,
    analytics: {
      event: { title: event.title, date: event.date, venue: event.venue },
      seats: { total: totalSeats, booked: bookedSeats, available: availableSeats, held: heldSeats },
      bookings: {
        confirmed: confirmed.length, // Transactions
        ticketsSold: totalTicketsSold, // UNIQUE SEATS
        cancelled: cancelled.length,
        resold: confirmed.filter(b => b.fromResale).length,
      },
      revenue: { total: totalRevenue, currency: 'INR' },
      breakdown: {
        vip:     { total: vipTotal,     booked: vipBooked },
        general: { total: generalTotal, booked: generalBooked },
      },
      waitlistCount: waitlistSnap.size,
      dailySales: dailySalesArray,
      salesDetails, // Flattened seat-level data
    },
  });
});

/**
 * GET /api/admin/events
 * Returns all events with basic stats (for admin dashboard list view).
 */
const getAllEventsAdmin = asyncHandler(async (req, res) => {
  const { uid } = req.user;
  const eventsSnap = await db
    .collection('events')
    .where('createdBy', '==', uid)
    .get();

  const eventDocs = eventsSnap.docs.sort((a, b) => 
    (a.data().date || '').localeCompare(b.data().date || '')
  );

  const events = await Promise.all(eventDocs.map(async (doc) => {
    const event = doc.data();

    const bookingsSnap = await db
      .collection('bookings')
      .where('eventId', '==', event.eventId)
      .where('status', '==', 'confirmed')
      .get();

    const revenue = bookingsSnap.docs.reduce((sum, b) => sum + (b.data().totalAmount || 0), 0);

    return {
      ...event,
      confirmedBookings: bookingsSnap.size,
      revenue,
    };
  }));

  // Sort by date ascending to preserve expected admin timeline order.
  events.sort((a, b) => new Date(a.date) - new Date(b.date));

  res.status(200).json({ success: true, events });
});

module.exports = { getEventAnalytics, getAllEventsAdmin };

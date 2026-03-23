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

  const totalRevenue = confirmed.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Waitlist count
  const waitlistSnap = await db
    .collection('waitlist')
    .where('eventId', '==', eventId)
    .where('status', '==', 'waiting')
    .get();

  res.status(200).json({
    success: true,
    analytics: {
      event: {
        title:  event.title,
        date:   event.date,
        venue:  event.venue,
      },
      seats: {
        total:     totalSeats,
        booked:    bookedSeats,
        available: availableSeats,
        held:      heldSeats,
      },
      bookings: {
        confirmed: confirmed.length,
        cancelled: cancelled.length,
      },
      revenue: {
        total:    totalRevenue,
        currency: 'INR',
      },
      breakdown: {
        vip:     { total: vipTotal,     booked: vipBooked },
        general: { total: generalTotal, booked: generalBooked },
      },
      waitlistCount: waitlistSnap.size,
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

  const events = await Promise.all(eventsSnap.docs.map(async (doc) => {
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

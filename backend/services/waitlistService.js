const { db } = require('../config/firebase');

/**
 * Service: waitlistService
 *
 * On cancellation, this service:
 * 1. Finds the next "waiting" user for the event (lowest position).
 * 2. Marks them as "notified" in the waitlist.
 * 3. Assigns the freed seats to that user via a new confirmed booking.
 * 4. Marks the assigned seats as "booked".
 *
 * @param {string} eventId   - The event whose seats just became free
 * @param {string[]} seatIds - Seat IDs that were freed by cancellation
 */
const assignFromWaitlist = async (eventId, seatIds) => {
  // Query the waitlist ordered by position so the first joiner gets priority
  const waitlistSnap = await db
    .collection('waitlist')
    .where('eventId', '==', eventId)
    .where('status', '==', 'waiting')
    .orderBy('position', 'asc')
    .limit(1)
    .get();

  if (waitlistSnap.empty) {
    // No one on waitlist — just leave seats as available (already freed by cancellation handler)
    return null;
  }

  const waitlistDoc = waitlistSnap.docs[0];
  const { userId, waitlistId } = waitlistDoc.data();

  // Use a transaction to atomically: create booking + update seats + update waitlist entry
  await db.runTransaction(async (t) => {
    // Mark seats as booked for the waitlisted user
    for (const seatId of seatIds) {
      const seatRef = db
        .collection('events')
        .doc(eventId)
        .collection('seats')
        .doc(seatId);
      t.update(seatRef, { status: 'booked', bookedBy: userId, heldBy: null, holdExpiry: null });
    }

    // Create a new confirmed booking for the waitlisted user
    const bookingRef = db.collection('bookings').doc();
    t.set(bookingRef, {
      bookingId:   bookingRef.id,
      userId,
      eventId,
      seats:       seatIds,
      totalAmount: 0,         // Price can be recalculated by the caller if needed
      status:      'confirmed',
      fromWaitlist: true,
      createdAt:   new Date().toISOString(),
    });

    // Update the waitlist entry to "notified"
    t.update(waitlistDoc.ref, { status: 'notified', assignedBookingId: bookingRef.id });
  });

  return { userId, seatIds };
};

/**
 * Adds a user to the waitlist for a given event.
 * Calculates position as (current count + 1).
 */
const joinWaitlist = async (eventId, userId) => {
  // Check if user is already on the waitlist
  const existing = await db
    .collection('waitlist')
    .where('eventId', '==', eventId)
    .where('userId', '==', userId)
    .where('status', '==', 'waiting')
    .limit(1)
    .get();

  if (!existing.empty) {
    throw Object.assign(new Error('You are already on the waitlist for this event'), { statusCode: 409 });
  }

  const countSnap = await db
    .collection('waitlist')
    .where('eventId', '==', eventId)
    .where('status', '==', 'waiting')
    .get();

  const position = countSnap.size + 1;
  const ref = db.collection('waitlist').doc();

  await ref.set({
    waitlistId: ref.id,
    eventId,
    userId,
    position,
    status: 'waiting',
    createdAt: new Date().toISOString(),
  });

  return { waitlistId: ref.id, position };
};

module.exports = { assignFromWaitlist, joinWaitlist };

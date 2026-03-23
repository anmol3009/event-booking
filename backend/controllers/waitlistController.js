const { db } = require('../config/firebase');
const asyncHandler = require('../utils/asyncHandler');
const { joinWaitlist } = require('../services/waitlistService');

/**
 * POST /api/waitlist
 * Joins the waitlist for a fully booked event.
 * Body: { eventId }
 */
const joinEventWaitlist = asyncHandler(async (req, res) => {
  const { uid } = req.user;
  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ success: false, message: 'eventId is required' });
  }

  // Verify event exists and is actually full
  const eventSnap = await db.collection('events').doc(eventId).get();
  if (!eventSnap.exists) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  const { availableSeats } = eventSnap.data();
  if (availableSeats > 0) {
    return res.status(400).json({
      success: false,
      message: `Event still has ${availableSeats} seats available. No need to join the waitlist.`,
    });
  }

  const result = await joinWaitlist(eventId, uid);
  res.status(201).json({ success: true, message: `Added to waitlist at position ${result.position}`, ...result });
});

/**
 * GET /api/waitlist/:eventId
 * Returns the waitlist for an event (useful for admin view).
 */
const getWaitlist = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const snap = await db
    .collection('waitlist')
    .where('eventId', '==', eventId)
    .get();

  const waitlist = snap.docs
    .map(d => d.data())
    .sort((a, b) => a.position - b.position);
  
  res.status(200).json({ success: true, waitlist });
});

/**
 * GET /api/waitlist/my
 * Returns all waitlist entries for the current user.
 */
const getMyWaitlist = asyncHandler(async (req, res) => {
  const { uid } = req.user;

  const snap = await db
    .collection('waitlist')
    .where('userId', '==', uid)
    .get();

  const waitlist = snap.docs.map(d => d.data());
  res.status(200).json({ success: true, waitlist });
});

module.exports = { joinEventWaitlist, getWaitlist, getMyWaitlist };

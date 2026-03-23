const { db } = require('../config/firebase');

/**
 * Service: seatService
 * Handles auto-generation of seats for an event.
 *
 * Layout:
 *   - Rows A-E   → VIP   (10 seats each → A1-A10, B1-B10 ... E1-E10)
 *   - Rows F-Z   → General (10 seats each)
 * Total seats = 26 rows × 10 = 260 seats
 * For demo purposes, ~15% of seats are randomly pre-marked as "booked".
 */

const PREMIUM_ROWS  = ['A', 'B'];
const VIP_ROWS      = ['C','D','E'];
// Strip M from general to remove the extra 'M section' row label.
const GENERAL_ROWS  = ['F','G','H','I','J','K','L','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
const SEATS_PER_ROW = 10;

/**
 * Generates all seat documents for an event in a Firestore batch.
 * @param {string} eventId
 * @param {number} vipPrice - price per VIP seat (for metadata)
 * @param {number} generalPrice - price per General seat
 * @param {number} premiumPrice - price per Premium seat
 * @returns {number} totalSeats count
 */
const generateSeats = async (eventId, vipPrice = 1500, generalPrice = 500, premiumPrice = 2500) => {
  const batch = db.batch();
  let seatCounter = 0;

  const allRows = [
    ...PREMIUM_ROWS.map(r => ({ row: r, category: 'Premium', price: premiumPrice })),
    ...VIP_ROWS.map(r => ({ row: r, category: 'VIP', price: vipPrice })),
    ...GENERAL_ROWS.map(r => ({ row: r, category: 'General', price: generalPrice })),
  ];

  for (const { row, category, price } of allRows) {
    for (let num = 1; num <= SEATS_PER_ROW; num++) {
      const seatId = seatCounter.toString();
      const label = `${row}${num}`;
      
      const seatRef = db
        .collection('events')
        .doc(eventId)
        .collection('seats')
        .doc(seatId);

      batch.set(seatRef, {
        seatId,
        label,
        eventId,
        category,
        price,
        status:      'available',
        heldBy:      null,
        holdExpiry:  null,
        bookedBy:    null,
        createdAt:   new Date().toISOString(),
      });
      seatCounter++;
    }
  }

  console.log(`[SeatService] Committing batch for ${seatCounter} seats (Firestore writes) for event: ${eventId}`);
  await batch.commit();
  return seatCounter;
};

module.exports = { generateSeats, SEATS_PER_ROW, VIP_ROWS, GENERAL_ROWS };

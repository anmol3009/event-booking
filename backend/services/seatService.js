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

const VIP_ROWS     = ['A', 'B', 'C', 'D', 'E'];
const GENERAL_ROWS = ['F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
const SEATS_PER_ROW = 10;

/**
 * Generates all seat documents for an event in a Firestore batch.
 * @param {string} eventId
 * @param {number} vipPrice - price per VIP seat (for metadata)
 * @param {number} generalPrice - price per General seat
 * @returns {number} totalSeats count
 */
const generateSeats = async (eventId, vipPrice = 1500, generalPrice = 500) => {
  const batch = db.batch();
  let seatCounter = 0;

  const allRows = [
    ...VIP_ROWS.map(r => ({ row: r, category: 'VIP', price: vipPrice })),
    ...GENERAL_ROWS.map(r => ({ row: r, category: 'General', price: generalPrice })),
  ];

  for (const { row, category, price } of allRows) {
    for (let num = 1; num <= SEATS_PER_ROW; num++) {
      const seatId = seatCounter.toString();
      const label = `${row}${num}`;
      
      // ~15% of seats randomly pre-booked for demo realism
      const isPreBooked = Math.random() < 0.15;

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
        status:      isPreBooked ? 'booked' : 'available',
        heldBy:      null,
        holdExpiry:  null,
        bookedBy:    isPreBooked ? 'demo-user' : null,
        createdAt:   new Date().toISOString(),
      });
      seatCounter++;
    }
  }

  await batch.commit();
  return seatCounter;
};

module.exports = { generateSeats, SEATS_PER_ROW, VIP_ROWS, GENERAL_ROWS };

const nodemailer = require('nodemailer');

// ── Transporter Setup ─────────────────────────────────────────────────────────
// Uses Gmail with an App Password (set EMAIL_USER and EMAIL_PASS in .env).
// For production, swap for a transactional service like SendGrid or Resend.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends an email to the seller when a buyer places an offer on their resale listing.
 *
 * @param {object} params
 * @param {string} params.sellerEmail
 * @param {string} params.sellerName
 * @param {string} params.buyerName
 * @param {string} params.buyerEmail
 * @param {string} params.eventName
 * @param {number} params.offerPrice
 * @param {string} params.listingId
 */
const sendOfferNotification = async ({
  sellerEmail,
  sellerName,
  buyerName,
  buyerEmail,
  eventName,
  offerPrice,
  listingId,
}) => {
  const mailOptions = {
    from: `"CookMyShow" <${process.env.EMAIL_USER}>`,
    to: sellerEmail,
    subject: `💰 New Offer on Your Listing – ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #7c3aed; padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">🎭 CookMyShow</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #1a1a1a;">Hi ${sellerName},</h2>
          <p style="color: #555; font-size: 16px;">
            You have received a new offer on your resale listing for <strong>${eventName}</strong>.
          </p>
          <div style="background: #f9f5ff; border-left: 4px solid #7c3aed; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 18px; color: #1a1a1a;">
              Offer Price: <strong style="color: #7c3aed;">₹${offerPrice.toLocaleString('en-IN')}</strong>
            </p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #888;">Buyer Name:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-weight: bold;">${buyerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888;">Buyer Email:</td>
              <td style="padding: 8px 0; color: #1a1a1a;">${buyerEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888;">Listing ID:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-family: monospace;">${listingId}</td>
            </tr>
          </table>
          <p style="color: #555;">
            Log in to CookMyShow to <strong>accept, reject, or counter</strong> this offer.
          </p>
        </div>
        <div style="background: #f5f5f5; padding: 16px; text-align: center; color: #999; font-size: 12px;">
          © 2025 CookMyShow. All rights reserved.
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Sends a booking confirmation email to the buyer.
 */
const sendBookingConfirmation = async ({ userEmail, userName, eventName, seats, bookingId }) => {
  const mailOptions = {
    from: `"CookMyShow" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `🎟️ Booking Confirmed – ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <div style="background: #7c3aed; padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">🎭 CookMyShow</h1>
        </div>
        <div style="padding: 32px;">
          <h2>Hi ${userName},</h2>
          <p>Your booking for <strong>${eventName}</strong> has been confirmed! 🎉</p>
          <p><strong>Booking ID:</strong> <span style="font-family: monospace;">${bookingId}</span></p>
          <p><strong>Seats:</strong> ${seats.join(', ')}</p>
          <p>You can view your QR ticket from the My Bookings section.</p>
        </div>
      </div>
    `,
  };

  // Use fire-and-forget — don't let email failures block the booking response
  transporter.sendMail(mailOptions).catch(err => {
    console.warn('[EMAIL] Booking confirmation failed:', err.message);
  });
};

module.exports = { sendOfferNotification, sendBookingConfirmation };

const { admin, db } = require('../config/firebase');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/auth/login
 * Body: { idToken: "<firebase-id-token>" }
 *
 * Verifies the Firebase ID token, upserts the user in Firestore,
 * and returns the user's profile.
 */
const login = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ success: false, message: 'idToken is required' });
  }

  // Verify token with Firebase Admin
  const decoded = await admin.auth().verifyIdToken(idToken);
  const { uid, email, name } = decoded;

  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();

  let userData;
  const { referralCode } = req.body;

  if (!userSnap.exists) {
    // 1. Generate unique referralCode for the user
    const myReferralCode = uid.substring(0, 8).toUpperCase();

    // 2. Handle optional referral from another user
    let referredBy = null;
    if (referralCode) {
      const referrerSnap = await db.collection('users')
        .where('myReferralCode', '==', referralCode.toUpperCase())
        .limit(1)
        .get();
      
      if (!referrerSnap.empty) {
        referredBy = referrerSnap.docs[0].id;
      }
    }

    // New user — create document
    userData = {
      userId:         uid,
      name:           name || email,
      email,
      myReferralCode,
      referredBy,
      coins:          0,
      hasBooked:      false,
      createdAt:      new Date().toISOString(),
    };
    await userRef.set(userData);
  } else {
    userData = userSnap.data();
    
    // BACKFILL: If an existing user is missing any referral/coin fields, update them
    let needsUpdate = false;
    const updates = {};

    if (!userData.myReferralCode) {
      updates.myReferralCode = uid.substring(0, 8).toUpperCase();
      needsUpdate = true;
    }
    if (userData.coins === undefined) {
      updates.coins = 0;
      needsUpdate = true;
    }
    if (userData.hasBooked === undefined) {
      updates.hasBooked = false;
      needsUpdate = true;
    }

    // Allow setting referredBy for existing users who don't have it yet AND haven't booked
    if (!userData.referredBy && !userData.hasBooked && referralCode) {
      const referrerSnap = await db.collection('users')
        .where('myReferralCode', '==', referralCode.toUpperCase())
        .limit(1)
        .get();
      
      if (!referrerSnap.empty) {
        updates.referredBy = referrerSnap.docs[0].id;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await userRef.update(updates);
      userData = { ...userData, ...updates };
    }
  }

  res.status(200).json({ success: true, user: userData });
});

module.exports = { login };

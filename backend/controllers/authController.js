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
  if (!userSnap.exists) {
    // New user — create document
    userData = {
      userId:    uid,
      name:      name || email,
      email,
      createdAt: new Date().toISOString(),
    };
    await userRef.set(userData);
  } else {
    userData = userSnap.data();
  }

  res.status(200).json({ success: true, user: userData });
});

module.exports = { login };

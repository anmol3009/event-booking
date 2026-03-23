const { db } = require('../config/firebase');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/users/profile
 * Returns the current authenticated user's profile from Firestore.
 */
const getProfile = asyncHandler(async (req, res) => {
  const { uid } = req.user;
  const userSnap = await db.collection('users').doc(uid).get();

  if (!userSnap.exists) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({ success: true, user: userSnap.data() });
});

/**
 * PUT /api/users/profile
 * Updates the current user's name in Firestore.
 * Body: { name: "New Name" }
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { uid } = req.user;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }

  await db.collection('users').doc(uid).update({ name });
  res.status(200).json({ success: true, message: 'Profile updated' });
});

module.exports = { getProfile, updateProfile };

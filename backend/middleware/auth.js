const { admin } = require('../config/firebase');

/**
 * Middleware: verifyAuth
 * Extracts "Authorization: Bearer <token>" header,
 * verifies the Firebase ID token, and attaches decoded user to req.user.
 */
const verifyAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid:   decoded.uid,
      email: decoded.email,
      name:  decoded.name || decoded.email,
    };
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = verifyAuth;

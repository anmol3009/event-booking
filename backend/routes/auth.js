const router = require('express').Router();
const { login } = require('../controllers/authController');

// POST /api/auth/login — Verify Firebase ID token and upsert user
router.post('/login', login);

module.exports = router;

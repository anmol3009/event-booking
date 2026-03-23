const router = require('express').Router();
const { getProfile, updateProfile } = require('../controllers/userController');
const verifyAuth = require('../middleware/auth');

router.get('/profile',  verifyAuth, getProfile);
router.put('/profile',  verifyAuth, updateProfile);

module.exports = router;

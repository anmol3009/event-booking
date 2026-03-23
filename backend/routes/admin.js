const router = require('express').Router();
const { getEventAnalytics, getAllEventsAdmin } = require('../controllers/adminController');
const verifyAuth = require('../middleware/auth');

// In production, add an admin-role check middleware here.
// For now, any authenticated user can access (extend as needed).
router.use(verifyAuth);

router.get('/events',                 getAllEventsAdmin);     // GET /api/admin/events
router.get('/analytics/:eventId',     getEventAnalytics);    // GET /api/admin/analytics/:eventId

module.exports = router;

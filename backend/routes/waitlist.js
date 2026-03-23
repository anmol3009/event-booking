const router = require('express').Router();
const { joinEventWaitlist, getWaitlist, getMyWaitlist } = require('../controllers/waitlistController');
const verifyAuth = require('../middleware/auth');

router.use(verifyAuth);

router.post('/',            joinEventWaitlist);    // POST /api/waitlist
router.get('/my',           getMyWaitlist);        // GET  /api/waitlist/my
router.get('/:eventId',     getWaitlist);          // GET  /api/waitlist/:eventId  (admin)

module.exports = router;

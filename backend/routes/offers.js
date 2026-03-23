const router = require('express').Router();
const { respondToOffer, getOffers } = require('../controllers/offerController');
const verifyAuth = require('../middleware/auth');

router.use(verifyAuth);

router.get('/',                       getOffers);         // GET  /api/offers?role=buyer|seller
router.post('/:offerId/respond',      respondToOffer);    // POST /api/offers/:id/respond

module.exports = router;

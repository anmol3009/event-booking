const router = require('express').Router();
const { createListing, getListings, getMyListings, buyListing } = require('../controllers/resaleController');
const { makeOffer } = require('../controllers/offerController');
const verifyAuth = require('../middleware/auth');

// GET /api/resale           — public listing view (no auth)
router.get('/', getListings);

// Auth-required actions
router.get('/my',                     verifyAuth, getMyListings);           // seller listing API
router.post('/',                      verifyAuth, createListing);          // create listing
router.post('/:listingId/buy',        verifyAuth, buyListing);             // direct buy
router.post('/:listingId/offer',      verifyAuth, makeOffer);              // make offer (triggers email)

module.exports = router;

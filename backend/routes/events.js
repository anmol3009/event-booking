const router = require('express').Router();
const { createEvent, getEvents, getEventById } = require('../controllers/eventController');
const verifyAuth = require('../middleware/auth');
const upload    = require('../utils/cloudinaryUpload');

// GET  /api/events         — list events (public, with optional date filter)
router.get('/', getEvents);

// GET  /api/events/:id     — single event + full seat map (public)
router.get('/:eventId', getEventById);

// POST /api/events         — create event (auth + image upload)
// "images" is the field name the frontend uses for file inputs
router.post('/', verifyAuth, upload.array('images', 5), createEvent);

module.exports = router;

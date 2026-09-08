const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { decode } = require('../controllers/vinController');

const router = express.Router();
router.get('/:vin', requireAuth, decode);

module.exports = router;

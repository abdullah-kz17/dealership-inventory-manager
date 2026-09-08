const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../controllers/uploadController');

const memoryUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();
router.post('/', requireAuth, memoryUpload.single('image'), upload);

module.exports = router;

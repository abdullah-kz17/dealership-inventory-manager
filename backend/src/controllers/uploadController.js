const { uploadImage } = require('../services/storageService');

async function upload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }
    const url = await uploadImage(req.file, req.user.tenantId);
    res.json({ success: true, data: { url } });
  } catch (err) {
    next(err);
  }
}

module.exports = { upload };

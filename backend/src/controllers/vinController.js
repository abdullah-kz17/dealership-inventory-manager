const { decodeVin } = require('../services/vinDecoderService');

async function decode(req, res, next) {
  try {
    const { vin } = req.params;
    const data = await decodeVin(vin);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { decode };

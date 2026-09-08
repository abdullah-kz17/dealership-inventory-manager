function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.status) {
    return res.status(err.status).json({ success: false, message: err.message, errors: err.errors });
  }

  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'A record with these unique values already exists' });
  }

  return res.status(500).json({ success: false, message: 'Internal server error' });
}

module.exports = errorHandler;

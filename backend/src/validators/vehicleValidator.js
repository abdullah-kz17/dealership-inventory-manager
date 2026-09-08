const { isValidVinFormat } = require('../services/vinDecoderService');

function validateVehiclePayload(body) {
  const errors = {};

  if (!isValidVinFormat(body.vin)) errors.vin = 'VIN must be exactly 17 valid characters';

  const year = Number(body.year);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) errors.year = 'Year must be a valid 4-digit year';

  if (!body.make || typeof body.make !== 'string') errors.make = 'Make is required';
  if (!body.model || typeof body.model !== 'string') errors.model = 'Model is required';

  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) errors.price = 'Price must be a non-negative number';

  const mileage = Number(body.mileage);
  if (!Number.isInteger(mileage) || mileage < 0) errors.mileage = 'Mileage must be a non-negative integer';

  if (!body.stockNumber || typeof body.stockNumber !== 'string') errors.stockNumber = 'Stock number is required';

  if (Object.keys(errors).length > 0) {
    const err = new Error('Validation failed');
    err.status = 400;
    err.errors = errors;
    throw err;
  }

  return {
    vin: body.vin.toUpperCase(),
    year,
    make: body.make.trim(),
    model: body.model.trim(),
    trim: body.trim ? String(body.trim).trim() : null,
    engine: body.engine ? String(body.engine).trim() : null,
    transmission: body.transmission ? String(body.transmission).trim() : null,
    drivetrain: body.drivetrain ? String(body.drivetrain).trim() : null,
    bodyStyle: body.bodyStyle ? String(body.bodyStyle).trim() : null,
    price,
    mileage,
    stockNumber: body.stockNumber.trim(),
    description: body.description ? String(body.description).trim() : null
  };
}

function validatePublicFilters(query) {
  const filters = {};

  if (query.make) filters.make = `%${query.make}%`;
  if (query.model) filters.model = `%${query.model}%`;

  const minPrice = Number(query.minPrice);
  const maxPrice = Number(query.maxPrice);
  if (!Number.isNaN(minPrice) && minPrice >= 0) filters.minPrice = minPrice;
  if (!Number.isNaN(maxPrice) && maxPrice >= 0) filters.maxPrice = maxPrice;
  if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
    delete filters.minPrice;
    delete filters.maxPrice;
  }

  const year = Number(query.year);
  if (Number.isInteger(year) && year >= 1900 && year <= 2100) filters.year = year;

  return filters;
}

module.exports = { validateVehiclePayload, validatePublicFilters };

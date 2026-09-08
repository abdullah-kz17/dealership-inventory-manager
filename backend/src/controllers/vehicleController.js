const vehicleService = require('../services/vehicleService');
const { validateVehiclePayload, validatePublicFilters } = require('../validators/vehicleValidator');

async function create(req, res, next) {
  try {
    const data = validateVehiclePayload(req.body);
    const imageUrls = Array.isArray(req.body.imageUrls) ? req.body.imageUrls.slice(0, 2) : [];

    if (imageUrls.length > 2) {
      return res.status(400).json({ success: false, message: 'A vehicle may have at most 2 images' });
    }

    const vehicle = await vehicleService.createVehicle(req.user.tenantId, data, imageUrls);
    res.status(201).json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = validateVehiclePayload(req.body);
    const vehicle = await vehicleService.updateVehicle(req.user.tenantId, req.params.id, data);
    res.json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const vehicles = await vehicleService.listVehiclesForTenant(req.user.tenantId);
    res.json({ success: true, data: vehicles });
  } catch (err) {
    next(err);
  }
}

async function listPublic(req, res, next) {
  try {
    const { tenantSlug } = req.params;
    if (!tenantSlug || typeof tenantSlug !== 'string') {
      return res.status(404).json({ success: false, message: 'Dealership not found' });
    }
    const filters = validatePublicFilters(req.query);
    const vehicles = await vehicleService.listPublicVehicles(tenantSlug, filters);
    res.json({ success: true, data: vehicles });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, update, listMine, listPublic };

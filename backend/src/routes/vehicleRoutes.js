const express = require('express');
const { requireAuth } = require('../middleware/auth');
const vehicleController = require('../controllers/vehicleController');

const router = express.Router();

router.get('/mine', requireAuth, vehicleController.listMine);
router.post('/', requireAuth, vehicleController.create);
router.put('/:id', requireAuth, vehicleController.update);

router.get('/public/:tenantSlug', vehicleController.listPublic);

module.exports = router;

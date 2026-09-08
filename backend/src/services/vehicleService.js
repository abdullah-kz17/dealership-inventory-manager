const pool = require('../config/db');

async function createVehicle(tenantId, data, imageUrls) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const vehicleResult = await client.query(
      `INSERT INTO vehicles
        (tenant_id, vin, year, make, model, trim, engine, transmission, drivetrain, body_style, price, mileage, stock_number, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        tenantId, data.vin, data.year, data.make, data.model, data.trim || null,
        data.engine || null, data.transmission || null, data.drivetrain || null,
        data.bodyStyle || null, data.price, data.mileage, data.stockNumber, data.description || null
      ]
    );

    const vehicle = vehicleResult.rows[0];

    for (let i = 0; i < imageUrls.length; i++) {
      await client.query(
        `INSERT INTO vehicle_images (vehicle_id, url, sort_order) VALUES ($1, $2, $3)`,
        [vehicle.id, imageUrls[i], i]
      );
    }

    await client.query('COMMIT');
    return vehicle;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateVehicle(tenantId, vehicleId, data) {
  const existing = await pool.query(
    'SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2',
    [vehicleId, tenantId]
  );
  if (existing.rows.length === 0) {
    const err = new Error('Vehicle not found');
    err.status = 404;
    throw err;
  }

  const result = await pool.query(
    `UPDATE vehicles SET
      year = $1, make = $2, model = $3, trim = $4, engine = $5, transmission = $6,
      drivetrain = $7, body_style = $8, price = $9, mileage = $10, stock_number = $11,
      description = $12, updated_at = now()
     WHERE id = $13 AND tenant_id = $14
     RETURNING *`,
    [
      data.year, data.make, data.model, data.trim || null, data.engine || null,
      data.transmission || null, data.drivetrain || null, data.bodyStyle || null,
      data.price, data.mileage, data.stockNumber, data.description || null,
      vehicleId, tenantId
    ]
  );

  return result.rows[0];
}

async function listVehiclesForTenant(tenantId) {
  const result = await pool.query(
    `SELECT v.*, COALESCE(
        json_agg(json_build_object('url', vi.url, 'sortOrder', vi.sort_order) ORDER BY vi.sort_order)
        FILTER (WHERE vi.id IS NOT NULL), '[]'
      ) AS images
     FROM vehicles v
     LEFT JOIN vehicle_images vi ON vi.vehicle_id = v.id
     WHERE v.tenant_id = $1
     GROUP BY v.id
     ORDER BY v.created_at DESC`,
    [tenantId]
  );
  return result.rows;
}

async function listPublicVehicles(tenantSlug, filters) {
  const conditions = ['t.slug = $1'];
  const params = [tenantSlug];
  let idx = 2;

  if (filters.make) {
    conditions.push(`v.make ILIKE $${idx++}`);
    params.push(filters.make);
  }
  if (filters.model) {
    conditions.push(`v.model ILIKE $${idx++}`);
    params.push(filters.model);
  }
  if (filters.minPrice !== undefined) {
    conditions.push(`v.price >= $${idx++}`);
    params.push(filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(`v.price <= $${idx++}`);
    params.push(filters.maxPrice);
  }
  if (filters.year !== undefined) {
    conditions.push(`v.year = $${idx++}`);
    params.push(filters.year);
  }

  const result = await pool.query(
    `SELECT v.*, COALESCE(
        json_agg(json_build_object('url', vi.url, 'sortOrder', vi.sort_order) ORDER BY vi.sort_order)
        FILTER (WHERE vi.id IS NOT NULL), '[]'
      ) AS images
     FROM vehicles v
     JOIN tenants t ON t.id = v.tenant_id
     LEFT JOIN vehicle_images vi ON vi.vehicle_id = v.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY v.id
     ORDER BY v.created_at DESC`,
    params
  );
  return result.rows;
}

module.exports = { createVehicle, updateVehicle, listVehiclesForTenant, listPublicVehicles };

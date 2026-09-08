// One-off seed script for demo/test data. Run with: node scripts/seed.js
// Uses the existing backend/.env credentials - not committed with real data.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

const DEMO_PASSWORD = 'Admin@1234';

const tenants = [
  {
    slug: 'demo-dealer',
    name: 'Demo Dealer',
    adminEmail: 'admin@demo-dealer.com',
    vehicles: [
      {
        vin: '1HGCM82633A004352',
        year: 2003, make: 'Honda', model: 'Accord', trim: 'EX',
        engine: 'V6', transmission: 'Automatic', drivetrain: 'FWD', bodyStyle: 'Sedan',
        price: 6500, mileage: 128000, stockNumber: 'DD-1001',
        description: 'Clean title, well maintained, single owner.',
        images: [
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800'
        ]
      },
      {
        vin: '2FMDK3GC4CBA12345',
        year: 2012, make: 'Ford', model: 'Edge', trim: 'SEL',
        engine: 'V6', transmission: 'Automatic', drivetrain: 'AWD', bodyStyle: 'SUV',
        price: 9800, mileage: 96000, stockNumber: 'DD-1002',
        description: 'AWD, leather seats, recent service.',
        images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800']
      }
    ]
  },
  {
    slug: 'second-dealer',
    name: 'Second Dealer Motors',
    adminEmail: 'admin@second-dealer.com',
    vehicles: [
      {
        vin: '1FTFW1ET5BFC12345',
        year: 2011, make: 'Ford', model: 'F-150', trim: 'XLT',
        engine: 'V8', transmission: 'Automatic', drivetrain: '4WD', bodyStyle: 'Pickup',
        price: 14500, mileage: 112000, stockNumber: 'SD-2001',
        description: 'Tow package, bed liner, runs great.',
        images: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800']
      },
      {
        vin: '3VWDX7AJ5DM123456',
        year: 2013, make: 'Volkswagen', model: 'Jetta', trim: 'SE',
        engine: 'I4', transmission: 'Automatic', drivetrain: 'FWD', bodyStyle: 'Sedan',
        price: 7200, mileage: 89000, stockNumber: 'SD-2002',
        description: 'Fuel efficient commuter, new tires.',
        images: [
          'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800',
          'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800'
        ]
      }
    ]
  }
];

async function upsertTenant(client, tenant) {
  const existing = await client.query('SELECT id FROM tenants WHERE slug = $1', [tenant.slug]);
  if (existing.rows.length > 0) return existing.rows[0].id;

  const result = await client.query(
    'INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING id',
    [tenant.name, tenant.slug]
  );
  return result.rows[0].id;
}

async function upsertAdmin(client, tenantId, email) {
  const existing = await client.query('SELECT id FROM admin_users WHERE tenant_id = $1 AND email = $2', [tenantId, email]);
  if (existing.rows.length > 0) return;

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await client.query(
    'INSERT INTO admin_users (tenant_id, email, password_hash) VALUES ($1, $2, $3)',
    [tenantId, email, passwordHash]
  );
}

async function upsertVehicle(client, tenantId, vehicle) {
  const existing = await client.query(
    'SELECT id FROM vehicles WHERE tenant_id = $1 AND stock_number = $2',
    [tenantId, vehicle.stockNumber]
  );
  if (existing.rows.length > 0) {
    console.log(`  Skipped (already exists): ${vehicle.stockNumber}`);
    return;
  }

  const result = await client.query(
    `INSERT INTO vehicles
      (tenant_id, vin, year, make, model, trim, engine, transmission, drivetrain, body_style, price, mileage, stock_number, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING id`,
    [
      tenantId, vehicle.vin, vehicle.year, vehicle.make, vehicle.model, vehicle.trim,
      vehicle.engine, vehicle.transmission, vehicle.drivetrain, vehicle.bodyStyle,
      vehicle.price, vehicle.mileage, vehicle.stockNumber, vehicle.description
    ]
  );

  const vehicleId = result.rows[0].id;
  for (let i = 0; i < vehicle.images.length; i++) {
    await client.query(
      'INSERT INTO vehicle_images (vehicle_id, url, sort_order) VALUES ($1, $2, $3)',
      [vehicleId, vehicle.images[i], i]
    );
  }
  console.log(`  Added: ${vehicle.stockNumber} (${vehicle.year} ${vehicle.make} ${vehicle.model})`);
}

async function seed() {
  const client = await pool.connect();
  try {
    for (const tenant of tenants) {
      console.log(`Tenant: ${tenant.slug}`);
      const tenantId = await upsertTenant(client, tenant);
      await upsertAdmin(client, tenantId, tenant.adminEmail);
      for (const vehicle of tenant.vehicles) {
        await upsertVehicle(client, tenantId, vehicle);
      }
    }
    console.log('\nDone. Login credentials for both tenants:');
    for (const tenant of tenants) {
      console.log(`  ${tenant.adminEmail} / ${DEMO_PASSWORD}  ->  /dealer/${tenant.slug}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

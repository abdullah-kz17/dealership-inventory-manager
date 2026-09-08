-- Multi-tenant auto dealership inventory schema
-- Postgres (Supabase)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Dealerships. Every other table hangs off tenant_id.
CREATE TABLE tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin/staff accounts, one dealership each.
CREATE TABLE admin_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    password_hash   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, email)
);

CREATE TABLE vehicles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vin             TEXT NOT NULL,
    year            INTEGER NOT NULL CHECK (year BETWEEN 1900 AND 2100),
    make            TEXT NOT NULL,
    model           TEXT NOT NULL,
    trim            TEXT,
    engine          TEXT,
    transmission    TEXT,
    drivetrain      TEXT,
    body_style      TEXT,
    price           NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    mileage         INTEGER NOT NULL CHECK (mileage >= 0),
    stock_number    TEXT NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, stock_number)
);

CREATE TABLE vehicle_images (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    sort_order  SMALLINT NOT NULL DEFAULT 0 CHECK (sort_order IN (0, 1))
);

-- Multi-tenant filtering: every vehicle list/search query filters by tenant_id first.
CREATE INDEX idx_vehicles_tenant ON vehicles (tenant_id);

-- Public showroom filters: make, price, year within a tenant's inventory.
CREATE INDEX idx_vehicles_tenant_make ON vehicles (tenant_id, make);
CREATE INDEX idx_vehicles_tenant_price ON vehicles (tenant_id, price);
CREATE INDEX idx_vehicles_tenant_year ON vehicles (tenant_id, year);

CREATE INDEX idx_vehicle_images_vehicle ON vehicle_images (vehicle_id);

-- Enforce max 2 images per vehicle (spec: 1 to 2 images).
CREATE OR REPLACE FUNCTION check_vehicle_image_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM vehicle_images WHERE vehicle_id = NEW.vehicle_id) >= 2 THEN
        RAISE EXCEPTION 'A vehicle may have at most 2 images';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vehicle_image_limit
BEFORE INSERT ON vehicle_images
FOR EACH ROW EXECUTE FUNCTION check_vehicle_image_limit();

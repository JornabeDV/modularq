-- Fix: agregar default a updated_at en tablas de órdenes de compra
-- Ejecutar si ya creaste las tablas y te da error de NOT NULL en updated_at

ALTER TABLE "suppliers" 
    ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "purchase_orders" 
    ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- Opcional: actualizar filas existentes que tengan updated_at en null
UPDATE "suppliers" SET "updated_at" = CURRENT_TIMESTAMP WHERE "updated_at" IS NULL;
UPDATE "purchase_orders" SET "updated_at" = CURRENT_TIMESTAMP WHERE "updated_at" IS NULL;

-- Migración: agregar columna tax_pct a ítems de órdenes de compra
-- Ejecutar en SQL Editor de Supabase (producción/desarrollo)
-- Es idempotente: se puede ejecutar varias veces sin errores

BEGIN;

ALTER TABLE "purchase_order_items"
ADD COLUMN IF NOT EXISTS "tax_pct" DOUBLE PRECISION NOT NULL DEFAULT 21;

COMMIT;

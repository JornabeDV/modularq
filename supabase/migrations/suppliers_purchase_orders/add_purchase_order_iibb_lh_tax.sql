-- Migración: agregar impuesto Percepción IIBB y LH a órdenes de compra
-- Ejecutar en SQL Editor de Supabase (producción/desarrollo)
-- Es idempotente: se puede ejecutar varias veces sin errores

BEGIN;

ALTER TABLE "purchase_orders"
ADD COLUMN IF NOT EXISTS "iibb_lh_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "iibb_lh_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;

COMMIT;

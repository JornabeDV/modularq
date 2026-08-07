-- Agrega soporte de moneda principal/secundaria a materiales y órdenes de compra,
-- y permite guardar la moneda en pedidos de materiales.
-- Ejecutar manualmente en Supabase SQL Editor.

-- ========================================
-- Materiales
-- ========================================
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS unit_price_ars DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS exchange_rate DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS exchange_rate_date TIMESTAMPTZ;

-- Para materiales existentes, asumimos ARS y copiamos unit_price a unit_price_ars.
UPDATE public.materials
SET
  currency = 'ARS',
  unit_price_ars = unit_price,
  exchange_rate = NULL,
  exchange_rate_date = NULL
WHERE currency IS NULL OR unit_price_ars IS NULL;

-- ========================================
-- Pedidos de materiales
-- ========================================
ALTER TABLE public.purchase_requests
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'ARS';

UPDATE public.purchase_requests
SET currency = 'ARS'
WHERE currency IS NULL;

-- ========================================
-- Órdenes de compra
-- ========================================
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS total_ars DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS exchange_rate DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS exchange_rate_date TIMESTAMPTZ;

-- Para órdenes existentes, asumimos ARS y copiamos total a total_ars.
UPDATE public.purchase_orders
SET
  currency = 'ARS',
  total_ars = total,
  exchange_rate = NULL,
  exchange_rate_date = NULL
WHERE currency IS NULL OR total_ars IS NULL;

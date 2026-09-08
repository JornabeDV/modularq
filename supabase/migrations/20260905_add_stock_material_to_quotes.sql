-- Agrega soporte para cotizar materiales de stock como ítems de cotización.
-- Ejecutar manualmente en Supabase SQL Editor.
-- Es idempotente: se puede ejecutar varias veces sin errores.

-- 1. Crear el enum quote_item_type si no existe (para futuras columas que usen el tipo)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_item_type') THEN
    CREATE TYPE "quote_item_type" AS ENUM ('standard_module', 'custom_module', 'service', 'stock_material');
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum
      WHERE enumlabel = 'stock_material'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'quote_item_type')
    ) THEN
      ALTER TYPE "quote_item_type" ADD VALUE 'stock_material';
    END IF;
  END IF;
END $$;

-- 2. Actualizar el CHECK constraint quote_items_type_check para incluir 'stock_material'
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'quote_items' AND constraint_name = 'quote_items_type_check'
  ) INTO constraint_exists;

  IF constraint_exists THEN
    ALTER TABLE public.quote_items DROP CONSTRAINT IF EXISTS quote_items_type_check;
    ALTER TABLE public.quote_items ADD CONSTRAINT quote_items_type_check
      CHECK (type IN ('standard_module', 'custom_module', 'service', 'stock_material'));
  END IF;
END $$;

-- 3. Agregar columna material_id a quote_items (si la tabla existe)
ALTER TABLE IF EXISTS public.quote_items
  ADD COLUMN IF NOT EXISTS material_id UUID;

-- 4. Index para consultas por material
CREATE INDEX IF NOT EXISTS idx_quote_items_material_id
  ON public.quote_items (material_id)
  WHERE material_id IS NOT NULL;

-- 5. Agregar columna precio_venta a materials (precio de venta en la moneda del material)
ALTER TABLE IF EXISTS public.materials
  ADD COLUMN IF NOT EXISTS precio_venta double precision;

-- 6. (Opcional) Sincronizar precio_venta con unit_price para materiales existentes
-- que no tengan precio_venta definido (usa el precio de costo como precio de venta inicial)
UPDATE public.materials
  SET precio_venta = unit_price
  WHERE precio_venta IS NULL
  AND unit_price IS NOT NULL
  AND unit_price > 0;

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS discount_pct double precision NOT NULL DEFAULT 0;
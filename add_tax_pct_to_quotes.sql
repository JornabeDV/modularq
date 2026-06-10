-- Agregar columna tax_pct a quotes para soporte de IVA configurable (21% o 10.5%)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS tax_pct FLOAT DEFAULT 21;

-- Actualizar cotizaciones existentes para que usen 21% por defecto
UPDATE quotes SET tax_pct = 21 WHERE tax_pct IS NULL;

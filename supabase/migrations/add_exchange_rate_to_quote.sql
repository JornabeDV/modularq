-- Agregar columna exchange_rate a la tabla quotes
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "exchange_rate" DOUBLE PRECISION;

-- Agregar columna exchange_rate_date a la tabla quotes
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "exchange_rate_date" TIMESTAMP(3);

-- Agregar columna total_ars a la tabla quotes (nullable, sin default)
-- total_ars = null  => semántica vieja: total está en ARS
-- total_ars != null => semántica nueva: total está en moneda original, total_ars en ARS
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "total_ars" DOUBLE PRECISION;

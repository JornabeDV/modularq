-- Agregar columna brand a la tabla materials
ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "brand" TEXT;

-- Actualizar la política RLS si es necesaria (la tabla ya tiene políticas)
-- No se requieren cambios adicionales en RLS ya que la columna brand es de lectura/escritura pública

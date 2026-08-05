-- Migración: relación muchos-a-muchos entre cotizaciones y proyectos
-- Ejecutar en Supabase SQL Editor o psql antes de que el código nuevo use quote_projects

BEGIN;

-- 1. Crear tabla intermedia
-- Nota: en la base de datos real, quotes.id y projects.id son UUID,
-- por lo que ambas columnas de la FK deben ser UUID.
CREATE TABLE IF NOT EXISTS quote_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (quote_id, project_id)
);

-- 2. Migrar relaciones existentes de projects.quote_id -> quote_projects
-- Se fuerza el cast a UUID porque projects.quote_id es UUID en la base de datos.
INSERT INTO quote_projects (quote_id, project_id)
SELECT quote_id::UUID, id::UUID
FROM projects
WHERE quote_id IS NOT NULL
ON CONFLICT (quote_id, project_id) DO NOTHING;

-- 3. Eliminar columna legacy (después de verificar que la migración fue exitosa)
-- ALTER TABLE projects DROP COLUMN IF EXISTS quote_id;

COMMIT;

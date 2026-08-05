-- =====================================================
-- MIGRACIÓN: Categorías de materiales editables
-- Convierte el enum fijo MaterialCategory en una tabla relacional
-- Ejecutar en SQL Editor de Supabase (producción/desarrollo)
-- Es idempotente: se puede ejecutar varias veces sin errores
-- =====================================================

-- 1. Crear tabla de categorías de materiales
CREATE TABLE IF NOT EXISTS "material_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "code_prefix" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3) WITH TIME ZONE,
    "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "material_categories_name_key" UNIQUE ("name"),
    CONSTRAINT "material_categories_slug_key" UNIQUE ("slug"),
    CONSTRAINT "material_categories_code_prefix_key" UNIQUE ("code_prefix")
);

-- 2. Insertar las categorías actuales del enum (idempotente por slug)
INSERT INTO "material_categories" ("id", "name", "slug", "code_prefix", "order")
VALUES
    (gen_random_uuid()::text, 'Estructura', 'estructura', 'EST', 0),
    (gen_random_uuid()::text, 'Paneles', 'paneles', 'PAN', 0),
    (gen_random_uuid()::text, 'Herrajes', 'herrajes', 'HER', 0),
    (gen_random_uuid()::text, 'Aislación', 'aislacion', 'AIS', 0),
    (gen_random_uuid()::text, 'Electricidad', 'electricidad', 'ELE', 0),
    (gen_random_uuid()::text, 'Sanitarios', 'sanitarios', 'SAN', 0),
    (gen_random_uuid()::text, 'Otros', 'otros', 'OTR', 0),
    (gen_random_uuid()::text, 'Adicionales', 'adicional', 'ADI', 0)
ON CONFLICT ("slug") DO NOTHING;

-- 3. Agregar columna category_id a materials si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'materials' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE "materials" ADD COLUMN "category_id" TEXT;
    END IF;
END$$;

-- 4. Migrar datos: asignar category_id según el valor actual del enum
UPDATE "materials" m
SET "category_id" = c.id
FROM "material_categories" c
WHERE m.category::text = c.slug
  AND m."category_id" IS NULL;

-- 5. Forzar category_id NOT NULL una vez migrados todos los datos
ALTER TABLE "materials" ALTER COLUMN "category_id" SET NOT NULL;

-- 6. Eliminar la columna del enum viejo (ya no se usa y sigue siendo NOT NULL)
-- Si falla por alguna dependencia, ejecutar primero:
-- ALTER TABLE "materials" ALTER COLUMN "category" DROP NOT NULL;
-- ALTER TABLE "materials" DROP COLUMN IF EXISTS "category";

-- 7. Foreign key de materials.category_id -> material_categories.id (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'materials_category_id_fkey'
    ) THEN
        ALTER TABLE "materials"
            ADD CONSTRAINT "materials_category_id_fkey"
            FOREIGN KEY ("category_id") REFERENCES "material_categories"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END$$;

-- 8. Índices para performance
CREATE INDEX IF NOT EXISTS "materials_category_id_idx" ON "materials"("category_id");
CREATE INDEX IF NOT EXISTS "material_categories_deleted_at_idx" ON "material_categories"("deleted_at");

-- 9. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_material_categories_updated_at ON "material_categories";
CREATE TRIGGER update_material_categories_updated_at
    BEFORE UPDATE ON "material_categories"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Row Level Security (RLS)
ALTER TABLE "material_categories" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "material_categories_all" ON "material_categories";
CREATE POLICY "material_categories_all"
    ON "material_categories"
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- 11. Eliminar el enum antiguo (solo si ya no se usa)
-- Nota: este paso fallará si todavía hay columnas u objetos que dependan del enum.
-- Tras verificar que materials.category fue reemplazado por category_id, ejecutar:
-- DROP TYPE IF EXISTS "MaterialCategory";

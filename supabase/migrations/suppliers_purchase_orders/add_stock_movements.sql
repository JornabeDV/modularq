-- =====================================================
-- MIGRACIÓN: Historial de movimientos de stock
-- Ejecutar en SQL Editor de Supabase (producción/desarrollo)
-- Es idempotente: se puede ejecutar varias veces sin errores
-- =====================================================

-- 1. Crear enums de tipos y orígenes de movimiento
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StockMovementType') THEN
        CREATE TYPE "StockMovementType" AS ENUM ('in', 'out', 'adjustment');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StockMovementSource') THEN
        CREATE TYPE "StockMovementSource" AS ENUM (
            'purchase_receipt',
            'project_assignment',
            'project_removal',
            'project_update',
            'manual_adjustment',
            'initial_stock'
        );
    END IF;
END$$;

-- 2. Crear tabla de movimientos de stock
CREATE TABLE IF NOT EXISTS "stock_movements" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "material_id" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "stock_after" DOUBLE PRECISION NOT NULL,
    "source_type" "StockMovementSource" NOT NULL,
    "source_id" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- 3. Índices
-- Nota: no se agrega FK sobre material_id porque materials.id es uuid
-- y stock_movements.material_id es text. La integridad se maneja en la app.
DROP INDEX IF EXISTS "stock_movements_material_id_created_at_idx";
CREATE INDEX "stock_movements_material_id_created_at_idx"
    ON "stock_movements"("material_id", "created_at" DESC);

DROP INDEX IF EXISTS "stock_movements_source_type_source_id_idx";
CREATE INDEX "stock_movements_source_type_source_id_idx"
    ON "stock_movements"("source_type", "source_id");

-- 4. Generar movimientos iniciales para stock existente
INSERT INTO "stock_movements" (
    "material_id",
    "type",
    "quantity",
    "stock_after",
    "source_type",
    "source_id",
    "reference",
    "notes"
)
SELECT
    "id" AS "material_id",
    'in' AS "type",
    "stock_quantity" AS "quantity",
    "stock_quantity" AS "stock_after",
    'initial_stock' AS "source_type",
    NULL AS "source_id",
    'Stock inicial' AS "reference",
    'Movimiento generado automáticamente al crear el historial de stock' AS "notes"
FROM "materials"
WHERE "stock_quantity" > 0
    AND NOT EXISTS (
        SELECT 1 FROM "stock_movements"
        WHERE "stock_movements"."material_id" = "materials"."id"::text
        AND "stock_movements"."source_type" = 'initial_stock'
    );

-- 5. Row Level Security (RLS)
ALTER TABLE "stock_movements" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_movements_all" ON "stock_movements";
CREATE POLICY "stock_movements_all"
    ON "stock_movements"
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

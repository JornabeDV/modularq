-- Agregar columna delivery_conditions a tabla existente de remitos
-- Ejecutar en SQL Editor de Supabase si ya creaste las tablas antes de esta columna
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'delivery_receipts'
          AND column_name = 'delivery_conditions'
    ) THEN
        ALTER TABLE "delivery_receipts" ADD COLUMN "delivery_conditions" JSONB;
    END IF;
END $$;

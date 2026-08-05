-- =====================================================
-- MIGRACIÓN: Módulo de Remitos de Entrega
-- Ejecutar en SQL Editor de Supabase (producción/desarrollo)
-- Es idempotente: se puede ejecutar varias veces sin errores
-- =====================================================

-- 1. Tabla de remitos de entrega
CREATE TABLE IF NOT EXISTS "delivery_receipts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "number" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'sale',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "client_id" TEXT,
    "client_name" TEXT NOT NULL,
    "client_company" TEXT,
    "client_phone" TEXT,
    "client_email" TEXT,
    "delivery_address" TEXT,
    "issue_date" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivery_date" TIMESTAMP(3) WITH TIME ZONE,
    "notes" TEXT,
    "delivery_conditions" JSONB,
    "notes_list" JSONB,
    "pdf_url" TEXT,
    "created_by" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) WITH TIME ZONE,
    "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_receipts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "delivery_receipts_number_key" UNIQUE ("number")
);

-- 1b. Agregar columna delivery_conditions si la tabla ya existía sin ella
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

-- 2. Tabla de ítems de remito
CREATE TABLE IF NOT EXISTS "delivery_receipt_items" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "delivery_receipt_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "standard_module_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "module_description" JSONB,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "delivery_receipt_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "delivery_receipt_items_delivery_receipt_id_fkey"
        FOREIGN KEY ("delivery_receipt_id") REFERENCES "delivery_receipts"("id") ON DELETE CASCADE
);

-- 3. Tabla de adjuntos de ítems de remito
CREATE TABLE IF NOT EXISTS "delivery_receipt_item_attachments" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "receipt_item_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_receipt_item_attachments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "delivery_receipt_item_attachments_receipt_item_id_fkey"
        FOREIGN KEY ("receipt_item_id") REFERENCES "delivery_receipt_items"("id") ON DELETE CASCADE
);

-- 4. Tabla de adicionales de ítems de remito
CREATE TABLE IF NOT EXISTS "delivery_receipt_additionals" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "receipt_item_id" TEXT NOT NULL,
    "material_id" TEXT,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "delivery_receipt_additionals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "delivery_receipt_additionals_receipt_item_id_fkey"
        FOREIGN KEY ("receipt_item_id") REFERENCES "delivery_receipt_items"("id") ON DELETE CASCADE
);

-- 5. Índices
DROP INDEX IF EXISTS "delivery_receipts_status_created_at_idx";
CREATE INDEX "delivery_receipts_status_created_at_idx"
    ON "delivery_receipts"("status", "created_at" DESC);

DROP INDEX IF EXISTS "delivery_receipts_client_id_idx";
CREATE INDEX "delivery_receipts_client_id_idx"
    ON "delivery_receipts"("client_id");

DROP INDEX IF EXISTS "delivery_receipt_items_receipt_id_idx";
CREATE INDEX "delivery_receipt_items_receipt_id_idx"
    ON "delivery_receipt_items"("delivery_receipt_id");

-- 6. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_delivery_receipts_updated_at ON "delivery_receipts";
CREATE TRIGGER update_delivery_receipts_updated_at
    BEFORE UPDATE ON "delivery_receipts"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_receipt_item_attachments_updated_at ON "delivery_receipt_item_attachments";
CREATE TRIGGER update_delivery_receipt_item_attachments_updated_at
    BEFORE UPDATE ON "delivery_receipt_item_attachments"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Row Level Security (RLS)
ALTER TABLE "delivery_receipts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "delivery_receipt_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "delivery_receipt_item_attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "delivery_receipt_additionals" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delivery_receipts_all" ON "delivery_receipts";
CREATE POLICY "delivery_receipts_all"
    ON "delivery_receipts"
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "delivery_receipt_items_all" ON "delivery_receipt_items";
CREATE POLICY "delivery_receipt_items_all"
    ON "delivery_receipt_items"
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "delivery_receipt_item_attachments_all" ON "delivery_receipt_item_attachments";
CREATE POLICY "delivery_receipt_item_attachments_all"
    ON "delivery_receipt_item_attachments"
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "delivery_receipt_additionals_all" ON "delivery_receipt_additionals";
CREATE POLICY "delivery_receipt_additionals_all"
    ON "delivery_receipt_additionals"
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

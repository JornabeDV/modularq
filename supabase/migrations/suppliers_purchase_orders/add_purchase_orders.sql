-- =====================================================
-- MIGRACIÓN: Módulo de Órdenes de Compra y Proveedores
-- Ejecutar en SQL Editor de Supabase (producción/desarrollo)
-- Es idempotente: se puede ejecutar varias veces sin errores
-- =====================================================

-- 1. Crear enum de estados de orden de compra (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PurchaseOrderStatus') THEN
        CREATE TYPE "PurchaseOrderStatus" AS ENUM ('draft', 'pending', 'approved', 'partial_received', 'received', 'cancelled');
    ELSE
        -- Asegurar que el valor 'partial_received' exista en entornos donde el enum fue creado sin él
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PurchaseOrderStatus')
            AND enumlabel = 'partial_received'
        ) THEN
            ALTER TYPE "PurchaseOrderStatus" ADD VALUE 'partial_received' AFTER 'approved';
        END IF;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PurchaseRequestStatus') THEN
        CREATE TYPE "PurchaseRequestStatus" AS ENUM ('draft', 'pending', 'quoted', 'approved', 'rejected', 'cancelled');
    END IF;
END$$;

-- 2. Crear tabla de proveedores
CREATE TABLE IF NOT EXISTS "suppliers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "cuit" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- 3. Crear tabla de pedidos de materiales
CREATE TABLE IF NOT EXISTS "purchase_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "request_number" TEXT NOT NULL,
    "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "purchase_requests_request_number_key" UNIQUE ("request_number")
);

-- 4. Crear tabla de ítems de pedido de materiales
CREATE TABLE IF NOT EXISTS "purchase_request_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchase_request_id" UUID NOT NULL,
    "material_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "purchase_request_items_pkey" PRIMARY KEY ("id")
);

-- 5. Crear tabla de presupuestos de proveedores
CREATE TABLE IF NOT EXISTS "supplier_quotes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchase_request_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quote_date" TIMESTAMP(3) WITH TIME ZONE,
    "valid_until" TIMESTAMP(3) WITH TIME ZONE,
    "file_url" TEXT,
    "file_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_quotes_pkey" PRIMARY KEY ("id")
);

-- 6. Crear tabla de órdenes de compra
CREATE TABLE IF NOT EXISTS "purchase_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_number" TEXT NOT NULL,
    "supplier_id" UUID NOT NULL,
    "purchase_request_id" UUID,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'draft',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax_pct" DOUBLE PRECISION NOT NULL DEFAULT 21,
    "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payment_terms" TEXT,
    "delivery_terms" TEXT,
    "delivery_date" TIMESTAMP(3) WITH TIME ZONE,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_at" TIMESTAMP(3) WITH TIME ZONE,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "purchase_orders_order_number_key" UNIQUE ("order_number")
);

-- 7. Crear tabla de ítems de orden de compra
CREATE TABLE IF NOT EXISTS "purchase_order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchase_order_id" UUID NOT NULL,
    "material_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- 8. Crear tabla de adjuntos de orden de compra
CREATE TABLE IF NOT EXISTS "purchase_order_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchase_order_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT,
    "uploaded_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_attachments_pkey" PRIMARY KEY ("id")
);

-- 9. Crear tabla de recepciones de orden de compra
CREATE TABLE IF NOT EXISTS "purchase_order_receipts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchase_order_id" UUID NOT NULL,
    "receipt_number" TEXT,
    "remito_number" TEXT,
    "remito_file_url" TEXT,
    "remito_file_name" TEXT,
    "notes" TEXT,
    "received_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_receipts_pkey" PRIMARY KEY ("id")
);

-- 10. Crear tabla de ítems de recepción
CREATE TABLE IF NOT EXISTS "purchase_order_receipt_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "receipt_id" UUID NOT NULL,
    "purchase_order_item_id" UUID NOT NULL,
    "material_id" UUID,
    "description" TEXT NOT NULL,
    "quantity_received" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "purchase_order_receipt_items_pkey" PRIMARY KEY ("id")
);

-- 11. Foreign keys (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'purchase_orders_supplier_id_fkey'
    ) THEN
        ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey"
            FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'purchase_orders_purchase_request_id_fkey'
    ) THEN
        ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_purchase_request_id_fkey"
            FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'purchase_order_items_purchase_order_id_fkey'
    ) THEN
        ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey"
            FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'purchase_order_items_material_id_fkey'
    ) THEN
        ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_material_id_fkey"
            FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'purchase_order_attachments_purchase_order_id_fkey'
    ) THEN
        ALTER TABLE "purchase_order_attachments" ADD CONSTRAINT "purchase_order_attachments_purchase_order_id_fkey"
            FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'purchase_requests_items_purchase_request_id_fkey'
    ) THEN
        ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_requests_items_purchase_request_id_fkey"
            FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'purchase_request_items_material_id_fkey'
    ) THEN
        ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_request_items_material_id_fkey"
            FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'supplier_quotes_purchase_request_id_fkey'
    ) THEN
        ALTER TABLE "supplier_quotes" ADD CONSTRAINT "supplier_quotes_purchase_request_id_fkey"
            FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'supplier_quotes_supplier_id_fkey'
    ) THEN
        ALTER TABLE "supplier_quotes" ADD CONSTRAINT "supplier_quotes_supplier_id_fkey"
            FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'purchase_order_receipts_purchase_order_id_fkey'
    ) THEN
        ALTER TABLE "purchase_order_receipts" ADD CONSTRAINT "purchase_order_receipts_purchase_order_id_fkey"
            FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'purchase_order_receipt_items_receipt_id_fkey'
    ) THEN
        ALTER TABLE "purchase_order_receipt_items" ADD CONSTRAINT "purchase_order_receipt_items_receipt_id_fkey"
            FOREIGN KEY ("receipt_id") REFERENCES "purchase_order_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'purchase_order_receipt_items_purchase_order_item_id_fkey'
    ) THEN
        ALTER TABLE "purchase_order_receipt_items" ADD CONSTRAINT "purchase_order_receipt_items_purchase_order_item_id_fkey"
            FOREIGN KEY ("purchase_order_item_id") REFERENCES "purchase_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'purchase_order_receipt_items_material_id_fkey'
    ) THEN
        ALTER TABLE "purchase_order_receipt_items" ADD CONSTRAINT "purchase_order_receipt_items_material_id_fkey"
            FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;

-- 12. Índices para performance (idempotente)
CREATE INDEX IF NOT EXISTS "purchase_orders_supplier_id_idx" ON "purchase_orders"("supplier_id");
CREATE INDEX IF NOT EXISTS "purchase_orders_purchase_request_id_idx" ON "purchase_orders"("purchase_request_id");
CREATE INDEX IF NOT EXISTS "purchase_orders_status_idx" ON "purchase_orders"("status");
CREATE INDEX IF NOT EXISTS "purchase_order_items_purchase_order_id_idx" ON "purchase_order_items"("purchase_order_id");
CREATE INDEX IF NOT EXISTS "purchase_order_items_material_id_idx" ON "purchase_order_items"("material_id");
CREATE INDEX IF NOT EXISTS "purchase_order_attachments_purchase_order_id_idx" ON "purchase_order_attachments"("purchase_order_id");
CREATE INDEX IF NOT EXISTS "purchase_requests_status_idx" ON "purchase_requests"("status");
CREATE INDEX IF NOT EXISTS "purchase_request_items_purchase_request_id_idx" ON "purchase_request_items"("purchase_request_id");
CREATE INDEX IF NOT EXISTS "purchase_request_items_material_id_idx" ON "purchase_request_items"("material_id");
CREATE INDEX IF NOT EXISTS "supplier_quotes_purchase_request_id_idx" ON "supplier_quotes"("purchase_request_id");
CREATE INDEX IF NOT EXISTS "supplier_quotes_supplier_id_idx" ON "supplier_quotes"("supplier_id");
CREATE INDEX IF NOT EXISTS "purchase_order_receipts_purchase_order_id_idx" ON "purchase_order_receipts"("purchase_order_id");
CREATE INDEX IF NOT EXISTS "purchase_order_receipt_items_receipt_id_idx" ON "purchase_order_receipt_items"("receipt_id");
CREATE INDEX IF NOT EXISTS "purchase_order_receipt_items_purchase_order_item_id_idx" ON "purchase_order_receipt_items"("purchase_order_item_id");
CREATE INDEX IF NOT EXISTS "purchase_order_receipt_items_material_id_idx" ON "purchase_order_receipt_items"("material_id");

-- 8. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON "suppliers";
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON "suppliers"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON "purchase_orders";
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON "purchase_orders"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_requests_updated_at ON "purchase_requests";
CREATE TRIGGER update_purchase_requests_updated_at BEFORE UPDATE ON "purchase_requests"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_supplier_quotes_updated_at ON "supplier_quotes";
CREATE TRIGGER update_supplier_quotes_updated_at BEFORE UPDATE ON "supplier_quotes"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Row Level Security (RLS)
-- Habilitar RLS
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_order_attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_request_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "supplier_quotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_order_receipts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_order_receipt_items" ENABLE ROW LEVEL SECURITY;

-- Políticas para rol anon (como usa el backend con anonKey)
DROP POLICY IF EXISTS "suppliers_all" ON "suppliers";
CREATE POLICY "suppliers_all"
    ON "suppliers"
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "purchase_orders_all" ON "purchase_orders";
CREATE POLICY "purchase_orders_all"
    ON "purchase_orders"
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "purchase_order_items_all" ON "purchase_order_items";
CREATE POLICY "purchase_order_items_all"
    ON "purchase_order_items"
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "purchase_order_attachments_all" ON "purchase_order_attachments";
CREATE POLICY "purchase_order_attachments_all"
    ON "purchase_order_attachments"
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "purchase_requests_all" ON "purchase_requests";
CREATE POLICY "purchase_requests_all"
    ON "purchase_requests"
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "purchase_request_items_all" ON "purchase_request_items";
CREATE POLICY "purchase_request_items_all"
    ON "purchase_request_items"
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "supplier_quotes_all" ON "supplier_quotes";
CREATE POLICY "supplier_quotes_all"
    ON "supplier_quotes"
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "purchase_order_receipts_all" ON "purchase_order_receipts";
CREATE POLICY "purchase_order_receipts_all"
    ON "purchase_order_receipts"
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "purchase_order_receipt_items_all" ON "purchase_order_receipt_items";
CREATE POLICY "purchase_order_receipt_items_all"
    ON "purchase_order_receipt_items"
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

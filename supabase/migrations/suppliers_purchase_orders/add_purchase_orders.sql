-- =====================================================
-- MIGRACIÓN: Módulo de Órdenes de Compra y Proveedores
-- Ejecutar en SQL Editor de Supabase (producción/desarrollo)
-- Es idempotente: se puede ejecutar varias veces sin errores
-- =====================================================

-- 1. Crear enum de estados de orden de compra (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PurchaseOrderStatus') THEN
        CREATE TYPE "PurchaseOrderStatus" AS ENUM ('draft', 'pending', 'approved', 'received', 'cancelled');
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

-- 3. Crear tabla de órdenes de compra
CREATE TABLE IF NOT EXISTS "purchase_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_number" TEXT NOT NULL,
    "supplier_id" UUID NOT NULL,
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

-- 4. Crear tabla de ítems de orden de compra
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

-- 5. Crear tabla de adjuntos de orden de compra
CREATE TABLE IF NOT EXISTS "purchase_order_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchase_order_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT,
    "uploaded_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_attachments_pkey" PRIMARY KEY ("id")
);

-- 6. Foreign keys (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'purchase_orders_supplier_id_fkey'
    ) THEN
        ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey"
            FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
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
END$$;

-- 7. Índices para performance (idempotente)
CREATE INDEX IF NOT EXISTS "purchase_orders_supplier_id_idx" ON "purchase_orders"("supplier_id");
CREATE INDEX IF NOT EXISTS "purchase_orders_status_idx" ON "purchase_orders"("status");
CREATE INDEX IF NOT EXISTS "purchase_order_items_purchase_order_id_idx" ON "purchase_order_items"("purchase_order_id");
CREATE INDEX IF NOT EXISTS "purchase_order_items_material_id_idx" ON "purchase_order_items"("material_id");
CREATE INDEX IF NOT EXISTS "purchase_order_attachments_purchase_order_id_idx" ON "purchase_order_attachments"("purchase_order_id");

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

-- 9. Row Level Security (RLS)
-- Habilitar RLS
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_order_attachments" ENABLE ROW LEVEL SECURITY;

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

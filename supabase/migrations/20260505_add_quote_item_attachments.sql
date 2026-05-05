-- Crear tabla de archivos adjuntos para ítems de cotización (módulos personalizados)
CREATE TABLE IF NOT EXISTS "quote_item_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quote_item_id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_item_attachments_pkey" PRIMARY KEY ("id")
);

-- Índice para búsquedas por quote_item_id
CREATE INDEX IF NOT EXISTS "quote_item_attachments_quote_item_id_idx"
    ON "quote_item_attachments"("quote_item_id");

-- Clave foránea hacia quote_items con eliminación en cascada
ALTER TABLE "quote_item_attachments"
    ADD CONSTRAINT "quote_item_attachments_quote_item_id_fkey"
    FOREIGN KEY ("quote_item_id")
    REFERENCES "quote_items"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_quote_item_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_quote_item_attachments_updated_at ON "quote_item_attachments";

CREATE TRIGGER update_quote_item_attachments_updated_at
    BEFORE UPDATE ON "quote_item_attachments"
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_item_attachments_updated_at();

-- Agregar columna notes_list (JSONB) a la tabla quotes para guardar notas ordenadas
ALTER TABLE "quotes"
ADD COLUMN IF NOT EXISTS "notes_list" JSONB;

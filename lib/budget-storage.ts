import { supabase } from "./supabase";

// Bucket para archivos de presupuestos (PDFs de planos técnicos)
export const BUDGET_ATTACHMENTS_BUCKET = "budget-attachments";

// Tamaño máximo de archivo (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Tipos permitidos para presupuestos
export const ALLOWED_PDF_TYPES = ["application/pdf"];

/**
 * Sube un PDF a Supabase Storage para presupuestos
 */
export async function uploadBudgetPdf(
  fileBuffer: Buffer,
  budgetId: string,
  filename: string,
  mimeType: string
): Promise<{
  url: string;
  path: string;
}> {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
  const filePath = `${budgetId}/${timestamp}_${sanitizedFilename}`;

  const { error: uploadError } = await supabase.storage
    .from(BUDGET_ATTACHMENTS_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Error al subir PDF: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUDGET_ATTACHMENTS_BUCKET)
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath,
  };
}

/**
 * Elimina un PDF de presupuestos de Supabase Storage
 */
export async function deleteBudgetPdf(
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(BUDGET_ATTACHMENTS_BUCKET)
      .remove([filePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting budget PDF:", error);
    return { success: false, error: "Error al eliminar PDF" };
  }
}

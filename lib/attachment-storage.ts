import { v2 as cloudinary } from "cloudinary";
import { supabase } from "./supabase";

// Configuración de Cloudinary (para imágenes)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
  secure: true,
});

// Tamaño máximo de archivo (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Tipos de archivos permitidos
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALLOWED_PDF_TYPES = ["application/pdf"];

/**
 * Determina el tipo de archivo
 */
export function getFileType(mimeType: string): "image" | "pdf" | null {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return "image";
  if (ALLOWED_PDF_TYPES.includes(mimeType)) return "pdf";
  return null;
}

/**
 * Valida si un archivo es permitido
 */
export function validateFile(
  file: File,
  fileType: "image" | "pdf"
): { valid: true } | { valid: false; error: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `El archivo es demasiado grande. Máximo ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  const allowedTypes = fileType === "image" ? ALLOWED_IMAGE_TYPES : ALLOWED_PDF_TYPES;
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: fileType === "image" 
        ? "Solo se permiten imágenes (JPG, PNG, WebP, GIF)"
        : "Solo se permiten archivos PDF",
    };
  }

  return { valid: true };
}

/**
 * Sube una imagen a Cloudinary
 */
export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  budgetId: string,
  filename: string
): Promise<{
  url: string;
  public_id: string;
  thumbnail_url?: string;
}> {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase().substring(0, 50);
  const publicId = `modularq/budgets/${budgetId}/${timestamp}_${sanitizedFilename}`;

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: publicId,
          resource_type: "image",
          folder: `modularq/budgets/${budgetId}`,
          overwrite: false,
          eager: [
            {
              width: 300,
              height: 300,
              crop: "limit",
              quality: "auto",
              fetch_format: "auto",
            },
          ],
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Error al subir imagen"));
            return;
          }

          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            thumbnail_url: result.eager?.[0]?.secure_url,
          });
        }
      )
      .end(fileBuffer);
  });
}

const ATTACHMENTS_BUCKET = "project-files";

/**
 * Sube un PDF a Supabase Storage
 */
export async function uploadPdfToSupabase(
  fileBuffer: Buffer,
  folderPrefix: string,
  filename: string,
  mimeType: string
): Promise<{
  url: string;
  path: string;
}> {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 100);
  const filePath = `attachments/${folderPrefix}/${timestamp}_${sanitizedFilename}`;

  const { data, error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error || !data) {
    throw new Error(`Error al subir PDF: ${error?.message ?? "desconocido"}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .getPublicUrl(data.path);

  return {
    url: publicUrlData.publicUrl,
    path: data.path,
  };
}

/**
 * Elimina una imagen de Cloudinary
 */
export async function deleteImageFromCloudinary(
  publicId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });

    if (result.result === "ok" || result.result === "not found") {
      return { success: true };
    }

    return { success: false, error: "No se pudo eliminar la imagen" };
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return { success: false, error: "Error al eliminar imagen" };
  }
}

/**
 * Elimina un PDF de Supabase Storage
 */
export async function deletePdfFromSupabase(
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error("Error deleting PDF from Supabase:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting PDF from Supabase:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Crea los buckets necesarios en Supabase
 */
export async function setupStorageBuckets(): Promise<void> {
  // El bucket project-files ya está configurado en Supabase
  console.log("Buckets configurados");
}

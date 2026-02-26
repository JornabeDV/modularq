import { v2 as cloudinary } from "cloudinary";

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
  secure: true,
});

export { cloudinary };

// Tipos de archivos permitidos
export const ALLOWED_FILE_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  pdf: ["application/pdf"],
};

// Extensiones permitidas
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"];

// Tamaño máximo de archivo (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Carpeta base en Cloudinary para presupuestos
export const BUDGET_ATTACHMENTS_FOLDER = "modularq/budgets";

/**
 * Determina el tipo de archivo (image o pdf)
 */
export function getFileType(mimeType: string): "image" | "pdf" | null {
  if (ALLOWED_FILE_TYPES.image.includes(mimeType)) {
    return "image";
  }
  if (ALLOWED_FILE_TYPES.pdf.includes(mimeType)) {
    return "pdf";
  }
  return null;
}

/**
 * Valida si un archivo es permitido
 */
export function validateFile(
  file: File
): { valid: true } | { valid: false; error: string } {
  // Validar tamaño
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `El archivo es demasiado grande. Máximo ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Validar tipo MIME
  const fileType = getFileType(file.type);
  if (!fileType) {
    return {
      valid: false,
      error: "Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, WebP, GIF) y PDFs.",
    };
  }

  return { valid: true };
}

/**
 * Genera el public_id para Cloudinary basado en el ID del presupuesto
 */
export function generatePublicId(budgetId: string, filename: string): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase()
    .substring(0, 50);
  return `${BUDGET_ATTACHMENTS_FOLDER}/${budgetId}/${timestamp}_${sanitizedFilename}`;
}

/**
 * Sube un archivo a Cloudinary
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  budgetId: string,
  filename: string,
  mimeType: string
): Promise<{
  success: true;
  url: string;
  public_id: string;
  thumbnail_url?: string;
}> {
  const fileType = getFileType(mimeType);
  const publicId = generatePublicId(budgetId, filename);

  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      public_id: publicId,
      resource_type: fileType === "image" ? "image" : "raw",
      folder: `${BUDGET_ATTACHMENTS_FOLDER}/${budgetId}`,
      overwrite: false,
    };

    // Para imágenes, generar thumbnail automáticamente
    if (fileType === "image") {
      uploadOptions.eager = [
        {
          width: 300,
          height: 300,
          crop: "limit",
          quality: "auto",
          fetch_format: "auto",
        },
      ];
    }

    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error || !result) {
          reject(error || new Error("Error al subir archivo"));
          return;
        }

        resolve({
          success: true,
          url: result.secure_url,
          public_id: result.public_id,
          thumbnail_url:
            fileType === "image" && result.eager && result.eager[0]
              ? result.eager[0].secure_url
              : undefined,
        });
      })
      .end(fileBuffer);
  });
}

/**
 * Elimina un archivo de Cloudinary
 */
export async function deleteFromCloudinary(
  publicId: string,
  fileType: "image" | "pdf"
): Promise<{ success: boolean; error?: string }> {
  try {
    const resourceType = fileType === "image" ? "image" : "raw";
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result === "ok" || result.result === "not found") {
      return { success: true };
    }

    return { success: false, error: "No se pudo eliminar el archivo" };
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return { success: false, error: "Error al eliminar archivo" };
  }
}

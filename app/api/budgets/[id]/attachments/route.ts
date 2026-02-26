import { NextRequest, NextResponse } from "next/server";
import { PrismaTypedService } from "@/lib/prisma-typed-service";
import {
  uploadImageToCloudinary,
  uploadPdfToSupabase,
  validateFile,
  getFileType,
} from "@/lib/attachment-storage";

// GET /api/budgets/[id]/attachments - Listar archivos adjuntos
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const attachments = await PrismaTypedService.getBudgetAttachments(id);
    return NextResponse.json({ attachments });
  } catch (error) {
    console.error("Error fetching budget attachments:", error);
    return NextResponse.json(
      { error: "Error al obtener archivos adjuntos" },
      { status: 500 }
    );
  }
}

// POST /api/budgets/[id]/attachments - Subir un nuevo archivo
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: budgetId } = params;

    // Verificar que el presupuesto existe
    const budget = await PrismaTypedService.getBudgetById(budgetId);
    if (!budget) {
      return NextResponse.json(
        { error: "Presupuesto no encontrado" },
        { status: 404 }
      );
    }

    // Parsear el form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const description = formData.get("description") as string;
    const documentType = (formData.get("document_type") as string) || "project_image";

    // Validar límite de imágenes (máximo 4 por presupuesto)
    if (documentType === "project_image") {
      const existingAttachments = await PrismaTypedService.getBudgetAttachments(budgetId);
      const projectImagesCount = existingAttachments.filter(
        (a) => a.document_type === "project_image"
      ).length;
      
      if (projectImagesCount >= 4) {
        return NextResponse.json(
          { error: "Límite alcanzado: solo se permiten 4 imágenes por presupuesto" },
          { status: 400 }
        );
      }
    }

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Obtener el tipo de archivo
    const fileType = getFileType(file.type);
    if (!fileType) {
      return NextResponse.json(
        { error: "Tipo de archivo no soportado" },
        { status: 400 }
      );
    }

    // Validar archivo según su tipo
    const validation = validateFile(file, fileType);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Convertir File a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Subir a el servicio correspondiente según el tipo
    let uploadResult: {
      url: string;
      public_id: string;
      thumbnail_url?: string;
    };

    if (fileType === "image") {
      // Imágenes → Cloudinary (mejor optimización y thumbnails)
      const result = await uploadImageToCloudinary(buffer, budgetId, file.name);
      uploadResult = result;
    } else {
      // PDFs → Supabase Storage (URLs directas y estables)
      const result = await uploadPdfToSupabase(buffer, budgetId, file.name, file.type);
      uploadResult = {
        url: result.url,
        public_id: result.path,
        thumbnail_url: undefined,
      };
    }

    // Guardar en la base de datos
    const attachment = await PrismaTypedService.createBudgetAttachment({
      budget_id: budgetId,
      filename: file.name,
      original_name: file.name,
      mime_type: file.type,
      file_type: fileType,
      document_type: documentType as "project_image" | "technical_plan",
      size: file.size,
      url: uploadResult.url,
      public_id: uploadResult.public_id,
      thumbnail_url: uploadResult.thumbnail_url,
      description: description || undefined,
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    console.error("Error uploading budget attachment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al subir el archivo" },
      { status: 500 }
    );
  }
}

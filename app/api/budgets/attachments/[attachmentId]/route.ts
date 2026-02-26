import { NextRequest, NextResponse } from "next/server";
import { PrismaTypedService } from "@/lib/prisma-typed-service";
import {
  deleteImageFromCloudinary,
  deletePdfFromSupabase,
} from "@/lib/attachment-storage";

// DELETE /api/budgets/attachments/[attachmentId] - Eliminar un archivo adjunto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { attachmentId: string } }
) {
  try {
    const { attachmentId } = params;

    // Obtener el attachment para saber dónde está almacenado
    const attachment = await PrismaTypedService.getBudgetAttachmentById(attachmentId);
    if (!attachment) {
      return NextResponse.json(
        { error: "Archivo no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar del servicio correspondiente según el tipo de archivo
    if (attachment.file_type === "image") {
      // Imágenes están en Cloudinary
      const deleteResult = await deleteImageFromCloudinary(attachment.public_id);
      if (!deleteResult.success) {
        console.error("Error deleting image from Cloudinary:", deleteResult.error);
      }
    } else {
      // PDFs están en Supabase Storage
      const deleteResult = await deletePdfFromSupabase(attachment.public_id);
      if (!deleteResult.success) {
        console.error("Error deleting PDF from Supabase:", deleteResult.error);
      }
    }

    // Eliminar de la base de datos
    await PrismaTypedService.deleteBudgetAttachment(attachmentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting budget attachment:", error);
    return NextResponse.json(
      { error: "Error al eliminar el archivo" },
      { status: 500 }
    );
  }
}

// PATCH /api/budgets/attachments/[attachmentId] - Actualizar descripción
export async function PATCH(
  request: NextRequest,
  { params }: { params: { attachmentId: string } }
) {
  try {
    const { attachmentId } = params;
    const body = await request.json();

    const attachment = await PrismaTypedService.updateBudgetAttachment(
      attachmentId,
      {
        description: body.description,
      }
    );

    return NextResponse.json({ attachment });
  } catch (error) {
    console.error("Error updating budget attachment:", error);
    return NextResponse.json(
      { error: "Error al actualizar el archivo" },
      { status: 500 }
    );
  }
}

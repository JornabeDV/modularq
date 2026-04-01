import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'
import { deletePdfFromSupabase } from '@/lib/attachment-storage'

// DELETE /api/standard-modules/[id]/attachments/[attachmentId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const module = await PrismaTypedService.getStandardModuleById(params.id)
    if (!module) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 })
    }

    const attachment = module.attachments?.find((a: { id: string }) => a.id === params.attachmentId)
    if (!attachment) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    await deletePdfFromSupabase(attachment.storage_path)
    await PrismaTypedService.deleteStandardModuleAttachment(params.attachmentId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting module attachment:', error)
    return NextResponse.json({ error: 'Error al eliminar archivo' }, { status: 500 })
  }
}

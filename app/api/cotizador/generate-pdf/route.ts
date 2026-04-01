import { NextRequest, NextResponse } from 'next/server'
import { mergePdfs } from '@/lib/pdf-merger'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// POST /api/cotizador/generate-pdf
// Recibe el PDF ya generado en el cliente + moduleIds,
// mergea los adjuntos de los módulos y devuelve el PDF final.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const pdfFile = formData.get('pdf') as File
    const moduleIdsRaw = formData.get('moduleIds') as string

    if (!pdfFile) {
      return NextResponse.json({ error: 'No se recibió el PDF' }, { status: 400 })
    }

    const moduleIds: string[] = moduleIdsRaw ? JSON.parse(moduleIdsRaw) : []

    // Recopilar PDFs adjuntos de los módulos
    const attachmentUrls: string[] = []
    for (const moduleId of moduleIds) {
      try {
        const module = await PrismaTypedService.getStandardModuleById(moduleId)
        if (module?.attachments?.length) {
          for (const att of module.attachments) {
            if (att.mime_type === 'application/pdf') {
              attachmentUrls.push(att.url)
            }
          }
        }
      } catch {
        // continuar sin los adjuntos de este módulo
      }
    }

    const pdfBuffer = await pdfFile.arrayBuffer()

    let finalBytes: Uint8Array
    if (attachmentUrls.length > 0) {
      finalBytes = await mergePdfs(pdfBuffer, attachmentUrls)
    } else {
      finalBytes = new Uint8Array(pdfBuffer)
    }

    return new NextResponse(finalBytes.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
      },
    })
  } catch (error) {
    console.error('Error generating cotizador PDF:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al generar PDF' },
      { status: 500 }
    )
  }
}

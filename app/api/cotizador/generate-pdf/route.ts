import { NextRequest, NextResponse } from 'next/server'
import { mergePdfs } from '@/lib/pdf-merger'
import { PrismaTypedService } from '@/lib/prisma-typed-service'
import { supabase } from '@/lib/supabase'

const QUOTES_BUCKET = 'quotes'

async function uploadQuotePdf(
  bytes: Uint8Array,
  quoteId: string,
  quoteNumber: string
): Promise<string> {
  const sanitized = quoteNumber.replace(/[^a-zA-Z0-9-]/g, '_')
  const filePath = `${quoteId}/${sanitized}.pdf`

  // Buffer.from(Uint8Array) creates a correctly-sized buffer (avoids backing ArrayBuffer size mismatch)
  const fileBuffer = Buffer.from(bytes)

  const { error } = await supabase.storage
    .from(QUOTES_BUCKET)
    .upload(filePath, fileBuffer, { contentType: 'application/pdf', upsert: true })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabase.storage.from(QUOTES_BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}

// POST /api/cotizador/generate-pdf
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const pdfFile = formData.get('pdf') as File
    const moduleIdsRaw = formData.get('moduleIds') as string
    const quoteDataRaw = formData.get('quoteData') as string | null

    if (!pdfFile) {
      return NextResponse.json({ error: 'No se recibió el PDF' }, { status: 400 })
    }

    const moduleIds: string[] = moduleIdsRaw ? JSON.parse(moduleIdsRaw) : []

    // Recopilar PDFs adjuntos de los módulos (filtro explícito por module_id)
    const attachmentUrls: string[] = []
    for (const moduleId of moduleIds) {
      try {
        const attachments = await PrismaTypedService.getStandardModuleAttachments(moduleId)
        for (const att of attachments) {
          if (att.mime_type === 'application/pdf') {
            attachmentUrls.push(att.url)
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

    // Si viene quoteData, persistir la cotización
    let quoteId: string | null = null
    let quoteNumber: string | null = null

    if (quoteDataRaw) {
      try {
        const quoteData = JSON.parse(quoteDataRaw)
        const number = await PrismaTypedService.generateQuoteNumber()

        // Crear registro en DB (sin pdf_url aún)
        const created = await PrismaTypedService.createQuote({
          number,
          ...quoteData,
        })

        quoteId = created.id
        quoteNumber = created.number

        // Subir PDF al Storage y actualizar el registro
        try {
          const pdfUrl = await uploadQuotePdf(finalBytes, quoteId, quoteNumber)
          await PrismaTypedService.updateQuotePdfUrl(quoteId, pdfUrl)
        } catch (uploadErr) {
          console.error('[generate-pdf] Storage upload error:', uploadErr)
        }
      } catch (err) {
        console.error('Error persisting quote:', err)
        // No bloqueamos la descarga del PDF aunque falle el guardado
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
    }
    if (quoteId) headers['X-Quote-Id'] = quoteId
    if (quoteNumber) headers['X-Quote-Number'] = quoteNumber

    return new NextResponse(Buffer.from(finalBytes), { headers })
  } catch (error) {
    console.error('Error generating cotizador PDF:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al generar PDF' },
      { status: 500 }
    )
  }
}

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

    // Si no viene PDF pero sí quoteData, solo creamos/reservamos la cotización y devolvemos el número
    if (!pdfFile && quoteDataRaw) {
      try {
        const quoteData = JSON.parse(quoteDataRaw)
        const existingQuoteId = formData.get('existingQuoteId') as string | null

        if (existingQuoteId) {
          const updated = await PrismaTypedService.replaceQuote(existingQuoteId, quoteData)
          return NextResponse.json({ quoteId: updated.id, quoteNumber: updated.number })
        } else {
          const number = await PrismaTypedService.generateQuoteNumber(quoteData.quote_type)
          const created = await PrismaTypedService.createQuote({ number, ...quoteData })
          return NextResponse.json({ quoteId: created.id, quoteNumber: created.number })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar la cotización'
        console.error('Error persisting quote:', err)
        return NextResponse.json({ error: message }, { status: 500 })
      }
    }

    if (!pdfFile) {
      return NextResponse.json({ error: 'No se recibió el PDF' }, { status: 400 })
    }

    const moduleIds: string[] = moduleIdsRaw ? JSON.parse(moduleIdsRaw) : []

    // Recopilar PDFs adjuntos de los ítems de la cotización.
    // Los attachments guardados en el quote_item tienen prioridad sobre los del
    // catálogo de módulos estándar, permitiendo reemplazarlos desde el cotizador.
    const attachmentUrls = new Set<string>()

    if (quoteDataRaw) {
      try {
        const quoteData = JSON.parse(quoteDataRaw)
        for (const item of quoteData.items ?? []) {
          if (item.attachments && item.attachments.length > 0) {
            for (const att of item.attachments) {
              if (att.mime_type === 'application/pdf') {
                attachmentUrls.add(att.url)
              }
            }
          } else if (item.type === 'standard_module' && item.standard_module_id) {
            try {
              const attachments = await PrismaTypedService.getStandardModuleAttachments(item.standard_module_id)
              for (const att of attachments) {
                if (att.mime_type === 'application/pdf') {
                  attachmentUrls.add(att.url)
                }
              }
            } catch {
              // continuar sin los adjuntos de este módulo
            }
          }
        }
      } catch {
        // continuar sin los adjuntos de los ítems
      }
    }

    // Fallback legacy: si no hay quoteData, usar los moduleIds recibidos
    if (attachmentUrls.size === 0 && moduleIds.length > 0) {
      for (const moduleId of moduleIds) {
        try {
          const attachments = await PrismaTypedService.getStandardModuleAttachments(moduleId)
          for (const att of attachments) {
            if (att.mime_type === 'application/pdf') {
              attachmentUrls.add(att.url)
            }
          }
        } catch {
          // continuar sin los adjuntos de este módulo
        }
      }
    }

    const pdfBuffer = await pdfFile.arrayBuffer()

    const pdfAttachmentUrls = Array.from(attachmentUrls)

    let finalBytes: Uint8Array
    if (pdfAttachmentUrls.length > 0) {
      finalBytes = await mergePdfs(pdfBuffer, pdfAttachmentUrls)
    } else {
      finalBytes = new Uint8Array(pdfBuffer)
    }

    // Si viene quoteData, persistir la cotización
    let quoteId: string | null = null
    let quoteNumber: string | null = null

    if (quoteDataRaw) {
      try {
        const quoteData = JSON.parse(quoteDataRaw)
        const existingQuoteId = formData.get('existingQuoteId') as string | null

        if (existingQuoteId) {
          // Modo editar borrador existente
          const updated = await PrismaTypedService.replaceQuote(existingQuoteId, quoteData)
          quoteId = updated.id
          quoteNumber = updated.number
        } else {
          // Modo crear nueva cotización
          const number = await PrismaTypedService.generateQuoteNumber(quoteData.quote_type)
          const created = await PrismaTypedService.createQuote({
            number,
            ...quoteData,
          })
          quoteId = created.id
          quoteNumber = created.number
        }

        // Subir PDF al Storage y actualizar el registro
        const pdfUrl = await uploadQuotePdf(finalBytes, quoteId, quoteNumber)
        await PrismaTypedService.updateQuotePdfUrl(quoteId, pdfUrl)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar la cotización'
        console.error('Error persisting quote:', err)
        return NextResponse.json({ error: message }, { status: 500 })
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

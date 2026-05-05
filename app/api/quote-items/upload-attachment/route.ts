import { NextRequest, NextResponse } from 'next/server'
import { uploadPdfToSupabase, validateFile } from '@/lib/attachment-storage'

// POST /api/quote-items/upload-attachment
// Sube un PDF a Supabase Storage para asociarlo luego a un quote item.
// No crea registro en DB porque el quote item todavía no existe.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Solo se permiten archivos PDF' }, { status: 400 })
    }

    const validation = validateFile(file, 'pdf')
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Usar un prefijo temporal ya que el quote item todavía no existe
    const tempPrefix = `temp/${Date.now()}`
    const result = await uploadPdfToSupabase(buffer, tempPrefix, file.name, file.type)

    return NextResponse.json({
      attachment: {
        filename: file.name,
        original_name: file.name,
        mime_type: file.type,
        size: file.size,
        url: result.url,
        storage_path: result.path,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading quote-item attachment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al subir el archivo' },
      { status: 500 }
    )
  }
}

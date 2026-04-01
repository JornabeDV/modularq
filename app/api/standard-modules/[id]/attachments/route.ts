import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'
import { uploadPdfToSupabase, validateFile } from '@/lib/attachment-storage'

// GET /api/standard-modules/[id]/attachments
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const module = await PrismaTypedService.getStandardModuleById(params.id)
    if (!module) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ attachments: module.attachments })
  } catch (error) {
    console.error('Error fetching module attachments:', error)
    return NextResponse.json({ error: 'Error al obtener archivos adjuntos' }, { status: 500 })
  }
}

// POST /api/standard-modules/[id]/attachments
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const moduleId = params.id

    const module = await PrismaTypedService.getStandardModuleById(moduleId)
    if (!module) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const description = formData.get('description') as string

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

    const result = await uploadPdfToSupabase(buffer, moduleId, file.name, file.type)

    const attachment = await PrismaTypedService.createStandardModuleAttachment({
      module_id: moduleId,
      filename: file.name,
      original_name: file.name,
      mime_type: file.type,
      size: file.size,
      url: result.url,
      storage_path: result.path,
      description: description || undefined,
    })

    return NextResponse.json({ attachment }, { status: 201 })
  } catch (error) {
    console.error('Error uploading module attachment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al subir el archivo' },
      { status: 500 }
    )
  }
}

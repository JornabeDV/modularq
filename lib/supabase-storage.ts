import { supabase } from './supabase'

export interface FileUploadResult {
  success: boolean
  data?: {
    path: string
    fileName: string
    fileType: string
    fileSize: number
  }
  error?: string
}

export interface FileMetadata {
  id: string
  project_id: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  uploaded_by: string
  uploaded_at: string
  description?: string
  is_public: boolean
  version: number
  created_at: string
  updated_at: string
}

export class SupabaseFileStorage {
  private static readonly BUCKET_NAME = 'project-files'
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB - máximo de Supabase
  private static readonly ALLOWED_TYPES = {
    pdf: ['application/pdf'],
    excel: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ],
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  }

  /**
   * Subir archivo a Supabase Storage
   */
  static async uploadFile(
    file: File,
    projectId: string,
    userId: string,
    description?: string
  ): Promise<FileUploadResult> {
    try {
      // Validaciones
      if (file.size > this.MAX_FILE_SIZE) {
        return { 
          success: false, 
          error: `Archivo demasiado grande. Máximo permitido: ${this.MAX_FILE_SIZE / 1024 / 1024}MB` 
        }
      }

      const fileType = this.getFileType(file.type)
      if (!fileType) {
        return { 
          success: false, 
          error: 'Tipo de archivo no permitido. Solo se aceptan PDF, Excel e imágenes.' 
        }
      }

      // Generar nombre único para evitar conflictos
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${projectId}/${timestamp}-${sanitizedName}`
      
      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file)

      if (error) {
        console.error('Error uploading to Supabase Storage:', error)
        return { success: false, error: `Error al subir archivo: ${error.message}` }
      }

      // Guardar metadatos en la base de datos
      const { data: fileRecord, error: dbError } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          file_name: file.name,
          file_type: fileType,
          file_size: file.size,
          storage_path: data.path,
          uploaded_by: userId,
          description: description || null,
          is_public: false
        })
        .select()
        .single()

      if (dbError) {
        console.error('Error saving file metadata:', dbError)
        // Intentar eliminar el archivo subido si falla la BD
        await supabase.storage.from(this.BUCKET_NAME).remove([data.path])
        return { success: false, error: `Error al guardar metadatos: ${dbError.message}` }
      }

      return {
        success: true,
        data: {
          path: data.path,
          fileName: file.name,
          fileType: fileType,
          fileSize: file.size
        }
      }
    } catch (error) {
      console.error('Unexpected error in uploadFile:', error)
      return { 
        success: false, 
        error: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      }
    }
  }

  /**
   * Obtener URL pública del archivo
   */
  static async getFileUrl(storagePath: string): Promise<string> {
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(storagePath)
    return data.publicUrl
  }

  /**
   * Obtener URL firmada para archivos privados
   */
  static async getSignedUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(storagePath, expiresIn)

    if (error) {
      console.error('Error creating signed URL:', error)
      throw new Error(`Error al generar URL: ${error.message}`)
    }

    return data.signedUrl
  }

  /**
   * Eliminar archivo del storage y base de datos
   */
  static async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Obtener información del archivo
      const { data: fileRecord, error: fetchError } = await supabase
        .from('project_files')
        .select('storage_path')
        .eq('id', fileId)
        .single()

      if (fetchError) {
        return { success: false, error: `Error al obtener archivo: ${fetchError.message}` }
      }

      // Eliminar de Supabase Storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([fileRecord.storage_path])

      if (storageError) {
        console.error('Error deleting from storage:', storageError)
        // Continuar con la eliminación de BD aunque falle el storage
      }

      // Eliminar de base de datos
      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId)

      if (dbError) {
        return { success: false, error: `Error al eliminar de base de datos: ${dbError.message}` }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error in deleteFile:', error)
      return { 
        success: false, 
        error: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      }
    }
  }

  /**
   * Obtener archivos de un proyecto
   */
  static async getProjectFiles(projectId: string): Promise<FileMetadata[]> {
    const { data, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Error fetching project files:', error)
      throw new Error(`Error al obtener archivos: ${error.message}`)
    }

    return data || []
  }

  /**
   * Obtener información de un archivo específico
   */
  static async getFileInfo(fileId: string): Promise<FileMetadata | null> {
    const { data, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (error) {
      console.error('Error fetching file info:', error)
      return null
    }

    return data
  }

  /**
   * Determinar tipo de archivo basado en MIME type
   */
  private static getFileType(mimeType: string): string | null {
    for (const [type, mimes] of Object.entries(this.ALLOWED_TYPES)) {
      if (mimes.includes(mimeType)) return type
    }
    return null
  }

  /**
   * Formatear tamaño de archivo para mostrar
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Obtener icono basado en tipo de archivo
   */
  static getFileIcon(fileType: string): string {
    const icons = {
      pdf: '📄',
      excel: '📊',
      image: '🖼️',
      other: '📁'
    }
    return icons[fileType as keyof typeof icons] || icons.other
  }
}
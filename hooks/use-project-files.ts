"use client"

import { useState, useEffect } from 'react'
import { SupabaseFileStorage, type FileMetadata } from '@/lib/supabase-storage'

export interface UseProjectFilesReturn {
  files: FileMetadata[]
  loading: boolean
  error: string | null
  uploadFile: (file: File, description?: string) => Promise<{ success: boolean; error?: string }>
  deleteFile: (fileId: string) => Promise<{ success: boolean; error?: string }>
  refreshFiles: () => Promise<void>
  getFileUrl: (fileId: string) => Promise<string | null>
  getSignedUrl: (fileId: string) => Promise<string | null>
}

export function useProjectFiles(
  projectId: string, 
  userId: string,
  hasPermission: boolean = true
): UseProjectFilesReturn {
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Cargar archivos del proyecto
   */
  const loadFiles = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const projectFiles = await SupabaseFileStorage.getProjectFiles(projectId)
      setFiles(projectFiles)
    } catch (err) {
      console.error('Error loading project files:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar archivos')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Subir nuevo archivo
   */
  const uploadFile = async (
    file: File, 
    description?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      const result = await SupabaseFileStorage.uploadFile(
        file, 
        projectId, 
        userId, 
        description
      )

      if (result.success) {
        // Recargar archivos para obtener la información completa
        await loadFiles()
        return { success: true }
      } else {
        setError(result.error || 'Error al subir archivo')
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Eliminar archivo
   */
  const deleteFile = async (fileId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      const result = await SupabaseFileStorage.deleteFile(fileId)

      if (result.success) {
        // Actualizar estado local sin recargar
        setFiles(prev => prev.filter(f => f.id !== fileId))
        return { success: true }
      } else {
        setError(result.error || 'Error al eliminar archivo')
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Obtener URL pública del archivo
   */
  const getFileUrl = async (fileId: string): Promise<string | null> => {
    try {
      const file = files.find(f => f.id === fileId)
      if (!file) return null

      return await SupabaseFileStorage.getFileUrl(file.storage_path)
    } catch (err) {
      console.error('Error getting file URL:', err)
      return null
    }
  }

  /**
   * Obtener URL firmada del archivo
   */
  const getSignedUrl = async (fileId: string): Promise<string | null> => {
    try {
      const file = files.find(f => f.id === fileId)
      if (!file) return null

      return await SupabaseFileStorage.getSignedUrl(file.storage_path)
    } catch (err) {
      console.error('Error getting signed URL:', err)
      return null
    }
  }

  /**
   * Refrescar lista de archivos
   */
  const refreshFiles = async () => {
    await loadFiles()
  }

  // Cargar archivos al montar el componente
  useEffect(() => {
    if (projectId && hasPermission) {
      loadFiles()
    } else {
      setLoading(false)
    }
  }, [projectId, hasPermission])

  return {
    files,
    loading,
    error,
    uploadFile,
    deleteFile,
    refreshFiles,
    getFileUrl,
    getSignedUrl
  }
}

/**
 * Hook simplificado para obtener solo la lista de archivos
 */
export function useProjectFilesList(projectId: string) {
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoading(true)
        const projectFiles = await SupabaseFileStorage.getProjectFiles(projectId)
        setFiles(projectFiles)
      } catch (err) {
        console.error('Error loading project files:', err)
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      loadFiles()
    }
  }, [projectId])

  return { files, loading }
}

/**
 * Hook para obtener información de un archivo específico
 */
export function useFileInfo(fileId: string) {
  const [file, setFile] = useState<FileMetadata | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFileInfo = async () => {
      try {
        setLoading(true)
        const fileInfo = await SupabaseFileStorage.getFileInfo(fileId)
        setFile(fileInfo)
      } catch (err) {
        console.error('Error loading file info:', err)
      } finally {
        setLoading(false)
      }
    }

    if (fileId) {
      loadFileInfo()
    }
  }, [fileId])

  return { file, loading }
}
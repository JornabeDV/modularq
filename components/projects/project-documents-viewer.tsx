"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { File, Eye, Download, Loader2, FolderOpen } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useProjectFilesList } from '@/hooks/use-project-files'
import { SupabaseFileStorage, type FileMetadata } from '@/lib/supabase-storage'
import { useToast } from '@/hooks/use-toast'
// import { ExcelViewer } from './excel-viewer' // Comentado: visualización online deshabilitada

interface ProjectDocumentsViewerProps {
  projectId: string
}

export function ProjectDocumentsViewer({ projectId }: ProjectDocumentsViewerProps) {
  const { files, loading } = useProjectFilesList(projectId)
  const { toast } = useToast()
  const [openingFile, setOpeningFile] = useState<string | null>(null)
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null)
  // Estados del visualizador de Excel comentados - funcionalidad deshabilitada
  // const [excelViewerOpen, setExcelViewerOpen] = useState(false)
  // const [selectedExcelFile, setSelectedExcelFile] = useState<FileMetadata | null>(null)

  const handleView = async (file: FileMetadata) => {
    // Para archivos Excel, descargar directamente en lugar de visualizar
    if (file.file_type === 'excel') {
      await handleDownload(file)
      return
    }

    // Para otros tipos de archivo, abrir en nueva pestaña
    try {
      setOpeningFile(file.id)
      // Intentar URL pública primero, si falla usar URL firmada
      let url: string
      try {
        url = await SupabaseFileStorage.getFileUrl(file.storage_path)
      } catch {
        // Si falla la URL pública, usar URL firmada
        url = await SupabaseFileStorage.getSignedUrl(file.storage_path)
      }
      window.open(url, '_blank')
    } catch (error) {
      toast({
        title: "Error al abrir archivo",
        description: "No se pudo abrir el archivo para visualización",
        variant: "destructive"
      })
    } finally {
      setOpeningFile(null)
    }
  }

  const handleDownload = async (file: FileMetadata) => {
    try {
      setDownloadingFile(file.id)
      // Usar URL firmada para descarga (archivos privados)
      const url = await SupabaseFileStorage.getSignedUrl(file.storage_path)
      
      // Descargar usando fetch para mejor control
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Error al obtener el archivo')
      }
      
      const blob = await response.blob()
      
      // Crear URL del blob y descargar
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = file.file_name
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Limpiar URL del blob
      window.URL.revokeObjectURL(blobUrl)
      
      toast({
        title: "Descarga completada",
        description: `${file.file_name} se ha descargado correctamente`
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Error al descargar archivo",
        description: "No se pudo descargar el archivo",
        variant: "destructive"
      })
    } finally {
      setDownloadingFile(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Documentos del Proyecto
            </CardTitle>
            <CardDescription>
              Documentos relacionados con este proyecto
            </CardDescription>
          </div>
          {files.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {files.length} documento{files.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Cargando documentos...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <File className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">No hay documentos en este proyecto</p>
          </div>
        ) : (
          <TooltipProvider>
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors select-none"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (!openingFile && !downloadingFile) {
                      handleView(file)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (!openingFile && !downloadingFile) {
                        handleView(file)
                      }
                    }
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate" title={file.file_name}>
                        {file.file_name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground mt-1">
                        <span>{SupabaseFileStorage.formatFileSize(file.file_size)}</span>
                        <span>{new Date(file.uploaded_at).toLocaleDateString('es-ES')}</span>
                        <span className="capitalize">{file.file_type}</span>
                      </div>
                      {file.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1" title={file.description}>
                          {file.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div 
                    className="flex items-center space-x-2 self-end sm:self-auto shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleView(file)
                          }}
                          disabled={openingFile === file.id}
                          className="cursor-pointer"
                        >
                          {openingFile === file.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="ml-2 hidden sm:inline">Ver</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{file.file_type === 'excel' ? 'Descargar documento' : 'Ver documento'}</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(file)
                          }}
                          disabled={downloadingFile === file.id}
                          className="cursor-pointer"
                        >
                          {downloadingFile === file.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          <span className="ml-2 hidden sm:inline">Descargar</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Descargar documento</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
      
      {/* Visualizador de Excel - Comentado: funcionalidad deshabilitada */}
      {/* <ExcelViewer 
        file={selectedExcelFile}
        open={excelViewerOpen}
        onOpenChange={(open) => {
          setExcelViewerOpen(open)
          if (!open) {
            setSelectedExcelFile(null)
          }
        }}
      /> */}
    </Card>
  )
}
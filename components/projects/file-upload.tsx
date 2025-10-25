"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Upload, File, X, Download, Eye, Trash2, AlertCircle } from 'lucide-react'
import { SupabaseFileStorage, type FileMetadata } from '@/lib/supabase-storage'
import { useToast } from '@/hooks/use-toast'

interface FileUploadProps {
  projectId: string
  userId: string
  onFileUploaded?: (file: FileMetadata) => void
  onFileDeleted?: (fileId: string) => void
  existingFiles?: FileMetadata[]
}

export function FileUpload({ 
  projectId, 
  userId, 
  onFileUploaded, 
  onFileDeleted,
  existingFiles = []
}: FileUploadProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<FileMetadata[]>(existingFiles)

  // Sincronizar el estado interno con los archivos existentes cuando cambien
  useEffect(() => {
    setFiles(existingFiles)
  }, [existingFiles])

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    const file = selectedFiles[0]
    
    setUploading(true)
    setProgress(0)

    try {
      // Simular progreso (Supabase no proporciona callback de progreso)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const result = await SupabaseFileStorage.uploadFile(
        file, 
        projectId, 
        userId, 
        description.trim() || undefined
      )

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success) {
        // Recargar todos los archivos del proyecto para obtener la información completa
        const projectFiles = await SupabaseFileStorage.getProjectFiles(projectId)
        setFiles(projectFiles)
        onFileUploaded?.(projectFiles[0]) // El primer archivo es el más reciente
        
        toast({
          title: "Archivo subido exitosamente",
          description: `${file.name} se ha subido correctamente`
        })
        
        setDescription('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        toast({
          title: "Error al subir archivo",
          description: result.error || "Error desconocido",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al subir el archivo",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }


  const confirmDeleteFile = async (file: FileMetadata) => {
    try {
      const result = await SupabaseFileStorage.deleteFile(file.id)
      
      if (result.success) {
        // Recargar todos los archivos del proyecto para mantener consistencia
        const projectFiles = await SupabaseFileStorage.getProjectFiles(projectId)
        setFiles(projectFiles)
        onFileDeleted?.(file.id)
        
        toast({
          title: "Archivo eliminado",
          description: "El archivo se ha eliminado correctamente"
        })
      } else {
        toast({
          title: "Error al eliminar archivo",
          description: result.error || "Error desconocido",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al eliminar el archivo",
        variant: "destructive"
      })
    }
  }

  const handleDownload = async (file: FileMetadata) => {
    try {
      const url = await SupabaseFileStorage.getFileUrl(file.storage_path)
      const link = document.createElement('a')
      link.href = url
      link.download = file.file_name
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      toast({
        title: "Error al descargar archivo",
        description: "No se pudo descargar el archivo",
        variant: "destructive"
      })
    }
  }

  const handleView = async (file: FileMetadata) => {
    try {
      const url = await SupabaseFileStorage.getFileUrl(file.storage_path)
      window.open(url, '_blank')
    } catch (error) {
      toast({
        title: "Error al abrir archivo",
        description: "No se pudo abrir el archivo para visualización",
        variant: "destructive"
      })
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Archivos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-muted-foreground">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, Excel, imágenes (máximo 50MB por archivo)
            </p>
          </div>

          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Seleccionar archivo</Label>
            <div className="relative">
              <Input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png,.gif,.webp"
                onChange={(e) => handleFileSelect(e.target.files)}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-colors cursor-pointer">
                <Upload className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  {uploading ? 'Subiendo...' : 'Haz clic para seleccionar archivo'}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="file-description">Descripción (opcional)</Label>
            <Textarea
              id="file-description"
              placeholder="Describe el contenido del archivo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
              rows={2}
            />
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Subiendo archivo...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Archivos del Proyecto ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {files.length > 0 ? (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div 
                    className="flex items-center space-x-3 cursor-pointer rounded-lg p-2 -m-2 flex-1"
                    onClick={() => handleView(file)}
                    title="Hacer clic para ver el archivo"
                  >
                    <span className="text-2xl">
                      {SupabaseFileStorage.getFileIcon(file.file_type)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {file.file_name}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{SupabaseFileStorage.formatFileSize(file.file_size)}</span>
                        <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
                        <span className="capitalize">{file.file_type}</span>
                      </div>
                      {file.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {file.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(file)}
                          className="h-8 w-8 p-0 cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ver archivo</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(file)}
                          className="h-8 w-8 p-0 cursor-pointer"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Descargar archivo</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Eliminar archivo</p>
                        </TooltipContent>
                      </Tooltip>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el archivo "{file.file_name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => confirmDeleteFile(file)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <File className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">No hay archivos en este proyecto</p>
              <p className="text-xs mt-1">Sube el primer archivo usando el formulario de arriba</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  )
}
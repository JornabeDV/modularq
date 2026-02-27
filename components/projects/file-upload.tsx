"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Upload,
  Download,
  Eye,
  Trash2,
  Loader2,
  FileText,
  Plus,
  Paperclip,
} from "lucide-react";
import { SupabaseFileStorage, type FileMetadata } from "@/lib/supabase-storage";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  projectId: string;
  userId: string;
  onFileUploaded?: (file: FileMetadata) => void;
  onFileDeleted?: (fileId: string) => void;
  existingFiles?: FileMetadata[];
  isReadOnly?: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function FileUpload({
  projectId,
  userId,
  onFileUploaded,
  onFileDeleted,
  existingFiles = [],
  isReadOnly = false,
}: FileUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(
    null,
  );
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileMetadata[]>(existingFiles);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FileMetadata | null>(null);

  // Sincronizar el estado interno con los archivos existentes cuando cambien
  useEffect(() => {
    setFiles(existingFiles);
  }, [existingFiles]);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `El archivo es demasiado grande. Máximo ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      };
    }
    return { valid: true };
  };

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0];

    const validation = validateFile(file);
    if (!validation.valid) {
      toast({
        title: "Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgressText(`Subiendo ${file.name}...`);

    try {
      const result = await SupabaseFileStorage.uploadFile(
        file,
        projectId,
        userId,
        description.trim() || undefined,
      );

      if (result.success) {
        // Recargar todos los archivos del proyecto para obtener la información completa
        const projectFiles =
          await SupabaseFileStorage.getProjectFiles(projectId);
        setFiles(projectFiles);
        onFileUploaded?.(projectFiles[0]);

        toast({
          title: "Archivo subido exitosamente",
          description: `${file.name} se ha subido correctamente`,
        });

        setDescription("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        toast({
          title: "Error al subir archivo",
          description: result.error || "Error desconocido",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al subir el archivo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);

      setUploadProgressText(null);
    }
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;

    const fileId = fileToDelete.id;
    setFileToDelete(null);
    setDeletingFileId(fileId);

    try {
      const result = await SupabaseFileStorage.deleteFile(fileId);

      if (result.success) {
        const projectFiles =
          await SupabaseFileStorage.getProjectFiles(projectId);
        setFiles(projectFiles);
        onFileDeleted?.(fileId);

        toast({
          title: "Archivo eliminado",
          description: `"${fileToDelete.file_name}" se ha eliminado.`,
        });
      } else {
        toast({
          title: "Error al eliminar archivo",
          description: result.error || "Error desconocido",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al eliminar el archivo",
        variant: "destructive",
      });
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleDownload = async (file: FileMetadata) => {
    try {
      const url = await SupabaseFileStorage.getSignedUrl(file.storage_path);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Error al obtener el archivo");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file.file_name;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast({
        title: "Descarga completada",
        description: `${file.file_name} se ha descargado correctamente`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error al descargar archivo",
        description: "No se pudo descargar el archivo",
        variant: "destructive",
      });
    }
  };

  const handleView = async (file: FileMetadata) => {
    try {
      let url: string;
      try {
        url = await SupabaseFileStorage.getFileUrl(file.storage_path);
      } catch {
        url = await SupabaseFileStorage.getSignedUrl(file.storage_path);
      }
      window.open(url, "_blank");
    } catch (error) {
      toast({
        title: "Error al abrir archivo",
        description: "No se pudo abrir el archivo para visualización",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Archivos del Proyecto
            {files.length > 0 && (
              <span className="text-sm text-muted-foreground font-normal">
                ({files.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          {!isReadOnly && (
            <div className="space-y-4">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
                  ${isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/20"}
                  ${uploading ? "opacity-50 pointer-events-none" : "cursor-pointer hover:border-muted-foreground/40 hover:bg-muted/30"}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png,.gif,.webp"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {uploading
                        ? uploadProgressText || "Subiendo..."
                        : "Arrastra archivos aquí"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {uploading
                        ? "Por favor espera"
                        : "PDF, Excel, imágenes. Máx. 50MB por archivo."}
                    </p>
                  </div>
                  {!uploading && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 gap-1 cursor-pointer"
                      disabled={uploading}
                    >
                      <Plus className="w-3 h-3" />
                      Seleccionar archivo
                    </Button>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="file-description" className="text-sm">
                  Descripción (opcional)
                </Label>
                <Textarea
                  id="file-description"
                  placeholder="Describe el contenido del archivo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={uploading}
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {/* Files List */}
          <div className="space-y-2">
            {uploading && (
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted">
                <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Subiendo documento...</p>
                  <p className="text-xs text-muted-foreground">
                    Por favor espera
                  </p>
                </div>
              </div>
            )}

            {files.map((file, index) => {
              const isBeingDeleted = deletingFileId === file.id;

              return (
                <a
                  key={file.id}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleView(file);
                  }}
                  className={`flex items-center gap-4 p-4 border rounded-lg bg-card transition-colors ${isBeingDeleted ? "opacity-50 pointer-events-none" : "hover:bg-accent/50 group cursor-pointer"}`}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center">
                    {isBeingDeleted ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <FileText className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium text-sm truncate"
                      title={file.file_name}
                    >
                      {index + 1}. {file.file_name}
                    </p>
                    <p className="text-xs">
                      {isBeingDeleted ? (
                        <span className="font-medium">Eliminando...</span>
                      ) : (
                        <>
                          {formatFileSize(file.file_size)} • Subido el{" "}
                          {formatDate(file.uploaded_at)}
                          {file.description && (
                            <span className="ml-2 text-muted-foreground">
                              • {file.description}
                            </span>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  {!isBeingDeleted && (
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(file);
                            }}
                          >
                            <Eye className="w-4 h-4" />
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
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Descargar</p>
                        </TooltipContent>
                      </Tooltip>

                      {!isReadOnly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFileToDelete(file);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Eliminar</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </a>
              );
            })}

            {files.length === 0 && !uploading && (
              <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No hay archivos en este proyecto</p>
                <p className="text-xs mt-1">
                  Sube documentos relacionados con el proyecto
                </p>
              </div>
            )}
          </div>
        </CardContent>

        {/* Confirmación de eliminación */}
        <AlertDialog
          open={!!fileToDelete}
          onOpenChange={() => setFileToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
              <AlertDialogDescription>
                Estás a punto de eliminar{" "}
                <strong>{fileToDelete?.file_name}</strong>.
                <br />
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="cursor-pointer"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </TooltipProvider>
  );
}

"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Image as ImageIcon,
  FileText,
  Trash2,
  Loader2,
  Eye,
  X,
  Paperclip,
  LayoutGrid,
  FileSpreadsheet,
  Plus,
} from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { BudgetAttachment, DocumentType } from "@/lib/prisma-typed-service";

interface BudgetAttachmentsProps {
  budgetId: string;
  attachments: BudgetAttachment[];
  onAttachmentsChange: (attachments: BudgetAttachment[]) => void;
  isEditable?: boolean;
}

// Tamaños máximos y tipos permitidos
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ALLOWED_PDF_TYPES = ["application/pdf"];
const MAX_PROJECT_IMAGES = 4; // Límite de imágenes por presupuesto

export function BudgetAttachments({
  budgetId,
  attachments,
  onAttachmentsChange,
  isEditable = true,
}: BudgetAttachmentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [selectedImage, setSelectedImage] = useState<BudgetAttachment | null>(
    null,
  );
  const [attachmentToDelete, setAttachmentToDelete] =
    useState<BudgetAttachment | null>(null);
  // Eliminado: isDeleting ya no se usa porque el modal se cierra inmediatamente
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<
    string | null
  >(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeUploadZone, setActiveUploadZone] = useState<DocumentType | null>(
    null,
  );

  const projectImagesRef = useRef<HTMLInputElement>(null);
  const technicalPlansRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Separar attachments por tipo
  const projectImages = attachments.filter(
    (a) => a.document_type === "project_image",
  );
  const technicalPlans = attachments.filter(
    (a) => a.document_type === "technical_plan",
  );

  // Detectar el servicio de almacenamiento por la URL
  const getStorageProvider = (
    attachment: BudgetAttachment,
  ): "cloudinary" | "supabase" => {
    if (attachment.url.includes("cloudinary.com")) return "cloudinary";
    if (attachment.url.includes("supabase.co")) return "supabase";
    return "supabase"; // default
  };

  // Validar archivo según el tipo
  const validateFile = (
    file: File,
    documentType: DocumentType,
  ): { valid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `El archivo es demasiado grande. Máximo ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      };
    }

    const allowedTypes =
      documentType === "project_image"
        ? ALLOWED_IMAGE_TYPES
        : ALLOWED_PDF_TYPES;

    if (!allowedTypes.includes(file.type)) {
      const typeMessage =
        documentType === "project_image"
          ? "Solo se permiten imágenes (JPG, PNG, WebP, GIF)"
          : "Solo se permiten archivos PDF";
      return { valid: false, error: typeMessage };
    }

    return { valid: true };
  };

  // Subir archivo
  const uploadFile = async (file: File, documentType: DocumentType) => {
    // Validar límite de imágenes
    if (
      documentType === "project_image" &&
      projectImages.length >= MAX_PROJECT_IMAGES
    ) {
      toast({
        title: "Límite alcanzado",
        description: `Solo se permiten ${MAX_PROJECT_IMAGES} imágenes por presupuesto. Elimina una imagen existente para subir una nueva.`,
        variant: "destructive",
      });
      return;
    }

    const validation = validateFile(file, documentType);
    if (!validation.valid) {
      toast({
        title: "Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadingType(documentType);
    setUploadProgress(`Subiendo ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);

      const response = await fetch(`/api/budgets/${budgetId}/attachments`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al subir el archivo");
      }

      const data = await response.json();
      onAttachmentsChange([data.attachment, ...attachments]);

      toast({
        title:
          documentType === "project_image" ? "Imagen subida" : "Plano subido",
        description: `"${file.name}" se ha subido correctamente.`,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al subir el archivo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadingType(null);
      setUploadProgress(null);
      setActiveUploadZone(null);
    }
  };

  // Manejar selección de archivo
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    documentType: DocumentType,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setActiveUploadZone(documentType);
      uploadFile(file, documentType);
    }
    // Resetear el input
    if (documentType === "project_image" && projectImagesRef.current) {
      projectImagesRef.current.value = "";
    } else if (documentType === "technical_plan" && technicalPlansRef.current) {
      technicalPlansRef.current.value = "";
    }
  };

  // Drag and drop
  const handleDragOver = useCallback(
    (e: React.DragEvent, type: DocumentType) => {
      e.preventDefault();
      setIsDragging(true);
      setActiveUploadZone(type);
    },
    [],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setActiveUploadZone(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, documentType: DocumentType) => {
      e.preventDefault();
      setIsDragging(false);
      setActiveUploadZone(null);

      const file = e.dataTransfer.files[0];
      if (file) {
        uploadFile(file, documentType);
      }
    },
    [attachments],
  );

  // Eliminar archivo
  const handleDelete = async () => {
    if (!attachmentToDelete) return;

    const attachmentId = attachmentToDelete.id;

    // Cerrar modal inmediatamente y marcar la imagen como eliminándose
    setAttachmentToDelete(null);
    setDeletingAttachmentId(attachmentId);

    try {
      const response = await fetch(`/api/budgets/attachments/${attachmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar el archivo");

      onAttachmentsChange(attachments.filter((a) => a.id !== attachmentId));

      toast({
        title: "Archivo eliminado",
        description: `"${attachmentToDelete.original_name}" se ha eliminado.`,
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el archivo",
        variant: "destructive",
      });
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  // Formatear tamaño
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Formatear fecha
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Componente de zona de subida
  const UploadZone = ({
    documentType,
    title,
    description,
    icon: Icon,
    acceptedTypes,
    colorClass,
  }: {
    documentType: DocumentType;
    title: string;
    description: string;
    icon: React.ElementType;
    acceptedTypes: string;
    colorClass: string;
  }) => (
    <div
      onDragOver={(e) => handleDragOver(e, documentType)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, documentType)}
      className={`
        border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
        ${activeUploadZone === documentType && isDragging ? `border-primary bg-primary/5 scale-[1.02]` : "border-muted-foreground/20"}
        ${isUploading ? "opacity-50 pointer-events-none" : "cursor-pointer hover:border-muted-foreground/40 hover:bg-muted/30"}
      `}
      onClick={() =>
        !isUploading &&
        (documentType === "project_image"
          ? projectImagesRef.current?.click()
          : technicalPlansRef.current?.click())
      }
    >
      <input
        ref={
          documentType === "project_image"
            ? projectImagesRef
            : technicalPlansRef
        }
        type="file"
        accept={acceptedTypes}
        onChange={(e) => handleFileSelect(e, documentType)}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-3">
        <div className={`p-3 rounded-full ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isUploading && activeUploadZone === documentType 
              ? uploadProgress || "Subiendo..." 
              : description}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 gap-1 cursor-pointer"
          disabled={isUploading}
        >
          <Plus className="w-3 h-3" />
          Seleccionar archivo
        </Button>
      </div>
    </div>
  );

  // Grid de imágenes de proyecto
  const ProjectImagesGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {/* Card de placeholder cuando se está subiendo una imagen */}
      {isUploading && uploadingType === "project_image" && (
        <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black-50/80">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-xs font-medium mt-2">
              Subiendo...
            </span>
          </div>
        </div>
      )}
      
      {projectImages.map((image) => {
        const isBeingDeleted = deletingAttachmentId === image.id;

        return (
          <div
            key={image.id}
            className={`group relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer ${isBeingDeleted ? "pointer-events-none" : ""}`}
            onClick={() => !isBeingDeleted && setSelectedImage(image)}
          >
            <Image
              src={image.thumbnail_url || image.url}
              alt={image.original_name}
              fill
              className={`object-cover transition-all ${isBeingDeleted ? "opacity-30 scale-95" : "group-hover:scale-105"}`}
            />

            {/* Overlay de eliminación */}
            {isBeingDeleted && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs font-medium mt-2">
                  Eliminando...
                </span>
              </div>
            )}

            {/* Overlay normal (solo cuando no se está eliminando) */}
            {!isBeingDeleted && (
              <>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                {isEditable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAttachmentToDelete(image);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );

  // Lista de planos técnicos
  const TechnicalPlansList = () => (
    <div className="space-y-2">
      {/* Placeholder cuando se está subiendo un plano */}
      {isUploading && uploadingType === "technical_plan" && (
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted">
          <div className="flex-shrink-0 w-12 h-12 bg-black-50/80 rounded-lg flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Subiendo documento...</p>
            <p className="text-xs">Por favor espera</p>
          </div>
        </div>
      )}
      
      {technicalPlans.map((plan, index) => {
        const provider = getStorageProvider(plan);
        const isBeingDeleted = deletingAttachmentId === plan.id;

        return (
          <a
            key={plan.id}
            href={plan.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-4 p-4 border rounded-lg bg-card transition-colors ${isBeingDeleted ? "opacity-50 pointer-events-none" : "hover:bg-accent/50 group cursor-pointer"}`}
          >
            <div
              className='flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center'
            >
              {isBeingDeleted ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <FileText className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="font-medium text-sm truncate"
                title={plan.original_name}
              >
                {index + 1}. {plan.original_name}
              </p>
              <p className="text-xs">
                {isBeingDeleted ? (
                  <span className="font-medium">
                    Eliminando...
                  </span>
                ) : (
                  <>
                    {formatFileSize(plan.size)} • Subido el{" "}
                    {formatDate(plan.created_at)}
                  </>
                )}
              </p>
            </div>
            {!isBeingDeleted && (
              <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" asChild>
                      <a href={plan.url} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ver PDF</p>
                  </TooltipContent>
                </Tooltip>
                {isEditable && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAttachmentToDelete(plan);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Eliminar PDF</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </a>
        );
      })}
    </div>
  );

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Archivos Adjuntos
            {attachments.length > 0 && (
              <span className="text-sm text-muted-foreground font-normal">
                ({attachments.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* SECCIÓN 1: Imágenes de Proyecto */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <LayoutGrid className="w-5 h-5 text-blue-500" />
              <div>
                <h3 className="font-semibold text-sm">Imágenes del Proyecto</h3>
                <p className="text-xs text-muted-foreground">
                  Fotos de módulos, instalaciones o referencias visuales
                </p>
              </div>
              <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {projectImages.length}
              </span>
            </div>

            {isEditable && projectImages.length < MAX_PROJECT_IMAGES && (
              <UploadZone
                documentType="project_image"
                title="Arrastra imágenes aquí"
                description={`JPG, PNG, WebP o GIF. Máx. 10MB. (${projectImages.length}/${MAX_PROJECT_IMAGES})`}
                icon={ImageIcon}
                acceptedTypes=".jpg,.jpeg,.png,.webp,.gif"
                colorClass="bg-blue-100 text-blue-600"
              />
            )}

            {isEditable && projectImages.length >= MAX_PROJECT_IMAGES && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-sm text-amber-800 font-medium">
                  Límite alcanzado: {MAX_PROJECT_IMAGES} imágenes
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Elimina una imagen existente para subir una nueva
                </p>
              </div>
            )}

            {projectImages.length > 0 ? (
              <ProjectImagesGrid />
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No hay imágenes de proyecto</p>
                <p className="text-xs mt-1">
                  Sube fotos para mostrar en el presupuesto
                </p>
              </div>
            )}
          </div>

          {/* SECCIÓN 2: Planos Técnicos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <FileSpreadsheet className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="font-semibold text-sm">Planos Técnicos</h3>
                <p className="text-xs text-muted-foreground">
                  Documentos PDF de planos, especificaciones técnicas y dibujos
                </p>
              </div>
              <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {technicalPlans.length}
              </span>
            </div>

            {isEditable && (
              <UploadZone
                documentType="technical_plan"
                title="Arrastra planos PDF aquí"
                description="Solo archivos PDF. Máx. 10MB por documento."
                icon={FileText}
                acceptedTypes=".pdf"
                colorClass="bg-red-100 text-red-600"
              />
            )}

            {technicalPlans.length > 0 ? (
              <TechnicalPlansList />
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No hay planos técnicos</p>
                <p className="text-xs mt-1">
                  Sube planos y especificaciones técnicas
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal para ver imagen */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent
          className="w-screen h-screen max-w-none rounded-none md:w-[95vw] md:h-[90vh] md:max-w-[95vw] md:rounded-lg p-0 overflow-hidden"
          showCloseButton={false}
        >
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
            <DialogTitle className="text-white flex items-center justify-between">
              <span className="truncate">{selectedImage?.original_name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 cursor-pointer"
                onClick={() => setSelectedImage(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedImage && (
            <div className="relative w-full h-full bg-black">
              <Image
                src={selectedImage.url}
                alt={selectedImage.original_name}
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminación */}
      <AlertDialog
        open={!!attachmentToDelete}
        onOpenChange={() => setAttachmentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar{" "}
              <strong>{attachmentToDelete?.original_name}</strong>.
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
    </TooltipProvider>
  );
}

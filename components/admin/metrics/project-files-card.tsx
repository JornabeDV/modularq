"use client";

import { formatDate } from "@/lib/utils";
import { SupabaseFileStorage } from "@/lib/supabase-storage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, Eye, FileText } from "lucide-react";
import { formatFileSize } from "./metrics-helpers";

type Props = {
  projectFiles: any[];
  filesLoading: boolean;
};

export function ProjectFilesCard({ projectFiles, filesLoading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Archivos del Proyecto
        </CardTitle>
        <CardDescription>
          Documentos y archivos asociados al proyecto
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando archivos...</p>
            </div>
          </div>
        ) : projectFiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm sm:text-base">
              No hay archivos en este proyecto
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {projectFiles.map((file) => (
              <div
                key={file.id}
                className="flex hover:bg-accent/50 transition-colors flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg"
              >
                <div
                  className="flex items-center cursor-pointer rounded-lg p-2 -m-2 flex-1"
                  onClick={() => handleView(file)}
                  title="Hacer clic para ver el archivo"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {file.file_name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>{formatDate(file.uploaded_at)}</span>
                      <span className="capitalize">{file.file_type}</span>
                    </div>
                    {file.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {file.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <TooltipProvider>
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
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const handleDownload = async (file: any) => {
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
  } catch (error) {
    console.error("Error downloading file:", error);
  }
};

const handleView = async (file: any) => {
  try {
    const url = await SupabaseFileStorage.getSignedUrl(file.storage_path);
    if (url) {
      window.open(url, "_blank");
    }
  } catch (error) {
    console.error("Error viewing file:", error);
  }
};

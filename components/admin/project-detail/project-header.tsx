"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Edit, Zap, ClipboardList } from "lucide-react";
import { DeleteProjectButton } from "../delete-project-button";
import type { Project } from "@/lib/types";

interface ProjectHeaderProps {
  project: Project;
  isReadOnly: boolean;
  isEditDialogOpen: boolean;
  onEditClick: () => void;
  onActivateClick: () => void;
  onDeactivateClick: () => void;
  onDelete: () => void;
}

export function ProjectHeader({
  project,
  isReadOnly,
  isEditDialogOpen,
  onEditClick,
  onActivateClick,
  onDeactivateClick,
  onDelete,
}: ProjectHeaderProps) {
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/projects")}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <>
              <Dialog open={isEditDialogOpen} onOpenChange={onEditClick}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={onEditClick}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </DialogTrigger>
              </Dialog>
              {project.status === "planning" && (
                <Button
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  size="sm"
                  onClick={onActivateClick}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">¡Activar Proyecto!</span>
                  <span className="sm:hidden">Activar</span>
                </Button>
              )}
              {project.status === "active" && (
                <Button
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  size="sm"
                  onClick={onDeactivateClick}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Volver a Planificación
                </Button>
              )}
              {project.status !== "active" && (
                <DeleteProjectButton
                  projectId={project.id}
                  projectName={project.name}
                  onDelete={onDelete}
                />
              )}
            </>
          )}
          {project.status === "active" && (
            <div className="hidden sm:block text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md">
              <strong>Proyecto Activo</strong>
            </div>
          )}
        </div>
      </div>

      {/* Project Status Indicator - Solo móvil */}
      {project.status === "active" && (
        <div className="flex justify-start sm:hidden">
          <div className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md inline-block">
            <strong>Proyecto Activo</strong>
          </div>
        </div>
      )}
    </>
  );
}

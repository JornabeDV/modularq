"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { GripVertical, CheckCircle, User, Edit } from "lucide-react";
import type { ProjectTask } from "@/lib/types";

interface DraggableTaskCardProps {
  projectTask: ProjectTask;
  onUnassign: (projectTaskId: string) => void;
  onEdit: (task: ProjectTask) => void;
  onComplete?: (task: ProjectTask) => void;
  isDragging?: boolean;
  taskNumber?: number;
  isReadOnly?: boolean;
  projectStatus?: string;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, taskId: string) => void;
}

export function DraggableTaskCard({
  projectTask,
  onUnassign,
  onEdit,
  onComplete,
  isDragging = false,
  taskNumber = 1,
  isReadOnly = false,
  projectStatus,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: DraggableTaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hasAssignedUser = Boolean(projectTask.assignedUser);
  const projectAllowsUnassignedActions =
    projectStatus === "planning" || projectStatus === "active";
  const canEditUnassigned =
    !isReadOnly && !hasAssignedUser && projectAllowsUnassignedActions;
  const canDeleteTask =
    !isReadOnly &&
    (hasAssignedUser ? projectStatus !== "active" : projectAllowsUnassignedActions);
  const deleteButtonLabel = hasAssignedUser ? "Quitar" : "Eliminar";
  const taskStatus = projectTask.status || "pending";
  const statusLabelMap: Record<ProjectTask["status"], string> = {
    pending: "Pendiente",
    in_progress: "En progreso",
    completed: "Completada",
    cancelled: "Cancelada",
  };
  const statusVariantMap: Record<
    ProjectTask["status"],
    "outline" | "secondary" | "default" | "destructive"
  > = {
    pending: "outline",
    in_progress: "secondary",
    completed: "default",
    cancelled: "destructive",
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("[data-drag-handle]") ||
      target.closest('[role="button"]')
    ) {
      return;
    }
    onEdit(projectTask);
  };
  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onEdit(projectTask);
  };
  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onUnassign(projectTask.id);
  };

  return (
    <Card
      className={`p-4 transition-all duration-200 select-none ${
        isReadOnly ? "cursor-default" : "cursor-move"
      } ${
        isDragging
          ? "opacity-50 shadow-lg"
          : isHovered
            ? "shadow-md bg-muted/50 border-primary/20 hover:shadow-md hover:bg-muted/30 hover:border-primary/10"
            : ""
      }`}
      onDragOver={!isReadOnly ? onDragOver : undefined}
      onDrop={!isReadOnly ? (e) => onDrop?.(e, projectTask.id) : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold">
              {taskNumber}
            </div>

            {!isReadOnly && (
              <div
                data-drag-handle
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors cursor-grab active:cursor-grabbing"
                draggable={true}
                onDragStart={(e) => {
                  e.stopPropagation();
                  onDragStart?.(e, projectTask.id);
                }}
                onDragEnd={(e) => {
                  e.stopPropagation();
                  onDragEnd?.(e);
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-5 w-5" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h5 className="font-medium text-sm sm:text-base truncate">
                {projectTask.task?.title}
              </h5>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {projectTask.task?.category}
                </Badge>
                <Badge
                  variant={statusVariantMap[taskStatus]}
                  className="text-xs"
                >
                  {statusLabelMap[taskStatus]}
                </Badge>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                {projectTask.assignedUser ? (
                  <Badge variant="outline" className="text-xs">
                    <User className="h-3 w-3 mr-1" />
                    {projectTask.assignedUser.name}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs text-muted-foreground"
                  >
                    <User className="h-3 w-3 mr-1" />
                    Sin asignar
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {canEditUnassigned && (
            <div className="flex justify-end sm:justify-start sm:flex-shrink-0">
              <Button
                size="sm"
                variant="default"
                className="cursor-pointer flex items-center gap-1"
                onClick={handleEditClick}
              >
                <Edit className="h-3 w-3" />
                Editar
              </Button>
            </div>
          )}
          {canDeleteTask && (
            <div className="flex justify-end sm:justify-start sm:flex-shrink-0">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer"
                  >
                    {deleteButtonLabel}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción elimina la tarea del proyecto. ¿Seguro que
                      querés continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteClick}>
                      {deleteButtonLabel}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

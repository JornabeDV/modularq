"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ProjectTask, Project } from "@/lib/types";

interface EditTaskDialogProps {
  isOpen: boolean;
  task: ProjectTask | null;
  project: Project | null;
  onClose: () => void;
  onSave: (taskId: string, data: Partial<ProjectTask>) => Promise<void>;
}

export function EditTaskDialog({
  isOpen,
  task,
  project,
  onClose,
  onSave,
}: EditTaskDialogProps) {
  const [formData, setFormData] = useState<Partial<ProjectTask>>({
    status: "pending",
    actualHours: 0,
    progressPercentage: 0,
    notes: "",
  });

  useEffect(() => {
    if (task) {
      setFormData({
        status: task.status,
        actualHours: task.actualHours || 0,
        progressPercentage: task.progressPercentage || 0,
        notes: task.notes || "",
      });
    }
  }, [task]);

  // Ensure status is "pending" if project is in planning
  useEffect(() => {
    if (task && project?.status === "planning") {
      setFormData((prev) => ({ ...prev, status: "pending" as any }));
    }
  }, [task, project?.status]);

  if (!task) return null;

  const isProjectActive = project?.status === "active";

  const handleSave = () => {
    const updateData = {
      status: isProjectActive ? formData.status : "pending",
      actualHours: formData.actualHours,
      progressPercentage: formData.progressPercentage,
      notes: formData.notes,
    };
    onSave(task.id, updateData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            Editar Tarea del Proyecto
          </DialogTitle>
          <DialogDescription className="text-sm">
            Actualiza la evolución de esta tarea en el proyecto
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="text-sm font-medium">Tarea</label>
            <p className="text-sm text-muted-foreground mt-1 break-words">
              {task.task?.title}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Estado</label>
            {isProjectActive ? (
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as any })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="assigned">Asignada</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground">Pendiente</p>
                <Badge
                  variant="outline"
                  className="text-[10px] sm:text-xs w-fit"
                >
                  <span className="hidden sm:inline">
                    El estado solo se puede cambiar cuando el proyecto está
                    activo
                  </span>
                  <span className="sm:hidden">
                    Solo editable cuando el proyecto está activo
                  </span>
                </Badge>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Horas Reales</label>
            <Input
              type="number"
              step="0.5"
              value={formData.actualHours}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  actualHours: parseFloat(e.target.value) || 0,
                })
              }
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Progreso (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.progressPercentage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  progressPercentage: parseInt(e.target.value) || 0,
                })
              }
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Notas</label>
            <Textarea
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Notas adicionales sobre la tarea..."
              className="text-sm mt-1 min-h-[80px] sm:min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="cursor-pointer w-full sm:w-auto order-2 sm:order-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="cursor-pointer w-full sm:w-auto order-1 sm:order-2"
          >
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TASK_CATEGORIES } from "@/lib/constants";
import type { ProjectTask, Project, Task } from "@/lib/types";

interface EditTaskDialogProps {
  isOpen: boolean;
  task: ProjectTask | null;
  project: Project | null;
  onClose: () => void;
  onSave: (
    taskId: string,
    projectTaskData: Partial<ProjectTask>,
    baseTaskData?: Partial<Task>,
  ) => Promise<void>;
}

type TaskFormErrors = {
  category?: string;
  estimatedHours?: string;
};

export function EditTaskDialog({
  isOpen,
  task,
  project,
  onClose,
  onSave,
}: EditTaskDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    estimatedHours: "1",
    status: "pending" as ProjectTask["status"],
    actualHours: 0,
    progressPercentage: 0,
    notes: "",
  });
  const [errors, setErrors] = useState<TaskFormErrors>({});

  useEffect(() => {
    if (!task) return;
    setFormData({
      title: task.task?.title || "",
      description: task.task?.description || "",
      category: task.task?.category || "",
      estimatedHours: String(
        task.estimatedHours || task.task?.estimatedHours || 1,
      ),
      status: task.status,
      actualHours: task.actualHours || 0,
      progressPercentage: task.progressPercentage || 0,
      notes: task.notes || "",
    });
    setErrors({});
  }, [task]);

  useEffect(() => {
    if (task && project?.status === "planning") {
      setFormData((prev) => ({ ...prev, status: "pending" as any }));
    }
  }, [task, project?.status]);

  if (!task) return null;

  const clearError = (field: keyof TaskFormErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleEstimatedHoursChange = (value: string) => {
    if (value === "" || /^\d*[.,]?\d*$/.test(value)) {
      setFormData((prev) => ({ ...prev, estimatedHours: value }));
      clearError("estimatedHours");
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "category") {
      clearError("category");
    }
  };

  const handleSave = () => {
    if (!task) return;

    const normalizedValue = formData.estimatedHours.replace(",", ".");
    const estimatedHoursValue = parseFloat(normalizedValue);
    const validationErrors: TaskFormErrors = {};
    if (!formData.category.trim()) {
      validationErrors.category = "La categoría es obligatoria";
    }
    if (!Number.isFinite(estimatedHoursValue) || estimatedHoursValue <= 0) {
      validationErrors.estimatedHours =
        "Las horas estimadas deben ser un número mayor a 0";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    const projectTaskUpdates: Partial<ProjectTask> = {
      estimatedHours: estimatedHoursValue,
    };
    const baseTaskUpdates: Partial<Task> = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      estimatedHours: estimatedHoursValue,
    };
    onSave(task.id, projectTaskUpdates, baseTaskUpdates);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            Editar Tarea del Proyecto
          </DialogTitle>
          <DialogDescription className="text-sm">
            Actualiza los datos de esta tarea
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="task-title" className="mb-2 block text-sm">
                Título de la tarea
              </Label>
              <Input
                id="task-title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
                placeholder="Ej: Instalación Sistema Eléctrico"
                className="placeholder:text-sm"
              />
            </div>
            <div>
              <Label htmlFor="task-category" className="mb-2 block text-sm">
                Categoría *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger
                  id="task-category"
                  className="w-full"
                  aria-invalid={Boolean(errors.category)}
                >
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-destructive mt-1">
                  {errors.category}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div>
              <Label
                htmlFor="task-estimated-hours"
                className="mb-2 block text-sm"
              >
                Horas Estimadas *
              </Label>
              <Input
                id="task-estimated-hours"
                value={formData.estimatedHours}
                onChange={(e) => handleEstimatedHoursChange(e.target.value)}
                placeholder="Ej: 2.5 o 2,5"
                inputMode="decimal"
                className="placeholder:text-sm w-1/2"
                aria-invalid={Boolean(errors.estimatedHours)}
              />
              {errors.estimatedHours && (
                <p className="text-xs text-destructive mt-1">
                  {errors.estimatedHours}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="task-description" className="mb-2 block text-sm">
                Descripción
              </Label>
              <Textarea
                id="task-description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe detalladamente la tarea..."
                rows={3}
                className="placeholder:text-sm text-xs sm:text-sm"
              />
            </div>
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

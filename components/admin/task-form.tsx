"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task } from "@/lib/types";
import { TASK_CATEGORIES } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  isEditing: boolean;
  initialData?: Task | null;
  projectId?: string;
  isLoading?: boolean;
}

export function TaskForm({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  initialData,
  projectId,
  isLoading = false,
}: TaskFormProps) {
  const { user } = useAuth();
  const isProjectTask = !!projectId;
  type TaskFormErrors = {
    category?: string;
    estimatedHours?: string;
  };

  const getDefaultFormData = () => ({
    title: "",
    description: "",
    estimatedHours: "1",
    category: "",
    type: isProjectTask ? "custom" : "standard",
  });

  const [formData, setFormData] = useState(getDefaultFormData());
  const [errors, setErrors] = useState<TaskFormErrors>({});

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        estimatedHours: String(initialData.estimatedHours || 1),
        category: initialData.category || "",
        type: initialData.type || (isProjectTask ? "custom" : "standard"),
      });
    } else {
      setFormData(getDefaultFormData());
    }
    setErrors({});
  }, [isEditing, initialData?.id, isProjectTask]);

  useEffect(() => {
    if (!isOpen && !isEditing) {
      setFormData(getDefaultFormData());
      setErrors({});
    }
  }, [isOpen, isEditing, isProjectTask]);

  const clearError = (field: keyof TaskFormErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };
  const categoryErrorId = "task-form-category-error";
  const estimatedHoursErrorId = "task-form-estimated-hours-error";

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "category") {
      clearError("category");
    }
  };

  const handleEstimatedHoursChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    if (value === "" || /^\d*[.,]?\d*$/.test(value)) {
      handleInputChange("estimatedHours", value);
      clearError("estimatedHours");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedValue = formData.estimatedHours.replace(",", ".");
    const estimatedHoursValue = parseFloat(normalizedValue);

    const newErrors: TaskFormErrors = {};
    if (!formData.category.trim()) {
      newErrors.category = "La categoría es obligatoria";
    }
    if (!Number.isFinite(estimatedHoursValue) || estimatedHoursValue <= 0) {
      newErrors.estimatedHours =
        "Las horas estimadas deben ser un número mayor a 0";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const typeValue =
      formData.type === "standard" || formData.type === "custom"
        ? formData.type
        : "custom";

    onSubmit({
      title: formData.title,
      description: formData.description,
      estimatedHours: estimatedHoursValue,
      category: formData.category,
      type: typeValue,
      taskOrder: 0,
      createdBy: user?.id || "00000000-0000-0000-0000-000000000000",
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) onClose();
      }}
    >
      <DialogContent
        className="h-[100dvh] w-[100dvw] max-w-none rounded-none md:h-auto md:w-full md:max-w-2xl md:rounded-lg">
        <DialogHeader>
          <DialogTitle className="max-sm:mt-12">
            {isEditing
              ? "Editar Tarea"
              : isProjectTask
                ? "Crear Tarea Personalizada"
                : "Crear Nueva Tarea Estándar"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col justify-between h-full space-y-4">
          <div>
            {/* Título y categoría */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 sm:mb-6">
              <div>
                <Label htmlFor="title" className="mb-2">
                  Título de la Tarea
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                  placeholder="Ej: Instalación Sistema Eléctrico"
                  className="placeholder:text-sm"
                />
              </div>
              <div>
                <Label htmlFor="category" className="mb-2">
                  Categoría *
                </Label>
                <Select
                  required
                  value={formData.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value)
                  }
                >
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={Boolean(errors.category)}
                    aria-describedby={
                      errors.category ? categoryErrorId : undefined
                    }
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
                  <p
                    className="text-xs text-destructive mt-1"
                    id={categoryErrorId}
                  >
                    {errors.category}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 sm:mb-6">
              {!isProjectTask && (
                <div>
                  <Label htmlFor="type" className="mb-2">
                    Tipo de Tarea
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange("type", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">
                        Estándar (aparece en todos los proyectos)
                      </SelectItem>
                      <SelectItem value="custom">
                        Personalizada (asignada manualmente)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label htmlFor="estimatedHours" className="mb-2">
                  Horas Estimadas *
                </Label>
                <Input
                  id="estimatedHours"
                  type="text"
                  inputMode="decimal"
                  required
                  value={formData.estimatedHours}
                  onChange={handleEstimatedHoursChange}
                  placeholder="Ej: 2.5 o 2,5"
                  className="placeholder:text-sm"
                  aria-invalid={Boolean(errors.estimatedHours)}
                  aria-describedby={
                    errors.estimatedHours ? estimatedHoursErrorId : undefined
                  }
                />
                {errors.estimatedHours && (
                  <p
                    className="text-xs text-destructive mt-1"
                    id={estimatedHoursErrorId}
                  >
                    {errors.estimatedHours}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="mb-2">
                Descripción
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe detalladamente la tarea..."
                rows={3}
                className="placeholder:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading
                ? "Guardando..."
                : isEditing
                  ? "Actualizar Tarea"
                  : "Crear Tarea"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
import { Calendar } from "lucide-react";
import type { Project } from "@/lib/types";
import { useClientsPrisma } from "@/hooks/use-clients-prisma";

interface ProjectFormData {
  name: string;
  description: string;
  status: "planning" | "active" | "paused" | "completed" | "delivered";
  condition: "alquiler" | "venta";
  startDate?: string;
  endDate?: string;
  clientId?: string;
  supervisor?: string;
  budget?: number;
  progress?: number;
  // Especificaciones técnicas
  modulation: string;
  height: number;
  width: number;
  depth: number;
  moduleCount: number;
}

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<any>; // Ahora retorna Promise
  isEditing: boolean;
  initialData?: Project | null;
  checklistComplete?: boolean;
}

const PROJECT_STATUSES = [
  { value: "planning", label: "Planificación" },
  { value: "active", label: "Activo" },
  { value: "paused", label: "En Pausa" },
  { value: "completed", label: "Completado" },
  { value: "delivered", label: "Entregado" },
];

const PROJECT_CONDITIONS = [
  { value: "alquiler", label: "Alquiler" },
  { value: "venta", label: "Venta" },
];

export function ProjectForm({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  initialData,
  checklistComplete = false,
}: ProjectFormProps) {
  const { clients, loading: clientsLoading } = useClientsPrisma();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "planning" as
      | "planning"
      | "active"
      | "paused"
      | "completed"
      | "delivered",
    condition: "venta" as "alquiler" | "venta",
    startDate: "",
    endDate: "",
    clientId: "none",
    modulation: "standard",
    height: 2.0,
    width: 1.5,
    depth: 0.8,
    moduleCount: 1,
  });

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        status: initialData.status,
        condition: initialData.condition || "venta",
        startDate: initialData.startDate || "",
        endDate: initialData.endDate || "",
        clientId: initialData.clientId || "none",
        modulation: initialData.modulation || "standard",
        height: initialData.height || 2.0,
        width: initialData.width || 1.5,
        depth: initialData.depth || 0.8,
        moduleCount: initialData.moduleCount || 1,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        status: "planning",
        condition: "venta",
        startDate: "",
        endDate: "",
        clientId: "none",
        modulation: "standard",
        height: 2.0,
        width: 1.5,
        depth: 0.8,
        moduleCount: 1,
      });
    }
  }, [isEditing, initialData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const submitData = {
        ...formData,
        clientId: formData.clientId === "none" ? undefined : formData.clientId,
      };

      const result = await onSubmit(submitData);

      if (result && !result.success) {
        setSubmitError(result.error || "Error al guardar el proyecto");
        setIsSubmitting(false);
        return;
      }

      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitError("Error inesperado al guardar el proyecto");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-auto max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Proyecto" : "Crear Nuevo Proyecto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="mb-2">
                Nombre del Proyecto
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                placeholder="Ej: Construcción Edificio Principal"
              />
            </div>
            <div>
              <Label htmlFor="clientId" className="mb-2">
                Cliente
              </Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => handleInputChange("clientId", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cliente</SelectItem>
                  {clientsLoading ? (
                    <SelectItem value="loading" disabled>
                      Cargando clientes...
                    </SelectItem>
                  ) : (
                    clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status" className="mb-2">
                Estado
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((status) => {
                    if (
                      isEditing &&
                      initialData?.status === "planning" &&
                      status.value === "active" &&
                      !checklistComplete
                    ) {
                      return null;
                    }
                    return (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="condition" className="mb-2">
                Condición
              </Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => handleInputChange("condition", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_CONDITIONS.map((condition) => (
                    <SelectItem key={condition.value} value={condition.value}>
                      {condition.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="mb-2">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              required
              placeholder="Describe el proyecto..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="mb-2">
                Fecha de Inicio
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  className="pl-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="endDate" className="mb-2">
                Fecha de Fin
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className="pl-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-medium">Especificaciones Técnicas</h3>

            <div className="space-y-2">
              <Label htmlFor="modulation">Modulación</Label>
              <Input
                id="modulation"
                placeholder="Ej: standard, hermanados"
                value={formData.modulation}
                onChange={(e) =>
                  handleInputChange("modulation", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Medidas (metros)</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label
                    htmlFor="height"
                    className="text-sm text-muted-foreground"
                  >
                    Alto
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="2.0"
                    value={formData.height}
                    onChange={(e) =>
                      handleInputChange(
                        "height",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div>
                  <Label
                    htmlFor="width"
                    className="text-sm text-muted-foreground"
                  >
                    Ancho
                  </Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="1.5"
                    value={formData.width}
                    onChange={(e) =>
                      handleInputChange(
                        "width",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div>
                  <Label
                    htmlFor="depth"
                    className="text-sm text-muted-foreground"
                  >
                    Profundidad
                  </Label>
                  <Input
                    id="depth"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.8"
                    value={formData.depth}
                    onChange={(e) =>
                      handleInputChange(
                        "depth",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="moduleCount">Cantidad de Módulos</Label>
              <Input
                id="moduleCount"
                type="number"
                min="1"
                placeholder="1"
                value={formData.moduleCount}
                onChange={(e) =>
                  handleInputChange(
                    "moduleCount",
                    parseInt(e.target.value) || 1
                  )
                }
              />
            </div>
          </div>

          {submitError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
              <p className="text-destructive text-sm">{submitError}</p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting
                ? "Guardando..."
                : isEditing
                ? "Actualizar Proyecto"
                : "Crear Proyecto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

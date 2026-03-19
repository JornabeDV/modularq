"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, X } from "lucide-react";

interface ModuleTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    source_module_id?: string;
  }) => void;
  isLoading?: boolean;
  initialData?: { name: string; description: string } | null;
  existingModules?: any[];
}

export function ModuleTemplateDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialData = null,
  existingModules = [],
}: ModuleTemplateDialogProps) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [sourceModuleId, setSourceModuleId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name ?? "",
        description: initialData?.description ?? "",
      });
      setSourceModuleId(null);
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim(),
      source_module_id: sourceModuleId ?? undefined,
    });
  };

  const activeModules = existingModules.filter((m) => m.is_active);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Módulo" : "Nuevo Módulo Estándar"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="module-name">Nombre del Módulo *</Label>
            <Input
              id="module-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ej: Módulo Planta Libre con Baño"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="module-description">Descripción</Label>
            <Input
              id="module-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Ej: Módulo 5.86m x 2.44m con baño simple"
            />
          </div>

          {/* Selector de módulo fuente — solo en modo crear */}
          {!isEditing && activeModules.length > 0 && (
            <div className="space-y-2">
              <Label>
                Copiar estructura de
                <span className="text-muted-foreground font-normal ml-2 text-xs">
                  (opcional)
                </span>
              </Label>
              <Select
                value={sourceModuleId ?? "none"}
                onValueChange={(val) =>
                  setSourceModuleId(val === "none" ? null : val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Módulo en blanco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Módulo en blanco</SelectItem>
                  {activeModules.map((mod) => (
                    <SelectItem key={mod.id} value={mod.id}>
                      {mod.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sourceModuleId && (
                <p className="text-xs text-muted-foreground">
                  Se copiarán todos los ítems y sus análisis de precios.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 cursor-pointer"
              onClick={onClose}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isEditing ? "Guardar cambios" : "Crear módulo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

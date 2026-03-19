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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, X } from "lucide-react";
import { UNIT_LABELS } from "@/lib/constants";

interface TemplateItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: {
    code: string;
    category: string;
    description: string;
    unit: string;
    default_quantity: number;
  }) => void;
  isLoading?: boolean;
  initialData?: {
    code: string;
    category: string;
    description: string;
    unit: string;
    default_quantity: number;
  } | null;
}

export function TemplateItemDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialData = null,
}: TemplateItemDialogProps) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState({
    code: "",
    category: "",
    description: "",
    unit: "",
    default_quantity: "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        code: initialData?.code ?? "",
        category: initialData?.category ?? "",
        description: initialData?.description ?? "",
        unit: initialData?.unit ?? "",
        default_quantity: initialData?.default_quantity?.toString() ?? "",
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.code.trim() ||
      !formData.category.trim() ||
      !formData.description.trim() ||
      !formData.unit
    )
      return;
    onSubmit({
      code: formData.code.trim(),
      category: formData.category.trim().toUpperCase(),
      description: formData.description.trim(),
      unit: formData.unit,
      default_quantity: parseFloat(formData.default_quantity) || 0,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-[100dvh] w-[100dvw] max-w-none rounded-none md:h-auto md:w-full md:max-w-2xl md:rounded-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Ítem" : "Agregar Ítem al Módulo"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-code">Código *</Label>
              <Input
                id="item-code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="Ej: 1.1, 2.3"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-unit">Unidad de Medida *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) =>
                  setFormData({ ...formData, unit: value })
                }
              >
                <SelectTrigger id="item-unit" className="w-full">
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(UNIT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="capitalize">
                          {value.replace(/_/g, " ")}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          ({label})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-category">Rubro *</Label>
            <Input
              id="item-category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              placeholder="Ej: ESTRUCTURA METÁLICA"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-description">Descripción *</Label>
            <Input
              id="item-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descripción del ítem"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-qty">
              Cantidad predeterminada
              <span className="text-muted-foreground font-normal ml-2 text-xs">
                (se usa al crear el presupuesto)
              </span>
            </Label>
            <Input
              id="item-qty"
              type="number"
              step="0.001"
              min="0"
              value={formData.default_quantity}
              onChange={(e) =>
                setFormData({ ...formData, default_quantity: e.target.value })
              }
              placeholder="0.00"
            />
          </div>

          <div className="flex max-sm:flex-col gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 cursor-pointer"
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
              {isEditing ? "Guardar cambios" : "Agregar ítem"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
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
import { Plus, X } from "lucide-react";
import { UNIT_LABELS } from "@/lib/constants";

interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: {
    code: string;
    category: string;
    description: string;
    unit: string;
    quantity: number;
  }) => void;
}

export function AddItemDialog({
  isOpen,
  onClose,
  onSubmit,
}: AddItemDialogProps) {
  const [formData, setFormData] = useState({
    code: "",
    category: "",
    description: "",
    unit: "",
    quantity: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      code: formData.code,
      category: formData.category,
      description: formData.description,
      unit: formData.unit,
      quantity: parseFloat(formData.quantity) || 0,
    });
    setFormData({
      code: "",
      category: "",
      description: "",
      unit: "",
      quantity: "",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-[100dvh] w-[100dvw] max-w-none rounded-none md:h-auto md:w-full md:max-w-2xl md:rounded-lg">
        <DialogHeader>
          <DialogTitle>Agregar Ítem al Presupuesto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="Ej: 9.1"
                required
              />
            </div>
            <div className="space-y-2 w-full">
              <Label htmlFor="unit">Unidad de Medida *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) =>
                  setFormData({ ...formData, unit: value })
                }
              >
                <SelectTrigger className="w-full">
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
            <Label htmlFor="category">Rubro *</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              placeholder="Ej: INSTALACIÓN ELÉCTRICA"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descripción del ítem"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              placeholder="0.00"
            />
          </div>

          <div className="flex max-sm:flex-col justify-end space-x-2 mt-4 max-sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="max-sm:w-full cursor-pointer"
            >
              Cancelar
            </Button>
            <Button type="submit" className="cursor-pointer">
              Agregar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

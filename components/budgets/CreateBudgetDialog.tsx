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
import { Plus, X } from "lucide-react";

interface CreateBudgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    client_name: string;
    location: string;
    description: string;
  }) => void;
}

export function CreateBudgetDialog({
  isOpen,
  onClose,
  onSubmit,
}: CreateBudgetDialogProps) {
  const [formData, setFormData] = useState({
    client_name: "",
    location: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      client_name: formData.client_name,
      location: formData.location,
      description: formData.description || "",
    });
    setFormData({ client_name: "", location: "", description: "" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Presupuesto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_name">Nombre del Cliente *</Label>
            <Input
              id="client_name"
              value={formData.client_name}
              onChange={(e) =>
                setFormData({ ...formData, client_name: e.target.value })
              }
              placeholder="Ej: Juan Pérez"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Ubicación *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Ej: San Juan"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción del Módulo</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Ej: Módulo 6x2.5m - Oficina"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Crear Presupuesto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { Loader2, CheckCircle } from "lucide-react";
import { PrismaTypedService } from "@/lib/prisma-typed-service";

interface CreateBudgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    client_name: string;
    location: string;
    description: string;
    module_template_id?: string;
  }) => void;
}

export function CreateBudgetDialog({
  isOpen,
  onClose,
  onSubmit,
}: CreateBudgetDialogProps) {
  const [formData, setFormData] = useState({
    client_name: "",
    location: "San Juan",
    description: "",
  });
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ client_name: "", location: "San Juan", description: "" });
      setSelectedModuleId(null);
      setLoadingModules(true);
      PrismaTypedService.getAllBudgetModuleTemplates()
        .then((data) => setModules(data.filter((m: any) => m.is_active)))
        .catch(() => setModules([]))
        .finally(() => setLoadingModules(false));
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      client_name: formData.client_name,
      location: formData.location,
      description: formData.description || "",
      module_template_id: selectedModuleId ?? undefined,
    });
  };

  const selectedModule = modules.find((m) => m.id === selectedModuleId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Presupuesto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Selector de módulo */}
          <div className="space-y-2">
            <Label>
              Módulo de base
              <span className="text-muted-foreground font-normal ml-2 text-xs">
                (opcional)
              </span>
            </Label>

            {loadingModules ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando módulos...
              </div>
            ) : modules.length === 0 ? (
              <p className="text-sm text-muted-foreground py-1">
                No hay módulos configurados. El presupuesto se creará en blanco.
              </p>
            ) : (
              <Select
                value={selectedModuleId ?? "none"}
                onValueChange={(val) =>
                  setSelectedModuleId(val === "none" ? null : val)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Presupuesto en blanco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Presupuesto en blanco</SelectItem>
                  {modules.map((mod) => (
                    <SelectItem key={mod.id} value={mod.id}>
                      {mod.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedModule && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                Se cargarán los ítems de{" "}
                <strong className="mx-1">{selectedModule.name}</strong> al
                presupuesto.
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-4">
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
              <Label htmlFor="description">
                Descripción breve del proyecto
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Ej: Módulo 6x2.5m - Oficina"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1 max-sm:flex-col">
            <Button
              type="button"
              variant="outline"
              className="flex-1 cursor-pointer"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 cursor-pointer">
              Crear Presupuesto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

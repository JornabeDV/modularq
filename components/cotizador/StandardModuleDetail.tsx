"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Plus, Trash2, FileText, X, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  StandardModule,
  ModuleDescriptionSection,
} from "@/hooks/use-standard-modules";
import { ModuleDescriptionEditor } from "@/components/budgets/ModuleDescriptionEditor";
import { PrismaTypedService } from "@/lib/prisma-typed-service";

interface RawMaterial {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  unit_price?: number;
}

interface Props {
  module: StandardModule;
  onRefresh: () => void;
}

const UNIT_LABELS: Record<string, string> = {
  unidad: "Un.",
  metro: "m",
  metro_cuadrado: "m²",
  metro_cubico: "m³",
  kilogramo: "kg",
  litro: "L",
};

export function StandardModuleDetail({ module, onRefresh }: Props) {
  const { toast } = useToast();

  const [allMaterials, setAllMaterials] = useState<RawMaterial[]>([]);
  const [materialSearch, setMaterialSearch] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    PrismaTypedService.getAllMaterials()
      .then((data) => setAllMaterials(data as RawMaterial[]))
      .catch(() => {});
  }, []);

  const usedMaterialIds = new Set(module.materials.map((m) => m.material_id));

  const filteredMaterials = allMaterials
    .filter((m) => !usedMaterialIds.has(m.id))
    .filter((m) => {
      if (!materialSearch.trim()) return true;
      const q = materialSearch.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
      );
    });

  const selectedMaterial = allMaterials.find(
    (m) => m.id === selectedMaterialId,
  );

  async function handleAddMaterial() {
    if (!selectedMaterialId) return;
    setAddingMaterial(true);
    try {
      const res = await fetch(`/api/standard-modules/${module.id}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material_id: selectedMaterialId,
          quantity: parseFloat(quantity) || 1,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al agregar material");
      }
      setSelectedMaterialId("");
      setMaterialSearch("");
      setQuantity("1");
      onRefresh();
      toast({ title: "Material agregado" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setAddingMaterial(false);
    }
  }

  async function handleRemoveMaterial(itemId: string) {
    try {
      const res = await fetch(
        `/api/standard-modules/${module.id}/materials/${itemId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      onRefresh();
      toast({ title: "Material quitado" });
    } catch {
      toast({ title: "Error al quitar material", variant: "destructive" });
    }
  }

  const uploadFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        toast({
          title: "Solo se permiten archivos PDF",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "El archivo supera los 10MB", variant: "destructive" });
        return;
      }
      setUploadingFile(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(
          `/api/standard-modules/${module.id}/attachments`,
          {
            method: "POST",
            body: formData,
          },
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Error al subir archivo");
        }
        onRefresh();
        toast({ title: "Archivo subido correctamente" });
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Error al subir archivo",
          variant: "destructive",
        });
      } finally {
        setUploadingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [module.id, onRefresh, toast],
  );

  async function handleDeleteAttachment(attachmentId: string) {
    try {
      const res = await fetch(
        `/api/standard-modules/${module.id}/attachments/${attachmentId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      onRefresh();
      toast({ title: "Archivo eliminado" });
    } catch {
      toast({ title: "Error al eliminar archivo", variant: "destructive" });
    }
  }

  async function handleSaveDescription(sections: ModuleDescriptionSection[]) {
    setSavingDescription(true);
    try {
      const res = await fetch(`/api/standard-modules/${module.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_description: sections }),
      });
      if (!res.ok) throw new Error();
      onRefresh();
      toast({ title: "Descripción guardada" });
    } catch {
      toast({ title: "Error al guardar descripción", variant: "destructive" });
    } finally {
      setSavingDescription(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="space-y-6 pt-2">
      {/* Descripción del módulo */}
      <ModuleDescriptionEditor
        sections={module.module_description ?? []}
        onSave={handleSaveDescription}
        isSaving={savingDescription}
      />

      {/* Materiales */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Materiales del módulo</h3>

        {module.materials.length > 0 && (
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-xs text-muted-foreground border-b">
                <th className="text-left py-1 font-medium">Material</th>
                <th className="text-left py-1 font-medium hidden sm:table-cell">
                  Categoría
                </th>
                <th className="text-right py-1 font-medium">Cant.</th>
                <th className="text-right py-1 font-medium">Unidad</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {module.materials.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-1.5">
                    <span className="font-medium">{item.material.name}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({item.material.code})
                    </span>
                  </td>
                  <td className="py-1.5 text-muted-foreground capitalize hidden sm:table-cell">
                    {item.material.category}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="py-1.5 text-right text-muted-foreground">
                    {UNIT_LABELS[item.material.unit] ?? item.material.unit}
                  </td>
                  <td className="py-1.5 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveMaterial(item.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Buscador + agregar */}
        <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
          <Label className="text-xs font-medium">Agregar material</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-sm"
              placeholder="Buscar por nombre o código..."
              value={materialSearch}
              onChange={(e) => {
                setMaterialSearch(e.target.value);
                setSelectedMaterialId("");
              }}
            />
          </div>

          {materialSearch.trim() && filteredMaterials.length > 0 && (
            <div className="border rounded-md bg-background max-h-40 overflow-y-auto divide-y">
              {filteredMaterials.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between ${
                    selectedMaterialId === m.id ? "bg-accent" : ""
                  }`}
                  onClick={() => {
                    setSelectedMaterialId(m.id);
                    setMaterialSearch(`${m.name} (${m.code})`);
                  }}
                >
                  <span>
                    <span className="font-medium">{m.name}</span>
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({m.code})
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {m.category}
                  </span>
                </button>
              ))}
            </div>
          )}

          {materialSearch.trim() && filteredMaterials.length === 0 && (
            <p className="text-xs text-muted-foreground px-1">
              No se encontraron materiales.
            </p>
          )}

          {selectedMaterial && (
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Seleccionado</Label>
                <p className="text-sm font-medium text-foreground">
                  {selectedMaterial.name}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({selectedMaterial.code})
                  </span>
                </p>
              </div>
              <div className="w-24 space-y-1">
                <Label className="text-xs">Cantidad</Label>
                <Input
                  className="h-8 text-sm"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                className="h-8"
                disabled={addingMaterial}
                onClick={handleAddMaterial}
              >
                <Plus className="w-3 h-3 mr-1" />
                Agregar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Archivos adjuntos */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Archivos adjuntos (PDFs)</h3>

        {module.attachments.length > 0 && (
          <div className="space-y-2 mb-3">
            {module.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm border"
              >
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate hover:underline text-primary"
                >
                  {att.original_name}
                </a>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(att.size / 1024).toFixed(0)} KB
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleDeleteAttachment(att.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Zona de drop */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30"
          } ${uploadingFile ? "opacity-60 pointer-events-none" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file);
            }}
          />
          <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          {uploadingFile ? (
            <p className="text-sm text-muted-foreground">Subiendo archivo...</p>
          ) : (
            <>
              <p className="text-sm font-medium">
                Arrastrá un PDF o hacé clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Solo archivos PDF · Máximo 10MB
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

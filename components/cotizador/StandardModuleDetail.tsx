"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Plus, Trash2, FileText, X, Upload, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
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
  onSaveDescription: (sections: ModuleDescriptionSection[]) => Promise<void>;
}

const UNIT_LABELS: Record<string, string> = {
  unidad: "Un.",
  metro: "m",
  metro_cuadrado: "m²",
  metro_cubico: "m³",
  kilogramo: "kg",
  litro: "L",
};

export function StandardModuleDetail({ module, onRefresh, onSaveDescription }: Props) {
  const { toast } = useToast();

  const [localMaterials, setLocalMaterials] = useState(module.materials);
  const [localAttachments, setLocalAttachments] = useState(module.attachments);
  const [allMaterials, setAllMaterials] = useState<RawMaterial[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [materialPopoverOpen, setMaterialPopoverOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Sync local state when parent re-fetches
  useEffect(() => {
    setLocalMaterials(module.materials);
  }, [module.materials]);
  useEffect(() => {
    setLocalAttachments(module.attachments);
  }, [module.attachments]);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    PrismaTypedService.getAllMaterials()
      .then((data) => setAllMaterials(data as RawMaterial[]))
      .catch(() => {});
  }, []);

  const usedMaterialIds = new Set(localMaterials.map((m) => m.material_id));

  const availableMaterials = allMaterials.filter(
    (m) => !usedMaterialIds.has(m.id),
  );

  const selectedMaterial = allMaterials.find((m) => m.id === selectedMaterialId);

  async function handleAddMaterial() {
    if (!selectedMaterialId) return;
    const mat = allMaterials.find((m) => m.id === selectedMaterialId);
    if (!mat) return;

    const qty = parseFloat(quantity) || 1;
    // Optimistic item — temporary id until API responds
    const tempId = `temp-${Date.now()}`;
    const optimisticItem = {
      id: tempId,
      module_id: module.id,
      material_id: mat.id,
      quantity: qty,
      material: {
        id: mat.id,
        code: mat.code,
        name: mat.name,
        category: mat.category,
        unit: mat.unit,
        unit_price: mat.unit_price,
      },
    };

    setLocalMaterials((prev) => [...prev, optimisticItem]);
    setSelectedMaterialId("");
    setQuantity("1");
    setAddingMaterial(true);

    try {
      const res = await fetch(`/api/standard-modules/${module.id}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material_id: mat.id, quantity: qty }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al agregar material");
      }
      const { item } = await res.json();
      // Replace temp item with the real server item (has correct id)
      setLocalMaterials((prev) =>
        prev.map((m) => (m.id === tempId ? item : m)),
      );
      toast({ title: "Material agregado" });
    } catch (err) {
      setLocalMaterials((prev) => prev.filter((m) => m.id !== tempId));
      setSelectedMaterialId(mat.id);
      setQuantity(String(qty));
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
    const previous = localMaterials;
    setLocalMaterials((prev) => prev.filter((m) => m.id !== itemId));
    try {
      const res = await fetch(
        `/api/standard-modules/${module.id}/materials/${itemId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      toast({ title: "Material quitado" });
    } catch {
      setLocalMaterials(previous);
      toast({ title: "Error al quitar material", variant: "destructive" });
    }
  }

  const uploadFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        toast({ title: "Solo se permiten archivos PDF", variant: "destructive" });
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
        const res = await fetch(`/api/standard-modules/${module.id}/attachments`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Error al subir archivo");
        }
        const { attachment } = await res.json();
        setLocalAttachments((prev) => [...prev, attachment]);
        toast({ title: "Archivo subido correctamente" });
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Error al subir archivo",
          variant: "destructive",
        });
      } finally {
        setUploadingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [module.id, toast],
  );

  async function handleDeleteAttachment(attachmentId: string) {
    const previous = localAttachments;
    setLocalAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    try {
      const res = await fetch(
        `/api/standard-modules/${module.id}/attachments/${attachmentId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      toast({ title: "Archivo eliminado" });
    } catch {
      setLocalAttachments(previous);
      toast({ title: "Error al eliminar archivo", variant: "destructive" });
    }
  }

  async function handleSaveDescription(sections: ModuleDescriptionSection[]) {
    setSavingDescription(true);
    try {
      await onSaveDescription(sections);
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

        {localMaterials.length > 0 && (
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
              {localMaterials.map((item) => (
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

        {/* Combobox + agregar */}
        <div className="border rounded-lg p-3 bg-muted/20 w-full">
          <Label className="text-xs font-medium mb-3 block">Agregar material</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Popover open={materialPopoverOpen} onOpenChange={setMaterialPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={materialPopoverOpen}
                    className="w-full justify-between h-8 text-sm font-normal"
                  >
                    <span className="truncate">
                      {selectedMaterial
                        ? `${selectedMaterial.code} - ${selectedMaterial.name}`
                        : "Seleccionar material..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(400px,calc(100vw-2rem))] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar por nombre o código..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No se encontraron materiales.</CommandEmpty>
                      <CommandGroup>
                        {availableMaterials.map((m) => (
                          <CommandItem
                            key={m.id}
                            value={`${m.code} ${m.name}`}
                            onSelect={() => {
                              setSelectedMaterialId(m.id);
                              setMaterialPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedMaterialId === m.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <span className="flex-1 truncate">
                              {m.code} - {m.name}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground capitalize shrink-0">
                              {m.category}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2">
              <Input
                className="h-8 text-sm text-center w-20 shrink-0"
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Cant."
              />
              <Button
                size="sm"
                className="h-8 flex-1 sm:flex-none cursor-pointer"
                disabled={addingMaterial || !selectedMaterialId}
                onClick={handleAddMaterial}
              >
                <Plus className="w-3 h-3 mr-1" />
                Agregar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Archivos adjuntos */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Archivos adjuntos (PDFs)</h3>

        {localAttachments.length > 0 && (
          <div className="space-y-2 mb-3">
            {localAttachments.map((att) => (
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

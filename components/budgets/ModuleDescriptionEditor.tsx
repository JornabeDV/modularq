"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Save, X, Loader2 } from "lucide-react";
import { ModuleDescriptionSection } from "@/lib/types/budget";

interface ModuleDescriptionEditorProps {
  sections: ModuleDescriptionSection[];
  onSave: (sections: ModuleDescriptionSection[]) => void;
  isSaving?: boolean;
}

export function ModuleDescriptionEditor({
  sections = [],
  onSave,
  isSaving = false,
}: ModuleDescriptionEditorProps) {
  const [editingSections, setEditingSections] =
    useState<ModuleDescriptionSection[]>(sections);
  const [isEditing, setIsEditing] = useState(false);

  const handleAddSection = () => {
    setEditingSections([...editingSections, { section: "", description: "" }]);
  };

  const handleRemoveSection = (index: number) => {
    setEditingSections(editingSections.filter((_, i) => i !== index));
  };

  const handleUpdateSection = (
    index: number,
    field: "section" | "description",
    value: string,
  ) => {
    const updated = [...editingSections];
    updated[index] = { ...updated[index], [field]: value };
    setEditingSections(updated);
  };

  const handleSave = () => {
    // Filtrar secciones vacías
    const validSections = editingSections.filter(
      (s) => s.section.trim() || s.description.trim(),
    );
    onSave(validSections);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingSections(sections);
    setIsEditing(false);
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === editingSections.length - 1) return;

    const updated = [...editingSections];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setEditingSections(updated);
  };

  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Descripción del Módulo</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            {sections.length > 0 ? "Editar" : "Agregar"}
          </Button>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay descripción del módulo. Haz clic en "Agregar" para añadir
              secciones.
            </p>
          ) : (
            <div className="space-y-3">
              {sections.map((section, index) => (
                <div key={index} className="border-l-2 border-primary pl-3">
                  <p className="font-medium text-sm">{section.section}</p>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">
          Editar Descripción del Módulo
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            Guardar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editingSections.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay secciones. Agrega una para comenzar.
          </p>
        )}

        {editingSections.map((section, index) => (
          <div
            key={index}
            className="flex gap-2 items-start p-3 border rounded-lg bg-muted/30"
          >
            <div className="flex flex-col gap-1 pt-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveSection(index, "up")}
                disabled={index === 0}
              >
                <GripVertical className="w-4 h-4 rotate-90" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveSection(index, "down")}
                disabled={index === editingSections.length - 1}
              >
                <GripVertical className="w-4 h-4 rotate-90" />
              </Button>
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <Label className="text-xs">Título de la sección</Label>
                <Input
                  value={section.section}
                  onChange={(e) =>
                    handleUpdateSection(index, "section", e.target.value)
                  }
                  placeholder="Ej: Estructura, Cerramientos, etc."
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Descripción</Label>
                <Textarea
                  value={section.description}
                  onChange={(e) =>
                    handleUpdateSection(index, "description", e.target.value)
                  }
                  placeholder="Descripción detallada de esta parte del módulo..."
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => handleRemoveSection(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <Button variant="outline" className="w-full" onClick={handleAddSection}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar sección
        </Button>
      </CardContent>
    </Card>
  );
}

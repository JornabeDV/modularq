"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PriceInput } from "@/components/ui/price-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  FileText,
  Trash2,
  Upload,
  GripVertical,
  X,
} from "lucide-react";
import type { QuoteItemAttachment } from "./QuoteItemCard";
import { ExchangeRate } from "@/lib/exchange-rate";

export interface ModuleDescriptionSection {
  section: string;
  description: string;
}

interface CustomModuleFormProps {
  onAdd: (item: {
    name: string;
    description: string;
    moduleDescriptionSections: ModuleDescriptionSection[];
    unitPrice: number;
    quantity: number;
    attachments: QuoteItemAttachment[];
  }) => void;
  exchangeRate: ExchangeRate | null;
  currency: 'ARS' | 'USD';
}

export function CustomModuleForm({ onAdd, exchangeRate, currency }: CustomModuleFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState<ModuleDescriptionSection[]>([]);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [attachments, setAttachments] = useState<QuoteItemAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") return;
    if (file.size > 10 * 1024 * 1024) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/quote-items/upload-attachment", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Error al subir archivo");
      const { attachment } = await res.json();
      setAttachments((prev) => [...prev, attachment]);
    } catch {
      // fail silently
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  function handleRemoveAttachment(storagePath: string) {
    setAttachments((prev) =>
      prev.filter((a) => a.storage_path !== storagePath)
    );
  }

  function handleAddSection() {
    setSections((prev) => [...prev, { section: "", description: "" }]);
  }

  function handleRemoveSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  function handleUpdateSection(
    index: number,
    field: "section" | "description",
    value: string
  ) {
    setSections((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function moveSection(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sections.length - 1) return;

    setSections((prev) => {
      const updated = [...prev];
      const newIndex = direction === "up" ? index - 1 : index + 1;
      const temp = updated[index];
      updated[index] = updated[newIndex];
      updated[newIndex] = temp;
      return updated;
    });
  }

  function handleSubmit() {
    const unitPrice = Number(price.replace(",", "."));
    const qty = Number(quantity);
    if (!name.trim() || isNaN(unitPrice) || unitPrice < 0 || isNaN(qty) || qty < 1) return;

    const validSections = sections.filter(
      (s) => s.section.trim() || s.description.trim()
    );

    onAdd({
      name: name.trim(),
      description: description.trim(),
      moduleDescriptionSections: validSections,
      unitPrice,
      quantity: qty,
      attachments,
    });

    setName("");
    setDescription("");
    setSections([]);
    setPrice("");
    setQuantity("1");
    setAttachments([]);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Nombre del módulo *</Label>
        <Input
          placeholder="Ej: Planta Libre Especial"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Descripción general</Label>
        <Textarea
          placeholder="Breve resumen del módulo..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      {/* Secciones descriptivas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Secciones descriptivas</Label>
          <span className="text-[10px] text-muted-foreground">
            {sections.length} sección{sections.length !== 1 ? "es" : ""}
          </span>
        </div>

        {sections.length === 0 && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            Agregá secciones con título y descripción para mostrar en el presupuesto.
          </p>
        )}

        {sections.map((section, index) => (
          <div
            key={index}
            className="flex gap-2 items-start p-2.5 border rounded-lg bg-muted/30"
          >
            <div className="flex flex-col gap-1 pt-1">
              <button
                type="button"
                className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                onClick={() => moveSection(index, "up")}
                disabled={index === 0}
              >
                <GripVertical className="w-3 h-3 rotate-90" />
              </button>
              <button
                type="button"
                className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                onClick={() => moveSection(index, "down")}
                disabled={index === sections.length - 1}
              >
                <GripVertical className="w-3 h-3 rotate-90" />
              </button>
            </div>

            <div className="flex-1 space-y-1.5">
              <Input
                value={section.section}
                onChange={(e) =>
                  handleUpdateSection(index, "section", e.target.value)
                }
                placeholder="Título de sección (ej: Estructura)"
                className="h-7 text-xs"
              />
              <Textarea
                value={section.description}
                onChange={(e) =>
                  handleUpdateSection(index, "description", e.target.value)
                }
                placeholder="Descripción detallada..."
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            <button
              type="button"
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0 mt-1"
              onClick={() => handleRemoveSection(index)}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={handleAddSection}
        >
          <Plus className="w-3 h-3 mr-1.5" />
          Agregar sección
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Precio unitario ({currency}) *</Label>
          <PriceInput
            placeholder="0"
            value={price}
            onChange={(val) => setPrice(val)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Cantidad</Label>
          <Input
            type="number"
            placeholder="1"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
      </div>

      {/* Archivos adjuntos */}
      <div>
        <Label className="text-xs">Archivos adjuntos (PDFs)</Label>
        {attachments.length > 0 && (
          <div className="space-y-1.5 mt-1.5 mb-2">
            {attachments.map((att) => (
              <div
                key={att.storage_path}
                className="flex items-center gap-2 p-2 bg-muted/40 rounded-md text-xs border"
              >
                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate hover:underline text-primary"
                >
                  {att.original_name}
                </a>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {(att.size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.storage_path)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div
          className="border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer hover:bg-muted/30 mt-1.5"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          {uploading ? (
            <p className="text-xs sm:text-sm text-muted-foreground">Subiendo...</p>
          ) : (
            <>
              <Upload className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Hacé clic para subir un PDF
              </p>
            </>
          )}
        </div>
      </div>

      <Button
        className="w-full cursor-pointer"
        onClick={handleSubmit}
        disabled={!name.trim() || !price || Number(price.replace(",", ".")) < 0}
      >
        <Plus className="w-4 h-4 mr-2" />
        Agregar módulo personalizado
      </Button>
    </div>
  );
}

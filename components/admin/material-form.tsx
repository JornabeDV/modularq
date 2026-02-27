"use client";

import { useState, useEffect, useMemo } from "react";
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
import { RefreshCw, AlertTriangle, Check } from "lucide-react";
import {
  useMaterialsPrisma,
  type CreateMaterialData,
  type Material,
} from "@/hooks/use-materials-prisma";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MaterialFormData {
  code: string;
  name: string;
  description: string;
  category:
    | "estructura"
    | "paneles"
    | "herrajes"
    | "aislacion"
    | "electricidad"
    | "sanitarios"
    | "otros";
  unit:
    | "unidad"
    | "metro"
    | "metro_cuadrado"
    | "metro_cubico"
    | "kilogramo"
    | "litro";
  stock_quantity: number;
  min_stock: number;
  unit_price: number;
  supplier: string;
}

interface MaterialFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMaterialData) => void;
  isEditing: boolean;
  initialData?: any | null;
  isLoading?: boolean;
  existingMaterials?: Material[];
}

// Función para normalizar nombres (quitar acentos, espacios extras, artículos)
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/\s+/g, " ") // Espacios múltiples a uno solo
    .trim()
    .replace(/\b(de|del|la|el|los|las|un|una|unos|unas)\b/g, "") // Quitar artículos
    .replace(/\s+/g, "") // Quitar todos los espacios
    .replace(/[^a-z0-9]/g, ""); // Solo letras y números
}

// Extraer palabras clave de un nombre (sin números ni unidades)
function extractKeywords(name: string): string[] {
  return normalizeName(name)
    .replace(/\d+/g, " ") // Quitar números
    .replace(/x/g, " ") // Quitar 'x' (como en 30x30)
    .split(" ")
    .filter((w) => w.length >= 3); // Solo palabras de 3+ caracteres
}

// Calcular similitud entre dos strings (0-1)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeName(str1);
  const s2 = normalizeName(str2);

  if (s1 === s2) return 1;

  // 1. Verificar si uno contiene al otro (substring)
  if (s1.includes(s2) || s2.includes(s1)) {
    const ratio =
      Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
    // Si el substring es >50% del string más largo, es muy similar
    if (ratio > 0.5) return 0.85 + ratio * 0.15; // Entre 0.85 y 1
  }

  // 2. Comparar palabras clave
  const keywords1 = extractKeywords(str1);
  const keywords2 = extractKeywords(str2);

  if (keywords1.length > 0 && keywords2.length > 0) {
    const common = keywords1.filter((k1) =>
      keywords2.some((k2) => k1 === k2 || k1.includes(k2) || k2.includes(k1)),
    );
    const keywordSimilarity =
      common.length / Math.max(keywords1.length, keywords2.length);
    if (keywordSimilarity >= 0.5) return 0.7 + keywordSimilarity * 0.2;
  }

  // 3. Distancia de Levenshtein (fallback)
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

const CATEGORIES = [
  { value: "estructura", label: "Estructura" },
  { value: "paneles", label: "Paneles" },
  { value: "herrajes", label: "Herrajes" },
  { value: "aislacion", label: "Aislación" },
  { value: "electricidad", label: "Electricidad" },
  { value: "sanitarios", label: "Sanitarios" },
  { value: "otros", label: "Otros" },
];

const UNITS = [
  { value: "unidad", label: "Unidad" },
  { value: "metro", label: "Metro" },
  { value: "metro_cuadrado", label: "Metro Cuadrado" },
  { value: "metro_cubico", label: "Metro Cúbico" },
  { value: "kilogramo", label: "Kilogramo" },
  { value: "litro", label: "Litro" },
];

export function MaterialForm({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  initialData,
  isLoading = false,
  existingMaterials = [],
}: MaterialFormProps) {
  const { getNextCode } = useMaterialsPrisma();
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [formData, setFormData] = useState<MaterialFormData>({
    code: "",
    name: "",
    description: "",
    category: "otros",
    unit: "unidad",
    stock_quantity: 0,
    min_stock: 0,
    unit_price: 0,
    supplier: "",
  });

  // Estado para sugerencias de autocompletado
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [nameInputFocused, setNameInputFocused] = useState(false);

  const generateCodeForCategory = async (category: string) => {
    if (!category || isEditing) return;

    setIsGeneratingCode(true);
    try {
      const nextCode = await getNextCode(category);
      setFormData((prev) => ({ ...prev, code: nextCode }));
    } catch (error) {
      console.error("Error generating code:", error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        code: initialData.code || "",
        name: initialData.name || "",
        description: initialData.description || "",
        category: initialData.category || "otros",
        unit: initialData.unit || "unidad",
        stock_quantity: initialData.stockQuantity || 0,
        min_stock: initialData.minStock || 0,
        unit_price: initialData.unitPrice || 0,
        supplier: initialData.supplier || "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        description: "",
        category: "otros",
        unit: "unidad",
        stock_quantity: 0,
        min_stock: 0,
        unit_price: 0,
        supplier: "",
      });
    }
  }, [isEditing, initialData?.id]);

  // Generar código automáticamente al abrir el formulario (solo creación)
  useEffect(() => {
    if (isOpen && !isEditing && !formData.code) {
      generateCodeForCategory(formData.category || "otros");
    }
  }, [isOpen, isEditing]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Si cambió la categoría y no estamos editando, generar código automáticamente
      if (field === "category" && !isEditing && value) {
        generateCodeForCategory(value);
      }

      return newData;
    });
  };

  const handleRegenerateCode = () => {
    if (formData.category && !isEditing) {
      generateCodeForCategory(formData.category);
    }
  };

  // Buscar materiales similares para autocompletado
  const similarMaterials = useMemo(() => {
    if (!formData.name || formData.name.length < 2) return [];

    return existingMaterials
      .filter((m) => !isEditing || m.id !== initialData?.id) // Excluir el material actual en edición
      .map((m) => ({
        ...m,
        similarity: calculateSimilarity(formData.name, m.name),
      }))
      .filter((m) => m.similarity > 0.3) // Mostrar si hay más de 30% similitud (más permisivo)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5); // Máximo 5 sugerencias
  }, [formData.name, existingMaterials, isEditing, initialData?.id]);

  // Verificar si hay un duplicado exacto o muy similar
  const exactDuplicate = useMemo(() => {
    if (!formData.name || isEditing) return null;

    const normalizedInput = normalizeName(formData.name);
    const inputKeywords = extractKeywords(formData.name);

    return existingMaterials.find((m) => {
      const normalizedExisting = normalizeName(m.name);

      // 1. Coincidencia exacta normalizada
      if (normalizedExisting === normalizedInput) return true;

      // 2. Una contiene a la otra completamente
      if (
        normalizedExisting.includes(normalizedInput) ||
        normalizedInput.includes(normalizedExisting)
      ) {
        const ratio =
          Math.min(normalizedInput.length, normalizedExisting.length) /
          Math.max(normalizedInput.length, normalizedExisting.length);
        if (ratio > 0.7) return true; // Si el match es >70%, es duplicado
      }

      // 3. Mismas palabras clave (ej: "perfil" vs "perfiles")
      const existingKeywords = extractKeywords(m.name);
      if (inputKeywords.length > 0 && existingKeywords.length > 0) {
        const common = inputKeywords.filter((k1) =>
          existingKeywords.some(
            (k2) => k1 === k2 || k1.includes(k2) || k2.includes(k1),
          ),
        );
        if (
          common.length === inputKeywords.length ||
          common.length === existingKeywords.length
        ) {
          return true;
        }
      }

      return false;
    });
  }, [formData.name, existingMaterials, isEditing]);

  // Seleccionar material de la sugerencia
  const handleSelectSuggestion = (material: Material) => {
    setFormData((prev) => ({
      ...prev,
      name: material.name,
      description: material.description || prev.description,
      category: material.category,
      unit: material.unit,
      unit_price: material.unitPrice || 0,
      supplier: material.supplier || "",
    }));
    setShowSuggestions(false);
  };

  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar duplicado con la misma lógica mejorada
    const normalizedInput = normalizeName(formData.name);
    const inputKeywords = extractKeywords(formData.name);

    const duplicate = existingMaterials.find((m) => {
      if (isEditing && m.id === initialData?.id) return false;

      const normalizedExisting = normalizeName(m.name);

      // Coincidencia exacta
      if (normalizedExisting === normalizedInput) return true;

      // Contención mutua
      if (
        normalizedExisting.includes(normalizedInput) ||
        normalizedInput.includes(normalizedExisting)
      ) {
        const ratio =
          Math.min(normalizedInput.length, normalizedExisting.length) /
          Math.max(normalizedInput.length, normalizedExisting.length);
        if (ratio > 0.7) return true;
      }

      // Palabras clave
      const existingKeywords = extractKeywords(m.name);
      if (inputKeywords.length > 0 && existingKeywords.length > 0) {
        const common = inputKeywords.filter((k1) =>
          existingKeywords.some(
            (k2) => k1 === k2 || k1.includes(k2) || k2.includes(k1),
          ),
        );
        if (
          common.length === inputKeywords.length ||
          common.length === existingKeywords.length
        ) {
          return true;
        }
      }

      return false;
    });

    if (duplicate && !showDuplicateWarning) {
      setShowDuplicateWarning(true);
      return;
    }

    const submitData: CreateMaterialData = {
      code: formData.code,
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category,
      unit: formData.unit,
      stock_quantity: formData.stock_quantity,
      min_stock: formData.min_stock,
      unit_price: formData.unit_price > 0 ? formData.unit_price : undefined,
      supplier: formData.supplier || undefined,
    };
    onSubmit(submitData);
    setShowDuplicateWarning(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-sm:w-[100dvw] rounded-none max-w-3xl max-sm:h-[100dvh] overflow-y-auto md:max-w-2xl md:rounded-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Material" : "Crear Nuevo Material"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Categoría */}
          <div>
            <Label htmlFor="category" className="mb-2">
              Categoría *
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange("category", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Código */}
          <div>
            <Label htmlFor="code" className="mb-2">
              Código *
            </Label>
            <div className="flex gap-2">
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  handleInputChange("code", e.target.value.toUpperCase())
                }
                required
                placeholder="Ej: EST-001"
                disabled={isEditing || isGeneratingCode}
                className="flex-1"
              />
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRegenerateCode}
                  disabled={isGeneratingCode || !formData.category}
                  className="cursor-pointer"
                  title="Regenerar código"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isGeneratingCode ? "animate-spin" : ""}`}
                  />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isEditing
                ? "Código único del material (no editable)"
                : "Código generado automáticamente según categoría"}
            </p>
          </div>

          {/* 3. Nombre */}
          <div className="relative">
            <Label htmlFor="name" className="mb-2">
              Nombre *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                handleInputChange("name", e.target.value);
                setShowSuggestions(true);
                setShowDuplicateWarning(false);
              }}
              onFocus={() => {
                setNameInputFocused(true);
                setShowSuggestions(true);
              }}
              onBlur={() => {
                setNameInputFocused(false);
                // Delay para permitir clic en sugerencias
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              required
              placeholder="Ej: Perfil de acero 50x50"
              autoComplete="off"
            />

            {/* Autocompletado - Sugerencias */}
            {showSuggestions &&
              nameInputFocused &&
              similarMaterials.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-card border rounded-md shadow-lg max-h-48 overflow-auto">
                  <div className="px-3 py-2 text-xs text-muted-foreground border-b">
                    Materiales similares encontrados:
                  </div>
                  {similarMaterials.map((material) => (
                    <button
                      key={material.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(material)}
                      className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between group"
                    >
                      <div>
                        <span className="font-medium">{material.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({material.code})
                        </span>
                      </div>
                      {material.similarity >= 0.9 && (
                        <span className="text-xs text-orange-500">
                          ¡Muy similar!
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

            {/* Alerta de duplicado exacto */}
            {(exactDuplicate || showDuplicateWarning) && (
              <Alert className="mt-2 border-orange-500 bg-orange-50 dark:bg-orange-950">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  {exactDuplicate ? (
                    <>
                      <strong>¡Atención!</strong> Ya existe un material con
                      nombre muy similar: <strong>{exactDuplicate.name}</strong>{" "}
                      ({exactDuplicate.code})
                      <br />
                      ¿Estás seguro de que quieres crear este material?
                    </>
                  ) : (
                    <>
                      <strong>¡Atención!</strong> Parece que estás creando un
                      material similar a uno existente.
                      <br />
                      ¿Deseas continuar de todos modos?
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="description" className="mb-2">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descripción detallada del material..."
              rows={3}
            />
          </div>

          {/* Unidad de Medida */}
          <div>
            <Label htmlFor="unit" className="mb-2">
              Unidad de Medida *
            </Label>
            <Select
              value={formData.unit}
              onValueChange={(value) => handleInputChange("unit", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="stock_quantity" className="mb-2">
                Stock Actual
              </Label>
              <Input
                id="stock_quantity"
                type="number"
                step="0.01"
                min="0"
                value={
                  formData.stock_quantity === 0 ? "" : formData.stock_quantity
                }
                onChange={(e) =>
                  handleInputChange(
                    "stock_quantity",
                    e.target.value === "" ? 0 : parseFloat(e.target.value) || 0,
                  )
                }
                onFocus={(e) => {
                  if (e.target.value === "0") {
                    e.target.select();
                  }
                }}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="min_stock" className="mb-2">
                Stock Mínimo
              </Label>
              <Input
                id="min_stock"
                type="number"
                step="0.01"
                min="0"
                value={formData.min_stock === 0 ? "" : formData.min_stock}
                onChange={(e) =>
                  handleInputChange(
                    "min_stock",
                    e.target.value === "" ? 0 : parseFloat(e.target.value) || 0,
                  )
                }
                onFocus={(e) => {
                  if (e.target.value === "0") {
                    e.target.select();
                  }
                }}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Alerta cuando el stock esté por debajo
              </p>
            </div>
            <div>
              <Label htmlFor="unit_price" className="mb-2">
                Precio Unitario
              </Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price === 0 ? "" : formData.unit_price}
                onChange={(e) =>
                  handleInputChange(
                    "unit_price",
                    e.target.value === "" ? 0 : parseFloat(e.target.value) || 0,
                  )
                }
                onFocus={(e) => {
                  if (e.target.value === "0") {
                    e.target.select();
                  }
                }}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="supplier" className="mb-2">
              Proveedor
            </Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) => handleInputChange("supplier", e.target.value)}
              placeholder="Ej: Proveedor ABC S.A."
            />
          </div>

          <div className="flex max-sm:flex-col max-sm:gap-2 justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="cursor-pointer max-sm:w-full"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer"
            >
              {isLoading
                ? "Guardando..."
                : isEditing
                  ? "Actualizar Material"
                  : "Crear Material"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

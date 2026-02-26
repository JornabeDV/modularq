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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator,
  Users,
  Package,
  Wrench,
  Plus,
  Trash2,
  X,
  CheckCircle,
  Loader2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
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
import { BudgetItem, LaborConcept } from "@/lib/prisma-typed-service";
import { MaterialForm } from "@/components/admin/material-form";
import { CreateMaterialData } from "@/hooks/use-materials-prisma";
import { formatCurrency } from "./BudgetTotalsCards";
import { UNIT_LABELS } from "@/lib/constants";

interface AnalysisData {
  labors: {
    labor_concept_id: string;
    quantity_hours: number;
    hourly_rate: number;
  }[];
  materials: {
    material_id?: string;
    material_name?: string;
    quantity: number;
    unit_price?: number;
  }[];
  equipments: { name: string; quantity_hours: number; hourly_cost: number }[];
}

interface PriceAnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: BudgetItem | null;
  laborConcepts: LaborConcept[];
  materials: any[];
  isSaving: boolean;
  onSave: (itemId: string, data: AnalysisData, itemName: string) => void;
  onCreateMaterial: (data: CreateMaterialData) => Promise<boolean>;
}

export function PriceAnalysisDialog({
  isOpen,
  onClose,
  item,
  laborConcepts,
  materials,
  isSaving,
  onSave,
  onCreateMaterial,
}: PriceAnalysisDialogProps) {
  const [itemName, setItemName] = useState("");
  const [analysisData, setAnalysisData] = useState<AnalysisData>({
    labors: [],
    materials: [],
    equipments: [],
  });
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [creatingMaterial, setCreatingMaterial] = useState(false);
  const [materialPopoverOpen, setMaterialPopoverOpen] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (item) {
      setItemName(item.description);
      const analysis = Array.isArray(item.price_analysis)
        ? item.price_analysis[0]
        : item.price_analysis;

      if (analysis) {
        setAnalysisData({
          labors: (analysis.labors || []).map((l: any) => {
            const concept = laborConcepts.find(
              (c) => c.id === l.labor_concept_id,
            );
            return {
              labor_concept_id: l.labor_concept_id,
              quantity_hours: l.quantity_hours,
              hourly_rate: l.hourly_rate || concept?.hourly_rate || 0,
            };
          }),
          materials: (analysis.materials || []).map((m: any) => ({
            material_id: m.material_id,
            material_name: m.material_name,
            quantity: m.quantity,
            unit_price: m.unit_price,
          })),
          equipments: (analysis.equipments || []).map((e: any) => ({
            name: e.name,
            quantity_hours: e.quantity_hours,
            hourly_cost: e.hourly_cost,
          })),
        });
      } else {
        setAnalysisData({ labors: [], materials: [], equipments: [] });
      }
    }
  }, [item, laborConcepts]);

  const addLabor = () => {
    setAnalysisData((prev) => ({
      ...prev,
      labors: [
        ...prev.labors,
        { labor_concept_id: "", quantity_hours: 0, hourly_rate: 0 },
      ],
    }));
  };

  const updateLabor = (index: number, field: string, value: any) => {
    setAnalysisData((prev) => ({
      ...prev,
      labors: prev.labors.map((l, i) =>
        i === index ? { ...l, [field]: value } : l,
      ),
    }));
  };

  const removeLabor = (index: number) => {
    setAnalysisData((prev) => ({
      ...prev,
      labors: prev.labors.filter((_, i) => i !== index),
    }));
  };

  const addMaterial = () => {
    setAnalysisData((prev) => ({
      ...prev,
      materials: [
        ...prev.materials,
        { material_id: "", quantity: 0, unit_price: 0 },
      ],
    }));
  };

  const updateMaterial = (index: number, field: string, value: any) => {
    setAnalysisData((prev) => ({
      ...prev,
      materials: prev.materials.map((m, i) =>
        i === index ? { ...m, [field]: value } : m,
      ),
    }));
  };

  const removeMaterial = (index: number) => {
    setAnalysisData((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  };

  const addEquipment = () => {
    setAnalysisData((prev) => ({
      ...prev,
      equipments: [
        ...prev.equipments,
        { name: "", quantity_hours: 0, hourly_cost: 0 },
      ],
    }));
  };

  const updateEquipment = (index: number, field: string, value: any) => {
    setAnalysisData((prev) => ({
      ...prev,
      equipments: prev.equipments.map((e, i) =>
        i === index ? { ...e, [field]: value } : e,
      ),
    }));
  };

  const removeEquipment = (index: number) => {
    setAnalysisData((prev) => ({
      ...prev,
      equipments: prev.equipments.filter((_, i) => i !== index),
    }));
  };

  const handleCreateMaterial = async (data: CreateMaterialData) => {
    setCreatingMaterial(true);
    const success = await onCreateMaterial(data);
    if (success) {
      // Agregar el nuevo material al análisis
      setAnalysisData((prev) => ({
        ...prev,
        materials: [
          ...prev.materials,
          {
            material_id: "", // Se actualizará cuando se recarguen los materiales
            material_name: data.name,
            quantity: 0,
            unit_price: data.unit_price || 0,
          },
        ],
      }));
      setShowMaterialForm(false);
    }
    setCreatingMaterial(false);
  };

  const calculateTotals = () => {
    const laborTotal = analysisData.labors.reduce(
      (sum, l) => sum + l.quantity_hours * (l.hourly_rate || 0),
      0,
    );
    const materialTotal = analysisData.materials.reduce((sum, m) => {
      const price =
        m.unit_price ||
        materials.find((mat: any) => mat.id === m.material_id)?.unit_price ||
        0;
      return sum + m.quantity * price;
    }, 0);
    const equipmentTotal = analysisData.equipments.reduce(
      (sum, e) => sum + e.quantity_hours * e.hourly_cost,
      0,
    );
    return {
      laborTotal,
      materialTotal,
      equipmentTotal,
      total: laborTotal + materialTotal + equipmentTotal,
    };
  };

  const totals = calculateTotals();

  if (!item) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-screen h-screen sm:w-[95vw] sm:max-w-6xl sm:max-h-[90vh] sm:h-auto overflow-y-auto overflow-x-hidden p-3 sm:p-6 m-0 sm:m-auto rounded-none sm:rounded-lg max-w-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="truncate">Análisis de Precios - {item.code}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 w-full min-w-0">
            {/* Nombre editable del ítem */}
            <div className="space-y-2">
              <Label htmlFor="item-name">Nombre del Ítem</Label>
              <Input
                id="item-name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Descripción del ítem"
              />
            </div>

            {/* MANO DE OBRA */}
            <Card>
              <CardHeader className="py-3 px-3 sm:px-6">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    MANO DE OBRA
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addLabor}
                    className="cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3 sm:px-6 min-w-0">
                {analysisData.labors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay conceptos de mano de obra
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Headers - Hidden on mobile */}
                    <div className="hidden sm:flex gap-3 text-xs text-muted-foreground font-medium px-1">
                      <div className="flex-[3]">Concepto</div>
                      <div className="w-24 text-center">Horas</div>
                      <div className="w-28 text-center">Tarifa ($/h)</div>
                      <div className="w-28 text-right">Total</div>
                      <div className="w-10"></div>
                    </div>
                    {analysisData.labors.map((labor, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center p-3 sm:p-0 bg-muted/30 sm:bg-transparent rounded-lg sm:rounded-none min-w-0"
                      >
                        <div className="w-full sm:flex-[3] min-w-0">
                          <span className="sm:hidden text-xs text-muted-foreground block mb-1">Concepto:</span>
                          <Select
                            value={labor.labor_concept_id}
                            onValueChange={(value) => {
                              const concept = laborConcepts.find(
                                (c) => c.id === value,
                              );
                              updateLabor(index, "labor_concept_id", value);
                              if (concept) {
                                updateLabor(
                                  index,
                                  "hourly_rate",
                                  concept.hourly_rate,
                                );
                              }
                            }}
                          >
                            <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10 w-full max-w-[calc(100vw-80px)] truncate">
                              <SelectValue placeholder="Seleccionar concepto" className="truncate" />
                            </SelectTrigger>
                            <SelectContent className="max-w-[300px]">
                              {laborConcepts.map((concept) => (
                                <SelectItem key={concept.id} value={concept.id}>
                                  {concept.name} (
                                  {formatCurrency(concept.hourly_rate)}/h)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-full sm:w-auto flex gap-2 sm:gap-3 items-center">
                          <div className="w-20 sm:w-24 flex-shrink-0">
                            <span className="sm:hidden text-xs text-muted-foreground block mb-1">Horas:</span>
                            <Input
                              type="number"
                              step="0.001"
                              value={labor.quantity_hours}
                              onChange={(e) =>
                                updateLabor(
                                  index,
                                  "quantity_hours",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder="Horas"
                              className="text-xs sm:text-sm h-8 sm:h-10 w-full text-center px-1"
                            />
                          </div>
                          <div className="w-24 sm:w-28 flex-shrink-0">
                            <span className="sm:hidden text-xs text-muted-foreground block mb-1">Tarifa:</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={labor.hourly_rate || ""}
                              onChange={(e) =>
                                updateLabor(
                                  index,
                                  "hourly_rate",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder="$/h"
                              className="text-xs sm:text-sm h-8 sm:h-10 w-full text-center px-1"
                            />
                          </div>
                          <div className="hidden sm:block w-28 text-right text-sm text-muted-foreground">
                            {formatCurrency(
                              labor.quantity_hours * (labor.hourly_rate || 0),
                            )}
                          </div>
                          <div className="sm:hidden text-xs text-muted-foreground whitespace-nowrap">
                            Total: {formatCurrency(
                              labor.quantity_hours * (labor.hourly_rate || 0),
                            )}
                          </div>
                        </div>
                        <div className="w-full sm:w-10 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer h-8 w-8 p-0"
                            onClick={() => removeLabor(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* MATERIALES */}
            <Card>
              <CardHeader className="py-3 px-3 sm:px-6">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    MATERIALES
                  </span>
                  <div className="flex gap-1 sm:gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addMaterial}
                      className="px-2 sm:px-3 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 sm:mr-1" />
                      <span>Agregar</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowMaterialForm(true)}
                      className="px-2 sm:px-3 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Nuevo</span>
                      <span className="sm:hidden">Nuevo</span>
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3 sm:px-6 min-w-0">
                {analysisData.materials.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4 space-y-2">
                    <p>No hay materiales</p>
                    <p className="text-sm">
                      Usá "Nuevo" para crear uno
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Headers - Hidden on mobile */}
                    <div className="hidden sm:flex gap-3 text-xs text-muted-foreground font-medium px-1">
                      <div className="flex-[3]">Material</div>
                      <div className="w-28 text-center">Cantidad</div>
                      <div className="w-32 text-right">Precio Total</div>
                      <div className="w-10"></div>
                    </div>
                    {analysisData.materials.map((material, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center p-3 sm:p-0 bg-muted/30 sm:bg-transparent rounded-lg sm:rounded-none min-w-0"
                      >
                        <div className="w-full sm:flex-[3] min-w-0">
                          <span className="sm:hidden text-xs text-muted-foreground block mb-1">Material:</span>
                          <Popover
                            open={materialPopoverOpen[index] || false}
                            onOpenChange={(open) =>
                              setMaterialPopoverOpen((prev) => ({ ...prev, [index]: open }))
                            }
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={materialPopoverOpen[index] || false}
                                className="w-full justify-between text-xs sm:text-sm h-8 sm:h-10 truncate"
                              >
                                <span className="truncate">
                                  {material.material_id
                                    ? (() => {
                                        const mat = materials.find((m: any) => m.id === material.material_id);
                                        return mat
                                          ? `${mat.code} - ${mat.name} (${formatCurrency(mat.unit_price || 0)}/${UNIT_LABELS[mat.unit] || mat.unit})`
                                          : "Seleccionar material";
                                      })()
                                    : "Seleccionar material"}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] sm:w-full p-0">
                              <Command>
                                <CommandInput placeholder="Buscar material..." className="h-9" />
                                <CommandList>
                                  <CommandEmpty>No se encontró material.</CommandEmpty>
                                  <CommandGroup>
                                    {materials.map((mat: any) => (
                                      <CommandItem
                                        key={mat.id}
                                        value={`${mat.code} ${mat.name} ${mat.unit}`}
                                        onSelect={() => {
                                          updateMaterial(index, "material_id", mat.id);
                                          updateMaterial(index, "material_name", mat.name);
                                          updateMaterial(index, "unit_price", mat.unit_price || 0);
                                          setMaterialPopoverOpen((prev) => ({ ...prev, [index]: false }));
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            material.material_id === mat.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <span className="flex-1 truncate">
                                          {mat.code} - {mat.name}
                                        </span>
                                        <span className="ml-2 text-muted-foreground text-xs whitespace-nowrap">
                                          {formatCurrency(mat.unit_price || 0)}/{UNIT_LABELS[mat.unit] || mat.unit}
                                        </span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="w-full sm:w-auto flex gap-2 sm:gap-3 items-center">
                          <div className="w-24 sm:w-28 flex-shrink-0">
                            <span className="sm:hidden text-xs text-muted-foreground block mb-1">Cantidad:</span>
                            <Input
                              type="number"
                              step="0.001"
                              value={material.quantity}
                              onChange={(e) =>
                                updateMaterial(
                                  index,
                                  "quantity",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder="Cantidad"
                              className="text-xs sm:text-sm h-8 sm:h-10 w-full text-center px-1"
                            />
                          </div>
                          <div className="w-28 sm:w-32 text-right text-sm text-muted-foreground flex-shrink-0">
                            <span className="sm:hidden text-xs">Total: </span>
                            {formatCurrency((material.unit_price || 0) * material.quantity)}
                          </div>
                        </div>
                        <div className="w-full sm:w-10 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 cursor-pointer"
                            onClick={() => removeMaterial(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* EQUIPOS */}
            <Card>
              <CardHeader className="py-3 px-3 sm:px-6">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    EQUIPOS
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={addEquipment}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3 sm:px-6 min-w-0">
                {analysisData.equipments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay equipos
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Headers - Hidden on mobile */}
                    <div className="hidden sm:flex gap-3 text-xs text-muted-foreground font-medium px-1">
                      <div className="flex-[2]">Equipo</div>
                      <div className="w-24 text-center">Cantidad</div>
                      <div className="w-28 text-center">Precio Unit.</div>
                      <div className="w-28 text-right">Precio Total</div>
                      <div className="w-10"></div>
                    </div>
                    {analysisData.equipments.map((equipment, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center p-3 sm:p-0 bg-muted/30 sm:bg-transparent rounded-lg sm:rounded-none min-w-0"
                      >
                        <div className="w-full sm:flex-[2] min-w-0">
                          <span className="sm:hidden text-xs text-muted-foreground block mb-1">Nombre:</span>
                          <Input
                            value={equipment.name}
                            onChange={(e) =>
                              updateEquipment(index, "name", e.target.value)
                            }
                            placeholder="Nombre del equipo"
                            className="text-xs sm:text-sm h-8 sm:h-10 w-full truncate"
                          />
                        </div>
                        <div className="w-full sm:w-auto flex gap-2 sm:gap-3 items-center">
                          <div className="w-20 sm:w-24 flex-shrink-0">
                            <span className="sm:hidden text-xs text-muted-foreground block mb-1">Cantidad:</span>
                            <Input
                              type="number"
                              step="0.5"
                              value={equipment.quantity_hours}
                              onChange={(e) =>
                                updateEquipment(
                                  index,
                                  "quantity_hours",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder="Cantidad"
                              className="text-xs sm:text-sm h-8 sm:h-10 w-full text-center px-1"
                            />
                          </div>
                          <div className="w-24 sm:w-28 flex-shrink-0">
                            <span className="sm:hidden text-xs text-muted-foreground block mb-1">Precio Unit.:</span>
                            <Input
                              type="number"
                              value={equipment.hourly_cost}
                              onChange={(e) =>
                                updateEquipment(
                                  index,
                                  "hourly_cost",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder="Precio Unit."
                              className="text-xs sm:text-sm h-8 sm:h-10 w-full text-center px-1"
                            />
                          </div>
                          <div className="w-24 sm:w-28 text-right text-sm text-muted-foreground flex-shrink-0">
                            <span className="sm:hidden text-xs">Total: </span>
                            {formatCurrency(
                              equipment.quantity_hours * equipment.hourly_cost,
                            )}
                          </div>
                        </div>
                        <div className="w-full sm:w-10 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer h-8 w-8 p-0"
                            onClick={() => removeEquipment(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TOTALES */}
            <Card className="bg-muted">
              <CardContent className="py-4 px-3 sm:px-6 min-w-0">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Mano de Obra (A):</span>
                    <span className="font-medium">
                      {formatCurrency(totals.laborTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Materiales (B):</span>
                    <span className="font-medium">
                      {formatCurrency(totals.materialTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Equipos (C):</span>
                    <span className="font-medium">
                      {formatCurrency(totals.equipmentTotal)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-sm sm:text-lg font-bold">COSTO UNITARIO (A+B+C):</span>
                    <span className="text-lg sm:text-xl font-bold text-green-600">
                      {formatCurrency(totals.total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* BOTONES */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={onClose}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="button"
                className="cursor-pointer"
                onClick={() => item && onSave(item.id, analysisData, itemName)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para crear nuevo material */}
      <MaterialForm
        isOpen={showMaterialForm}
        onClose={() => setShowMaterialForm(false)}
        onSubmit={handleCreateMaterial}
        isEditing={false}
        isLoading={creatingMaterial}
      />
    </>
  );
}

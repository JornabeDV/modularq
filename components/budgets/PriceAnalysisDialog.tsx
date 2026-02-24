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
} from "lucide-react";
import { BudgetItem, LaborConcept } from "@/lib/prisma-typed-service";
import { MaterialForm } from "@/components/admin/material-form";
import { CreateMaterialData } from "@/hooks/use-materials-prisma";
import { formatCurrency } from "./BudgetTotalsCards";

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
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Análisis de Precios - {item.code}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
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
              <CardHeader className="py-3">
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
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                {analysisData.labors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay conceptos de mano de obra
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-1">
                      <div className="col-span-4">Concepto</div>
                      <div className="col-span-2">Cantidad (hs)</div>
                      <div className="col-span-2">Tarifa ($/h)</div>
                      <div className="col-span-3 text-right">Total</div>
                      <div className="col-span-1"></div>
                    </div>
                    {analysisData.labors.map((labor, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-2 items-center"
                      >
                        <div className="col-span-4">
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
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar concepto" />
                            </SelectTrigger>
                            <SelectContent>
                              {laborConcepts.map((concept) => (
                                <SelectItem key={concept.id} value={concept.id}>
                                  {concept.name} (
                                  {formatCurrency(concept.hourly_rate)}/h)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
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
                          />
                        </div>
                        <div className="col-span-2">
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
                          />
                        </div>
                        <div className="col-span-3 text-right text-sm text-muted-foreground">
                          {formatCurrency(
                            labor.quantity_hours * (labor.hourly_rate || 0),
                          )}
                        </div>
                        <div className="col-span-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
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
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    MATERIALES
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addMaterial}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowMaterialForm(true)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Nuevo Material
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                {analysisData.materials.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4 space-y-2">
                    <p>No hay materiales</p>
                    <p className="text-xs">
                      Usá "Nuevo Material" para crear uno nuevo
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-1">
                      <div className="col-span-5">Concepto</div>
                      <div className="col-span-2">Cantidad</div>
                      <div className="col-span-4 text-right">Precio Unit.</div>
                      <div className="col-span-1"></div>
                    </div>
                    {analysisData.materials.map((material, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-2 items-center"
                      >
                        <div className="col-span-5">
                          <Select
                            value={material.material_id || ""}
                            onValueChange={(value) => {
                              const mat = materials.find(
                                (m: any) => m.id === value,
                              );
                              updateMaterial(index, "material_id", value);
                              updateMaterial(index, "material_name", mat?.name);
                              updateMaterial(
                                index,
                                "unit_price",
                                mat?.unit_price || 0,
                              );
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar material" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map((mat: any) => (
                                <SelectItem key={mat.id} value={mat.id}>
                                  {mat.code} - {mat.name} (
                                  {formatCurrency(mat.unit_price || 0)}/
                                  {mat.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
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
                          />
                        </div>
                        <div className="col-span-4 text-right text-sm text-muted-foreground">
                          {formatCurrency(material.unit_price || 0)}
                        </div>
                        <div className="col-span-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
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
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    EQUIPOS
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addEquipment}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                {analysisData.equipments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay equipos
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-1">
                      <div className="col-span-4">Concepto</div>
                      <div className="col-span-3">Cantidad</div>
                      <div className="col-span-2">Precio</div>
                      <div className="col-span-2 text-right">Total</div>
                      <div className="col-span-1"></div>
                    </div>
                    {analysisData.equipments.map((equipment, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-2 items-center"
                      >
                        <div className="col-span-4">
                          <Input
                            value={equipment.name}
                            onChange={(e) =>
                              updateEquipment(index, "name", e.target.value)
                            }
                            placeholder="Nombre del equipo"
                          />
                        </div>
                        <div className="col-span-3">
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
                            placeholder="Horas"
                          />
                        </div>
                        <div className="col-span-2">
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
                            placeholder="$/hora"
                          />
                        </div>
                        <div className="col-span-2 text-right text-sm text-muted-foreground">
                          {formatCurrency(
                            equipment.quantity_hours * equipment.hourly_cost,
                          )}
                        </div>
                        <div className="col-span-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
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
              <CardContent className="py-4">
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
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>COSTO UNITARIO (A+B+C):</span>
                    <span className="text-green-600">
                      {formatCurrency(totals.total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* BOTONES */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1"
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
                    Guardar Análisis
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

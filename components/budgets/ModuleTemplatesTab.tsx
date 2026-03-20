"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  Calculator,
  Layers,
  Loader2,
  ListOrdered,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PrismaTypedService } from "@/lib/prisma-typed-service";
import { useMaterialsPrisma } from "@/hooks/use-materials-prisma";
import { ModuleTemplateDialog } from "./ModuleTemplateDialog";
import { ModuleDescriptionEditor } from "./ModuleDescriptionEditor";
import { TemplateItemDialog } from "./TemplateItemDialog";
import { TemplateItemPriceAnalysisDialog } from "./TemplateItemPriceAnalysisDialog";
import { UNIT_LABELS } from "@/lib/constants";
import { formatCurrency } from "./BudgetTotalsCards";
import type { ModuleDescriptionSection } from "@/lib/types/budget";

export function ModuleTemplatesTab() {
  const { toast } = useToast();

  // — Módulos
  const [modules, setModules] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);

  // — Vista detalle de módulo
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  const [moduleItems, setModuleItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // — Labor concepts & materiales para el análisis de precios
  const [laborConcepts, setLaborConcepts] = useState<any[]>([]);
  const { materials, createMaterial } = useMaterialsPrisma();

  // — Dialogs módulo
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<any | null>(null);
  const [savingModule, setSavingModule] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<any | null>(null);
  const [deletingModule, setDeletingModule] = useState(false);

  // — Dialogs ítem
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  // — Dialog análisis de precios
  const [analysisItem, setAnalysisItem] = useState<any | null>(null);
  const [savingAnalysis, setSavingAnalysis] = useState(false);

  // — Descripción del módulo
  const [savingDescription, setSavingDescription] = useState(false);

  // ─────────────────────────────────────────
  // Carga inicial
  // ─────────────────────────────────────────

  const loadModules = useCallback(async () => {
    setLoadingModules(true);
    try {
      const data = await PrismaTypedService.getAllBudgetModuleTemplates();
      setModules(data);
    } catch {
      toast({ title: "Error al cargar módulos", variant: "destructive" });
    } finally {
      setLoadingModules(false);
    }
  }, [toast]);

  const loadModuleItems = useCallback(
    async (moduleId: string) => {
      setLoadingItems(true);
      try {
        const data = await PrismaTypedService.getAllBudgetItemTemplates(
          true,
          moduleId,
        );
        setModuleItems(data);
      } catch {
        toast({ title: "Error al cargar ítems", variant: "destructive" });
      } finally {
        setLoadingItems(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  useEffect(() => {
    const loadLaborConcepts = async () => {
      try {
        const data = await PrismaTypedService.getAllLaborConcepts();
        setLaborConcepts(data);
      } catch {
        // silencioso
      }
    };
    loadLaborConcepts();
  }, []);

  // ─────────────────────────────────────────
  // Módulos — CRUD
  // ─────────────────────────────────────────

  const handleSaveModule = async (data: {
    name: string;
    description: string;
    source_module_id?: string;
  }) => {
    setSavingModule(true);
    try {
      if (editingModule) {
        const updated = await PrismaTypedService.updateBudgetModuleTemplate(
          editingModule.id,
          data,
        );
        setModules((prev) =>
          prev.map((m) => (m.id === updated.id ? updated : m)),
        );
        if (selectedModule?.id === updated.id) setSelectedModule(updated);
        toast({ title: "Módulo actualizado" });
      } else {
        const created = await PrismaTypedService.createBudgetModuleTemplate({
          ...data,
          order: modules.length + 1,
        });
        // Clonar ítems y descripción del módulo fuente si se eligió uno
        if (data.source_module_id) {
          await PrismaTypedService.cloneBudgetModuleItems(
            data.source_module_id,
            created.id,
          );
          // Refrescar el módulo para que tenga module_description actualizada en memoria
          const refreshed =
            await PrismaTypedService.getBudgetModuleTemplateWithItems(
              created.id,
            );
          setModules((prev) => [...prev, refreshed ?? created]);
        } else {
          setModules((prev) => [...prev, created]);
        }
        toast({
          title: data.source_module_id
            ? "Módulo creado con ítems copiados"
            : "Módulo creado",
        });
      }
      setShowModuleDialog(false);
      setEditingModule(null);
    } catch {
      toast({ title: "Error al guardar el módulo", variant: "destructive" });
    } finally {
      setSavingModule(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!moduleToDelete) return;
    setDeletingModule(true);
    try {
      await PrismaTypedService.deleteBudgetModuleTemplate(moduleToDelete.id);
      setModules((prev) => prev.filter((m) => m.id !== moduleToDelete.id));
      if (selectedModule?.id === moduleToDelete.id) setSelectedModule(null);
      toast({ title: "Módulo eliminado" });
      setModuleToDelete(null);
    } catch {
      toast({ title: "Error al eliminar el módulo", variant: "destructive" });
    } finally {
      setDeletingModule(false);
    }
  };

  const openModule = (mod: any) => {
    setSelectedModule(mod);
    loadModuleItems(mod.id);
  };

  // ─────────────────────────────────────────
  // Ítems — CRUD
  // ─────────────────────────────────────────

  const handleSaveItem = async (data: {
    code: string;
    category: string;
    description: string;
    unit: string;
    default_quantity: number;
  }) => {
    if (!selectedModule) return;
    setSavingItem(true);
    try {
      if (editingItem) {
        const updated = await PrismaTypedService.updateBudgetItemTemplate(
          editingItem.id,
          data,
        );
        setModuleItems((prev) =>
          prev.map((it) => (it.id === updated.id ? updated : it)),
        );
        toast({ title: "Ítem actualizado" });
      } else {
        const created = await PrismaTypedService.createBudgetItemTemplate({
          ...data,
          module_template_id: selectedModule.id,
          order: moduleItems.length,
        });
        setModuleItems((prev) => [...prev, created]);
        toast({ title: "Ítem agregado" });
      }
      setShowItemDialog(false);
      setEditingItem(null);
    } catch {
      toast({ title: "Error al guardar el ítem", variant: "destructive" });
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setDeletingItem(true);
    try {
      await PrismaTypedService.deleteBudgetItemTemplate(itemToDelete.id);
      setModuleItems((prev) => prev.filter((it) => it.id !== itemToDelete.id));
      toast({ title: "Ítem eliminado" });
      setItemToDelete(null);
    } catch {
      toast({ title: "Error al eliminar el ítem", variant: "destructive" });
    } finally {
      setDeletingItem(false);
    }
  };

  // ─────────────────────────────────────────
  // Análisis de precios
  // ─────────────────────────────────────────

  const handleSaveAnalysis = async (itemId: string, analysisData: any) => {
    setSavingAnalysis(true);
    try {
      const updated = await PrismaTypedService.updateBudgetItemTemplate(
        itemId,
        {
          template_labors: analysisData.labors,
          template_materials: analysisData.materials,
          template_equipments: analysisData.equipments,
        },
      );
      setModuleItems((prev) =>
        prev.map((it) => (it.id === updated.id ? updated : it)),
      );
      toast({ title: "Análisis guardado" });
      setAnalysisItem(null);
    } catch {
      toast({ title: "Error al guardar el análisis", variant: "destructive" });
    } finally {
      setSavingAnalysis(false);
    }
  };

  const handleSaveDescription = async (
    sections: ModuleDescriptionSection[],
  ) => {
    if (!selectedModule) return;
    setSavingDescription(true);
    try {
      const updated = await PrismaTypedService.updateBudgetModuleTemplate(
        selectedModule.id,
        {
          module_description: sections,
        },
      );
      setSelectedModule(updated);
      setModules((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m)),
      );
      toast({ title: "Descripción guardada" });
    } catch {
      toast({
        title: "Error al guardar la descripción",
        variant: "destructive",
      });
    } finally {
      setSavingDescription(false);
    }
  };

  const handleCreateMaterial = async (data: any): Promise<boolean> => {
    const result = await createMaterial(data);
    return result?.success ?? false;
  };

  // ─────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────

  const getItemAnalysisSummary = (item: any) => {
    const labors = item.template_labors?.length || 0;
    const mats = item.template_materials?.length || 0;
    const equips = item.template_equipments?.length || 0;
    const total = labors + mats + equips;
    return total > 0 ? `${total} concept${total === 1 ? "o" : "os"}` : null;
  };

  // ─────────────────────────────────────────
  // Render — Vista lista de módulos
  // ─────────────────────────────────────────

  if (!selectedModule) {
    return (
      <>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Módulos Estándar</h2>
              <p className="text-sm text-muted-foreground">
                Configurá los módulos que se usan como base al crear presupuestos.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingModule(null);
                setShowModuleDialog(true);
              }}
              className="cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Módulo
            </Button>
          </div>

          {/* Lista */}
          {loadingModules ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : modules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Layers className="w-12 h-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground font-medium">
                  No hay módulos creados
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Creá tu primer módulo estándar para agilizar la confección de
                  presupuestos.
                </p>
                <Button
                  className="mt-4 cursor-pointer"
                  onClick={() => {
                    setEditingModule(null);
                    setShowModuleDialog(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primer módulo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((mod) => (
                <Card
                  key={mod.id}
                  className="hover:shadow-md transition-shadow justify-between"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">
                          {mod.name}
                        </CardTitle>
                        {mod.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {mod.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={mod.is_active ? "default" : "secondary"}
                        className="shrink-0 text-xs"
                      >
                        {mod.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer gap-1.5 text-xs"
                        onClick={() => openModule(mod)}
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                        Ver ítems
                      </Button>
                      <div className="flex gap-1">
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="cursor-pointer h-8 w-8 p-0"
                                onClick={() => {
                                  setEditingModule(mod);
                                  setShowModuleDialog(true);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar módulo</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="cursor-pointer h-8 w-8 p-0"
                                onClick={() => setModuleToDelete(mod)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Eliminar módulo</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Dialogs */}
        <ModuleTemplateDialog
          isOpen={showModuleDialog}
          onClose={() => {
            setShowModuleDialog(false);
            setEditingModule(null);
          }}
          onSubmit={handleSaveModule}
          isLoading={savingModule}
          initialData={editingModule}
          existingModules={modules}
        />

        <Dialog
          open={!!moduleToDelete}
          onOpenChange={() => setModuleToDelete(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>¿Eliminar módulo?</DialogTitle>
              <DialogDescription>
                Estás a punto de eliminar{" "}
                <strong>{moduleToDelete?.name}</strong> y todos sus ítems. Esta
                acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setModuleToDelete(null)}
                disabled={deletingModule}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="cursor-pointer"
                onClick={handleDeleteModule}
                disabled={deletingModule}
              >
                {deletingModule ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // ─────────────────────────────────────────
  // Render — Vista detalle de ítems del módulo
  // ─────────────────────────────────────────

  return (
    <>
      <div className="space-y-4">
        {/* Header detalle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer shrink-0"
              onClick={() => setSelectedModule(null)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Módulos
            </Button>
            <div>
              <h2 className="text-lg font-semibold">{selectedModule.name}</h2>
              {selectedModule.description && (
                <p className="text-xs text-muted-foreground">
                  {selectedModule.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex max-sm:flex-col tems-center gap-2">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                setEditingModule(selectedModule);
                setShowModuleDialog(true);
              }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Editar módulo
            </Button>
            <Button
              className="cursor-pointer"
              onClick={() => {
                setEditingItem(null);
                setShowItemDialog(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar ítem
            </Button>
          </div>
        </div>

        {/* Tabla de ítems */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="w-4 h-4" />
              Ítems del módulo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-0">
            {loadingItems ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : moduleItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ListOrdered className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground font-medium">Sin ítems</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Agregá los ítems que componen este módulo.
                </p>
                <Button
                  className="mt-4 cursor-pointer"
                  onClick={() => {
                    setEditingItem(null);
                    setShowItemDialog(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar primer ítem
                </Button>
              </div>
            ) : (
              (() => {
                const grouped = moduleItems.reduce(
                  (acc: Record<string, any[]>, item: any) => {
                    const cat = item.category || "Sin categoría";
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(item);
                    return acc;
                  },
                  {},
                );
                const categories = moduleItems.reduce(
                  (acc: string[], item: any) => {
                    const cat = item.category || "Sin categoría";
                    if (!acc.includes(cat)) acc.push(cat);
                    return acc;
                  },
                  [],
                );
                const getUnitCost = (item: any) => {
                  const labor = (item.template_labors || []).reduce(
                    (s: number, l: any) =>
                      s + (l.quantity_hours || 0) * (l.hourly_rate || 0),
                    0,
                  );
                  const mat = (item.template_materials || []).reduce(
                    (s: number, m: any) =>
                      s + (m.quantity || 0) * (m.unit_price || 0),
                    0,
                  );
                  const eq = (item.template_equipments || []).reduce(
                    (s: number, e: any) =>
                      s + (e.quantity_hours || 0) * (e.hourly_cost || 0),
                    0,
                  );
                  return labor + mat + eq;
                };
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[550px]">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left px-2 h-10 font-medium whitespace-nowrap w-[80px]">
                            Código
                          </th>
                          <th className="text-left px-2 h-10 font-medium min-w-[200px]">
                            Descripción
                          </th>
                          <th className="text-center px-2 h-10 font-medium whitespace-nowrap w-[70px]">
                            Unidad
                          </th>
                          <th className="text-right px-2 h-10 font-medium whitespace-nowrap w-[90px]">
                            Cant. pred.
                          </th>
                          <th className="text-right px-2 h-10 font-medium whitespace-nowrap w-[130px]">
                            Costo Unitario
                          </th>
                          <th className="px-2 w-[80px] text-center whitespace-nowrap">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((category: string) => (
                          <>
                            <tr
                              key={`cat-${category}`}
                              className="bg-muted/80 border-b"
                            >
                              <td colSpan={6} className="p-2 px-3">
                                <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                                  {category}
                                </span>
                              </td>
                            </tr>
                            {grouped[category]?.map((item: any) => {
                              const unitCost = getUnitCost(item);
                              return (
                                <tr
                                  key={item.id}
                                  className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                                  onClick={() => setAnalysisItem(item)}
                                  title="Click para editar análisis de precios"
                                >
                                  <td className="px-2 font-mono text-muted-foreground pl-6 whitespace-nowrap text-xs">
                                    {item.code}
                                  </td>
                                  <td className="px-2 max-w-[200px]">
                                    <span
                                      className="truncate block text-sm"
                                      title={item.description}
                                    >
                                      {item.description}
                                    </span>
                                  </td>
                                  <td className="px-2 text-center whitespace-nowrap text-sm text-muted-foreground">
                                    {UNIT_LABELS[item.unit] || item.unit}
                                  </td>
                                  <td className="px-2 text-right whitespace-nowrap text-sm">
                                    {item.default_quantity > 0 ? (
                                      item.default_quantity
                                    ) : (
                                      <span className="text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2 text-right whitespace-nowrap text-sm font-medium">
                                    {unitCost > 0 ? (
                                      formatCurrency(unitCost)
                                    ) : (
                                      <span className="text-muted-foreground text-xs">
                                        Sin análisis
                                      </span>
                                    )}
                                  </td>
                                  <td
                                    className="p-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <TooltipProvider>
                                      <div className="flex items-center justify-center gap-1">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="cursor-pointer h-7 w-7 p-0"
                                              onClick={() => {
                                                setEditingItem(item);
                                                setShowItemDialog(true);
                                              }}
                                            >
                                              <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Editar ítem</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="cursor-pointer h-7 w-7 p-0"
                                              onClick={() =>
                                                setItemToDelete(item)
                                              }
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Eliminar ítem</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </TooltipProvider>
                                  </td>
                                </tr>
                              );
                            })}
                          </>
                        ))}
                      </tbody>
                      <tfoot className="font-medium bg-muted/50">
                        <tr>
                          <td
                            colSpan={4}
                            className="p-2 text-right text-xs text-muted-foreground"
                          >
                            {moduleItems.length} ítem
                            {moduleItems.length !== 1 ? "s" : ""}
                          </td>
                          <td className="p-2 text-right font-semibold whitespace-nowrap text-sm">
                            {moduleItems.some(
                              (it: any) => getUnitCost(it) > 0,
                            ) &&
                              formatCurrency(
                                moduleItems.reduce((s: number, it: any) => {
                                  const qty = it.default_quantity || 0;
                                  return s + qty * getUnitCost(it);
                                }, 0),
                              )}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>

        {/* Descripción del Módulo */}
        <ModuleDescriptionEditor
          sections={selectedModule.module_description || []}
          onSave={handleSaveDescription}
          isSaving={savingDescription}
        />
      </div>

      {/* Dialogs */}
      <ModuleTemplateDialog
        isOpen={showModuleDialog}
        onClose={() => {
          setShowModuleDialog(false);
          setEditingModule(null);
        }}
        onSubmit={handleSaveModule}
        isLoading={savingModule}
        initialData={editingModule}
      />

      <TemplateItemDialog
        isOpen={showItemDialog}
        onClose={() => {
          setShowItemDialog(false);
          setEditingItem(null);
        }}
        onSubmit={handleSaveItem}
        isLoading={savingItem}
        initialData={editingItem}
      />

      <TemplateItemPriceAnalysisDialog
        isOpen={!!analysisItem}
        onClose={() => setAnalysisItem(null)}
        item={analysisItem}
        laborConcepts={laborConcepts}
        materials={materials}
        isSaving={savingAnalysis}
        onSave={handleSaveAnalysis}
        onCreateMaterial={handleCreateMaterial}
      />

      <Dialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar ítem?</DialogTitle>
            <DialogDescription>
              Eliminás{" "}
              <strong>
                {itemToDelete?.code} — {itemToDelete?.description}
              </strong>
              . Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setItemToDelete(null)}
              disabled={deletingItem}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={handleDeleteItem}
              disabled={deletingItem}
            >
              {deletingItem ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  PrismaTypedService,
  BudgetItem,
  LaborConcept,
  ModuleDescriptionSection,
} from "@/lib/prisma-typed-service";
import {
  getExchangeRate,
  formatExchangeRate,
  ExchangeRate,
} from "@/lib/exchange-rate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MainLayout } from "@/components/layout/main-layout";
import { useBudget } from "@/hooks/useBudget";
import { CreateMaterialData } from "@/hooks/use-materials-prisma";
import {
  BudgetHeader,
  BudgetTotalsCards,
  PendingChangesBanner,
  BudgetItemsTable,
  BudgetResourceSummary,
  BudgetClientView,
  AddItemDialog,
  PriceAnalysisDialog,
  formatCurrency,
  ModuleDescriptionEditor,
} from "@/components/budgets";

interface BudgetDetailPageProps {
  params: { id: string };
}

export default function BudgetDetailPage({ params }: BudgetDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Hook principal del presupuesto
  const {
    budget,
    loading,
    saving,
    editingQuantities,
    pendingChanges,
    loadBudget,
    handleQuantityChange,
    handleQuantityBlur,
    saveAllChanges,
    discardChanges,
  } = useBudget(params.id);

  // Estados locales
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Estados para análisis de precios
  const [showPriceAnalysisDialog, setShowPriceAnalysisDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BudgetItem | null>(null);
  const [savingAnalysis, setSavingAnalysis] = useState(false);
  const [laborConcepts, setLaborConcepts] = useState<LaborConcept[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [savingModuleDesc, setSavingModuleDesc] = useState(false);

  // Cargar cotización del dólar y datos necesarios para recursos
  useEffect(() => {
    const loadInitialData = async () => {
      const [rate, concepts, mats] = await Promise.all([
        getExchangeRate(),
        PrismaTypedService.getAllLaborConcepts(),
        PrismaTypedService.getAllMaterials(),
      ]);
      setExchangeRate(rate);
      setLaborConcepts(concepts);
      setMaterials(mats);
    };
    loadInitialData();
  }, []);

  // Advertir si hay cambios sin guardar al salir
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingChanges.size > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [pendingChanges]);

  // Calcular totales con cambios pendientes
  const calculatedTotals = useMemo(() => {
    if (!budget || pendingChanges.size === 0) {
      return {
        subtotal_direct_costs: budget?.subtotal_direct_costs || 0,
        subtotal_with_expenses: budget?.subtotal_with_expenses || 0,
        subtotal_with_benefit: budget?.subtotal_with_benefit || 0,
        final_price: budget?.final_price || 0,
        hasChanges: false,
      };
    }

    let subtotalDirectCosts = 0;
    budget.items?.forEach((item: BudgetItem) => {
      const quantity = pendingChanges.has(item.id)
        ? parseFloat(editingQuantities[item.id]) || 0
        : item.quantity;
      subtotalDirectCosts += quantity * item.unit_cost_total;
    });

    const generalExpensesPct = budget.general_expenses_pct || 0;
    const benefitPct = budget.benefit_pct || 0;
    const ivaPct = budget.iva_pct || 0;
    const grossIncomePct = budget.gross_income_pct || 0;

    const generalExpenses = subtotalDirectCosts * (generalExpensesPct / 100);
    const subtotalWithExpenses = subtotalDirectCosts + generalExpenses;
    const benefit = subtotalWithExpenses * (benefitPct / 100);
    const subtotalWithBenefit = subtotalWithExpenses + benefit;
    const iva = subtotalWithBenefit * (ivaPct / 100);
    const grossIncome = subtotalWithBenefit * (grossIncomePct / 100);
    const finalPrice = subtotalWithBenefit + iva + grossIncome;

    return {
      subtotal_direct_costs: subtotalDirectCosts,
      subtotal_with_expenses: subtotalWithExpenses,
      subtotal_with_benefit: subtotalWithBenefit,
      final_price: finalPrice,
      hasChanges: true,
    };
  }, [budget, pendingChanges, editingQuantities]);

  // Calcular recursos totales
  const resources = useMemo(() => {
    const resources = {
      labors: {} as Record<
        string,
        {
          name: string;
          totalHours: number;
          hourlyRate: number;
          totalCost: number;
        }
      >,
      materials: {} as Record<
        string,
        {
          name: string;
          unit: string;
          totalQuantity: number;
          unitPrice: number;
          totalCost: number;
        }
      >,
      equipments: {} as Record<
        string,
        {
          name: string;
          totalHours: number;
          hourlyCost: number;
          totalCost: number;
        }
      >,
    };

    budget?.items?.forEach((item: BudgetItem) => {
      const quantity = item.quantity || 0;
      // El price_analysis puede venir como objeto o array desde Supabase
      const analysis = Array.isArray(item.price_analysis)
        ? item.price_analysis[0]
        : item.price_analysis;

      if (analysis) {
        analysis.labors?.forEach((labor: any) => {
          const conceptId = labor.labor_concept_id;
          const concept = laborConcepts.find((c) => c.id === conceptId);
          const hours = (labor.quantity_hours || 0) * quantity;
          const rate = labor.hourly_rate || concept?.hourly_rate || 0;
          const cost = hours * rate;

          if (!resources.labors[conceptId]) {
            resources.labors[conceptId] = {
              name: concept?.name || "Sin nombre",
              totalHours: 0,
              hourlyRate: rate,
              totalCost: 0,
            };
          }
          resources.labors[conceptId].totalHours += hours;
          resources.labors[conceptId].totalCost += cost;
        });

        analysis.materials?.forEach((material: any) => {
          const matId = material.material_id || material.material_name;
          const mat = materials.find((m: any) => m.id === material.material_id);
          const qty = (material.quantity || 0) * quantity;
          const price = material.unit_price || mat?.unit_price || 0;
          const cost = qty * price;

          if (!resources.materials[matId]) {
            resources.materials[matId] = {
              name: material.material_name || mat?.name || "Sin nombre",
              unit: mat?.unit || "un",
              totalQuantity: 0,
              unitPrice: price,
              totalCost: 0,
            };
          }
          resources.materials[matId].totalQuantity += qty;
          resources.materials[matId].totalCost += cost;
        });

        analysis.equipments?.forEach((equipment: any) => {
          const eqName = equipment.name;
          const hours = (equipment.quantity_hours || 0) * quantity;
          const costPerHour = equipment.hourly_cost || 0;
          const cost = hours * costPerHour;

          if (!resources.equipments[eqName]) {
            resources.equipments[eqName] = {
              name: eqName,
              totalHours: 0,
              hourlyCost: costPerHour,
              totalCost: 0,
            };
          }
          resources.equipments[eqName].totalHours += hours;
          resources.equipments[eqName].totalCost += cost;
        });
      }
    });

    return resources;
  }, [budget, laborConcepts, materials]);

  // Handlers
  const handleSaveChanges = async () => {
    const result = await saveAllChanges();
    if (result?.success && result.count !== undefined) {
      toast({
        title: "Cambios guardados",
        description: `${result.count} ítem${result.count > 1 ? "s" : ""} actualizado${result.count > 1 ? "s" : ""}`,
      });
    } else if (result?.error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    }
  };

  const handleDiscardChanges = () => {
    discardChanges();
    toast({
      title: "Cambios descartados",
      description: "Se restauraron los valores originales",
    });
  };

  const handleSaveModuleDescription = async (
    sections: ModuleDescriptionSection[],
  ) => {
    setSavingModuleDesc(true);
    try {
      await PrismaTypedService.updateBudget(params.id, {
        module_description: sections,
      });
      await loadBudget();
      toast({
        title: "Descripción guardada",
        description: "La descripción del módulo ha sido actualizada.",
      });
    } catch (error) {
      console.error("Error saving module description:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la descripción del módulo.",
        variant: "destructive",
      });
    } finally {
      setSavingModuleDesc(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const result = await PrismaTypedService.approveBudget(params.id);
      if (result.success) {
        router.push("/admin/budgets");
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error approving budget:", error);
      alert("Error al aprobar el presupuesto");
    } finally {
      setIsApproving(false);
    }
  };

  const handleAddItem = async (itemData: {
    code: string;
    category: string;
    description: string;
    unit: string;
    quantity: number;
  }) => {
    try {
      await PrismaTypedService.addBudgetItem(params.id, {
        code: itemData.code,
        category: itemData.category,
        description: itemData.description,
        unit: itemData.unit,
        quantity: itemData.quantity,
        is_custom: true,
      });
      await loadBudget();
      setShowAddItemDialog(false);
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Error al agregar el ítem");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("¿Estás seguro de eliminar este ítem?")) return;

    try {
      await PrismaTypedService.deleteBudgetItem(itemId);
      await loadBudget();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Error al eliminar el ítem");
    }
  };

  const openPriceAnalysis = async (item: BudgetItem) => {
    setSelectedItem(item);
    setShowPriceAnalysisDialog(true);

    const [concepts, mats] = await Promise.all([
      PrismaTypedService.getAllLaborConcepts(),
      PrismaTypedService.getAllMaterials(),
    ]);
    setLaborConcepts(concepts);
    setMaterials(mats);
  };

  const handleSavePriceAnalysis = async (
    itemId: string,
    analysisData: {
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
      equipments: {
        name: string;
        quantity_hours: number;
        hourly_cost: number;
      }[];
    },
    itemName: string,
  ) => {
    setSavingAnalysis(true);
    try {
      const item = budget?.items.find((i: BudgetItem) => i.id === itemId);
      if (item && itemName !== item.description) {
        await PrismaTypedService.updateBudgetItem(itemId, {
          description: itemName,
        });
      }

      await PrismaTypedService.updatePriceAnalysis(itemId, analysisData);
      setShowPriceAnalysisDialog(false);
      setSelectedItem(null);
      await loadBudget();
    } catch (error) {
      console.error("Error saving price analysis:", error);
      alert("Error al guardar el análisis de precios");
    } finally {
      setSavingAnalysis(false);
    }
  };

  const handleCreateMaterial = async (
    data: CreateMaterialData,
  ): Promise<boolean> => {
    try {
      const result = await PrismaTypedService.createMaterial(data);
      if (result) {
        const updatedMaterials = await PrismaTypedService.getAllMaterials();
        setMaterials(updatedMaterials);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error creating material:", error);
      return false;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">
              Cargando presupuesto...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!budget) {
    return <div className="p-8">Presupuesto no encontrado</div>;
  }

  const isEditable = budget.status === "draft";

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <BudgetHeader
          budget={budget}
          isEditable={isEditable}
          saving={saving || isApproving}
          pendingChangesCount={pendingChanges.size}
          onAddItem={() => setShowAddItemDialog(true)}
          onApprove={handleApprove}
        />

        {/* Banner de cambios pendientes */}
        <PendingChangesBanner
          count={pendingChanges.size}
          saving={saving}
          onDiscard={handleDiscardChanges}
          onSave={handleSaveChanges}
        />

        {/* Tabs principales */}
        <Tabs defaultValue="computo" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger
              value="computo"
              className="cursor-pointer text-sm py-2 h-auto"
            >
              <span className="hidden sm:inline">Cómputo y </span>Presupuesto
            </TabsTrigger>
            <TabsTrigger
              value="recursos"
              className="cursor-pointer text-sm py-2 h-auto"
            >
              <span className="hidden sm:inline">Resumen de </span>Recursos
            </TabsTrigger>
            <TabsTrigger
              value="cliente"
              className="cursor-pointer text-sm py-2 h-auto"
            >
              <span className="hidden sm:inline">Presupuesto </span>Cliente
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Cómputo y Presupuesto */}
          <TabsContent value="computo" className="space-y-4">
            <BudgetTotalsCards
              totals={calculatedTotals}
              generalExpensesPct={budget.general_expenses_pct}
              benefitPct={budget.benefit_pct}
            />

            <BudgetItemsTable
              items={budget.items}
              isEditable={isEditable}
              editingQuantities={editingQuantities}
              pendingChanges={pendingChanges}
              onQuantityChange={handleQuantityChange}
              onQuantityBlur={handleQuantityBlur}
              onEditItem={openPriceAnalysis}
              onDeleteItem={handleDeleteItem}
            />

            {/* Banner de cambios pendientes */}
            <PendingChangesBanner
              count={pendingChanges.size}
              saving={saving}
              onDiscard={handleDiscardChanges}
              onSave={handleSaveChanges}
            />

            {/* Desglose de Precio Final */}
            <Card>
              <CardHeader className="max-sm:px-3">
                <CardTitle className="flex items-center gap-2">
                  Resumen de Precios
                  {calculatedTotals.hasChanges && (
                    <span className="text-xs text-muted-foreground">
                      (valores preliminares)
                    </span>
                  )}
                </CardTitle>
                {budget.status === "approved" && budget.exchange_rate ? (
                  <p className="text-xs text-muted-foreground">
                    Cotización al aprobar (
                    {budget.exchange_rate_date
                      ? new Date(budget.exchange_rate_date).toLocaleDateString(
                          "es-AR",
                        )
                      : ""}
                    ): <strong>${budget.exchange_rate}</strong>
                  </p>
                ) : exchangeRate ? (
                  <p className="text-xs text-muted-foreground">
                    Dólar BNA Venta (actual):{" "}
                    <strong>{formatExchangeRate(exchangeRate)}</strong>
                  </p>
                ) : null}
              </CardHeader>
              <CardContent className="max-sm:px-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left p-2 font-medium">Concepto</th>
                        <th className="text-right p-2 font-medium">
                          Pesos (AR$)
                        </th>
                        {(budget.exchange_rate || exchangeRate) && (
                          <th className="text-right p-2 font-medium text-green-600">
                            Dólares (U$S)
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const rateToUse =
                          budget.exchange_rate || exchangeRate?.venta || null;
                        const showUSD = rateToUse !== null;

                        const subtotalDirect =
                          calculatedTotals.subtotal_direct_costs;
                        const generalExp =
                          subtotalDirect * (budget.general_expenses_pct / 100);
                        const subtotalExp = subtotalDirect + generalExp;
                        const benefit =
                          subtotalExp * (budget.benefit_pct / 100);
                        const subtotalBenefit = subtotalExp + benefit;
                        const iva = subtotalBenefit * (budget.iva_pct / 100);
                        const grossIncome =
                          subtotalBenefit * (budget.gross_income_pct / 100);
                        const calculatedPrice =
                          subtotalBenefit + iva + grossIncome;

                        return (
                          <>
                            <tr className="border-b">
                              <td className="p-2 whitespace-nowrap">
                                Subtotal (1)
                              </td>
                              <td className="p-2 text-right">
                                {formatCurrency(subtotalDirect)}
                              </td>
                              {showUSD && (
                                <td className="p-2 text-right text-green-600">
                                  {formatCurrency(subtotalDirect / rateToUse!)}
                                </td>
                              )}
                            </tr>
                            <tr className="border-b">
                              <td className="p-2 whitespace-nowrap">
                                Gastos Generales ({budget.general_expenses_pct}
                                %)
                              </td>
                              <td className="p-2 text-right">
                                {formatCurrency(generalExp)}
                              </td>
                              {showUSD && (
                                <td className="p-2 text-right text-green-600">
                                  {formatCurrency(generalExp / rateToUse!)}
                                </td>
                              )}
                            </tr>
                            <tr className="border-b font-medium">
                              <td className="p-2 whitespace-nowrap">
                                Subtotal (2)
                              </td>
                              <td className="p-2 text-right">
                                {formatCurrency(subtotalExp)}
                              </td>
                              {showUSD && (
                                <td className="p-2 text-right text-green-600">
                                  {formatCurrency(subtotalExp / rateToUse!)}
                                </td>
                              )}
                            </tr>
                            <tr className="border-b">
                              <td className="p-2 whitespace-nowrap">
                                Beneficio ({budget.benefit_pct}%)
                              </td>
                              <td className="p-2 text-right">
                                {formatCurrency(benefit)}
                              </td>
                              {showUSD && (
                                <td className="p-2 text-right text-green-600">
                                  {formatCurrency(benefit / rateToUse!)}
                                </td>
                              )}
                            </tr>
                            <tr className="border-b font-medium">
                              <td className="p-2 whitespace-nowrap">
                                Subtotal (3)
                              </td>
                              <td className="p-2 text-right">
                                {formatCurrency(subtotalBenefit)}
                              </td>
                              {showUSD && (
                                <td className="p-2 text-right text-green-600">
                                  {formatCurrency(subtotalBenefit / rateToUse!)}
                                </td>
                              )}
                            </tr>
                            <tr className="border-b">
                              <td className="p-2 whitespace-nowrap">
                                IVA ({budget.iva_pct}%)
                              </td>
                              <td className="p-2 text-right">
                                {formatCurrency(iva)}
                              </td>
                              {showUSD && (
                                <td className="p-2 text-right text-green-600">
                                  {formatCurrency(iva / rateToUse!)}
                                </td>
                              )}
                            </tr>
                            <tr className="border-b bg-muted/30">
                              <td className="p-2 font-bold">
                                Precio Calculado
                              </td>
                              <td className="p-2 text-right font-bold">
                                {formatCurrency(calculatedPrice)}
                              </td>
                              {showUSD && (
                                <td className="p-2 text-right font-bold text-green-600">
                                  {formatCurrency(calculatedPrice / rateToUse!)}
                                </td>
                              )}
                            </tr>
                            <tr className="bg-green-50 dark:bg-green-950">
                              <td className="p-2 font-bold text-lg">
                                Precio Final
                              </td>
                              <td className="p-2 text-right text-lg font-bold text-green-600">
                                {formatCurrency(calculatedTotals.final_price)}
                              </td>
                              {showUSD && (
                                <td className="p-2 text-right text-lg font-bold text-green-600">
                                  {formatCurrency(
                                    calculatedTotals.final_price / rateToUse!,
                                  )}
                                </td>
                              )}
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Resumen de Recursos */}
          <TabsContent value="recursos">
            <BudgetResourceSummary resources={resources} />
          </TabsContent>

          {/* Tab 3: Presupuesto Cliente */}
          <TabsContent value="cliente">
            <BudgetClientView
              budget={budget}
              currentExchangeRate={exchangeRate?.venta}
              onSaveModuleDescription={handleSaveModuleDescription}
              savingModuleDesc={savingModuleDesc}
            />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <AddItemDialog
          isOpen={showAddItemDialog}
          onClose={() => setShowAddItemDialog(false)}
          onSubmit={handleAddItem}
        />

        <PriceAnalysisDialog
          isOpen={showPriceAnalysisDialog}
          onClose={() => {
            setShowPriceAnalysisDialog(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          laborConcepts={laborConcepts}
          materials={materials}
          isSaving={savingAnalysis}
          onSave={handleSavePriceAnalysis}
          onCreateMaterial={handleCreateMaterial}
        />
      </div>
    </MainLayout>
  );
}

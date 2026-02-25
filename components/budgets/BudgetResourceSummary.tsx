"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, Wrench } from "lucide-react";
import { formatCurrency } from "./BudgetTotalsCards";

interface ResourceItem {
  name: string;
  totalHours?: number;
  totalQuantity?: number;
  unit?: string;
  hourlyCost?: number;
  unitPrice?: number;
  totalCost: number;
}

interface BudgetResources {
  labors: Record<string, ResourceItem>;
  materials: Record<string, ResourceItem>;
  equipments: Record<string, ResourceItem>;
}

interface BudgetResourceSummaryProps {
  resources: BudgetResources;
}

export function BudgetResourceSummary({
  resources,
}: BudgetResourceSummaryProps) {
  const hasLabors = Object.keys(resources.labors).length > 0;
  const hasMaterials = Object.keys(resources.materials).length > 0;
  const hasEquipments = Object.keys(resources.equipments).length > 0;

  return (
    <div className="space-y-4">
      {/* Mano de Obra */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            Total Mano de Obra
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 pt-0 sm:pt-0">
          {!hasLabors ? (
            <p className="text-sm text-muted-foreground text-center py-4 px-4">
              No hay mano de obra cargada en los ítems
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Concepto</th>
                    <th className="text-right p-2 font-medium whitespace-nowrap">
                      Horas
                    </th>
                    <th className="text-right p-2 font-medium whitespace-nowrap">
                      Costo/Hora
                    </th>
                    <th className="text-right p-2 font-medium whitespace-nowrap">
                      Costo Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(resources.labors).map((labor, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2 max-w-[150px] sm:max-w-none">
                        <span
                          className="text-xs sm:text-sm truncate block"
                          title={labor.name}
                        >
                          {labor.name}
                        </span>
                      </td>
                      <td className="p-2 text-right whitespace-nowrap">
                        <span className="text-xs sm:text-sm">
                          {labor.totalHours?.toLocaleString("es-AR", {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="p-2 text-right whitespace-nowrap">
                        <span className="text-xs sm:text-sm">
                          {formatCurrency(
                            labor.hourlyCost ||
                              (labor.totalHours
                                ? labor.totalCost / labor.totalHours
                                : 0),
                          )}
                        </span>
                      </td>
                      <td className="p-2 text-right font-medium whitespace-nowrap">
                        <span className="text-xs sm:text-sm">
                          {formatCurrency(labor.totalCost)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-medium">
                    <td className="p-2 text-xs sm:text-sm" colSpan={3}>
                      Total Mano de Obra:
                    </td>
                    <td className="p-2 text-right text-xs sm:text-sm">
                      {formatCurrency(
                        Object.values(resources.labors).reduce(
                          (sum, l) => sum + l.totalCost,
                          0,
                        ),
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Materiales */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            Total Materiales
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 pt-0 sm:pt-0">
          {!hasMaterials ? (
            <p className="text-sm text-muted-foreground text-center py-4 px-4">
              No hay materiales cargados en los ítems
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[350px]">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Material</th>
                    <th className="text-right p-2 font-medium whitespace-nowrap">
                      Cantidad
                    </th>
                    <th className="text-right p-2 font-medium whitespace-nowrap">
                      Unidad
                    </th>
                    <th className="text-right p-2 font-medium whitespace-nowrap">
                      Costo Unit.
                    </th>
                    <th className="text-right p-2 font-medium whitespace-nowrap">
                      Costo Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(resources.materials).map((mat, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2 max-w-[150px] sm:max-w-none">
                        <span
                          className="text-xs sm:text-sm truncate block"
                          title={mat.name}
                        >
                          {mat.name}
                        </span>
                      </td>
                      <td className="p-2 text-right whitespace-nowrap">
                        <span className="text-xs sm:text-sm">
                          {mat.totalQuantity?.toLocaleString("es-AR", {
                            maximumFractionDigits: 3,
                          })}
                        </span>
                      </td>
                      <td className="p-2 text-right whitespace-nowrap">
                        <span className="text-xs sm:text-sm">{mat.unit}</span>
                      </td>
                      <td className="p-2 text-right whitespace-nowrap">
                        <span className="text-xs sm:text-sm">
                          {formatCurrency(
                            mat.unitPrice ||
                              (mat.totalQuantity
                                ? mat.totalCost / mat.totalQuantity
                                : 0),
                          )}
                        </span>
                      </td>
                      <td className="p-2 text-right font-medium whitespace-nowrap">
                        <span className="text-xs sm:text-sm">
                          {formatCurrency(mat.totalCost)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-medium">
                    <td className="p-2 text-xs sm:text-sm" colSpan={4}>
                      Total Materiales:
                    </td>
                    <td className="p-2 text-right text-xs sm:text-sm">
                      {formatCurrency(
                        Object.values(resources.materials).reduce(
                          (sum, m) => sum + m.totalCost,
                          0,
                        ),
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Equipos */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
            Total Equipos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 pt-0 sm:pt-0">
          {!hasEquipments ? (
            <p className="text-sm text-muted-foreground text-center py-4 px-4">
              No hay equipos cargados en los ítems
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[300px]">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Equipo</th>
                    <th className="text-right p-2 font-medium whitespace-nowrap">
                      Cantidad
                    </th>
                    <th className="text-right p-2 font-medium whitespace-nowrap">
                      Costo Unit.
                    </th>
                    <th className="text-right p-2 font-medium whitespace-nowrap">
                      Costo Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(resources.equipments).map((eq, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2 max-w-[150px] sm:max-w-none">
                        <span
                          className="text-xs sm:text-sm truncate block"
                          title={eq.name}
                        >
                          {eq.name}
                        </span>
                      </td>
                      <td className="p-2 text-right whitespace-nowrap">
                        <span className="text-xs sm:text-sm">
                          {eq.totalQuantity?.toLocaleString("es-AR", {
                            maximumFractionDigits: 2,
                          }) ||
                            eq.totalHours?.toLocaleString("es-AR", {
                              maximumFractionDigits: 2,
                            })}
                        </span>
                      </td>
                      <td className="p-2 text-right whitespace-nowrap">
                        <span className="text-xs sm:text-sm">
                          {formatCurrency(
                            eq.hourlyCost ||
                              (eq.totalQuantity || eq.totalHours
                                ? eq.totalCost /
                                  (eq.totalQuantity || eq.totalHours || 1)
                                : 0),
                          )}
                        </span>
                      </td>
                      <td className="p-2 text-right font-medium whitespace-nowrap">
                        <span className="text-xs sm:text-sm">
                          {formatCurrency(eq.totalCost)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-medium">
                    <td className="p-2 text-xs sm:text-sm" colSpan={3}>
                      Total Equipos:
                    </td>
                    <td className="p-2 text-right text-xs sm:text-sm">
                      {formatCurrency(
                        Object.values(resources.equipments).reduce(
                          (sum, e) => sum + e.totalCost,
                          0,
                        ),
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

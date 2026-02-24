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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" />
            Total Mano de Obra
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasLabors ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay mano de obra cargada en los ítems
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Concepto</th>
                  <th className="text-right p-2 font-medium">Horas</th>
                  <th className="text-right p-2 font-medium">Costo Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(resources.labors).map((labor, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{labor.name}</td>
                    <td className="p-2 text-right">
                      {labor.totalHours?.toLocaleString("es-AR", {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-2 text-right font-medium">
                      {formatCurrency(labor.totalCost)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-medium">
                  <td className="p-2" colSpan={2}>
                    Total Mano de Obra:
                  </td>
                  <td className="p-2 text-right">
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
          )}
        </CardContent>
      </Card>

      {/* Materiales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="w-5 h-5" />
            Total Materiales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasMaterials ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay materiales cargados en los ítems
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Material</th>
                  <th className="text-right p-2 font-medium">Cantidad</th>
                  <th className="text-right p-2 font-medium">Unidad</th>
                  <th className="text-right p-2 font-medium">Costo Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(resources.materials).map((mat, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{mat.name}</td>
                    <td className="p-2 text-right">
                      {mat.totalQuantity?.toLocaleString("es-AR", {
                        maximumFractionDigits: 3,
                      })}
                    </td>
                    <td className="p-2 text-right">{mat.unit}</td>
                    <td className="p-2 text-right font-medium">
                      {formatCurrency(mat.totalCost)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-medium">
                  <td className="p-2" colSpan={3}>
                    Total Materiales:
                  </td>
                  <td className="p-2 text-right">
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
          )}
        </CardContent>
      </Card>

      {/* Equipos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="w-5 h-5" />
            Total Equipos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasEquipments ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay equipos cargados en los ítems
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Equipo</th>
                  <th className="text-right p-2 font-medium">Horas</th>
                  <th className="text-right p-2 font-medium">Costo Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(resources.equipments).map((eq, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{eq.name}</td>
                    <td className="p-2 text-right">
                      {eq.totalHours?.toLocaleString("es-AR", {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-2 text-right font-medium">
                      {formatCurrency(eq.totalCost)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-medium">
                  <td className="p-2" colSpan={2}>
                    Total Equipos:
                  </td>
                  <td className="p-2 text-right">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

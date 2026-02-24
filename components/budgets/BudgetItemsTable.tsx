"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calculator, Edit, Trash2 } from "lucide-react";
import { BudgetItem } from "@/lib/prisma-typed-service";
import { formatCurrency } from "./BudgetTotalsCards";

interface BudgetItemsTableProps {
  items: BudgetItem[];
  isEditable: boolean;
  editingQuantities: Record<string, string>;
  pendingChanges: Set<string>;
  onQuantityChange: (itemId: string, value: string) => void;
  onQuantityBlur: (itemId: string) => void;
  onEditItem: (item: BudgetItem) => void;
  onDeleteItem: (itemId: string) => void;
}

export function BudgetItemsTable({
  items,
  isEditable,
  editingQuantities,
  pendingChanges,
  onQuantityChange,
  onQuantityBlur,
  onEditItem,
  onDeleteItem,
}: BudgetItemsTableProps) {
  // Agrupar items por categoría manteniendo el orden
  const grouped = items?.reduce(
    (acc: Record<string, BudgetItem[]>, item: BudgetItem) => {
      const cat = item.category || "Sin categoría";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {},
  );

  // Obtener categorías en el orden en que aparecen los items
  const categories = items?.reduce((acc: string[], item: BudgetItem) => {
    const cat = item.category || "Sin categoría";
    if (!acc.includes(cat)) acc.push(cat);
    return acc;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Cómputo y Presupuesto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Código</th>
                <th className="text-left p-3 font-medium">Descripción</th>
                <th className="text-center p-3 font-medium">Unidad</th>
                <th className="text-right p-3 font-medium">Cantidad</th>
                <th className="text-right p-3 font-medium">C. Unitario</th>
                <th className="text-right p-3 font-medium">C. Total</th>
                {isEditable && (
                  <th className="p-3 w-10 text-center">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {categories?.map((category: string) => (
                <>
                  {/* Fila de subtítulo del rubro */}
                  <tr key={`cat-${category}`} className="bg-muted/80 border-b">
                    <td colSpan={isEditable ? 7 : 6} className="p-2 px-3">
                      <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        {category}
                      </span>
                    </td>
                  </tr>
                  {/* Items de este rubro */}
                  {grouped[category]?.map((item: BudgetItem) => {
                    const hasChanges = pendingChanges.has(item.id);
                    const quantity = hasChanges
                      ? parseFloat(editingQuantities[item.id]) || 0
                      : item.quantity;
                    const totalCost = quantity * item.unit_cost_total;

                    return (
                      <tr
                        key={item.id}
                        className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => isEditable && onEditItem(item)}
                        title={isEditable ? "Click para editar ítem" : ""}
                      >
                        <td className="p-3 font-mono text-muted-foreground pl-6">
                          <div className="flex items-center gap-2">
                            {hasChanges && (
                              <span
                                className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0"
                                title="Cambio sin guardar"
                              />
                            )}
                            {item.code}
                          </div>
                        </td>
                        <td className="p-3">{item.description}</td>
                        <td className="p-3 text-center">{item.unit}</td>
                        <td
                          className="p-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isEditable ? (
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={editingQuantities[item.id] ?? ""}
                              onChange={(e) => {
                                const value = e.target.value.replace(",", ".");
                                const parts = value.split(".");
                                if (parts.length > 2) return;
                                if (
                                  value === "" ||
                                  value === "." ||
                                  /^\d*\.?\d*$/.test(value)
                                ) {
                                  onQuantityChange(item.id, value);
                                }
                              }}
                              onFocus={(e) => e.target.select()}
                              onBlur={() => onQuantityBlur(item.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.currentTarget.blur();
                                }
                              }}
                              className="w-28 text-right ml-auto"
                              placeholder="0"
                            />
                          ) : (
                            item.quantity.toLocaleString("es-AR")
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {formatCurrency(item.unit_cost_total)}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(totalCost)}
                          {hasChanges && (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              *
                            </span>
                          )}
                        </td>
                        {isEditable && (
                          <td className="p-3">
                            <TooltipProvider>
                              <div className="flex items-center justify-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditItem(item);
                                      }}
                                      className="cursor-pointer h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar ítem</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteItem(item.id);
                                      }}
                                      className="cursor-pointer text-destructive hover:text-destructive h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Eliminar ítem</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
            <tfoot className="font-medium bg-muted/50">
              <tr>
                <td colSpan={5} className="p-3 text-right">
                  Total Costos Directos
                </td>
                <td className="p-3 text-right font-semibold">
                  {formatCurrency(
                    items?.reduce((sum: number, item: BudgetItem) => {
                      const qty = pendingChanges.has(item.id)
                        ? parseFloat(editingQuantities[item.id]) || 0
                        : item.quantity;
                      return sum + qty * item.unit_cost_total;
                    }, 0) || 0,
                  )}
                </td>
                {isEditable && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

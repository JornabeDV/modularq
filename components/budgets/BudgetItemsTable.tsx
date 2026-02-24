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
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
          Cómputo y Presupuesto
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 pt-0 sm:pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[550px]">
            <thead>
              <tr className="border-b">
                <th className="text-left px-2 h-10 font-medium whitespace-nowrap w-[80px] sm:w-auto">Código</th>
                <th className="text-left px-2 h-10 font-medium min-w-[120px] sm:min-w-[200px]">Descripción</th>
                <th className="text-center px-2 h-10 font-medium whitespace-nowrap w-[60px] sm:w-auto">Unidad</th>
                <th className="text-right px-2 h-10 font-medium whitespace-nowrap w-[70px] sm:w-auto">Cantidad</th>
                <th className="text-right px-2 h-10 font-medium whitespace-nowrap w-[100px]">Costo Unitario</th>
                <th className="text-right px-2 h-10 font-medium whitespace-nowrap w-[90px] sm:w-auto">Costo Total</th>
                {isEditable && (
                  <th className="px-2 w-[70px] sm:w-[80px] text-center whitespace-nowrap">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {categories?.map((category: string) => (
                <>
                  {/* Fila de subtítulo del rubro */}
                  <tr key={`cat-${category}`} className="bg-muted/80 border-b">
                    <td colSpan={isEditable ? 7 : 6} className="p-2 px-2 sm:px-3" style={{ minWidth: '550px' }}>
                      <span className="font-semibold text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">
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
                        <td className="px-2 font-mono text-muted-foreground pl-2 sm:pl-6 whitespace-nowrap">
                          <div className="flex items-center gap-1 sm:gap-2">
                            {hasChanges && (
                              <span
                                className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0"
                                title="Cambio sin guardar"
                              />
                            )}
                            <span className="text-xs sm:text-sm">{item.code}</span>
                          </div>
                        </td>
                        <td className="px-2 max-w-[140px] sm:max-w-none">
                          <span className="truncate block text-xs sm:text-sm" title={item.description}>
                            {item.description}
                          </span>
                        </td>
                        <td className="px-2 text-center whitespace-nowrap text-xs sm:text-sm">{item.unit}</td>
                        <td
                          className="px-2 w-16 sm:w-20 text-right whitespace-nowrap"
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
                              className="w-14 sm:w-20 text-right ml-auto text-xs sm:text-sm h-8 sm:h-9 px-1 sm:px-3"
                              placeholder="0"
                            />
                          ) : (
                            <span className="text-xs sm:text-sm">
                              {item.quantity.toLocaleString("es-AR")}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-right whitespace-nowrap text-xs sm:text-sm">
                          {formatCurrency(item.unit_cost_total)}
                        </td>
                        <td className="p-2 text-right font-medium whitespace-nowrap text-xs sm:text-sm">
                          {formatCurrency(totalCost)}
                          {hasChanges && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              *
                            </span>
                          )}
                        </td>
                        {isEditable && (
                          <td className="p-2">
                            <TooltipProvider>
                              <div className="flex items-center justify-center gap-1 sm:gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditItem(item);
                                      }}
                                      className="cursor-pointer h-7 w-7 sm:h-8 sm:w-8 p-0"
                                    >
                                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
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
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteItem(item.id);
                                      }}
                                      className="cursor-pointer h-7 w-7 sm:h-8 sm:w-8 p-0"
                                    >
                                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
                <td colSpan={5} className="p-2 text-right text-xs sm:text-sm">
                  Total Costos Directos
                </td>
                <td className="p-2 text-right font-semibold whitespace-nowrap text-xs sm:text-sm">
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

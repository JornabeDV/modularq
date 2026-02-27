"use client";

import React from "react";
import { ArrowUpDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MaterialFilters } from "@/components/admin/material-filters";
import { MaterialRow } from "@/components/admin/material-row";
import type { Material } from "@/hooks/use-materials-prisma";

type SortField =
  | "code"
  | "name"
  | "category"
  | "stockQuantity"
  | "unitPrice"
  | "supplier";

interface MaterialTableProps {
  materials: Material[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter?: string;
  onCategoryFilterChange?: (value: string) => void;
  lowStockOnly?: boolean;
  onLowStockOnlyChange?: (value: boolean) => void;
  onEditMaterial: (material: Material) => void;
  onDeleteMaterial: (materialId: string) => void;
  isReadOnly?: boolean;
  sortField?: SortField;
  sortOrder?: "asc" | "desc";
  onSort?: (field: SortField) => void;
}

export function MaterialTable({
  materials,
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  lowStockOnly,
  onLowStockOnlyChange,
  onEditMaterial,
  onDeleteMaterial,
  isReadOnly = false,
  sortField,
  sortOrder,
  onSort,
}: MaterialTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Materiales</CardTitle>
        <CardDescription>
          Lista de todos los materiales en inventario
        </CardDescription>
        <div className="mt-4">
          <MaterialFilters
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={onCategoryFilterChange}
            lowStockOnly={lowStockOnly}
            onLowStockOnlyChange={onLowStockOnlyChange}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-background">
                <TableHead
                  className="cursor-pointer min-w-[120px]"
                  onClick={() => onSort?.("code")}
                >
                  <div className="flex items-center gap-1">
                    Código
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer min-w-[200px]"
                  onClick={() => onSort?.("name")}
                >
                  <div className="flex items-center gap-1">
                    Nombre
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer min-w-[120px]"
                  onClick={() => onSort?.("category")}
                >
                  <div className="flex items-center gap-1">
                    Categoría
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer min-w-[100px]"
                  onClick={() => onSort?.("stockQuantity")}
                >
                  <div className="flex items-center gap-1">
                    Stock
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer min-w-[120px]"
                  onClick={() => onSort?.("unitPrice")}
                >
                  <div className="flex items-center gap-1">
                    Precio Unit.
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer min-w-[150px]"
                  onClick={() => onSort?.("supplier")}
                >
                  <div className="flex items-center gap-1">
                    Proveedor
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                {!isReadOnly && (
                  <TableHead className="text-center">Acciones</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.length === 0 ? (
                <TableRow>
                  <td
                    colSpan={isReadOnly ? 6 : 7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchTerm || categoryFilter !== "all" || lowStockOnly
                      ? "No se encontraron materiales con ese criterio de búsqueda"
                      : "No hay materiales registrados"}
                  </td>
                </TableRow>
              ) : (
                materials.map((material) => (
                  <MaterialRow
                    key={material.id}
                    material={material}
                    onEdit={onEditMaterial}
                    onDelete={onDeleteMaterial}
                    isReadOnly={isReadOnly}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

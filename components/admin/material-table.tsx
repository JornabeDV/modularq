"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MaterialFilters } from '@/components/admin/material-filters'
import { MaterialRow } from '@/components/admin/material-row'
import type { Material } from '@/hooks/use-materials-prisma'

interface MaterialTableProps {
  materials: Material[]
  searchTerm: string
  onSearchChange: (value: string) => void
  categoryFilter?: string
  onCategoryFilterChange?: (value: string) => void
  lowStockOnly?: boolean
  onLowStockOnlyChange?: (value: boolean) => void
  onEditMaterial: (material: Material) => void
  onDeleteMaterial: (materialId: string) => void
  isReadOnly?: boolean
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
  isReadOnly = false
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
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Precio Unit.</TableHead>
                <TableHead>Proveedor</TableHead>
                {!isReadOnly && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.length === 0 ? (
                <TableRow>
                  <td colSpan={isReadOnly ? 6 : 7} className="text-center py-8 text-muted-foreground">
                    {searchTerm || categoryFilter !== 'all' || lowStockOnly
                      ? 'No se encontraron materiales con ese criterio de búsqueda'
                      : 'No hay materiales registrados'}
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
  )
}
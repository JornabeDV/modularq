"use client"

import { ArrowUpDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataPagination } from "@/components/ui/data-pagination"
import { SupplierFilters } from "./supplier-filters"
import { SupplierRow } from "./supplier-row"
import type { Supplier } from "@/hooks/use-suppliers"

type SortField = "name" | "contact_name" | "email" | "phone" | "cuit"

interface SupplierTableProps {
  suppliers: Supplier[]
  totalItems: number
  itemsPerPage: number
  currentPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
  searchTerm: string
  onSearchChange: (value: string) => void
  onEditSupplier: (supplier: Supplier) => void
  onViewSupplier: (supplier: Supplier) => void
  onDeleteSupplier: (supplierId: string) => void
  isReadOnly?: boolean
  sortField?: SortField
  sortOrder?: "asc" | "desc"
  onSort?: (field: SortField) => void
}

export function SupplierTable({
  suppliers,
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  searchTerm,
  onSearchChange,
  onEditSupplier,
  onViewSupplier,
  onDeleteSupplier,
  isReadOnly = false,
  sortField,
  sortOrder,
  onSort,
}: SupplierTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Proveedores</CardTitle>
        <CardDescription>Lista de todos los proveedores registrados</CardDescription>
        <SupplierFilters
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
        />
      </CardHeader>
      <CardContent>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-background">
                <TableHead
                  className="cursor-pointer min-w-[180px]"
                  onClick={() => onSort?.("name")}
                >
                  <div className="flex items-center gap-1">
                    Nombre
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer min-w-[150px]"
                  onClick={() => onSort?.("contact_name")}
                >
                  <div className="flex items-center gap-1">
                    Contacto
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer min-w-[200px]"
                  onClick={() => onSort?.("email")}
                >
                  <div className="flex items-center gap-1">
                    Email
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer min-w-[120px]"
                  onClick={() => onSort?.("phone")}
                >
                  <div className="flex items-center gap-1">
                    Teléfono
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer min-w-[120px]"
                  onClick={() => onSort?.("cuit")}
                >
                  <div className="flex items-center gap-1">
                    CUIT
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                {!isReadOnly && (
                  <TableHead className="text-right">Acciones</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <td
                    colSpan={isReadOnly ? 5 : 6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchTerm
                      ? "No se encontraron proveedores con ese criterio de búsqueda"
                      : "No hay proveedores registrados"}
                  </td>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <SupplierRow
                    key={supplier.id}
                    supplier={supplier}
                    onEdit={onEditSupplier}
                    onView={onViewSupplier}
                    onDelete={onDeleteSupplier}
                    isReadOnly={isReadOnly}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalItems > 0 && (
          <div className="pt-4 border-t">
            <DataPagination
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={onPageChange}
              onItemsPerPageChange={onItemsPerPageChange}
              itemsPerPageOptions={[5, 10, 20, 50]}
              itemsText="proveedores"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

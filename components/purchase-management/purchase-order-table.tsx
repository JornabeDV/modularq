"use client"

import { ArrowUpDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataPagination } from "@/components/ui/data-pagination"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PurchaseOrderFilters } from "./purchase-order-filters"
import { PurchaseOrderRow } from "./purchase-order-row"

type SortField = "order_number" | "supplier" | "status" | "total" | "created_at"

interface PurchaseOrderTableProps {
  orders: any[]
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  supplierFilter: string
  onSupplierFilterChange: (value: string) => void
  suppliers: any[]
  onViewOrder: (orderId: string) => void
  onEditOrder: (orderId: string) => void
  onDeleteOrder: (orderId: string) => void
  onCreateOrder?: () => void
  isReadOnly?: boolean
  sortField?: SortField
  sortOrder?: "asc" | "desc"
  onSort?: (field: SortField) => void
  totalItems: number
  itemsPerPage: number
  currentPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (value: number) => void
}

export function PurchaseOrderTable({
  orders,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  supplierFilter,
  onSupplierFilterChange,
  suppliers,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  onCreateOrder,
  isReadOnly = false,
  sortField,
  sortOrder,
  onSort,
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
}: PurchaseOrderTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Órdenes de Compra</CardTitle>
            <CardDescription>
              Órdenes formales a proveedores con recepciones y stock
            </CardDescription>
          </div>
          {!isReadOnly && onCreateOrder && (
            <Button type="button" className="w-full sm:w-auto cursor-pointer" onClick={onCreateOrder}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden
            </Button>
          )}
        </div>
        <div className="mt-4">
          <PurchaseOrderFilters
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            statusFilter={statusFilter}
            onStatusFilterChange={onStatusFilterChange}
            supplierFilter={supplierFilter}
            onSupplierFilterChange={onSupplierFilterChange}
            suppliers={suppliers}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-background">
                <TableHead
                  className="cursor-pointer min-w-[140px]"
                  onClick={() => onSort?.("order_number")}
                >
                  <div className="flex items-center gap-1">
                    Número
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer min-w-[180px]"
                  onClick={() => onSort?.("supplier")}
                >
                  <div className="flex items-center gap-1">
                    Proveedor
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="min-w-[140px]">Pedido origen</TableHead>
                <TableHead
                  className="cursor-pointer min-w-[120px]"
                  onClick={() => onSort?.("status")}
                >
                  <div className="flex items-center gap-1">
                    Estado
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer min-w-[120px] text-right"
                  onClick={() => onSort?.("total")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Total
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer min-w-[120px]"
                  onClick={() => onSort?.("created_at")}
                >
                  <div className="flex items-center gap-1">
                    Fecha
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                {!isReadOnly && (
                  <TableHead className="text-right">Acciones</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <td
                    colSpan={isReadOnly ? 6 : 7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchTerm || statusFilter !== "all" || supplierFilter !== "all"
                      ? "No se encontraron órdenes con ese criterio de búsqueda"
                      : "No hay órdenes de compra registradas"}
                  </td>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <PurchaseOrderRow
                    key={order.id}
                    order={order}
                    onView={onViewOrder}
                    onEdit={onEditOrder}
                    onDelete={onDeleteOrder}
                    isReadOnly={isReadOnly}
                  />
                ))
              )}
            </TableBody>
          </Table>

          {totalItems > 0 && (
            <div className="pt-4 border-t">
              <DataPagination
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={onPageChange}
                onItemsPerPageChange={onItemsPerPageChange}
                itemsPerPageOptions={[5, 10, 20, 50]}
                itemsText="órdenes"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

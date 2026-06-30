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
import { PurchaseRequestFilters } from "./purchase-request-filters"
import { PurchaseRequestRow } from "./purchase-request-row"

type SortField = "request_number" | "status" | "created_at"

interface PurchaseRequestTableProps {
  requests: any[]
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  onViewRequest: (request: any) => void
  onEditRequest: (request: any) => void
  onDeleteRequest: (requestId: string) => void
  onCreateOrder: (request: any) => void
  onCreateRequest?: () => void
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

export function PurchaseRequestTable({
  requests,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onViewRequest,
  onEditRequest,
  onDeleteRequest,
  onCreateOrder,
  onCreateRequest,
  isReadOnly = false,
  sortField,
  sortOrder,
  onSort,
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
}: PurchaseRequestTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Pedidos de materiales</CardTitle>
            <CardDescription>
              Solicitudes internas de materiales con presupuestos y órdenes asociadas
            </CardDescription>
          </div>
          {!isReadOnly && onCreateRequest && (
            <Button type="button" className="w-full sm:w-auto cursor-pointer" onClick={onCreateRequest}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Pedido
            </Button>
          )}
        </div>
        <div className="mt-4">
          <PurchaseRequestFilters
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            statusFilter={statusFilter}
            onStatusFilterChange={onStatusFilterChange}
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
                  onClick={() => onSort?.("request_number")}
                >
                  <div className="flex items-center gap-1">
                    Número
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer min-w-[120px]"
                  onClick={() => onSort?.("status")}
                >
                  <div className="flex items-center gap-1">
                    Estado
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="min-w-[80px]">Ítems</TableHead>
                <TableHead className="min-w-[120px]">Presupuestos</TableHead>
                <TableHead className="min-w-[100px]">Órdenes</TableHead>
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
              {requests.length === 0 ? (
                <TableRow>
                  <td
                    colSpan={isReadOnly ? 6 : 7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchTerm || statusFilter !== "all"
                      ? "No se encontraron pedidos con ese criterio de búsqueda"
                      : "No hay pedidos de materiales registrados"}
                  </td>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <PurchaseRequestRow
                    key={request.id}
                    request={request}
                    onView={onViewRequest}
                    onEdit={onEditRequest}
                    onDelete={onDeleteRequest}
                    onCreateOrder={onCreateOrder}
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
                itemsText="pedidos"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { usePurchaseRequests } from "@/hooks/use-purchase-requests"
import { PurchaseRequestStats } from "./purchase-request-stats"
import { PurchaseRequestTable } from "./purchase-request-table"
import { PurchaseRequestForm } from "./purchase-request-form"
import { SupplierQuotesPanel } from "./SupplierQuotesPanel"
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { X, ShoppingCart } from "lucide-react"
import { PurchaseRequestPDFButton } from "./PurchaseRequestPDFButton"

type SortField = "request_number" | "status" | "created_at"
type SortOrder = "asc" | "desc"

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  pending: "Pendiente",
  quoted: "Cotizado",
  approved: "Aprobado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-50 text-gray-700 border-gray-200",
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  quoted: "bg-purple-50 text-purple-700 border-purple-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  rejected: "bg-orange-50 text-orange-700 border-orange-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
}

export function PurchaseRequestManagement() {
  const router = useRouter()
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const isReadOnly = userProfile?.role === "supervisor"

  const {
    purchaseRequests,
    loading,
    error,
    createPurchaseRequest,
    updatePurchaseRequest,
    deletePurchaseRequest,
  } = usePurchaseRequests()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<any>(null)
  const [viewingRequest, setViewingRequest] = useState<any>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const filteredRequests = (purchaseRequests || []).filter((request) => {
    const matchesSearch =
      searchTerm === "" ||
      request.request_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.notes && request.notes.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || request.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case "request_number":
        comparison = a.request_number.localeCompare(b.request_number)
        break
      case "status":
        comparison = a.status.localeCompare(b.status)
        break
      case "created_at":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
    }
    return sortOrder === "asc" ? comparison : -comparison
  })

  const totalItems = sortedRequests.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedRequests = sortedRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleCreate = async (data: {
    status: string
    notes?: string
    items: any[]
  }) => {
    try {
      await createPurchaseRequest(data)
      setIsCreateDialogOpen(false)
      toast({ title: "Pedido creado", description: "El pedido se creó correctamente" })
    } catch (error) {
      toast({
        title: "Error al crear pedido",
        description: error instanceof Error ? error.message : "No se pudo crear el pedido",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async (data: {
    status: string
    notes?: string
    items: any[]
  }) => {
    if (!editingRequest) return
    try {
      await updatePurchaseRequest(editingRequest.id, data)
      setEditingRequest(null)
      toast({ title: "Pedido actualizado", description: "El pedido se actualizó correctamente" })
    } catch (error) {
      toast({
        title: "Error al actualizar pedido",
        description: error instanceof Error ? error.message : "No se pudo actualizar el pedido",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (requestId: string) => {
    try {
      await deletePurchaseRequest(requestId)
      toast({ title: "Pedido eliminado", description: "El pedido se eliminó correctamente" })
    } catch (error) {
      toast({
        title: "Error al eliminar pedido",
        description: error instanceof Error ? error.message : "No se pudo eliminar el pedido",
        variant: "destructive",
      })
    }
  }

  const handleCreateOrder = (request: any) => {
    const params = new URLSearchParams()
    params.append("purchase_request_id", request.id)
    router.push(`/admin/purchase-orders/new?${params.toString()}`)
  }

  const totalRequests = purchaseRequests?.length || 0
  const pendingRequests = purchaseRequests?.filter((r) => r.status === "pending").length || 0
  const quotedRequests = purchaseRequests?.filter((r) => r.status === "quoted").length || 0
  const approvedRequests = purchaseRequests?.filter((r) => r.status === "approved").length || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando pedidos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Error</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <PurchaseRequestStats
        totalRequests={totalRequests}
        pendingRequests={pendingRequests}
        quotedRequests={quotedRequests}
        approvedRequests={approvedRequests}
      />

      {/* Table */}
      <PurchaseRequestTable
        requests={paginatedRequests}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        onViewRequest={setViewingRequest}
        onEditRequest={setEditingRequest}
        onDeleteRequest={handleDelete}
        onCreateOrder={handleCreateOrder}
        onCreateRequest={() => setIsCreateDialogOpen(true)}
        isReadOnly={isReadOnly}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      {/* Create Form */}
      <PurchaseRequestForm
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreate}
        isEditing={false}
      />

      {/* Edit Form */}
      <PurchaseRequestForm
        isOpen={!!editingRequest}
        onClose={() => setEditingRequest(null)}
        onSubmit={handleUpdate}
        isEditing={true}
        initialData={editingRequest}
      />

      {/* View Dialog */}
      <Dialog open={!!viewingRequest} onOpenChange={() => setViewingRequest(null)}>
        <DialogContent className="sm:max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
          {viewingRequest && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Pedido {viewingRequest.request_number}
                  <Badge variant="outline" className={`text-xs ${STATUS_COLORS[viewingRequest.status]}`}>
                    {STATUS_LABELS[viewingRequest.status] || viewingRequest.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {viewingRequest.notes || "Sin notas"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Ítems solicitados</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead>Unidad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingRequest.items.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-sm text-muted-foreground">
                              {item.material ? `${item.material.code} - ${item.material.name}` : "Manual"}
                            </TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <SupplierQuotesPanel purchaseRequestId={viewingRequest.id} />

                {viewingRequest.purchase_orders && viewingRequest.purchase_orders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Órdenes de compra relacionadas</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Número</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewingRequest.purchase_orders.map((order: any) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                              <TableCell>{order.supplier?.name || "—"}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{order.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                ${order.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setViewingRequest(null)} className="cursor-pointer">
                    <X className="h-4 w-4 mr-2" /> Cerrar
                  </Button>
                  <PurchaseRequestPDFButton
                    purchaseRequest={{
                      request_number: viewingRequest.request_number,
                      status: viewingRequest.status,
                      notes: viewingRequest.notes,
                      created_at: viewingRequest.created_at,
                      items: viewingRequest.items.map((item: any) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unit: item.unit,
                        material: item.material
                          ? {
                              id: item.material.id,
                              code: item.material.code,
                              name: item.material.name,
                              brand: item.material.brand,
                            }
                          : null,
                      })),
                    }}
                    variant="outline"
                    label="Descargar PDF"
                  />
                  <Button onClick={() => handleCreateOrder(viewingRequest)} className="cursor-pointer">
                    <ShoppingCart className="h-4 w-4 mr-2" /> Crear Orden de Compra
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

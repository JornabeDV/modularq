"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { usePurchaseOrders } from "@/hooks/use-purchase-orders"
import { useSuppliers } from "@/hooks/use-suppliers"
import { PurchaseOrderStats } from "./purchase-order-stats"
import { PurchaseOrderTable } from "./purchase-order-table"

type SortField = "order_number" | "supplier" | "status" | "total" | "created_at"
type SortOrder = "asc" | "desc"

export function PurchaseOrderManagement() {
  const router = useRouter()
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const isReadOnly = userProfile?.role === "supervisor"

  const { purchaseOrders, loading, error, deletePurchaseOrder, fetchPurchaseOrders } = usePurchaseOrders()
  const { suppliers } = useSuppliers()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [supplierFilter, setSupplierFilter] = useState("all")

  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Recargar datos cuando la ventana recupera el foco (por si volvió de editar una orden)
  useEffect(() => {
    const handleFocus = () => {
      fetchPurchaseOrders(undefined, true)
    }
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const filteredOrders = (purchaseOrders || []).filter((order) => {
    const matchesSearch =
      searchTerm === "" ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.purchase_request?.request_number?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesSupplier = supplierFilter === "all" || order.supplier_id === supplierFilter

    return matchesSearch && matchesStatus && matchesSupplier
  })

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case "order_number":
        comparison = a.order_number.localeCompare(b.order_number)
        break
      case "supplier":
        comparison = (a.supplier?.name || "").localeCompare(b.supplier?.name || "")
        break
      case "status":
        comparison = a.status.localeCompare(b.status)
        break
      case "total":
        comparison = a.total - b.total
        break
      case "created_at":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
    }
    return sortOrder === "asc" ? comparison : -comparison
  })

  const totalItems = sortedOrders.length
  const paginatedOrders = sortedOrders.slice(
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

  const handleSupplierFilterChange = (value: string) => {
    setSupplierFilter(value)
    setCurrentPage(1)
  }

  const handleDelete = async (orderId: string) => {
    try {
      await deletePurchaseOrder(orderId)
      toast({ title: "Orden eliminada", description: "La orden se eliminó correctamente" })
    } catch (error) {
      toast({
        title: "Error al eliminar orden",
        description: error instanceof Error ? error.message : "No se pudo eliminar la orden",
        variant: "destructive",
      })
    }
  }

  const totalOrders = purchaseOrders?.length || 0
  const pendingOrders = purchaseOrders?.filter((o) => o.status === "pending").length || 0
  const approvedOrders = purchaseOrders?.filter((o) => o.status === "approved").length || 0
  const receivedOrders = purchaseOrders?.filter((o) => o.status === "received").length || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando órdenes...</p>
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
      <PurchaseOrderStats
        totalOrders={totalOrders}
        pendingOrders={pendingOrders}
        approvedOrders={approvedOrders}
        receivedOrders={receivedOrders}
      />

      {/* Table */}
      <PurchaseOrderTable
        orders={paginatedOrders}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        supplierFilter={supplierFilter}
        onSupplierFilterChange={handleSupplierFilterChange}
        suppliers={suppliers}
        onViewOrder={(id) => router.push(`/admin/purchase-orders/${id}`)}
        onEditOrder={(id) => router.push(`/admin/purchase-orders/${id}`)}
        onDeleteOrder={handleDelete}
        onCreateOrder={() => router.push("/admin/purchase-orders/new")}
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
    </div>
  )
}

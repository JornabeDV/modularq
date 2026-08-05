"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { usePurchaseRequests } from "@/hooks/use-purchase-requests"
import { PurchaseRequestStats } from "./purchase-request-stats"
import { PurchaseRequestTable } from "./purchase-request-table"

type SortField = "request_number" | "status" | "created_at"
type SortOrder = "asc" | "desc"

export function PurchaseRequestManagement() {
  const router = useRouter()
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const isReadOnly = userProfile?.role === "supervisor"

  const {
    purchaseRequests,
    loading,
    error,
    deletePurchaseRequest,
  } = usePurchaseRequests()

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

  const handleCreateRequest = () => {
    router.push("/admin/purchase-requests/new")
  }

  const handleEditRequest = (request: any) => {
    router.push(`/admin/purchase-requests/${request.id}/edit`)
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
        onEditRequest={handleEditRequest}
        onDeleteRequest={handleDelete}
        onCreateOrder={handleCreateOrder}
        onCreateRequest={handleCreateRequest}
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

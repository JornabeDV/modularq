"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { SupplierStats } from "./supplier-stats"
import { SupplierTable } from "./supplier-table"
import { SupplierForm } from "./supplier-form"
import { SupplierViewDialog } from "./supplier-view-dialog"
import { useSuppliers, type Supplier } from "@/hooks/use-suppliers"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

type SortField = "name" | "contact_name" | "email" | "phone" | "cuit"
type SortOrder = "asc" | "desc"

export function SupplierManagement() {
  const { userProfile } = useAuth()
  const { toast } = useToast()

  const isReadOnly = userProfile?.role === "supervisor"

  const { suppliers, loading, error, createSupplier, updateSupplier, deleteSupplier } =
    useSuppliers()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null)

  const [isUpdating, setIsUpdating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  const [createError, setCreateError] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const handleCreateSupplier = async (supplierData: {
    name: string
    contact_name: string
    email: string
    phone: string
    address: string
    cuit: string
    notes: string
    is_active: boolean
  }) => {
    setCreateError(null)
    try {
      await createSupplier(supplierData)
      toast({
        title: "Proveedor creado",
        description: `El proveedor ${supplierData.name} se ha creado correctamente`,
      })
      setIsCreateDialogOpen(false)
      setCreateError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo crear el proveedor"
      toast({
        title: "Error al crear proveedor",
        description: message,
        variant: "destructive",
      })
      setCreateError(message)
    }
  }

  const handleUpdateSupplier = async (
    supplierId: string,
    supplierData: {
      name: string
      contact_name: string
      email: string
      phone: string
      address: string
      cuit: string
      notes: string
      is_active: boolean
    }
  ) => {
    if (isUpdating) return

    setIsUpdating(true)
    setUpdateError(null)

    try {
      await updateSupplier(supplierId, supplierData)
      toast({
        title: "Proveedor actualizado",
        description: "El proveedor se ha actualizado correctamente",
      })
      setEditingSupplier(null)
      setUpdateError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar el proveedor"
      toast({
        title: "Error al actualizar proveedor",
        description: message,
        variant: "destructive",
      })
      setUpdateError(message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteSupplier = async (supplierId: string) => {
    try {
      await deleteSupplier(supplierId)
      toast({
        title: "Proveedor eliminado",
        description: "El proveedor se ha eliminado exitosamente",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo eliminar el proveedor"
      toast({
        title: "Error al eliminar proveedor",
        description: message,
        variant: "destructive",
      })
    }
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier)
  }

  const handleViewSupplier = (supplier: Supplier) => {
    setViewingSupplier(supplier)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const filteredSuppliers =
    suppliers?.filter((supplier) => {
      if (searchTerm === "") return true

      const searchLower = searchTerm.toLowerCase()

      if (supplier.name.toLowerCase().includes(searchLower)) return true
      if (supplier.contact_name?.toLowerCase().includes(searchLower)) return true
      if (supplier.email?.toLowerCase().includes(searchLower)) return true
      if (supplier.phone?.includes(searchTerm)) return true
      if (supplier.cuit?.includes(searchTerm)) return true
      if (supplier.address?.toLowerCase().includes(searchLower)) return true

      return false
    }) || []

  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name)
        break
      case "contact_name":
        comparison = (a.contact_name || "").localeCompare(b.contact_name || "")
        break
      case "email":
        comparison = (a.email || "").localeCompare(b.email || "")
        break
      case "phone":
        comparison = (a.phone || "").localeCompare(b.phone || "")
        break
      case "cuit":
        comparison = (a.cuit || "").localeCompare(b.cuit || "")
        break
      default:
        comparison = 0
    }
    return sortOrder === "asc" ? comparison : -comparison
  })

  const totalItems = sortedSuppliers.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSuppliers = sortedSuppliers.slice(startIndex, endIndex)

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage, searchTerm])

  useEffect(() => {
    setCurrentPage(1)
  }, [sortField, sortOrder])

  const totalSuppliers = suppliers?.length || 0
  const activeSuppliers = suppliers?.filter((s) => s.is_active).length || 0

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando proveedores...</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Gestión de Proveedores</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Administra la información de tus proveedores
          </p>
        </div>

        {!isReadOnly && (
          <Button
            type="button"
            className="w-full sm:w-auto cursor-pointer"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Button>
        )}
      </div>

      <SupplierStats
        totalSuppliers={totalSuppliers}
        activeSuppliers={activeSuppliers}
      />

      <SupplierTable
        suppliers={paginatedSuppliers}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onEditSupplier={handleEditSupplier}
        onViewSupplier={handleViewSupplier}
        onDeleteSupplier={handleDeleteSupplier}
        isReadOnly={isReadOnly}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      <SupplierForm
        isOpen={isCreateDialogOpen || !!createError}
        onClose={() => {
          setIsCreateDialogOpen(false)
          setCreateError(null)
        }}
        onSubmit={handleCreateSupplier}
        isEditing={false}
        error={createError}
      />

      <SupplierForm
        isOpen={!!editingSupplier || !!updateError}
        onClose={() => {
          if (!isUpdating) {
            setEditingSupplier(null)
            setUpdateError(null)
          }
        }}
        onSubmit={(data) =>
          editingSupplier && handleUpdateSupplier(editingSupplier.id, data)
        }
        isEditing={true}
        initialData={editingSupplier}
        isLoading={isUpdating}
        error={updateError}
      />

      <SupplierViewDialog
        isOpen={!!viewingSupplier}
        onClose={() => setViewingSupplier(null)}
        supplier={viewingSupplier}
      />
    </div>
  )
}

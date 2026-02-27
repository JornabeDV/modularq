"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { DataPagination } from '@/components/ui/data-pagination'
import { MaterialStats } from './material-stats'
import { MaterialTable } from './material-table'
import { MaterialForm } from './material-form'
import { useMaterialsPrisma, type CreateMaterialData } from '@/hooks/use-materials-prisma'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'

export function StockManagement() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  
  // Los supervisores solo pueden ver, no editar
  const isReadOnly = userProfile?.role === 'supervisor'
  
  const { materials, loading, error, createMaterial, updateMaterial, deleteMaterial } = useMaterialsPrisma()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<any>(null)
  
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)

  const handleCreateMaterial = async (materialData: CreateMaterialData) => {
    const result = await createMaterial(materialData)
    if (result.success) {
      setIsCreateDialogOpen(false)
      toast({
        title: "Material creado",
        description: `El material ${materialData.name} se ha creado correctamente`
      })
    } else {
      toast({
        title: "Error al crear material",
        description: result.error || "No se pudo crear el material",
        variant: "destructive"
      })
    }
  }

  const handleUpdateMaterial = async (materialId: string, materialData: any) => {
    if (isUpdating) return
    
    setIsUpdating(true)
    
    try {
      const updateData: any = {}
      if (materialData.code !== undefined) updateData.code = materialData.code
      if (materialData.name !== undefined) updateData.name = materialData.name
      if (materialData.description !== undefined) updateData.description = materialData.description
      if (materialData.category !== undefined) updateData.category = materialData.category
      if (materialData.unit !== undefined) updateData.unit = materialData.unit
      if (materialData.stock_quantity !== undefined) updateData.stock_quantity = materialData.stock_quantity
      if (materialData.min_stock !== undefined) updateData.min_stock = materialData.min_stock
      if (materialData.unit_price !== undefined) updateData.unit_price = materialData.unit_price
      if (materialData.supplier !== undefined) updateData.supplier = materialData.supplier
      
      const result = await updateMaterial(materialId, updateData)
      if (result.success) {
        setEditingMaterial(null)
        toast({
          title: "Material actualizado",
          description: "El material se ha actualizado correctamente"
        })
      } else {
        toast({
          title: "Error al actualizar material",
          description: result.error || "No se pudo actualizar el material",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating material:', error)
      toast({
        title: "Error al actualizar material",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteMaterial = async (materialId: string) => {
    const result = await deleteMaterial(materialId)
    if (result.success) {
      toast({
        title: "Material eliminado",
        description: "El material se ha eliminado correctamente"
      })
    } else {
      toast({
        title: "Error al eliminar material",
        description: result.error || "No se pudo eliminar el material",
        variant: "destructive"
      })
    }
  }

  const handleEditMaterial = (material: any) => {
    setEditingMaterial(material)
  }

  // Filtrar materiales
  const filteredMaterials = materials?.filter(material => {
    const matchesSearch = searchTerm === '' || 
      material.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.supplier && material.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter
    
    const matchesLowStock = !lowStockOnly || material.stockQuantity <= material.minStock
    
    return matchesSearch && matchesCategory && matchesLowStock
  }) || []

  // Paginación
  const totalItems = filteredMaterials.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Resetear página cuando cambian filtros
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value)
    setCurrentPage(1)
  }

  const handleLowStockOnlyChange = (value: boolean) => {
    setLowStockOnly(value)
    setCurrentPage(1)
  }

  // Calcular estadísticas
  const totalMaterials = materials?.length || 0
  const lowStockMaterials = materials?.filter(m => m.stockQuantity <= m.minStock) || []
  const lowStockCount = lowStockMaterials.length
  
  const totalInventoryValue = materials?.reduce((sum, m) => {
    return sum + (m.stockQuantity * (m.unitPrice || 0))
  }, 0) || 0
  
  const categories = new Set(materials?.map(m => m.category) || [])
  const totalCategories = categories.size

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando materiales...</p>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Gestión de Stock</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Administra los insumos industriales y su inventario
          </p>
        </div>
        
        {!isReadOnly && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" className="w-full sm:w-auto cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Material
              </Button>
            </DialogTrigger>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <MaterialStats 
        totalMaterials={totalMaterials}
        lowStockCount={lowStockCount}
        totalInventoryValue={totalInventoryValue}
        totalCategories={totalCategories}
      />

      {/* Materials Table */}
      <MaterialTable
        materials={paginatedMaterials}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={handleCategoryFilterChange}
        lowStockOnly={lowStockOnly}
        onLowStockOnlyChange={handleLowStockOnlyChange}
        onEditMaterial={handleEditMaterial}
        onDeleteMaterial={handleDeleteMaterial}
        isReadOnly={isReadOnly}
      />

      {/* Paginación */}
      {totalItems > 0 && (
        <div className="pt-4 border-t">
          <DataPagination
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPageOptions={[5, 10, 20, 50]}
            itemsText="materiales"
          />
        </div>
      )}

      {/* Create Material Dialog */}
      <MaterialForm
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateMaterial}
        isEditing={false}
        existingMaterials={materials || []}
      />

      {/* Edit Material Dialog */}
      <MaterialForm
        isOpen={!!editingMaterial}
        onClose={() => {
          if (!isUpdating) {
            setEditingMaterial(null)
          }
        }}
        onSubmit={(data) => editingMaterial && handleUpdateMaterial(editingMaterial.id, data)}
        isEditing={true}
        initialData={editingMaterial}
        isLoading={isUpdating}
        existingMaterials={materials || []}
      />
    </div>
  )
}
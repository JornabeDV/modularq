"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Package, DollarSign, AlertTriangle } from 'lucide-react'
import { ProjectMaterialRow } from './project-material-row'
import { ProjectMaterialForm } from './project-material-form'
import { useProjectMaterialsPrisma } from '@/hooks/use-project-materials-prisma'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import type { ProjectMaterial, CreateProjectMaterialData, UpdateProjectMaterialData } from '@/hooks/use-project-materials-prisma'

interface ProjectMaterialsManagerProps {
  projectId: string
  isReadOnly?: boolean
}

export function ProjectMaterialsManager({ projectId, isReadOnly = false }: ProjectMaterialsManagerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { projectMaterials, loading, addMaterialToProject, updateProjectMaterial, removeMaterialFromProject, getTotalValue } = useProjectMaterialsPrisma(projectId)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<ProjectMaterial | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleAddMaterial = async (materialData: CreateProjectMaterialData | UpdateProjectMaterialData) => {
    // Solo procesar si tiene material_id (es CreateProjectMaterialData)
    if ('material_id' in materialData) {
      const result = await addMaterialToProject({
        ...materialData,
        assigned_by: user?.id
      })
      
      if (result.success) {
        setIsCreateDialogOpen(false)
        toast({
          title: "Material agregado",
          description: `El material se ha agregado al proyecto y el stock se ha descontado automáticamente`
        })
      } else {
        toast({
          title: "Error al agregar material",
          description: result.error || "No se pudo agregar el material al proyecto",
          variant: "destructive"
        })
      }
    }
  }

  const handleUpdateMaterial = async (materialData: UpdateProjectMaterialData) => {
    if (!editingMaterial || isUpdating) return
    
    setIsUpdating(true)
    
    try {
      const result = await updateProjectMaterial(editingMaterial.id, materialData)
      if (result.success) {
        setEditingMaterial(null)
        toast({
          title: "Material actualizado",
          description: "El material se ha actualizado correctamente. El stock se ha ajustado automáticamente."
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

  const handleDeleteMaterial = async (projectMaterialId: string) => {
    const result = await removeMaterialFromProject(projectMaterialId)
    if (result.success) {
      toast({
        title: "Material eliminado",
        description: "El material se ha eliminado del proyecto y el stock se ha devuelto automáticamente"
      })
    } else {
      toast({
        title: "Error al eliminar material",
        description: result.error || "No se pudo eliminar el material",
        variant: "destructive"
      })
    }
  }

  const handleEditMaterial = (projectMaterial: ProjectMaterial) => {
    setEditingMaterial(projectMaterial)
  }

  const totalValue = getTotalValue()
  const totalMaterials = projectMaterials.length
  const lowStockMaterials = projectMaterials.filter(pm => {
    const stock = pm.material?.stock_quantity || 0
    return stock <= (pm.material?.min_stock || 0)
  }).length

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              Materiales del Proyecto
            </CardTitle>
            <CardDescription className="text-sm">
              Gestiona los materiales asignados a este proyecto. El stock se descuenta automáticamente.
            </CardDescription>
          </div>
          {!isReadOnly && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="cursor-pointer self-start sm:self-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Agregar Material</span>
                  <span className="sm:hidden">Agregar</span>
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Materiales</p>
                <p className="text-lg font-bold">{totalMaterials}</p>
              </div>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-lg font-bold">
                  ${totalValue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          {lowStockMaterials > 0 && (
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-destructive">Materiales con Stock Bajo</p>
                  <p className="text-lg font-bold text-destructive">{lowStockMaterials}</p>
                </div>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
            </div>
          )}
        </div>

        {/* Tabla de Materiales */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Cargando materiales...</p>
          </div>
        ) : !projectMaterials || projectMaterials.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay materiales asignados</h3>
            <p className="text-muted-foreground mb-4">
              Agrega materiales para gestionar el inventario del proyecto
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-background">
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Notas</TableHead>
                  {!isReadOnly && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectMaterials.map((projectMaterial) => (
                  <ProjectMaterialRow
                    key={projectMaterial.id}
                    projectMaterial={projectMaterial}
                    onEdit={handleEditMaterial}
                    onDelete={handleDeleteMaterial}
                    isReadOnly={isReadOnly}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Create Material Dialog */}
      <ProjectMaterialForm
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleAddMaterial}
        isEditing={false}
      />

      {/* Edit Material Dialog */}
      <ProjectMaterialForm
        isOpen={!!editingMaterial}
        onClose={() => {
          if (!isUpdating) {
            setEditingMaterial(null)
          }
        }}
        onSubmit={handleUpdateMaterial}
        isEditing={true}
        initialData={editingMaterial}
        isLoading={isUpdating}
      />
    </Card>
  )
}
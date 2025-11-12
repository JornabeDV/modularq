"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMaterialsPrisma } from '@/hooks/use-materials-prisma'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import type { ProjectMaterial, CreateProjectMaterialData, UpdateProjectMaterialData } from '@/hooks/use-project-materials-prisma'

const CATEGORIES = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'estructura', label: 'Estructura' },
  { value: 'paneles', label: 'Paneles' },
  { value: 'herrajes', label: 'Herrajes' },
  { value: 'aislacion', label: 'Aislación' },
  { value: 'electricidad', label: 'Electricidad' },
  { value: 'sanitarios', label: 'Sanitarios' },
  { value: 'otros', label: 'Otros' }
]

interface ProjectMaterialFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateProjectMaterialData | UpdateProjectMaterialData) => void
  isEditing: boolean
  initialData?: ProjectMaterial | null
  isLoading?: boolean
}

const UNIT_LABELS: Record<string, string> = {
  unidad: 'Unidad',
  metro: 'm',
  metro_cuadrado: 'm²',
  metro_cubico: 'm³',
  kilogramo: 'kg',
  litro: 'L'
}

export function ProjectMaterialForm({ isOpen, onClose, onSubmit, isEditing, initialData, isLoading = false }: ProjectMaterialFormProps) {
  const { materials, loading: materialsLoading } = useMaterialsPrisma()
  const [formData, setFormData] = useState({
    material_id: '',
    quantity: 0,
    unit_price: 0,
    notes: ''
  })
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        material_id: initialData.materialId,
        quantity: initialData.quantity,
        unit_price: initialData.unitPrice || 0,
        notes: initialData.notes || ''
      })
      setSelectedMaterial(initialData.material)
    } else {
      setFormData({
        material_id: '',
        quantity: 0,
        unit_price: 0,
        notes: ''
      })
      setSelectedMaterial(null)
      setCategoryFilter('all')
    }
  }, [isEditing, initialData?.id, isOpen])

  // Actualizar material seleccionado cuando cambia el select
  useEffect(() => {
    if (formData.material_id && !isEditing) {
      const material = materials?.find(m => m.id === formData.material_id)
      setSelectedMaterial(material)
      // Si hay precio en el material, usarlo como default
      if (material?.unitPrice) {
        setFormData(prev => ({ ...prev, unit_price: material.unitPrice || 0 }))
      }
    }
  }, [formData.material_id, materials, isEditing])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isEditing) {
      const updateData: UpdateProjectMaterialData = {
        quantity: formData.quantity,
        unit_price: formData.unit_price > 0 ? formData.unit_price : undefined,
        notes: formData.notes || undefined
      }
      onSubmit(updateData)
    } else {
      const createData: CreateProjectMaterialData = {
        material_id: formData.material_id,
        quantity: formData.quantity,
        unit_price: formData.unit_price > 0 ? formData.unit_price : undefined,
        notes: formData.notes || undefined
      }
      onSubmit(createData)
    }
  }

  // Filtrar materiales disponibles (con stock > 0 o los ya asignados en edición)
  const availableMaterials = materials?.filter(m => {
    if (isEditing && m.id === initialData?.materialId) {
      return true // Incluir el material actual en edición
    }
    return m.stockQuantity > 0
  }) || []

  // Filtrar materiales por categoría
  const filteredMaterials = availableMaterials.filter(material => {
    // Filtro por categoría
    if (categoryFilter !== 'all' && material.category !== categoryFilter) {
      return false
    }
    
    return true
  })

  const stockAvailable = selectedMaterial ? (selectedMaterial.stock_quantity ?? selectedMaterial.stockQuantity ?? 0) : 0
  const quantityRequested = formData.quantity
  const hasInsufficientStock = !isEditing && quantityRequested > stockAvailable

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isLoading) {
        onClose()
      }
    }}>
      <DialogContent className="w-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Material del Proyecto' : 'Agregar Material al Proyecto'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="category_filter" className="mb-2">Filtrar por Categoría</Label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="material_id" className="mb-2">Material *</Label>
                <Select
                  value={formData.material_id}
                  onValueChange={(value) => {
                    handleInputChange('material_id', value)
                    const material = filteredMaterials.find(m => m.id === value)
                    if (material) {
                      setSelectedMaterial(material)
                      if (material.unitPrice) {
                        handleInputChange('unit_price', material.unitPrice)
                      }
                    }
                  }}
                  disabled={materialsLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialsLoading ? (
                      <SelectItem value="loading" disabled>Cargando materiales...</SelectItem>
                    ) : filteredMaterials.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {categoryFilter !== 'all' 
                          ? 'No hay materiales disponibles en esta categoría' 
                          : 'No hay materiales disponibles con stock'}
                      </SelectItem>
                    ) : (
                      filteredMaterials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{material.code} - {material.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              Stock: {material.stockQuantity}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedMaterial && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p><strong>Categoría:</strong> {selectedMaterial.category}</p>
                    <p><strong>Stock disponible:</strong> {selectedMaterial.stockQuantity} {UNIT_LABELS[selectedMaterial.unit] || selectedMaterial.unit}</p>
                    {selectedMaterial.unitPrice && (
                      <p><strong>Precio unitario:</strong> ${selectedMaterial.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {isEditing && selectedMaterial && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{selectedMaterial.code} - {selectedMaterial.name}</p>
              <p className="text-sm text-muted-foreground">
                Stock disponible: {selectedMaterial.stock_quantity ?? selectedMaterial.stockQuantity ?? 0} {UNIT_LABELS[selectedMaterial.unit] || selectedMaterial.unit}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity" className="mb-2">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                value={formData.quantity === 0 ? '' : formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                onFocus={(e) => {
                  if (e.target.value === '0') {
                    e.target.select()
                  }
                }}
                required
                placeholder="0"
              />
              {selectedMaterial && !isEditing && (
                <p className="text-xs text-muted-foreground mt-1">
                  Disponible: {stockAvailable} {UNIT_LABELS[selectedMaterial.unit] || selectedMaterial.unit}
                </p>
              )}
              {hasInsufficientStock && (
                <Alert className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Stock insuficiente. Disponible: {stockAvailable} {UNIT_LABELS[selectedMaterial.unit] || selectedMaterial.unit}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <div>
              <Label htmlFor="unit_price" className="mb-2">Precio Unitario (opcional)</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price === 0 ? '' : formData.unit_price}
                onChange={(e) => handleInputChange('unit_price', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                onFocus={(e) => {
                  if (e.target.value === '0') {
                    e.target.select()
                  }
                }}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Si no se especifica, se usará el precio actual del material
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="mb-2">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Notas adicionales sobre este material en el proyecto..."
              rows={3}
            />
          </div>

          {selectedMaterial && formData.quantity > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Total estimado:</p>
              <p className="text-lg font-bold">
                ${((formData.quantity * (formData.unit_price || selectedMaterial.unitPrice || 0))).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="cursor-pointer">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || hasInsufficientStock || !formData.material_id && !isEditing || formData.quantity <= 0} 
              className="cursor-pointer"
            >
              {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Material' : 'Agregar Material')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
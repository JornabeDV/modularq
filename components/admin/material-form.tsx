"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw } from 'lucide-react'
import { useMaterialsPrisma, type CreateMaterialData } from '@/hooks/use-materials-prisma'

interface MaterialFormData {
  code: string
  name: string
  description: string
  category: 'estructura' | 'paneles' | 'herrajes' | 'aislacion' | 'electricidad' | 'sanitarios' | 'otros'
  unit: 'unidad' | 'metro' | 'metro_cuadrado' | 'metro_cubico' | 'kilogramo' | 'litro'
  stock_quantity: number
  min_stock: number
  unit_price: number
  supplier: string
}

interface MaterialFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateMaterialData) => void
  isEditing: boolean
  initialData?: any | null
  isLoading?: boolean
}

const CATEGORIES = [
  { value: 'estructura', label: 'Estructura' },
  { value: 'paneles', label: 'Paneles' },
  { value: 'herrajes', label: 'Herrajes' },
  { value: 'aislacion', label: 'Aislación' },
  { value: 'electricidad', label: 'Electricidad' },
  { value: 'sanitarios', label: 'Sanitarios' },
  { value: 'otros', label: 'Otros' }
]

const UNITS = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'metro', label: 'Metro' },
  { value: 'metro_cuadrado', label: 'Metro Cuadrado' },
  { value: 'metro_cubico', label: 'Metro Cúbico' },
  { value: 'kilogramo', label: 'Kilogramo' },
  { value: 'litro', label: 'Litro' }
]

export function MaterialForm({ isOpen, onClose, onSubmit, isEditing, initialData, isLoading = false }: MaterialFormProps) {
  const { getNextCode } = useMaterialsPrisma()
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [formData, setFormData] = useState<MaterialFormData>({
    code: '',
    name: '',
    description: '',
    category: 'otros',
    unit: 'unidad',
    stock_quantity: 0,
    min_stock: 0,
    unit_price: 0,
    supplier: ''
  })

  const generateCodeForCategory = async (category: string) => {
    if (!category || isEditing) return
    
    setIsGeneratingCode(true)
    try {
      const nextCode = await getNextCode(category)
      setFormData(prev => ({ ...prev, code: nextCode }))
    } catch (error) {
      console.error('Error generating code:', error)
    } finally {
      setIsGeneratingCode(false)
    }
  }

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        code: initialData.code || '',
        name: initialData.name || '',
        description: initialData.description || '',
        category: initialData.category || 'otros',
        unit: initialData.unit || 'unidad',
        stock_quantity: initialData.stockQuantity || 0,
        min_stock: initialData.minStock || 0,
        unit_price: initialData.unitPrice || 0,
        supplier: initialData.supplier || ''
      })
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        category: 'otros',
        unit: 'unidad',
        stock_quantity: 0,
        min_stock: 0,
        unit_price: 0,
        supplier: ''
      })
    }
  }, [isEditing, initialData?.id])

  // Generar código automáticamente al abrir el formulario (solo creación)
  useEffect(() => {
    if (isOpen && !isEditing && !formData.code) {
      generateCodeForCategory(formData.category || 'otros')
    }
  }, [isOpen, isEditing])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Si cambió la categoría y no estamos editando, generar código automáticamente
      if (field === 'category' && !isEditing && value) {
        generateCodeForCategory(value)
      }
      
      return newData
    })
  }

  const handleRegenerateCode = () => {
    if (formData.category && !isEditing) {
      generateCodeForCategory(formData.category)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData: CreateMaterialData = {
      code: formData.code,
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category,
      unit: formData.unit,
      stock_quantity: formData.stock_quantity,
      min_stock: formData.min_stock,
      unit_price: formData.unit_price > 0 ? formData.unit_price : undefined,
      supplier: formData.supplier || undefined
    }
    onSubmit(submitData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isLoading) {
        onClose()
      }
    }}>
      <DialogContent className="max-sm:w-[100dvw] rounded-none max-w-3xl max-sm:h-[100dvh] overflow-y-auto md:max-w-2xl md:rounded-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Material' : 'Crear Nuevo Material'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Categoría */}
          <div>
            <Label htmlFor="category" className="mb-2">Categoría *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
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

          {/* 2. Código */}
          <div>
            <Label htmlFor="code" className="mb-2">Código *</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                required
                placeholder="Ej: EST-001"
                disabled={isEditing || isGeneratingCode}
                className="flex-1"
              />
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRegenerateCode}
                  disabled={isGeneratingCode || !formData.category}
                  className="cursor-pointer"
                  title="Regenerar código"
                >
                  <RefreshCw className={`h-4 w-4 ${isGeneratingCode ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isEditing 
                ? 'Código único del material (no editable)' 
                : 'Código generado automáticamente según categoría'}
            </p>
          </div>

          {/* 3. Nombre */}
          <div>
            <Label htmlFor="name" className="mb-2">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              placeholder="Ej: Perfil de acero 50x50"
            />
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="description" className="mb-2">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descripción detallada del material..."
              rows={3}
            />
          </div>

          {/* Unidad de Medida */}
          <div>
            <Label htmlFor="unit" className="mb-2">Unidad de Medida *</Label>
            <Select
              value={formData.unit}
              onValueChange={(value) => handleInputChange('unit', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="stock_quantity" className="mb-2">Stock Actual</Label>
              <Input
                id="stock_quantity"
                type="number"
                step="0.01"
                min="0"
                value={formData.stock_quantity === 0 ? '' : formData.stock_quantity}
                onChange={(e) => handleInputChange('stock_quantity', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                onFocus={(e) => {
                  if (e.target.value === '0') {
                    e.target.select()
                  }
                }}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="min_stock" className="mb-2">Stock Mínimo</Label>
              <Input
                id="min_stock"
                type="number"
                step="0.01"
                min="0"
                value={formData.min_stock === 0 ? '' : formData.min_stock}
                onChange={(e) => handleInputChange('min_stock', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                onFocus={(e) => {
                  if (e.target.value === '0') {
                    e.target.select()
                  }
                }}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">Alerta cuando el stock esté por debajo</p>
            </div>
            <div>
              <Label htmlFor="unit_price" className="mb-2">Precio Unitario</Label>
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
            </div>
          </div>

          <div>
            <Label htmlFor="supplier" className="mb-2">Proveedor</Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) => handleInputChange('supplier', e.target.value)}
              placeholder="Ej: Proveedor ABC S.A."
            />
          </div>

          <div className="flex max-sm:flex-col max-sm:gap-2 justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="cursor-pointer max-sm:w-full">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="cursor-pointer">
              {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Material' : 'Crear Material')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
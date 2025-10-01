"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Task } from '@/lib/types'
import { TASK_CATEGORIES } from '@/lib/constants'
import { useAuth } from '@/lib/auth-context'

interface TaskFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  isEditing: boolean
  initialData?: Task | null
  projectId?: string
  isLoading?: boolean
}

export function TaskForm({ isOpen, onClose, onSubmit, isEditing, initialData, projectId, isLoading = false }: TaskFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    estimatedHours: 0 as number,
    category: '',
    type: 'custom' as 'standard' | 'custom'
  })
  
  // Si es para un proyecto, siempre es personalizada
  const isProjectTask = !!projectId

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        estimatedHours: initialData.estimatedHours,
        category: initialData.category,
        type: initialData.type
      })
    } else {
      setFormData({
        title: '',
        description: '',
        estimatedHours: 0,
        category: '',
        type: isProjectTask ? 'custom' : 'standard'
      })
    }
  }, [isEditing, initialData?.id, isProjectTask])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    onSubmit({
      title: formData.title,
      description: formData.description,
      estimatedHours: formData.estimatedHours,
      category: formData.category,
      type: formData.type,
      createdBy: user?.id || '00000000-0000-0000-0000-000000000000'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isLoading) {
        onClose()
      }
    }}>
      <DialogContent className="w-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Tarea' : (isProjectTask ? 'Crear Tarea Personalizada' : 'Crear Nueva Tarea Estándar')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title" className="mb-2">Título de la Tarea</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                placeholder="Ej: Instalación Sistema Eléctrico"
              />
            </div>
            <div>
              <Label htmlFor="category" className="mb-2">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isProjectTask && (
              <div>
                <Label htmlFor="type" className="mb-2">Tipo de Tarea</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">
                      Estándar (aparece en todos los proyectos)
                    </SelectItem>
                    <SelectItem value="custom">
                      Personalizada (asignada manualmente)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="estimatedHours" className="mb-2">Horas Estimadas</Label>
              <Input
                id="estimatedHours"
                type="number"
                value={formData.estimatedHours === 0 ? '' : formData.estimatedHours}
                onChange={(e) => {
                  const value = e.target.value
                  const numValue = value === '' ? 0 : parseFloat(value)
                  handleInputChange('estimatedHours', isNaN(numValue) ? 0 : numValue)
                }}
                required
                min="0"
                step="0.1"
                placeholder="Ej: 8.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="mb-2">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
              placeholder="Describe detalladamente la tarea..."
              rows={3}
            />
          </div>


          {formData.type === 'standard' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Tarea Estándar:</strong> Esta tarea aparecerá automáticamente en todos los proyectos nuevos que se creen.
              </p>
            </div>
          )}

          {formData.type === 'custom' && projectId && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-800">
                <strong>Tarea Personalizada:</strong> Esta tarea será asignada únicamente al proyecto actual.
              </p>
            </div>
          )}



          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Tarea' : 'Crear Tarea')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
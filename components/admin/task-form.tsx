"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import type { Task } from '@/lib/types'
import { TASK_CATEGORIES } from '@/lib/constants'
import { useUsers } from '@/hooks/use-users'
import { useAuth } from '@/lib/auth-context'

interface TaskFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  isEditing: boolean
  initialData?: Task | null
}

export function TaskForm({ isOpen, onClose, onSubmit, isEditing, initialData }: TaskFormProps) {
  const { users } = useUsers()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    estimatedHours: 0 as number,
    category: '',
    assignedUsers: [] as string[],
    isTemplate: true
  })

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        estimatedHours: initialData.estimatedHours,
        category: initialData.category,
        assignedUsers: initialData.assignedUsers?.map(u => u.id) || [],
        isTemplate: initialData.isTemplate
      })
    } else {
      setFormData({
        title: '',
        description: '',
        estimatedHours: 0,
        category: '',
        assignedUsers: [],
        isTemplate: true
      })
    }
  }, [isEditing, initialData])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleUserToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedUsers: prev.assignedUsers.includes(userId)
        ? prev.assignedUsers.filter(id => id !== userId)
        : [...prev.assignedUsers, userId]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Convertir IDs de usuarios a objetos con información completa
    const assignedUsersWithDetails = formData.assignedUsers.map(userId => {
      const user = users.find(u => u.id === userId)
      return {
        id: userId,
        name: user?.name || 'Usuario desconocido',
        role: user?.role || 'operario'
      }
    })
    
    onSubmit({
      ...formData,
      assignedUsers: assignedUsersWithDetails,
      actualHours: 0,
      createdBy: user?.id || '00000000-0000-0000-0000-000000000000', // UUID por defecto si no hay usuario
      skills: [] // Array vacío por defecto
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Tarea' : 'Crear Nueva Tarea'}
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

          <div>
            <Label className="mb-2">Asignar a Usuarios</Label>
            <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
              {users.filter(user => user.role === 'operario').length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay operarios disponibles</p>
              ) : (
                <div className="space-y-2">
                  {users
                    .filter(user => user.role === 'operario')
                    .map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={formData.assignedUsers.includes(user.id || '')}
                          onCheckedChange={() => handleUserToggle(user.id || '')}
                        />
                        <Label
                          htmlFor={`user-${user.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {user.name} ({user.role})
                        </Label>
                      </div>
                    ))}
                </div>
              )}
            </div>
            {formData.assignedUsers.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {formData.assignedUsers.length} usuario(s) seleccionado(s)
              </p>
            )}
          </div>


          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? 'Actualizar Tarea' : 'Crear Tarea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
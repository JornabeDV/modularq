"use client"

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import type { CreateUserData } from '@/hooks/use-users-prisma'

interface EditUserDialogProps {
  isOpen: boolean
  onClose: () => void
  formData: CreateUserData
  onFormDataChange: (data: CreateUserData) => void
  onSubmit: (e: React.FormEvent) => void
  isEditing: boolean
}

export function EditUserDialog({
  isOpen,
  onClose,
  formData,
  onFormDataChange,
  onSubmit,
  isEditing
}: EditUserDialogProps) {
  const handleInputChange = (field: keyof CreateUserData, value: string | string[]) => {
    onFormDataChange({ ...formData, [field]: value })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="max-w-sm">
            <Label htmlFor="name" className="mb-2">Nombre Completo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              placeholder="Ej: Juan Pérez"
            />
          </div>
          
          <div className="max-w-sm">
            <Label htmlFor="password" className="mb-2">
              {isEditing ? 'Nueva Contraseña' : 'Contraseña'}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required={!isEditing}
              minLength={6}
              placeholder={isEditing ? 'Dejar vacío para mantener la actual' : ''}
            />
          </div>
          
          <div className="max-w-sm">
            <Label htmlFor="role" className="mb-2">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange('role', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="operario">Operario</SelectItem>
                <SelectItem value="subcontratista">Subcontratista</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
              Cancelar
            </Button>
            <Button type="submit" className="cursor-pointer">
              {isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
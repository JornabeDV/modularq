"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ClientFormData {
  cuit: string
  company_name: string
  representative: string
  email: string
  phone: string
}

interface ClientFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ClientFormData) => void
  isEditing: boolean
  initialData?: any | null
  isLoading?: boolean
}

export function ClientForm({ isOpen, onClose, onSubmit, isEditing, initialData, isLoading = false }: ClientFormProps) {
  const [formData, setFormData] = useState({
    cuit: '',
    company_name: '',
    representative: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        cuit: initialData.cuit || '',
        company_name: initialData.companyName || '',
        representative: initialData.representative || '',
        email: initialData.email || '',
        phone: initialData.phone || ''
      })
    } else {
      setFormData({
        cuit: '',
        company_name: '',
        representative: '',
        email: '',
        phone: ''
      })
    }
  }, [isEditing, initialData?.id])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
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
            {isEditing ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cuit" className="mb-2">CUIT</Label>
              <Input
                id="cuit"
                value={formData.cuit}
                onChange={(e) => handleInputChange('cuit', e.target.value)}
                required
                placeholder="Ej: 20-12345678-9"
                pattern="[0-9]{2}-[0-9]{8}-[0-9]{1}"
                title="Formato: XX-XXXXXXXX-X"
              />
            </div>
            <div>
              <Label htmlFor="company_name" className="mb-2">Nombre de la Empresa</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                required
                placeholder="Ej: Constructora ABC S.A."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="representative" className="mb-2">Representante</Label>
            <Input
              id="representative"
              value={formData.representative}
              onChange={(e) => handleInputChange('representative', e.target.value)}
              required
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email" className="mb-2">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                placeholder="Ej: contacto@empresa.com"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="mb-2">Celular</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
                placeholder="Ej: +54 9 11 1234-5678"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="cursor-pointer">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="cursor-pointer">
              {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Cliente' : 'Crear Cliente')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
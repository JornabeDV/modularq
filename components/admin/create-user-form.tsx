"use client"

import { useState } from 'react'
import { useUsers, type CreateUserData } from '@/hooks/use-users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, UserPlus, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export function CreateUserForm() {
  const { createUser } = useUsers()
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [formData, setFormData] = useState<CreateUserData>({
    password: '',
    name: '',
    role: 'operario'
  })

  // Generar contraseña segura
  const generatePassword = () => {
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    
    // Asegurar al menos un carácter de cada tipo
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)] // Mayúscula
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)] // Minúscula
    password += '0123456789'[Math.floor(Math.random() * 10)] // Número
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)] // Símbolo
    
    // Completar con caracteres aleatorios
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }
    
    // Mezclar la contraseña
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  const handleGeneratePassword = () => {
    const password = generatePassword()
    setGeneratedPassword(password)
    setFormData({ ...formData, password })
    toast.success('Contraseña segura generada')
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido')
      return false
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return false
    }
    return true
  }

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword)
      toast.success('Contraseña copiada al portapapeles')
    } catch (error) {
      toast.error('Error al copiar la contraseña')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsGenerating(true)
    
    const result = await createUser(formData)
    
    if (result.success) {
      toast.success('Usuario creado exitosamente')
      setIsOpen(false)
      setFormData({
        password: '',
        name: '',
        role: 'operario'
      })
      setGeneratedPassword('')
    } else {
      toast.error(result.error || 'Error al crear usuario')
    }
    
    setIsGenerating(false)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'supervisor':
        return 'default'
      case 'operario':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Crear Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Agrega un nuevo usuario al sistema con su rol y contraseña correspondiente
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="role">Rol *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">Admin</Badge>
                        <span>Administrador</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="supervisor">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Supervisor</Badge>
                        <span>Supervisor</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="operario">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Operario</Badge>
                        <span>Operario</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contraseña */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contraseña de Acceso</CardTitle>
              <CardDescription>
                Asigna una contraseña segura para el usuario. Puedes generar una automáticamente o crear una personalizada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeneratePassword}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Generar Contraseña Segura
                </Button>
                {generatedPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyPassword}
                    title="Copiar contraseña"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {generatedPassword && (
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-medium">{generatedPassword}</span>
                    <Badge variant="outline" className="text-green-600">Generada</Badge>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Contraseña segura generada. Cópiala para entregársela al usuario.
                  </p>
                </div>
              )}
              
              <div>
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  La contraseña debe tener al menos 6 caracteres. Recomendamos usar una combinación de letras, números y símbolos.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
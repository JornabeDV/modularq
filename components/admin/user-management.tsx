"use client"

import { useState } from 'react'
import { useUsers, type CreateUserData } from '@/hooks/use-users'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { UserStats } from './user-stats'
import { UserTable } from './user-table'
import { EditUserDialog } from './edit-user-dialog'

export function UserManagement() {
  const { users, loading, createUser, updateUser, deleteUser } = useUsers()
  const { user: currentUser } = useAuth()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [formData, setFormData] = useState<CreateUserData>({
    password: '',
    name: '',
    role: 'operario',
    skills: []
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await createUser(formData)
    
    if (result.success) {
      toast.success('Usuario creado exitosamente')
      setIsCreateDialogOpen(false)
      resetFormData()
    } else {
      toast.error(result.error || 'Error al crear usuario')
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    const result = await updateUser(editingUser.id, formData)
    
    if (result.success) {
      toast.success('Usuario actualizado exitosamente')
      setEditingUser(null)
      resetFormData()
    } else {
      toast.error(result.error || 'Error al actualizar usuario')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const result = await deleteUser(userId, currentUser?.id)
    
    if (result.success) {
      toast.success('Usuario eliminado exitosamente')
    } else {
      toast.error(result.error || 'Error al eliminar usuario')
    }
  }

  const handleEditUser = (user: any) => {
    setEditingUser(user)
    setFormData({
      password: '',
      name: user.name,
      role: user.role,
      skills: user.skills || []
    })
  }

  const resetFormData = () => {
    setFormData({
      password: '',
      name: '',
      role: 'operario',
      skills: []
    })
  }

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    try {
      const matchesSearch = searchTerm === '' || 
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesRole = roleFilter === 'all' || (user.role && user.role === roleFilter)
      
      return matchesSearch && matchesRole
    } catch (error) {
      console.error('Error filtrando usuario:', error, user)
      return false
    }
  })

  // Calcular estadísticas
  const adminCount = users.filter(u => u.role === 'admin').length
  const operarioCount = users.filter(u => u.role === 'operario').length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Gestión de Usuarios</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Administra usuarios, roles y permisos del sistema</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <UserStats 
        totalUsers={users.length}
        adminCount={adminCount}
        operarioCount={operarioCount}
      />

      {/* Users Table */}
      <UserTable
        users={filteredUsers as any}
        currentUserId={currentUser?.id}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
      />

      {/* Create User Dialog */}
      <EditUserDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleCreateUser}
        isEditing={false}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleUpdateUser}
        isEditing={true}
      />
    </div>
  )
}
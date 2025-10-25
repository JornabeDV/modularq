"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { ClientStats } from './client-stats'
import { ClientTable } from './client-table'
import { ClientForm } from './client-form'
import { useClientsPrisma, type CreateClientData } from '@/hooks/use-clients-prisma'
import { useProjectsPrisma } from '@/hooks/use-projects-prisma'

export function ClientManagement() {
  const { clients, loading, error, createClient, updateClient, deleteClient } = useClientsPrisma()
  const { projects } = useProjectsPrisma()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleCreateClient = async (clientData: CreateClientData) => {
    const result = await createClient(clientData)
    if (result.success) {
      setIsCreateDialogOpen(false)
    }
  }

  const handleUpdateClient = async (clientId: string, clientData: any) => {
    if (isUpdating) return
    
    setIsUpdating(true)
    
    try {
      const updateData: any = {}
      if (clientData.cuit !== undefined) updateData.cuit = clientData.cuit
      if (clientData.company_name !== undefined) updateData.company_name = clientData.company_name
      if (clientData.representative !== undefined) updateData.representative = clientData.representative
      if (clientData.email !== undefined) updateData.email = clientData.email
      if (clientData.phone !== undefined) updateData.phone = clientData.phone
      
      const result = await updateClient(clientId, updateData)
      if (result.success) {
        setEditingClient(null)
      }
    } catch (error) {
      console.error('Error updating client:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    await deleteClient(clientId)
  }

  const handleEditClient = (client: any) => {
    setEditingClient(client)
  }

  // Filtrar clientes
  const filteredClients = clients?.filter(client => {
    const matchesSearch = searchTerm === '' || 
      client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.representative.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cuit.includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  }) || []

  // Calcular estadísticas
  const totalClients = clients?.length || 0
  const totalProjects = projects?.filter(p => p.clientId).length || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando clientes...</p>
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
          <h2 className="text-xl sm:text-2xl font-bold">Gestión de Clientes</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Administra la información de tus clientes y empresas
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" className="w-full sm:w-auto cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <ClientStats 
        totalClients={totalClients}
        totalProjects={totalProjects}
      />

      {/* Clients Table */}
      <ClientTable
        clients={filteredClients}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onEditClient={handleEditClient}
        onDeleteClient={handleDeleteClient}
      />

      {/* Create Client Dialog */}
      <ClientForm
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateClient}
        isEditing={false}
      />

      {/* Edit Client Dialog */}
      <ClientForm
        isOpen={!!editingClient}
        onClose={() => {
          if (!isUpdating) {
            setEditingClient(null)
          }
        }}
        onSubmit={(data) => editingClient && handleUpdateClient(editingClient.id, data)}
        isEditing={true}
        initialData={editingClient}
        isLoading={isUpdating}
      />
    </div>
  )
}
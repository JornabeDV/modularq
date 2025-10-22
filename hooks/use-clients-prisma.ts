"use client"

import { useState, useEffect } from 'react'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

export interface Client {
  id: string
  cuit: string
  companyName: string
  representative: string
  email: string
  phone: string
  createdAt: string
  updatedAt: string
}

export interface CreateClientData {
  cuit: string
  company_name: string
  representative: string
  email: string
  phone: string
}

export interface UpdateClientData {
  cuit?: string
  company_name?: string
  representative?: string
  email?: string
  phone?: string
}

export function useClientsPrisma() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar clientes
  const fetchClients = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await PrismaTypedService.getAllClients()
      
      // Convertir datos al formato Client
      const formattedClients: Client[] = data.map(client => ({
        id: client.id,
        cuit: client.cuit,
        companyName: client.company_name,
        representative: client.representative,
        email: client.email,
        phone: client.phone,
        createdAt: typeof client.created_at === 'string' ? client.created_at : client.created_at.toISOString(),
        updatedAt: typeof client.updated_at === 'string' ? client.updated_at : client.updated_at.toISOString()
      }))
      
      setClients(formattedClients)
    } catch (err) {
      console.error('Error fetching clients:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  // Crear nuevo cliente
  const createClient = async (clientData: CreateClientData): Promise<{ success: boolean; error?: string; client?: Client }> => {
    try {
      setError(null)
      
      const client = await PrismaTypedService.createClient(clientData)

      // Convertir el cliente de Prisma al formato Client personalizado
      const formattedClient: Client = {
        id: client.id,
        cuit: client.cuit,
        companyName: client.company_name,
        representative: client.representative,
        email: client.email,
        phone: client.phone,
        createdAt: typeof client.created_at === 'string' ? client.created_at : client.created_at.toISOString(),
        updatedAt: typeof client.updated_at === 'string' ? client.updated_at : client.updated_at.toISOString()
      }

      // Actualizar estado local
      await fetchClients()
      
      return { success: true, client: formattedClient }
    } catch (err) {
      console.error('Error creating client:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al crear cliente'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Actualizar cliente
  const updateClient = async (clientId: string, clientData: UpdateClientData): Promise<{ success: boolean; error?: string; client?: Client }> => {
    try {
      setError(null)
      
      const client = await PrismaTypedService.updateClient(clientId, clientData)

      // Actualizar estado local
      await fetchClients()
      
      return { success: true, client: undefined }
    } catch (err) {
      console.error('Error updating client:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar cliente'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Eliminar cliente
  const deleteClient = async (clientId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      await PrismaTypedService.deleteClient(clientId)

      // Actualizar estado local
      await fetchClients()
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting client:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar cliente'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Obtener cliente por ID
  const getClientById = (clientId: string): Client | undefined => {
    return clients.find(c => c.id === clientId)
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchClients()
  }, [])

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    getClientById,
    refetch: fetchClients
  }
}
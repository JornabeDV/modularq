"use client"

import { useState, useEffect } from 'react'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

export interface ClientContact {
  id: string
  name: string
  email: string
  phone: string
  role: string
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  cuit: string
  companyName: string
  representative?: string
  email?: string
  phone?: string
  contacts?: ClientContact[]
  createdAt: string
  updatedAt: string
}

export interface CreateContactData {
  name: string
  email: string
  phone: string
  role: string
  isPrimary?: boolean
}

export interface CreateClientData {
  cuit: string
  company_name: string
  representative?: string
  email?: string
  phone?: string
  contacts?: CreateContactData[]
}

export interface UpdateClientData {
  cuit?: string
  company_name?: string
  representative?: string
  email?: string
  phone?: string
  contacts?: CreateContactData[]
}

export function useClientsPrisma() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      
      const [data, contactsByClient] = await Promise.all([
        PrismaTypedService.getAllClients(),
        PrismaTypedService.getAllClientContacts()
      ])
      
      const formattedClients: Client[] = data.map((client) => {
        const contacts = contactsByClient[client.id] || []
        return {
          id: client.id,
          cuit: client.cuit,
          companyName: client.company_name,
          representative: client.representative || undefined,
          email: client.email || undefined,
          phone: client.phone || undefined,
          contacts: contacts.map(contact => ({
            id: contact.id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            role: contact.role,
            isPrimary: contact.is_primary || false,
            createdAt: typeof contact.created_at === 'string' ? contact.created_at : contact.created_at.toISOString(),
            updatedAt: typeof contact.updated_at === 'string' ? contact.updated_at : contact.updated_at.toISOString()
          })),
          createdAt: typeof client.created_at === 'string' ? client.created_at : client.created_at.toISOString(),
          updatedAt: typeof client.updated_at === 'string' ? client.updated_at : client.updated_at.toISOString()
        }
      })
      
      setClients(formattedClients)
    } catch (err) {
      console.error('Error fetching clients:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  const createClient = async (clientData: CreateClientData): Promise<{ success: boolean; error?: string; client?: Client }> => {
    try {
      setError(null)
      
      const { contacts, ...clientFields } = clientData
      
      const client = await PrismaTypedService.createClient(clientFields)

      if (contacts && contacts.length > 0) {
        await Promise.all(
          contacts.map(contact =>
            PrismaTypedService.createClientContact(client.id, contact)
          )
        )
      }

      const clientContacts = await PrismaTypedService.getClientContacts(client.id)
      const formattedClient: Client = {
        id: client.id,
        cuit: client.cuit,
        companyName: client.company_name,
        representative: client.representative || undefined,
        email: client.email || undefined,
        phone: client.phone || undefined,
        contacts: clientContacts?.map(contact => ({
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          role: contact.role,
          isPrimary: contact.is_primary || false,
          createdAt: typeof contact.created_at === 'string' ? contact.created_at : contact.created_at.toISOString(),
          updatedAt: typeof contact.updated_at === 'string' ? contact.updated_at : contact.updated_at.toISOString()
        })) || [],
        createdAt: typeof client.created_at === 'string' ? client.created_at : client.created_at.toISOString(),
        updatedAt: typeof client.updated_at === 'string' ? client.updated_at : client.updated_at.toISOString()
      }

      // Agregar cliente al estado local inmediatamente sin recargar
      setClients(prev => [...prev, formattedClient])
      
      // Refrescar datos en segundo plano sin mostrar loading
      fetchClients(true).catch(console.error)
      
      return { success: true, client: formattedClient }
    } catch (err: any) {
      let errorMessage = 'Error al crear cliente'
      
      if (err && typeof err === 'object') {
        const errorCode = err.code
        const errorMsg = err.message || ''
        
        if (errorCode === '23505' || 
            errorMsg.includes('duplicate key') || 
            errorMsg.includes('already exists') ||
            (err.details && err.details.includes('already exists'))) {
          errorMessage = 'El CUIT ingresado ya existe. Por favor, verifica el número de CUIT.'
        } else if (err.message) {
          errorMessage = err.message
        }
      } else if (err instanceof Error) {
        if (err.message.includes('duplicate key') || err.message.includes('already exists')) {
          errorMessage = 'El CUIT ingresado ya existe. Por favor, verifica el número de CUIT.'
        } else {
          errorMessage = err.message
        }
      }

      return { success: false, error: errorMessage }
    }
  }

  const updateClient = async (clientId: string, clientData: UpdateClientData): Promise<{ success: boolean; error?: string; client?: Client }> => {
    try {
      setError(null)
      
      const { contacts } = clientData
      
      if (contacts !== undefined) {
        await PrismaTypedService.deleteAllClientContacts(clientId)
        
        if (contacts.length > 0) {
          await Promise.all(
            contacts.map(contact =>
              PrismaTypedService.createClientContact(clientId, contact)
            )
          )
        }
      }

      // Refrescar datos en segundo plano sin mostrar loading
      fetchClients(true).catch(console.error)
      
      return { success: true, client: undefined }
    } catch (err: any) {
      console.error('Error updating client:', err)
      let errorMessage = 'Error al actualizar cliente'
      
      if (err && typeof err === 'object') {
        const errorCode = err.code
        const errorMsg = err.message || ''
        
        if (errorCode === '23505' || 
            errorMsg.includes('duplicate key') || 
            errorMsg.includes('already exists') ||
            (err.details && err.details.includes('already exists'))) {
          errorMessage = 'El CUIT ingresado ya existe. Por favor, verifica el número de CUIT.'
        } else if (err.message) {
          errorMessage = err.message
        }
      } else if (err instanceof Error) {
        if (err.message.includes('duplicate key') || err.message.includes('already exists')) {
          errorMessage = 'El CUIT ingresado ya existe. Por favor, verifica el número de CUIT.'
        } else {
          errorMessage = err.message
        }
      }
      
      return { success: false, error: errorMessage }
    }
  }

  const deleteClient = async (clientId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      await PrismaTypedService.deleteClient(clientId)

      // Actualizar estado local directamente sin recargar toda la lista
      setClients(prev => prev.filter(c => c.id !== clientId))
      
      // Refrescar datos en segundo plano sin mostrar loading
      fetchClients(true).catch(console.error)
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting client:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar cliente'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const getClientById = (clientId: string): Client | undefined => {
    return clients.find(c => c.id === clientId)
  } 

  const getUserTaskStats = async (userId: string) => {
    try {
      const tasks = await PrismaTypedService.getTasksByUser(userId)

      const total = tasks.length
      const completed = tasks.filter(t => t.status === 'completed').length
      const inProgress = tasks.filter(t => t.status === 'in_progress').length
      const pending = tasks.filter(t => t.status === 'pending').length

      return { total, completed, inProgress, pending }
    } catch (err) {
      console.error('Error getting user task stats:', err)
      return { total: 0, completed: 0, inProgress: 0, pending: 0 }
    }
  }

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
    getUserTaskStats,
    refetch: fetchClients
  }
}
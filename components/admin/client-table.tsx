"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ClientFilters } from '@/components/admin/client-filters'
import { ClientRow } from '@/components/admin/client-row'
import type { Client } from '@/hooks/use-clients-prisma'

interface ClientTableProps {
  clients: Client[]
  searchTerm: string
  onSearchChange: (value: string) => void
  onEditClient: (client: Client) => void
  onDeleteClient: (clientId: string) => void
}

export function ClientTable({
  clients,
  searchTerm,
  onSearchChange,
  onEditClient,
  onDeleteClient
}: ClientTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Clientes</CardTitle>
        <CardDescription>
          Administra la información de tus clientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ClientFilters
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
        />
        
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CUIT</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Representante</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No se encontraron clientes con ese criterio de búsqueda' : 'No hay clientes registrados'}
                  </td>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    onEdit={onEditClient}
                    onDelete={onDeleteClient}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
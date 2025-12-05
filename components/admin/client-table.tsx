"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataPagination } from '@/components/ui/data-pagination'
import { ClientFilters } from '@/components/admin/client-filters'
import { ClientRow } from '@/components/admin/client-row'
import type { Client } from '@/hooks/use-clients-prisma'

interface ClientTableProps {
  clients: Client[]
  totalItems: number
  itemsPerPage: number
  currentPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
  searchTerm: string
  onSearchChange: (value: string) => void
  onEditClient: (client: Client) => void
  onDeleteClient: (clientId: string) => void
  isReadOnly?: boolean
}

export function ClientTable({
  clients,
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  searchTerm,
  onSearchChange,
  onEditClient,
  onDeleteClient,
  isReadOnly = false
}: ClientTableProps) {
  return (
    <Card>
      <CardHeader>
        <ClientFilters
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
        />
      </CardHeader>
      <CardContent>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-background">
                <TableHead>CUIT</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Representante</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                {!isReadOnly && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <td colSpan={isReadOnly ? 5 : 6} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No se encontraron clientes con ese criterio de búsqueda' : 'No hay clientes registrados'}
                  </td>
                </TableRow>
              ) : (
                clients.map((client, index) => {
                  // Calcular el número de fila considerando la paginación
                  const rowNumber = (currentPage - 1) * itemsPerPage + index + 1
                  return (
                    <ClientRow
                      key={client.id}
                      client={client}
                      onEdit={onEditClient}
                      onDelete={onDeleteClient}
                      isReadOnly={isReadOnly}
                    />
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Paginación */}
        {totalItems > 0 && (
          <div className="pt-4 border-t">
            <DataPagination
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={onPageChange}
              onItemsPerPageChange={onItemsPerPageChange}
              itemsPerPageOptions={[5, 10, 20, 50]}
              itemsText="clientes"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
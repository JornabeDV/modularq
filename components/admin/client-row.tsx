"use client"

import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'
import { DeleteClientButton } from '@/components/admin/delete-client-button'
import type { Client } from '@/hooks/use-clients-prisma'

interface ClientRowProps {
  client: Client
  onEdit: (client: Client) => void
  onDelete: (clientId: string) => void
}

export function ClientRow({ client, onEdit, onDelete }: ClientRowProps) {
  const handleEdit = () => {
    onEdit(client)
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{client.cuit}</TableCell>
      <TableCell>{client.companyName}</TableCell>
      <TableCell>{client.representative}</TableCell>
      <TableCell>{client.email}</TableCell>
      <TableCell>{client.phone}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteClientButton
            clientId={client.id}
            clientName={client.companyName}
            onDelete={onDelete}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}
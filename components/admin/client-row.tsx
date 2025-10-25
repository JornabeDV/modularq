"use client"

import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'
import { DeleteClientButton } from '@/components/admin/delete-client-button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
    <TooltipProvider>
      <TableRow>
        <TableCell className="font-medium">{client.cuit}</TableCell>
        <TableCell>{client.companyName}</TableCell>
        <TableCell>{client.representative}</TableCell>
        <TableCell>{client.email}</TableCell>
        <TableCell>{client.phone}</TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="cursor-pointer"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar cliente</p>
              </TooltipContent>
            </Tooltip>
            <DeleteClientButton
              clientId={client.id}
              clientName={client.companyName}
              onDelete={onDelete}
            />
          </div>
        </TableCell>
      </TableRow>
    </TooltipProvider>
  )
}
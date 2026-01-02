"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Eye } from "lucide-react";
import { DeleteClientButton } from "@/components/admin/delete-client-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Client } from "@/hooks/use-clients-prisma";

interface ClientRowProps {
  client: Client;
  onEdit: (client: Client) => void;
  onView: (client: Client) => void;
  onDelete: (clientId: string) => void;
  isReadOnly?: boolean;
}

export function ClientRow({
  client,
  onEdit,
  onView,
  onDelete,
  isReadOnly = false,
}: ClientRowProps) {
  const handleEdit = () => {
    onEdit(client);
  };

  const handleView = () => {
    onView(client);
  };

  const primaryContact =
    client.contacts && client.contacts.length > 0
      ? client.contacts.find((c) => c.isPrimary) || client.contacts[0]
      : {
          name: client.representative || "Sin contacto",
          email: client.email || "-",
          phone: client.phone || "-",
        };

  return (
    <TooltipProvider>
      <TableRow
        className={
          isReadOnly
            ? "hover:!bg-background cursor-default"
            : "cursor-pointer hover:bg-muted/50"
        }
        style={isReadOnly ? { backgroundColor: "transparent" } : undefined}
        onClick={isReadOnly ? undefined : handleView}
      >
        <TableCell className="font-medium">{client.cuit}</TableCell>
        <TableCell>{client.companyName}</TableCell>
        <TableCell>{primaryContact.name}</TableCell>
        <TableCell>{primaryContact.email}</TableCell>
        <TableCell>{primaryContact.phone}</TableCell>
        {!isReadOnly && (
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView();
                    }}
                    className="cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver cliente</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit();
                    }}
                    className="cursor-pointer"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar cliente</p>
                </TooltipContent>
              </Tooltip>
              <div onClick={(e) => e.stopPropagation()}>
                <DeleteClientButton
                  clientId={client.id}
                  clientName={client.companyName}
                  onDelete={onDelete}
                />
              </div>
            </div>
          </TableCell>
        )}
      </TableRow>
    </TooltipProvider>
  );
}

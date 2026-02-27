"use client";

import React from "react";
import { ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataPagination } from "@/components/ui/data-pagination";
import { ClientFilters } from "@/components/admin/client-filters";
import { ClientRow } from "@/components/admin/client-row";
import type { Client } from "@/hooks/use-clients-prisma";

type SortField = "cuit" | "companyName" | "representative" | "email" | "phone";

interface ClientTableProps {
  clients: Client[];
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onEditClient: (client: Client) => void;
  onViewClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  isReadOnly?: boolean;
  sortField?: SortField;
  sortOrder?: "asc" | "desc";
  onSort?: (field: SortField) => void;
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
  onViewClient,
  onDeleteClient,
  isReadOnly = false,
  sortField,
  sortOrder,
  onSort,
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
                <TableHead
                  className="cursor-pointer min-w-[120px]"
                  onClick={() => onSort?.("cuit")}
                >
                  <div className="flex items-center gap-1">
                    CUIT
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer min-w-[200px]"
                  onClick={() => onSort?.("companyName")}
                >
                  <div className="flex items-center gap-1">
                    Empresa
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer min-w-[150px]"
                  onClick={() => onSort?.("representative")}
                >
                  <div className="flex items-center gap-1">
                    Representante
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer min-w-[200px]"
                  onClick={() => onSort?.("email")}
                >
                  <div className="flex items-center gap-1">
                    Email
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer min-w-[120px]"
                  onClick={() => onSort?.("phone")}
                >
                  <div className="flex items-center gap-1">
                    Teléfono
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                {!isReadOnly && (
                  <TableHead className="text-right">Acciones</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <td
                    colSpan={isReadOnly ? 5 : 6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchTerm
                      ? "No se encontraron clientes con ese criterio de búsqueda"
                      : "No hay clientes registrados"}
                  </td>
                </TableRow>
              ) : (
                clients.map((client, index) => {
                  const rowNumber =
                    (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <ClientRow
                      key={client.id}
                      client={client}
                      onEdit={onEditClient}
                      onView={onViewClient}
                      onDelete={onDeleteClient}
                      isReadOnly={isReadOnly}
                    />
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

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
  );
}

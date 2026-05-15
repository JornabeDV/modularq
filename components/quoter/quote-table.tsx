"use client";

import { useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataPagination } from "@/components/ui/data-pagination";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { QuoteRow } from "./quote-row";
import type { Quote, QuoteStatus } from "@/hooks/use-quotes";

type SortField = "number" | "client_name" | "status" | "total" | "created_at";

interface QuoteTableProps {
  quotes: Quote[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeFilter: QuoteStatus | "all";
  onFilterChange: (value: QuoteStatus | "all") => void;
  activeType: "sale" | "rental";
  onTypeChange: (type: "sale" | "rental") => void;
  onStatusChange: (id: string, status: QuoteStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  role: string;
  userId: string;
  loading?: boolean;
  sortField?: SortField;
  sortOrder?: "asc" | "desc";
  onSort?: (field: SortField) => void;
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (value: number) => void;
}

export function QuoteTable({
  quotes,
  searchTerm,
  onSearchChange,
  activeFilter,
  onFilterChange,
  activeType,
  onTypeChange,
  onStatusChange,
  onDelete,
  role,
  userId,
  loading = false,
  sortField,
  sortOrder,
  onSort,
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
}: QuoteTableProps) {
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);

  const SortHeader = ({
    field,
    label,
    className,
  }: {
    field: SortField;
    label: string;
    className?: string;
  }) => (
    <TableHead
      className={`cursor-pointer ${className || ""}`}
      onClick={() => onSort?.(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="w-3 h-3" />
      </div>
    </TableHead>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Historial de Cotizaciones</CardTitle>
            <p className="text-muted-foreground text-sm mt-1.5">
              Listado de cotizaciones generadas.
            </p>
          </div>

          {/* Tabs Venta / Alquiler */}
          <div className="flex border-b mt-4">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeType === "sale"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onTypeChange("sale")}
            >
              Ventas
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeType === "rental"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onTypeChange("rental")}
            >
              Alquileres
            </button>
          </div>

          {/* Filtros */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número o cliente..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={activeFilter}
              onValueChange={(value) =>
                onFilterChange(value as QuoteStatus | "all")
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="sent">Enviada</SelectItem>
                <SelectItem value="approved">Aprobada</SelectItem>
                <SelectItem value="rejected">Rechazada</SelectItem>
                <SelectItem value="expired">Vencida</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mt-2">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-background">
                  <SortHeader field="number" label="Número" className="w-[110px]" />
                  <TableHead className="w-[80px]">Tipo</TableHead>
                  <SortHeader field="client_name" label="Cliente" />
                  <SortHeader field="status" label="Estado" className="w-[100px]" />
                  <SortHeader field="total" label="Total" className="w-[120px]" />
                  <SortHeader field="created_at" label="Fecha" className="w-[140px]" />
                  <TableHead className="text-right min-w-[240px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      Cargando cotizaciones...
                    </td>
                  </TableRow>
                ) : quotes.length === 0 ? (
                  <TableRow>
                    <td colSpan={7} className="text-center py-12">
                      <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                      <p className="text-muted-foreground text-sm">
                        {searchTerm
                          ? "No se encontraron cotizaciones con ese criterio de búsqueda."
                          : activeFilter === "all"
                            ? `No hay cotizaciones de ${activeType === "rental" ? "alquiler" : "venta"} todavía.`
                            : `No hay cotizaciones de ${activeType === "rental" ? "alquiler" : "venta"} con ese estado.`}
                      </p>
                      <Button asChild variant="outline" className="mt-4">
                        <Link href="/quoter">
                          <Plus className="w-4 h-4 mr-2" />
                          Crear cotización
                        </Link>
                      </Button>
                    </td>
                  </TableRow>
                ) : (
                  quotes.map((quote) => (
                    <QuoteRow
                      key={quote.id}
                      quote={quote}
                      onStatusChange={onStatusChange}
                      onDeleteClick={setQuoteToDelete}
                      role={role}
                      userId={userId}
                    />
                  ))
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
                itemsText="cotizaciones"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!quoteToDelete}
        onOpenChange={(open) => !open && setQuoteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              cotización <strong>{quoteToDelete?.number}</strong> de{" "}
              <strong>{quoteToDelete?.client_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (quoteToDelete) {
                  await onDelete(quoteToDelete.id);
                  setQuoteToDelete(null);
                }
              }}
              className="cursor-pointer"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

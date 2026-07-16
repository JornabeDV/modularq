"use client"

import { useState } from "react"
import { Search, FileText, Plus } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { DeliveryReceiptRow } from "./delivery-receipt-row"
import type { DeliveryReceipt, DeliveryReceiptStatus } from "@/hooks/use-delivery-receipts"

interface DeliveryReceiptTableProps {
  receipts: DeliveryReceipt[]
  loading?: boolean
  role: string
  userId: string
  onIssue: (id: string) => Promise<void>
  onDuplicate: (id: string) => Promise<string>
  onDelete: (id: string) => Promise<void>
}

export function DeliveryReceiptTable({
  receipts,
  loading = false,
  role,
  userId,
  onIssue,
  onDuplicate,
  onDelete,
}: DeliveryReceiptTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<DeliveryReceiptStatus | "all">("all")
  const [receiptToDelete, setReceiptToDelete] = useState<DeliveryReceipt | null>(null)

  const filtered = receipts.filter((r) => {
    const matchesStatus = activeFilter === "all" || r.status === activeFilter
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      r.number.toLowerCase().includes(term) ||
      r.client_name.toLowerCase().includes(term) ||
      (r.client_company?.toLowerCase().includes(term) ?? false)
    return matchesStatus && matchesSearch
  })

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Remitos de Entrega</CardTitle>
              <p className="text-muted-foreground text-sm mt-1.5">
                Control de remitos generados: borradores, emisión y reimpresión.
              </p>
            </div>
            <Button asChild>
              <Link href="/admin/delivery-receipts/new">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo remito
              </Link>
            </Button>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={activeFilter}
              onValueChange={(value) =>
                setActiveFilter(value as DeliveryReceiptStatus | "all")
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="issued">Emitido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mt-2">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-background">
                  <TableHead className="w-[120px]">Número</TableHead>
                  <TableHead className="w-[80px]">Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-[100px]">Estado</TableHead>
                  <TableHead className="w-[120px]">Fecha</TableHead>
                  <TableHead className="text-right min-w-[220px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      Cargando remitos...
                    </td>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <td colSpan={6} className="text-center py-12">
                      <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                      <p className="text-muted-foreground text-sm">
                        {searchTerm || activeFilter !== "all"
                          ? "No se encontraron remitos con ese criterio."
                          : "No hay remitos cargados todavía."}
                      </p>
                      <Button asChild variant="outline" className="mt-4">
                        <Link href="/admin/delivery-receipts/new">
                          <Plus className="w-4 h-4 mr-2" />
                          Crear remito
                        </Link>
                      </Button>
                    </td>
                  </TableRow>
                ) : (
                  filtered.map((receipt) => (
                    <DeliveryReceiptRow
                      key={receipt.id}
                      receipt={receipt}
                      onIssue={onIssue}
                      onDuplicate={onDuplicate}
                      onDeleteClick={setReceiptToDelete}
                      role={role}
                      userId={userId}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!receiptToDelete}
        onOpenChange={(open) => !open && setReceiptToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar remito?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              remito <strong>{receiptToDelete?.number}</strong> de{" "}
              <strong>{receiptToDelete?.client_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (receiptToDelete) {
                  await onDelete(receiptToDelete.id)
                  setReceiptToDelete(null)
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
  )
}

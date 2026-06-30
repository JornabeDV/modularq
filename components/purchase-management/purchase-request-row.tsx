"use client"

import { useState } from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye, ShoppingCart, FileDown } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PurchaseRequestPDFButton } from "./PurchaseRequestPDFButton"
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

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  pending: "Pendiente",
  quoted: "Cotizado",
  approved: "Aprobado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-50 text-gray-700 border-gray-200",
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  quoted: "bg-purple-50 text-purple-700 border-purple-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  rejected: "bg-orange-50 text-orange-700 border-orange-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
}

interface PurchaseRequestRowProps {
  request: any
  onView: (request: any) => void
  onEdit: (request: any) => void
  onDelete: (requestId: string) => void
  onCreateOrder: (request: any) => void
  isReadOnly?: boolean
}

export function PurchaseRequestRow({
  request,
  onView,
  onEdit,
  onDelete,
  onCreateOrder,
  isReadOnly = false,
}: PurchaseRequestRowProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
      <TableRow
        onClick={() => onView(request)}
        className="cursor-pointer hover:bg-muted/50"
      >
        <TableCell className="font-medium tabular-nums">{request.request_number}</TableCell>
        <TableCell>
          <Badge variant="outline" className={`text-xs font-medium ${STATUS_COLORS[request.status]}`}>
            {STATUS_LABELS[request.status] || request.status}
          </Badge>
        </TableCell>
        <TableCell className="tabular-nums">{request.items?.length || 0}</TableCell>
        <TableCell className="tabular-nums">{request.supplier_quotes?.length || 0}</TableCell>
        <TableCell className="tabular-nums">{request.purchase_orders?.length || 0}</TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {new Date(request.created_at).toLocaleDateString("es-AR")}
        </TableCell>
        {!isReadOnly && (
          <TableCell className="text-right">
            <TooltipProvider>
              <div className="flex justify-end gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onView(request)
                      }}
                      className="cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ver pedido</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PurchaseRequestPDFButton
                      purchaseRequest={{
                        request_number: request.request_number,
                        status: request.status,
                        notes: request.notes,
                        created_at: request.created_at,
                        items: request.items.map((item: any) => ({
                          description: item.description,
                          quantity: item.quantity,
                          unit: item.unit,
                          material: item.material
                            ? {
                                id: item.material.id,
                                code: item.material.code,
                                name: item.material.name,
                                brand: item.material.brand,
                              }
                            : null,
                        })),
                      }}
                      size="sm"
                      label=""
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Descargar PDF</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(request)
                      }}
                      className="cursor-pointer"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Editar pedido</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCreateOrder(request)
                      }}
                      className="cursor-pointer"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Crear orden de compra</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDeleteDialog(true)
                      }}
                      className="cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Eliminar pedido</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </TableCell>
        )}
      </TableRow>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pedido de materiales?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar el pedido{" "}
              <strong>{request.request_number}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(request.id)
                setShowDeleteDialog(false)
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

"use client"

import { useState } from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye } from "lucide-react"
import { PurchaseOrderStatusBadge } from "@/components/purchase-orders/PurchaseOrderStatusBadge"
import { PurchaseOrderPDFActions } from "@/components/purchase-orders/PurchaseOrderPDFActions"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
import { Badge } from "@/components/ui/badge"
import { formatCurrencyPair } from "@/lib/exchange-rate"

interface PurchaseOrderRowProps {
  order: any
  onView: (orderId: string) => void
  onEdit: (orderId: string) => void
  onDelete: (orderId: string) => void
  isReadOnly?: boolean
}

export function PurchaseOrderRow({
  order,
  onView,
  onEdit,
  onDelete,
  isReadOnly = false,
}: PurchaseOrderRowProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
      <TableRow
        onClick={() => onView(order.id)}
        className="cursor-pointer hover:bg-muted/50"
      >
        <TableCell className="font-medium tabular-nums">{order.order_number}</TableCell>
        <TableCell>{order.supplier?.name || "—"}</TableCell>
        <TableCell>
          {order.purchase_request ? (
            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
              {order.purchase_request.request_number}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </TableCell>
        <TableCell>
          <PurchaseOrderStatusBadge status={order.status} />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {order.currency || 'ARS'}
              </Badge>
              <span className="tabular-nums font-semibold">
                {formatCurrencyPair(order.total, order.currency || 'ARS', order.exchange_rate ?? null).primary}
              </span>
            </div>
            {order.currency === 'USD' && order.total_ars && (
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {formatCurrencyPair(order.total, 'USD', order.exchange_rate ?? null).secondary}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {new Date(order.created_at).toLocaleDateString("es-AR")}
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
                        onView(order.id)
                      }}
                      className="cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ver orden</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(order.id)
                      }}
                      className="cursor-pointer"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Editar orden</p>
                  </TooltipContent>
                </Tooltip>
                <PurchaseOrderPDFActions orderId={order.id} orderNumber={order.order_number} />
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
                    <p>Eliminar orden</p>
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
            <AlertDialogTitle>¿Eliminar orden de compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar la orden{" "}
              <strong>{order.order_number}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(order.id)
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

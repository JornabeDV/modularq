"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SupplierQuotesPanel } from "./SupplierQuotesPanel"
import { PurchaseRequestPDFButton } from "./PurchaseRequestPDFButton"
import { ShoppingCart, X } from "lucide-react"

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

interface PurchaseRequestDetailProps {
  request: any
  onClose?: () => void
}

export function PurchaseRequestDetail({ request, onClose }: PurchaseRequestDetailProps) {
  const router = useRouter()

  const handleCreateOrder = () => {
    const params = new URLSearchParams()
    params.append("purchase_request_id", request.id)
    router.push(`/admin/purchase-orders/new?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 mb-3"> 
          <h1 className="text-xl sm:text-2xl font-bold">Pedido {request.request_number}</h1>
          <Badge variant="outline" className={`text-xs ${STATUS_COLORS[request.status]}`}>
            {STATUS_LABELS[request.status] || request.status}
          </Badge>
        </div>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer max-sm:w-full">
            <X className="h-4 w-4 mr-2" /> Cerrar
          </Button>
        )}
      </div>

      {request.notes ? (
        <p className="text-muted-foreground">{request.notes}</p>
      ) : (
        <p className="text-muted-foreground">Sin notas</p>
      )}

      <div>
        <h3 className="text-sm font-semibold mb-2">Ítems solicitados</h3>
        <div className="rounded-md border overflow-x-auto">
          <Table className="min-w-[500px]">
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {request.items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.material ? `${item.material.code} - ${item.material.name}` : "Manual"}
                  </TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <SupplierQuotesPanel purchaseRequestId={request.id} />

      {request.purchase_orders && request.purchase_orders.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Órdenes de compra relacionadas</h3>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {request.purchase_orders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                    <TableCell>{order.supplier?.name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${order.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
        {onClose && (
          <Button variant="outline" onClick={onClose} className="cursor-pointer max-sm:w-full">
            <X className="h-4 w-4 mr-2" /> Cerrar
          </Button>
        )}
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
          variant="outline"
          label="Descargar PDF"
          className="max-sm:w-full"
        />
        <Button onClick={handleCreateOrder} className="cursor-pointer max-sm:w-full">
          <ShoppingCart className="h-4 w-4 mr-2" /> Crear Orden de Compra
        </Button>
      </div>
    </div>
  )
}

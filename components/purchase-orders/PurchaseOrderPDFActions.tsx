"use client"

import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { usePurchaseOrders } from "@/hooks/use-purchase-orders"
import { PurchaseOrderPDFDocument } from "./PurchaseOrderPDFDocument"
import { Download, Eye, Loader2 } from "lucide-react"

interface PurchaseOrderPDFActionsProps {
  orderId: string
  orderNumber: string
}

export function PurchaseOrderPDFActions({ orderId, orderNumber }: PurchaseOrderPDFActionsProps) {
  const { getPurchaseOrder } = usePurchaseOrders()
  const [loadingAction, setLoadingAction] = useState<"view" | "download" | null>(null)

  const generatePdfBlob = async () => {
    const order = await getPurchaseOrder(orderId)

    const pdfData = {
      order_number: order.order_number,
      status: order.status,
      supplier: order.supplier || { name: "" },
      items: order.items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })),
      subtotal: order.subtotal,
      tax_pct: order.tax_pct,
      tax_amount: order.tax_amount,
      total: order.total,
      payment_terms: order.payment_terms,
      delivery_terms: order.delivery_terms,
      delivery_date: order.delivery_date,
      notes: order.notes,
      created_at: order.created_at,
    }

    return await pdf(<PurchaseOrderPDFDocument purchaseOrder={pdfData} />).toBlob()
  }

  const handleView = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()
    setLoadingAction("view")
    try {
      const blob = await generatePdfBlob()
      if (!blob) return
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()
    setLoadingAction("download")
    try {
      const blob = await generatePdfBlob()
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${orderNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <TooltipProvider>
      <div className="flex justify-end gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={handleView}
              disabled={loadingAction !== null}
            >
              {loadingAction === "view" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ver PDF</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={handleDownload}
              disabled={loadingAction !== null}
            >
              {loadingAction === "download" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Descargar PDF</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

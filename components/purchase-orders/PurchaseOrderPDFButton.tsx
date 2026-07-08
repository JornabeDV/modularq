"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { pdf } from "@react-pdf/renderer"
import { FileDown, Loader2 } from "lucide-react"
import { PurchaseOrderPDFDocument } from "./PurchaseOrderPDFDocument"

interface PurchaseOrderPDFButtonProps {
  purchaseOrder: Parameters<typeof PurchaseOrderPDFDocument>[0]["purchaseOrder"]
  label?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function PurchaseOrderPDFButton({
  purchaseOrder,
  label = "Descargar PDF",
  variant = "outline",
  size = "sm",
  className,
}: PurchaseOrderPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      const blob = await pdf(
        <PurchaseOrderPDFDocument purchaseOrder={purchaseOrder} />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${purchaseOrder.order_number}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleDownload}
      disabled={isGenerating}
      className={`cursor-pointer ${className || ""}`}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin mr-1" />
      ) : (
        <FileDown className="h-4 w-4 mr-1" />
      )}
      {label}
    </Button>
  )
}

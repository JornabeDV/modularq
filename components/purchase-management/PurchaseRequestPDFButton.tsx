"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { pdf } from "@react-pdf/renderer"
import { FileDown, Loader2 } from "lucide-react"
import { PurchaseRequestPDFDocument } from "./PurchaseRequestPDFDocument"

interface PurchaseRequestPDFButtonProps
  extends Omit<React.ComponentProps<"button">, "ref" | "type" | "className"> {
  purchaseRequest: Parameters<typeof PurchaseRequestPDFDocument>[0]["purchaseRequest"]
  label?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export const PurchaseRequestPDFButton = React.forwardRef<
  HTMLButtonElement,
  PurchaseRequestPDFButtonProps
>(function PurchaseRequestPDFButton(
  {
    purchaseRequest,
    label = "Descargar PDF",
    variant = "outline",
    size = "default",
    className,
    onClick,
    ...props
  },
  ref
) {
  const [isGenerating, setIsGenerating] = useState(false)
  const iconClass = label ? "h-4 w-4 mr-1" : "h-4 w-4"

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      const blob = await pdf(
        <PurchaseRequestPDFDocument purchaseRequest={purchaseRequest} />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${purchaseRequest.request_number}.pdf`
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
      ref={ref}
      type="button"
      variant={variant}
      size={size}
      onClick={(e) => {
        onClick?.(e)
        handleDownload()
      }}
      disabled={isGenerating}
      className={`cursor-pointer ${className || ""}`}
      {...props}
    >
      {isGenerating ? (
        <Loader2 className={`${iconClass} animate-spin`} />
      ) : (
        <FileDown className={iconClass} />
      )}
      {label}
    </Button>
  )
})

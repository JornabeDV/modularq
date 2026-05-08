"use client"

import { Badge } from "@/components/ui/badge"

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: "Borrador", className: "bg-gray-50 text-gray-700 border-gray-200" },
  pending: { label: "Pendiente", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  approved: { label: "Aprobada", className: "bg-blue-50 text-blue-700 border-blue-200" },
  received: { label: "Recibida", className: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "Cancelada", className: "bg-red-50 text-red-700 border-red-200" },
}

interface PurchaseOrderStatusBadgeProps {
  status: string
  className?: string
}

export function PurchaseOrderStatusBadge({ status, className = "" }: PurchaseOrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, className: "bg-gray-50 text-gray-700 border-gray-200" }

  return (
    <Badge variant="outline" className={`text-xs font-medium ${config.className} ${className}`}>
      {config.label}
    </Badge>
  )
}

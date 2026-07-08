"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePurchaseRequests } from "@/hooks/use-purchase-requests"
import { Loader2 } from "lucide-react"

interface PurchaseRequestSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function PurchaseRequestSelect({
  value,
  onChange,
  placeholder = "Seleccionar pedido (opcional)",
  disabled = false,
}: PurchaseRequestSelectProps) {
  const { purchaseRequests, loading } = usePurchaseRequests()

  return (
    <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)} disabled={disabled || loading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Sin pedido asociado</SelectItem>
        {loading ? (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          purchaseRequests.map((request) => (
            <SelectItem key={request.id} value={request.id}>
              <span className="font-mono text-xs">{request.request_number}</span>
              <span className="text-muted-foreground ml-2">({request.items.length} ítems)</span>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}

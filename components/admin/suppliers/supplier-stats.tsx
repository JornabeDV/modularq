"use client"

import { Card } from "@/components/ui/card"
import { Building2, CheckCircle2 } from "lucide-react"

interface SupplierStatsProps {
  totalSuppliers: number
  activeSuppliers: number
}

export function SupplierStats({ totalSuppliers, activeSuppliers }: SupplierStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4">
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{totalSuppliers}</p>
          </div>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Activos</p>
            <p className="text-lg font-bold">{activeSuppliers}</p>
          </div>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
    </div>
  )
}

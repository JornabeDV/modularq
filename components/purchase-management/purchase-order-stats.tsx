"use client"

import { Card } from '@/components/ui/card'
import { ShoppingCart, Clock, CheckCircle2, Package } from 'lucide-react'

interface PurchaseOrderStatsProps {
  totalOrders: number
  pendingOrders: number
  approvedOrders: number
  receivedOrders: number
}

export function PurchaseOrderStats({
  totalOrders,
  pendingOrders,
  approvedOrders,
  receivedOrders,
}: PurchaseOrderStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Órdenes</p>
            <p className="text-lg sm:text-xl font-bold">{totalOrders}</p>
          </div>
          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Pendientes</p>
            <p className={`text-lg sm:text-xl font-bold ${pendingOrders > 0 ? 'text-yellow-600' : ''}`}>
              {pendingOrders}
            </p>
          </div>
          <Clock className={`h-4 w-4 sm:h-5 sm:w-5 ${pendingOrders > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`} />
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Aprobadas</p>
            <p className="text-lg sm:text-xl font-bold">{approvedOrders}</p>
          </div>
          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Recibidas</p>
            <p className="text-lg sm:text-xl font-bold">{receivedOrders}</p>
          </div>
          <Package className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>
      </Card>
    </div>
  )
}

"use client"

import { Card } from '@/components/ui/card'
import { ClipboardList, Clock, CheckCircle2, FileText } from 'lucide-react'

interface PurchaseRequestStatsProps {
  totalRequests: number
  pendingRequests: number
  quotedRequests: number
  approvedRequests: number
}

export function PurchaseRequestStats({
  totalRequests,
  pendingRequests,
  quotedRequests,
  approvedRequests,
}: PurchaseRequestStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Pedidos</p>
            <p className="text-lg sm:text-xl font-bold">{totalRequests}</p>
          </div>
          <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Pendientes</p>
            <p className={`text-lg sm:text-xl font-bold ${pendingRequests > 0 ? 'text-yellow-600' : ''}`}>
              {pendingRequests}
            </p>
          </div>
          <Clock className={`h-4 w-4 sm:h-5 sm:w-5 ${pendingRequests > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`} />
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Cotizados</p>
            <p className="text-lg sm:text-xl font-bold">{quotedRequests}</p>
          </div>
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Aprobados</p>
            <p className="text-lg sm:text-xl font-bold">{approvedRequests}</p>
          </div>
          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>
      </Card>
    </div>
  )
}

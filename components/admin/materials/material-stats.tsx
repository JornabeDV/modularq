"use client"

import { Card } from '@/components/ui/card'
import { Package, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react'

interface MaterialStatsProps {
  totalMaterials: number
  lowStockCount: number
  totalInventoryValue: number
  totalCategories: number
}

export function MaterialStats({ 
  totalMaterials, 
  lowStockCount, 
  totalInventoryValue,
  totalCategories 
}: MaterialStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total Materiales</p>
            <p className="text-lg sm:text-xl font-bold">{totalMaterials}</p>
          </div>
          <Package className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>
      </Card>
      
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Stock Bajo</p>
            <p className={`text-lg sm:text-xl font-bold ${lowStockCount > 0 ? 'text-destructive' : ''}`}>
              {lowStockCount}
            </p>
          </div>
          <AlertTriangle className={`h-4 w-4 sm:h-5 sm:w-5 ${lowStockCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
        </div>
      </Card>
      
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Valor Inventario</p>
            <p className="text-lg sm:text-xl font-bold">
              ${totalInventoryValue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>
      </Card>
      
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Categorías</p>
            <p className="text-lg sm:text-xl font-bold">{totalCategories}</p>
          </div>
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>
      </Card>
    </div>
  )
}
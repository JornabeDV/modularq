"use client"

import { Card } from '@/components/ui/card'
import { Building2, Phone } from 'lucide-react'

interface ClientStatsProps {
  totalClients: number
  totalProjects: number
}

export function ClientStats({ totalClients, totalProjects }: ClientStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4">
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{totalClients}</p>
          </div>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
      
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Proyectos</p>
            <p className="text-lg font-bold">{totalProjects}</p>
          </div>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
    </div>
  )
}
"use client"

import { Card } from '@/components/ui/card'
import { FolderOpen, Clock, Users, Star, Wrench } from 'lucide-react'

interface TaskStatsProps {
  totalTasks: number
  standardTasks: number
  customTasks: number
  assignedTasks: number
  unassignedTasks: number
}

export function TaskStats({ totalTasks, standardTasks, customTasks, assignedTasks, unassignedTasks }: TaskStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{totalTasks}</p>
          </div>
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
      
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Estándar</p>
            <p className="text-lg font-bold">{standardTasks}</p>
          </div>
          <Star className="h-4 w-4 text-blue-500" />
        </div>
      </Card>
      
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Personalizadas</p>
            <p className="text-lg font-bold">{customTasks}</p>
          </div>
          <Wrench className="h-4 w-4 text-green-500" />
        </div>
      </Card>
      
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Asignadas</p>
            <p className="text-lg font-bold">{assignedTasks}</p>
          </div>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
      
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Sin Asignar</p>
            <p className="text-lg font-bold">{unassignedTasks}</p>
          </div>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
    </div>
  )
}
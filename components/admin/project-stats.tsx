"use client"

import { Card } from '@/components/ui/card'
import { FolderOpen, Play, CheckCircle, Calendar } from 'lucide-react'

interface ProjectStatsProps {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalTasks: number
}

export function ProjectStats({ totalProjects, activeProjects, completedProjects, totalTasks }: ProjectStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{totalProjects}</p>
          </div>
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
      
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Activos</p>
            <p className="text-lg font-bold">{activeProjects}</p>
          </div>
          <Play className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
      
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Completados</p>
            <p className="text-lg font-bold">{completedProjects}</p>
          </div>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
      
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Tareas</p>
            <p className="text-lg font-bold">{totalTasks}</p>
          </div>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
    </div>
  )
}
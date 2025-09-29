"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, Clock, Play, Square } from 'lucide-react'

interface TaskHeaderProps {
  task: {
    task?: {
      title?: string
      description?: string
    }
    status: string
  }
  onBack: () => void
}

export function TaskHeader({ task, onBack }: TaskHeaderProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'cancelled':
        return <Square className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'in_progress':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'En Progreso'
      case 'completed':
        return 'Completada'
      case 'pending':
        return 'Pendiente'
      case 'cancelled':
        return 'Cancelada'
      default:
        return 'Desconocido'
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Proyecto
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{task.task?.title}</h1>
          <p className="text-muted-foreground">{task.task?.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getStatusIcon(task.status)}
        <Badge variant={getStatusColor(task.status)}>
          {getStatusLabel(task.status)}
        </Badge>
      </div>
    </div>
  )
}
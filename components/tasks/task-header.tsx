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
      case 'pending':
        return 'Pendiente'
      case 'assigned':
        return 'Asignada'
      case 'in_progress':
        return 'En Progreso'
      case 'completed':
        return 'Completada'
      case 'cancelled':
        return 'Cancelada'
      default:
        return 'Desconocido'
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button 
          variant="outline" 
          size="lg"
          onClick={onBack}
          className="shrink-0 text-lg px-6 py-3 cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver a Mis Tareas
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl sm:text-4xl font-bold text-balance">{task.task?.title}</h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-2">{task.task?.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {getStatusIcon(task.status)}
        <Badge variant={getStatusColor(task.status)} className="text-lg px-4 py-2">
          {getStatusLabel(task.status)}
        </Badge>
      </div>
    </div>
  )
}
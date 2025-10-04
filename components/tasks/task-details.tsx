"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { FileText, CheckCircle, Users } from 'lucide-react'

interface TaskDetailsProps {
  task: {
    task?: {
      estimatedHours?: number
    }
    actualHours: number
    startDate?: string
    endDate?: string
    progressPercentage: number
    notes?: string
    status: string
    collaborators?: Array<{
      id: string
      userId: string
      user?: {
        id: string
        name: string
        role: string
      }
      addedByUser?: {
        id: string
        name: string
        role: string
      }
    }>
  }
  onComplete?: () => void
}

export function TaskDetails({ task, onComplete }: TaskDetailsProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatHours = (hours: number) => {
    if (hours < 0.0001) {
      return '< 1m'
    }
    if (hours < 1) {
      const minutes = Math.round(hours * 60)
      return minutes < 1 ? '< 1m' : `${minutes}m`
    }
    return `${hours.toFixed(1)}h`
  }

  const isCompleted = task.status === 'completed'

  return (
    <Card className={isCompleted ? 'bg-green-50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalles de la Tarea
          </div>
          {isCompleted && (
            <Badge variant="outline" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completada
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Horas Estimadas</Label>
            <p className="text-lg font-semibold">{task.task?.estimatedHours}h</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Horas Reales</Label>
            <p className="text-lg font-semibold">{formatHours(task.actualHours)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Fecha de Inicio</Label>
            <p className="text-sm">{formatDate(task.startDate)}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Fecha de Fin</Label>
            <p className="text-sm">{formatDate(task.endDate)}</p>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-muted-foreground">Progreso</Label>
          <div className="mt-2">
            <Progress 
              value={task.progressPercentage} 
              className="h-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {task.progressPercentage}% completado
            </p>
          </div>
        </div>

        {task.notes && (
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Notas</Label>
            <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
              {task.notes}
            </p>
          </div>
        )}

        {/* Colaboradores */}
        {task.collaborators && task.collaborators.length > 0 && (
          <div>
            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Colaboradores
            </Label>
            <div className="mt-2 space-y-2">
              {task.collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {collaborator.user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{collaborator.user?.name || 'Usuario'}</p>
                    <p className="text-xs text-muted-foreground">
                      Agregado por {collaborator.addedByUser?.name || 'Sistema'}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {collaborator.user?.role || 'operario'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón de Completar Tarea */}
        {task.status === 'in_progress' && onComplete && (
          <div className="pt-4 border-t">
            <button 
              onClick={onComplete}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Marcar como Completada
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
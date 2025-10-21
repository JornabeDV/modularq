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
    totalHoursWithActive?: number
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
    return `${hours % 1 === 0 ? hours : hours.toFixed(1)}hs`
  }

  const isCompleted = task.status === 'completed'

  return (
    <Card className={isCompleted ? 'bg-green-50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <span className="text-xl">Información de la Tarea</span>
          </div>
          {isCompleted && (
            <Badge variant="outline" className="text-sm px-3 py-1">
              <CheckCircle className="h-4 w-4 mr-1" />
              Completada
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label className="text-base font-semibold text-muted-foreground">Tiempo Estimado</Label>
            <p className="text-2xl font-bold">{task.task?.estimatedHours} horas</p>
          </div>
          <div>
            <Label className="text-base font-semibold text-muted-foreground">Tiempo Trabajado</Label>
            <p className="text-2xl font-bold">{formatHours(task.totalHoursWithActive || task.actualHours)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label className="text-base font-semibold text-muted-foreground">Fecha de Inicio</Label>
            <p className="text-lg">{formatDate(task.startDate)}</p>
          </div>
          <div>
            <Label className="text-base font-semibold text-muted-foreground">Fecha de Fin</Label>
            <p className="text-lg">{formatDate(task.endDate)}</p>
          </div>
        </div>

        <div>
          <Label className="text-base font-semibold text-muted-foreground">Progreso de la Tarea</Label>
          <div className="mt-3">
            <Progress 
              value={task.progressPercentage} 
              className="h-4"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-lg font-semibold text-muted-foreground">
                {task.progressPercentage}% completado
              </p>
              {task.task?.estimatedHours && (
                <p className="text-base text-muted-foreground">
                  {formatHours(task.totalHoursWithActive || task.actualHours)} / {task.task.estimatedHours}hs
                </p>
              )}
            </div>
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
        {(task.status === 'in_progress' || task.status === 'assigned') && onComplete && (
          <div className="pt-6 border-t">
            <button 
              onClick={onComplete}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-bold text-xl flex items-center justify-center gap-3 shadow-lg"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              FINALIZAR TAREA
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
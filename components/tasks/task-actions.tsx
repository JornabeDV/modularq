"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { TimeTracker } from '@/components/time-tracking/time-tracker'
import { TimeEntriesList } from '@/components/time-tracking/time-entries-list'

interface TaskActionsProps {
  task: {
    status: string
    taskId: string
    projectTaskId: string
  }
  projectId: string
  operarioId?: string
  onTimeEntryCreate: (entry: any) => void
  onProgressUpdate: (progress: number) => void
  onTaskComplete?: () => void
  onTotalHoursUpdate?: (totalHours: number) => void
  refreshTimeEntries: number
}

export function TaskActions({
  task,
  projectId,
  operarioId,
  onTimeEntryCreate,
  onProgressUpdate,
  onTaskComplete,
  onTotalHoursUpdate,
  refreshTimeEntries
}: TaskActionsProps) {
  return (
    <>
      {/* Time Tracker */}
      {(task.status === 'in_progress' || task.status === 'assigned') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              Cronómetro de Trabajo
            </CardTitle>
            <CardDescription className="text-base">
              Presiona INICIAR para comenzar a trabajar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimeTracker 
              operarioId={operarioId || ''} 
              taskId={task.projectTaskId}
              projectId={projectId}
              onTimeEntryCreate={onTimeEntryCreate}
              onProgressUpdate={onProgressUpdate}
              onTaskComplete={onTaskComplete}
              onTotalHoursUpdate={onTotalHoursUpdate}
            />
          </CardContent>
        </Card>
      )}

      {/* Historial de Tiempo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            Sesiones de Trabajo
          </CardTitle>
          <CardDescription className="text-base">
            Historial de todas las sesiones de trabajo en esta tarea
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TimeEntriesList 
            operarioId={operarioId} 
            taskId={task.taskId}
            projectId={projectId}
            limit={10}
            refreshTrigger={refreshTimeEntries}
          />
        </CardContent>
      </Card>
    </>
  )
}
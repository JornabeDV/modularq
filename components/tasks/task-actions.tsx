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
  refreshTimeEntries: number
}

export function TaskActions({
  task,
  projectId,
  operarioId,
  onTimeEntryCreate,
  onProgressUpdate,
  onTaskComplete,
  refreshTimeEntries
}: TaskActionsProps) {
  return (
    <>
      {/* Time Tracker */}
      {task.status === 'in_progress' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Registro de Tiempo
            </CardTitle>
            <CardDescription>
              Registra el tiempo que trabajas en esta tarea
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
            />
          </CardContent>
        </Card>
      )}

      {/* Historial de Tiempo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de Tiempo
          </CardTitle>
          <CardDescription>
            Registro de todas las sesiones de trabajo en esta tarea
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
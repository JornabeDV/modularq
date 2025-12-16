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
  // Cronómetro y sesiones de trabajo ocultos - Simplificado a solo estados
  return null
}
"use client"

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
}: TaskActionsProps) {
  return null
}
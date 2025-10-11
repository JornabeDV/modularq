"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { useProjectTasksPrisma } from '@/hooks/use-project-tasks-prisma'
import { useProjectOperariosPrisma } from '@/hooks/use-project-operarios-prisma'
import { useAuth } from '@/lib/auth-context'
import { TaskHeader } from '@/components/tasks/task-header'
import { TaskDetails } from '@/components/tasks/task-details'
import { TaskActions } from '@/components/tasks/task-actions'
import { EditTaskModal } from '@/components/tasks/edit-task-modal'
import { TaskLoadingStates } from '@/components/tasks/task-loading-states'

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const projectId = params?.id as string
  const taskId = params?.taskId as string
  
  const { projectTasks, updateProjectTask, loading } = useProjectTasksPrisma(projectId)
  const { projectOperarios, loading: operariosLoading } = useProjectOperariosPrisma(projectId)
  
  const [task, setTask] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [actualHours, setActualHours] = useState(0)
  const [progressPercentage, setProgressPercentage] = useState(0)
  const [notes, setNotes] = useState('')
  const [isTracking, setIsTracking] = useState(false)
  const [refreshTimeEntries, setRefreshTimeEntries] = useState(0)

  // Verificar si el operario está asignado al proyecto
  const isAssignedToProject = projectOperarios?.some(po => po.user_id === user?.id) || false

  useEffect(() => {
    if (projectTasks && projectTasks.length > 0) {
      const foundTask = projectTasks.find(pt => pt.id === taskId)
      if (foundTask) {
        setTask(foundTask)
        setActualHours(foundTask.actualHours || 0)
        setProgressPercentage(foundTask.progressPercentage || 0)
        setNotes(foundTask.notes || '')
      }
    }
  }, [projectTasks, taskId])

  const handleUpdateTask = async () => {
    if (!task) return

    const updateData = {
      actualHours,
      progressPercentage,
      notes
    }

    const result = await updateProjectTask(task.id, updateData)
    if (result.success) {
      setIsEditing(false)
      // Actualizar el estado local
      setTask({ ...task, ...updateData })
    }
  }

  const handleCompleteTask = async () => {
    if (!task) return

    const updateData = {
      status: 'completed' as const,
      actualHours,
      progressPercentage: 100,
      notes,
      endDate: new Date().toISOString().split('T')[0]
    }

    const result = await updateProjectTask(task.id, updateData)
    if (result.success) {
      router.push(`/projects/${projectId}`)
    }
  }

  const handleTimeEntryCreate = useCallback((entry: any) => {
    setRefreshTimeEntries(prev => prev + 1)
    
    // Actualizar las horas reales trabajadas
    if (entry.hours && task) {
      const newActualHours = (task.actualHours || 0) + entry.hours
      setActualHours(newActualHours)
      
      // Actualizar el estado local del task
      setTask({ ...task, actualHours: newActualHours })
      
      // Actualizar en la base de datos
      updateProjectTask(task.id, { actualHours: newActualHours }, true)
    }
  }, [task, updateProjectTask])

  const handleProgressUpdate = useCallback(async (progress: number) => {
    setProgressPercentage(progress)
    
    // Actualizar el progreso en la base de datos sin refetch
    if (task) {
      try {
        await updateProjectTask(task.id, { progressPercentage: progress }, true)
      } catch (err) {
        console.error('Error updating progress:', err)
      }
    }
  }, [task, updateProjectTask])

  // Estados de carga y error
  if (loading || operariosLoading) {
    return (
      <MainLayout>
        <TaskLoadingStates state="loading" />
      </MainLayout>
    )
  }

  if (!task) {
    return (
      <MainLayout>
        <TaskLoadingStates 
          state="not-found" 
          onBackToProject={() => router.push(`/projects/${projectId}`)}
        />
      </MainLayout>
    )
  }

  if (!operariosLoading && !isAssignedToProject) {
    return (
      <MainLayout>
        <TaskLoadingStates 
          state="access-denied" 
          onBackToProjects={() => router.push('/projects')}
        />
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <TaskHeader 
          task={task}
          onBack={() => router.push(`/projects/${projectId}`)}
        />

        <div className="space-y-6">
          {/* Detalles de la Tarea */}
          <TaskDetails 
            task={{
              ...task,
              collaborators: task.collaborators
            }}
            onComplete={handleCompleteTask}
          />

          {/* Acciones de la Tarea (Time Tracker + Historial) */}
          <TaskActions
            task={{
              status: task.status,
              taskId: task?.taskId || '',
              projectTaskId: task?.id || ''
            }}
            projectId={projectId}
            operarioId={user?.id}
            onTimeEntryCreate={handleTimeEntryCreate}
            onProgressUpdate={handleProgressUpdate}
            onTaskComplete={() => {
              // Redirigir al proyecto cuando la tarea se complete automáticamente
              router.push(`/projects/${projectId}`)
            }}
            refreshTimeEntries={refreshTimeEntries}
          />
        </div>

        {/* Modal de Edición */}
        <EditTaskModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          actualHours={actualHours}
          progressPercentage={progressPercentage}
          notes={notes}
          onActualHoursChange={setActualHours}
          onProgressChange={setProgressPercentage}
          onNotesChange={setNotes}
          onSave={handleUpdateTask}
        />
      </div>
    </MainLayout>
  )
}
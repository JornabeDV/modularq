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
  const [totalHoursWithActive, setTotalHoursWithActive] = useState(0)
  const [progressPercentage, setProgressPercentage] = useState(0)
  const [notes, setNotes] = useState('')
  const [isTracking, setIsTracking] = useState(false)
  const [refreshTimeEntries, setRefreshTimeEntries] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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
      showSuccessNotification('✅ ¡Tarea completada exitosamente!')
      setTimeout(() => router.push(`/projects/${projectId}`), 1500)
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

  const handleTotalHoursUpdate = useCallback((totalHours: number) => {
    setTotalHoursWithActive(totalHours)
  }, [])

  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

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
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Breadcrumbs */}
        <div className="text-lg text-gray-600 mb-4">
          <span className="hover:text-blue-600 cursor-pointer" onClick={() => router.push('/projects')}>
            Mis Proyectos
          </span>
          <span className="mx-2">→</span>
          <span className="hover:text-blue-600 cursor-pointer" onClick={() => router.push(`/projects/${projectId}`)}>
            Proyecto Modular 1.2
          </span>
          <span className="mx-2">→</span>
          <span className="font-semibold text-gray-800">{task.task?.title}</span>
        </div>

        {/* Header */}
        <TaskHeader 
          task={task}
          onBack={() => router.push(`/projects/${projectId}`)}
        />

        <div className="space-y-8">
          {/* Detalles de la Tarea */}
          <TaskDetails 
            task={{
              ...task,
              totalHoursWithActive: totalHoursWithActive,
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
            onTotalHoursUpdate={handleTotalHoursUpdate}
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

        {/* Notificación de Éxito */}
        {showSuccess && (
          <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 animate-in slide-in-from-right">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">{successMessage}</span>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
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
import { supabase } from '@/lib/supabase'

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
  const [taskStartDate, setTaskStartDate] = useState<string | null>(null)

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
        setTaskStartDate(foundTask.startDate || null)
      }
    }
  }, [projectTasks, taskId])

  // Cargar entradas de tiempo y calcular horas totales, progreso y fecha de inicio
  useEffect(() => {
    const loadTimeEntriesAndCalculate = async () => {
      if (!task?.taskId || !projectId) return

      try {
        // Obtener todas las entradas de tiempo (completadas y activas)
        const { data: timeEntries, error } = await supabase
          .from('time_entries')
          .select('hours, start_time, end_time')
          .eq('task_id', task.taskId)
          .eq('project_id', projectId)
          .order('start_time', { ascending: true })

        if (error) {
          console.error('Error fetching time entries:', error)
          return
        }

        let totalHours = 0
        let firstEntryStartTime: string | null = null

        // Ordenar entradas por fecha de inicio para obtener la primera
        if (timeEntries && timeEntries.length > 0) {
          firstEntryStartTime = timeEntries[0].start_time
        }

        // Calcular horas totales incluyendo sesiones activas
        timeEntries?.forEach((entry: any) => {
          if (entry.end_time) {
            // Sesión completada - usar horas calculadas si existe y es válido, sino calcular desde fechas
            if (entry.hours != null && entry.hours !== undefined && !isNaN(entry.hours) && entry.hours > 0) {
              totalHours += parseFloat(entry.hours)
            } else {
              // Si no tiene hours o es 0, calcular desde start_time y end_time
              const startTime = new Date(entry.start_time)
              const endTime = new Date(entry.end_time)
              const elapsedMs = endTime.getTime() - startTime.getTime()
              const elapsedHours = elapsedMs / (1000 * 60 * 60)
              totalHours += elapsedHours
            }
          } else {
            // Sesión activa - calcular tiempo transcurrido
            const startTime = new Date(entry.start_time)
            const now = new Date()
            const elapsedMs = now.getTime() - startTime.getTime()
            const elapsedHours = elapsedMs / (1000 * 60 * 60)
            totalHours += elapsedHours
          }
        })

        // Actualizar horas totales
        setTotalHoursWithActive(totalHours)

        // El progreso se basa solo en el estado de la tarea, no en horas trabajadas
        // Solo actualizar si la tarea está completada y el progreso no es 100%
        if (task.status === 'completed' && progressPercentage !== 100) {
          setProgressPercentage(100)
          updateProjectTask(task.id, { progressPercentage: 100 }, true)
        }

        // Actualizar fecha de inicio si no existe y hay entradas de tiempo
        if (!task.startDate && firstEntryStartTime) {
          // Usar fecha local para evitar problemas de zona horaria
          const date = new Date(firstEntryStartTime)
          // Obtener año, mes y día en la zona horaria local
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const startDate = `${year}-${month}-${day}`
          
          setTaskStartDate(startDate)
          
          // Actualizar en la base de datos
          try {
            await supabase
              .from('project_tasks')
              .update({ start_date: startDate })
              .eq('id', task.id)
            
            // Actualizar estado local del task
            setTask((prev: any) => ({ ...prev, startDate }))
          } catch (err) {
            console.error('Error actualizando fecha de inicio:', err)
          }
        }
      } catch (err) {
        console.error('Error loading time entries:', err)
      }
    }

    if (task) {
      loadTimeEntriesAndCalculate()
      
      // Actualizar cada 30 segundos para sesiones activas
      const interval = setInterval(loadTimeEntriesAndCalculate, 30000)
      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, task?.taskId, task?.estimatedHours, task?.startDate, projectId, refreshTimeEntries])

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

    // Primero, cerrar todas las sesiones activas de esta tarea
    try {
      const now = new Date()
      const { data: activeEntries, error: fetchError } = await supabase
        .from('time_entries')
        .select('id, start_time')
        .eq('task_id', task.taskId)
        .eq('project_id', projectId)
        .is('end_time', null)

      if (fetchError) {
        console.error('Error fetching active sessions:', fetchError)
      } else if (activeEntries && activeEntries.length > 0) {
        // Cerrar todas las sesiones activas
        for (const entry of activeEntries) {
          const startTime = new Date(entry.start_time)
          const elapsedMs = now.getTime() - startTime.getTime()
          const elapsedHours = elapsedMs / (1000 * 60 * 60)
          
          await supabase
            .from('time_entries')
            .update({
              end_time: now.toISOString(),
              hours: elapsedHours,
              description: entry.description || 'Sesión cerrada al completar la tarea'
            })
            .eq('id', entry.id)
        }
      }
    } catch (err) {
      console.error('Error closing active sessions:', err)
    }

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
    // Dar un pequeño delay para asegurar que la BD se haya actualizado completamente
    setTimeout(() => {
      setRefreshTimeEntries(prev => prev + 1)
    }, 500)
    
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
              progressPercentage: progressPercentage,
              startDate: taskStartDate || task.startDate,
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
"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Square } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { StopTaskModal } from './stop-task-modal'

interface TimeTrackerProps {
  operarioId: string
  taskId: string
  projectId: string
  onTimeEntryCreate?: (entry: any) => void
  onProgressUpdate?: (progress: number) => void
  onTaskComplete?: () => void
  onTotalHoursUpdate?: (totalHours: number) => void
}

export function TimeTracker({ operarioId, taskId, projectId, onTimeEntryCreate, onProgressUpdate, onTaskComplete, onTotalHoursUpdate }: TimeTrackerProps) {
  const { user } = useAuth()
  const [isTracking, setIsTracking] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentTask, setCurrentTask] = useState<any>(null)
  const [totalHoursWorked, setTotalHoursWorked] = useState(0)
  const [lastSentProgress, setLastSentProgress] = useState<number | null>(null)
  const [isNearLimit, setIsNearLimit] = useState(false)
  const [currentTimeEntryId, setCurrentTimeEntryId] = useState<string | null>(null)
  
  // Límite máximo: 2 horas extra del tiempo estimado (en milisegundos)
  const MAX_EXTRA_TIME = 2 * 60 * 60 * 1000 // 2 horas extra

  // Función para verificar si el operario tiene sesiones activas en otras tareas/proyectos
  const checkGlobalActiveSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', operarioId)
        .is('end_time', null)
        .order('start_time', { ascending: false })

      if (error) {
        console.error('Error checking global active sessions:', error)
        return []
      }

      return data || []
    } catch (err) {
      console.error('Error checking global active sessions:', err)
      return []
    }
  }

  // Función para cerrar sesiones activas existentes
  const closeExistingSessions = async (excludeTaskId?: string, excludeProjectId?: string) => {
    try {
      const activeSessions = await checkGlobalActiveSessions()
      
      for (const session of activeSessions) {
        // No cerrar la sesión actual si estamos en la misma tarea y proyecto
        if (session.task_id === excludeTaskId && session.project_id === excludeProjectId) {
          continue
        }

        const endTime = new Date()
        const startTime = new Date(session.start_time)
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)

        // Cerrar la sesión existente
        const { error } = await supabase
          .from('time_entries')
          .update({
            end_time: endTime.toISOString(),
            description: 'Sesión cerrada automáticamente al iniciar nueva tarea',
            hours: hours
          })
          .eq('id', session.id)

        if (error) {
          console.error('Error closing existing session:', error)
        }
      }
    } catch (err) {
      console.error('Error closing existing sessions:', err)
    }
  }

  // Función para cargar sesión activa desde la base de datos
  const loadActiveSession = async () => {
    if (!currentTask?.task_id) {
      return
    }

    try {
      // Buscar sesión activa específica para esta tarea y proyecto
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', operarioId)
        .eq('task_id', currentTask.task_id)
        .eq('project_id', projectId)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)

      if (data && data.length > 0 && !error) {
        const activeSession = data[0]
        // Recuperar sesión activa
        const startTime = new Date(activeSession.start_time)
        const now = new Date()
        const sessionElapsedTime = now.getTime() - startTime.getTime()
        
        setStartTime(startTime)
        setElapsedTime(sessionElapsedTime) // Solo el tiempo de esta sesión
        setIsTracking(true)
        setCurrentTimeEntryId(activeSession.id)
      }
    } catch (err) {
      // No active session found for this task
    }
  }

  // Función para completar tarea automáticamente cuando se alcanza el tiempo estimado
  const completeTaskAutomatically = async () => {
    if (!currentTask || !currentTimeEntryId) return

    try {
      const endTime = new Date()
      const hours = elapsedTime / (1000 * 60 * 60)
      
      if (hours > 0) {
        // Completar la entrada de tiempo existente
        const { error: timeError } = await supabase
          .from('time_entries')
          .update({
            end_time: endTime.toISOString(),
            description: 'Tarea completada automáticamente al alcanzar límite de tiempo',
            hours: hours
          })
          .eq('id', currentTimeEntryId)

        if (timeError) {
          console.error('Error updating final time entry:', timeError)
        }

        // Actualizar horas trabajadas en project_tasks
        const newTotalHours = totalHoursWorked + hours
        const { error: updateError } = await supabase
          .from('project_tasks')
          .update({ 
            actual_hours: newTotalHours,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentTask.id)

        if (updateError) {
          console.error('Error updating actual_hours:', updateError)
        }

        // Marcar tarea como completada
        const { error: completeError } = await supabase
          .from('project_tasks')
          .update({
            status: 'completed',
            actual_hours: newTotalHours,
            end_date: new Date().toISOString().split('T')[0],
            progress_percentage: 100,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentTask.id)

        if (completeError) {
          console.error('Error completing task:', completeError)
        } else {
          // Limpiar estado local
          setCurrentTimeEntryId(null)
          setIsTracking(false)
          setStartTime(null)
          setElapsedTime(0)
          
          // Notificar al componente padre
          onTaskComplete?.()
          
        }
      }
    } catch (err) {
      console.error('Error completing task automatically:', err)
    }
  }

  // Cargar información de la tarea actual
  useEffect(() => {
    const fetchCurrentTask = async () => {
      try {
        const { data, error } = await supabase
          .from('project_tasks')
          .select(`
            id,
            task_id,
            project_id,
            status,
            task:task_id (
              id,
              title,
              description,
              estimated_hours
            )
          `)
          .eq('id', taskId)
          .single()

        if (error) {
          console.error('TimeTracker - Supabase error:', error)
          throw error
        }
        setCurrentTask(data)
      } catch (err) {
        console.error('TimeTracker - Error fetching current task:', err)
        setCurrentTask(null)
      }
    }

    if (taskId) {
      fetchCurrentTask()
    }
  }, [taskId])

  // Cargar sesión activa después de que currentTask esté disponible
  useEffect(() => {
    const loadActiveSessionAndValidate = async () => {
      if (!currentTask?.task_id) return

      // Primero verificar si hay sesiones activas en otras tareas
      const activeSessions = await checkGlobalActiveSessions()
      const otherActiveSessions = activeSessions.filter(session => 
        session.task_id !== currentTask.task_id || session.project_id !== currentTask.project_id
      )

      if (otherActiveSessions.length > 0) {
        // Se detectaron sesiones activas en otras tareas al cargar el componente
      }

      // Cargar la sesión activa para esta tarea específica
      await loadActiveSession()
    }

    loadActiveSessionAndValidate()
  }, [currentTask?.task_id, operarioId])

  // Cargar horas trabajadas y calcular progreso
  useEffect(() => {
    const fetchTotalHours = async () => {
      if (!currentTask?.task_id) return

      try {
        const { data, error } = await supabase
          .from('time_entries')
          .select('hours')
          .eq('task_id', currentTask.task_id)
          .eq('user_id', operarioId)
          .eq('project_id', projectId)

        if (error) throw error

        const totalHours = data?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0
        setTotalHoursWorked(totalHours)

        // Calcular progreso basado en horas trabajadas vs estimadas
        if (currentTask.task?.estimated_hours && currentTask.task.estimated_hours > 0) {
          const progress = Math.min((totalHours / currentTask.task.estimated_hours) * 100, 100)
          onProgressUpdate?.(Math.round(progress))
        }
      } catch (err) {
        console.error('Error fetching total hours:', err)
      }
    }

    fetchTotalHours()
  }, [currentTask, operarioId]) // Removido onProgressUpdate de las dependencias

  // Efecto separado para actualizar progreso cuando cambien las horas trabajadas
  useEffect(() => {
    if (currentTask?.task?.estimated_hours && currentTask.task.estimated_hours > 0) {
      // Calcular progreso incluyendo la sesión activa
      const activeSessionHours = isTracking && elapsedTime > 0 ? elapsedTime / (1000 * 60 * 60) : 0
      const totalHoursWithActive = totalHoursWorked + activeSessionHours
      const progress = Math.min((totalHoursWithActive / currentTask.task.estimated_hours) * 100, 100)
      const roundedProgress = Math.round(progress)
      
      // Enviar tiempo total actualizado
      onTotalHoursUpdate?.(totalHoursWithActive)
      
      // Solo actualizar si el progreso ha cambiado significativamente y no es el mismo que ya enviamos
      if (roundedProgress !== lastSentProgress && Math.abs(roundedProgress - (currentTask.progressPercentage || 0)) > 1) {
        setLastSentProgress(roundedProgress)
        onProgressUpdate?.(roundedProgress)
      }
    }
  }, [totalHoursWorked, elapsedTime, isTracking, currentTask?.task?.estimated_hours, currentTask?.progressPercentage, lastSentProgress, onProgressUpdate, onTotalHoursUpdate])

  // Refrescar horas trabajadas cuando se crea una nueva entrada
  useEffect(() => {
    const refreshHours = async () => {
      if (!currentTask?.task_id) return

      try {
        const { data, error } = await supabase
          .from('time_entries')
          .select('hours')
          .eq('task_id', currentTask.task_id)
          .eq('user_id', operarioId)
          .eq('project_id', projectId)

        if (error) throw error

        const totalHours = data?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0
        setTotalHoursWorked(totalHours)
      } catch (err) {
        console.error('Error refreshing hours:', err)
      }
    }

    // Refrescar después de un breve delay para permitir que la BD se actualice
    const timeoutId = setTimeout(refreshHours, 2000)
    return () => clearTimeout(timeoutId)
  }, [onTimeEntryCreate, currentTask?.task_id, operarioId])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isTracking && startTime) {
      interval = setInterval(() => {
        const now = Date.now()
        const sessionElapsedTime = now - startTime.getTime()
        
        // Calcular tiempo total trabajado (sesiones anteriores + sesión actual)
        const activeSessionHours = sessionElapsedTime / (1000 * 60 * 60)
        const totalWorkedHours = totalHoursWorked + activeSessionHours
        
        // Verificar límites de tiempo basado en tiempo total trabajado
        let maxTotalHours = MAX_EXTRA_TIME / (1000 * 60 * 60) // Límite por defecto: 2 horas
        let warningThreshold = maxTotalHours * 0.9 // 90% del límite por defecto
        
        // Si la tarea tiene tiempo estimado, usar tiempo estimado + 2 horas extra
        if (currentTask?.task?.estimated_hours) {
          const estimatedHours = currentTask.task.estimated_hours
          
          // Tiempo estimado + 2 horas extra máximo
          maxTotalHours = estimatedHours + (MAX_EXTRA_TIME / (1000 * 60 * 60))
          warningThreshold = maxTotalHours * 0.9 // 90% del límite total
        }
        
        // Mostrar advertencia cuando se acerque al límite
        if (totalWorkedHours >= warningThreshold && totalWorkedHours < maxTotalHours) {
          setIsNearLimit(true)
        } else {
          setIsNearLimit(false)
        }
        
        // Detener automáticamente si se alcanza el límite de tiempo total trabajado
        if (totalWorkedHours >= maxTotalHours) {
          setIsTracking(false)
          setElapsedTime(sessionElapsedTime)
          setIsNearLimit(false)
          if (interval) clearInterval(interval)
          
          // Marcar tarea como completada automáticamente
          completeTaskAutomatically()
          return
        }
        
        setElapsedTime(sessionElapsedTime)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTracking, startTime, currentTask?.task?.estimated_hours, totalHoursWorked])


  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`
  }

  const handleStart = async () => {
    if (!taskId || !currentTask) {
      return
    }

    // Verificar si ya hay una sesión activa para esta tarea específica
    if (isTracking && currentTimeEntryId) {
      return
    }

    // Verificar si hay sesiones activas en otras tareas/proyectos
    const activeSessions = await checkGlobalActiveSessions()
    const otherActiveSessions = activeSessions.filter(session => 
      session.task_id !== currentTask.task_id || session.project_id !== currentTask.project_id
    )

    if (otherActiveSessions.length > 0) {
      // Cerrar sesiones existentes en otras tareas/proyectos
      await closeExistingSessions(currentTask.task_id, currentTask.project_id)
    }

    const now = new Date()
    
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          user_id: operarioId,
          task_id: currentTask.task_id,
          project_id: currentTask.project_id,
          start_time: now.toISOString(),
          end_time: null,
          description: 'Sesión de trabajo iniciada',
          date: now.toISOString().split("T")[0],
        })
        .select()
        .single()

      if (error) throw error

      setCurrentTimeEntryId(data.id)
      setStartTime(now)
      setIsTracking(true)
      setElapsedTime(0)
      
    } catch (err) {
      console.error('Error starting session:', err)
    }
  }

  // Estado para el modal de detener
  const [showStopModal, setShowStopModal] = useState(false)

  const handleStop = () => {
    // Mostrar modal para escribir nota
    setShowStopModal(true)
  }

  const handleConfirmStop = async (reason: string) => {
    if (!currentTimeEntryId) return

    const endTime = new Date()
    const hours = elapsedTime / (1000 * 60 * 60)

    try {
      // Completar la entrada existente
      const { data, error } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime.toISOString(),
          description: reason,
          hours: hours
        })
        .eq('id', currentTimeEntryId)
        .select()
        .single()

      if (error) {
        console.error('Error updating time entry on stop:', error)
        throw error
      }

      onTimeEntryCreate?.(data)

      // Actualizar horas trabajadas
      const newTotalHours = totalHoursWorked + hours
      setTotalHoursWorked(newTotalHours)

      // Actualizar actual_hours en la tabla project_tasks
      try {
        const { error: updateError } = await supabase
          .from('project_tasks')
          .update({ 
            actual_hours: newTotalHours,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentTask.id)

        if (updateError) {
          console.error('Error updating actual_hours:', updateError)
        }
      } catch (err) {
        console.error('Error updating actual_hours:', err)
      }

      if (currentTask.task?.estimated_hours && currentTask.task.estimated_hours > 0) {
        const progress = Math.min((newTotalHours / currentTask.task.estimated_hours) * 100, 100)
        onProgressUpdate?.(Math.round(progress))
      }

      // Limpiar estado local
      setCurrentTimeEntryId(null)
      setIsTracking(false)
      setStartTime(null)
      setElapsedTime(0)
      setShowStopModal(false)
      
    } catch (err) {
      console.error('Error stopping session:', err)
    }
  }

  const handleCancelStop = () => {
    setShowStopModal(false)
  }

  return (
    <div className="space-y-4">

        {/* Cronómetro */}
        <div className="text-center space-y-6">
          {/* Estado de trabajo */}
          {isTracking && (
            <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4">
              <p className="text-xl font-bold text-green-800 flex items-center justify-center gap-2">
                TRABAJANDO AHORA
              </p>
            </div>
          )}
          
          <div className={`text-4xl sm:text-5xl font-mono font-bold ${isNearLimit ? 'text-orange-500' : isTracking ? 'text-green-600' : 'text-gray-600'}`}>
            {formatTime(elapsedTime)}
          </div>
          
          {/* Advertencia de límite */}
          {isNearLimit && (
            <div className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-2 rounded-lg">
              <p className="text-sm font-medium">
                ⚠️ Te estás acercando al límite de tiempo
                {currentTask?.task?.estimated_hours 
                  ? ` (${currentTask.task.estimated_hours}h estimadas + 2h extra)`
                  : ' (máximo 2 horas)'
                }
              </p>
            </div>
          )}
          
          {/* Horas trabajadas */}
          {currentTask?.task?.estimated_hours && (
            <div className="text-sm text-muted-foreground space-y-1">
              {isTracking && elapsedTime > 0 && (
                <div className="text-blue-600">
                  <span className="font-medium">{(() => {
                    const activeHours = elapsedTime / (1000 * 60 * 60)
                    const hours = Math.floor(activeHours)
                    const minutes = Math.round((activeHours - hours) * 60)
                    
                    if (hours === 0) {
                      return `${minutes}min`
                    } else if (minutes === 0) {
                      return `${hours}hs`
                    } else {
                      return `${hours}hs ${minutes}min`
                    }
                  })()}</span> en sesión activa
                </div>
              )}
              
              <div className="text-xs">
                Total: <span className="font-medium">{(() => {
                  const activeSessionHours = isTracking && elapsedTime > 0 ? elapsedTime / (1000 * 60 * 60) : 0
                  const totalHours = totalHoursWorked + activeSessionHours
                  const hours = Math.floor(totalHours)
                  const minutes = Math.round((totalHours - hours) * 60)
                  
                  if (hours === 0) {
                    return `${minutes}min`
                  } else if (minutes === 0) {
                    return `${hours}hs`
                  } else {
                    return `${hours}hs ${minutes}min`
                  }
                })()}</span> de {currentTask.task.estimated_hours}hs estimadas
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {!isTracking ? (
              <Button 
                onClick={handleStart}
                disabled={!currentTask}
                className="flex items-center gap-3 w-full sm:w-auto h-16 text-xl font-bold bg-green-600 hover:bg-green-700"
              >
                <Play className="h-6 w-6" />
                INICIAR TRABAJO {!currentTask ? '(Cargando...)' : ''}
              </Button>
            ) : (
              <Button 
                onClick={handleStop}
                className="flex items-center gap-3 w-full sm:w-auto h-16 text-xl font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                <Square className="h-6 w-6" />
                DETENER TRABAJO
              </Button>
            )}
          </div>
        </div>

        {/* Modal de Detener */}
        <StopTaskModal
          isOpen={showStopModal}
          onClose={handleCancelStop}
          onConfirm={handleConfirmStop}
          elapsedTime={elapsedTime}
          formatTime={formatTime}
        />

    </div>
  )
}
"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play, Pause, Square, Clock } from 'lucide-react'
import { useProjectTasks } from '@/hooks/use-project-tasks'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

interface TimeTrackerProps {
  operarioId: string
  taskId: string
  onTimeEntryCreate?: (entry: any) => void
  onProgressUpdate?: (progress: number) => void
}

export function TimeTracker({ operarioId, taskId, onTimeEntryCreate, onProgressUpdate }: TimeTrackerProps) {
  const { user } = useAuth()
  const [isTracking, setIsTracking] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentTask, setCurrentTask] = useState<any>(null)
  const [totalHoursWorked, setTotalHoursWorked] = useState(0)
  const [lastSentProgress, setLastSentProgress] = useState<number | null>(null)
  const [isNearLimit, setIsNearLimit] = useState(false)

  // Clave única para localStorage basada en operario y tarea
  const timerStorageKey = `timer_${operarioId}_${taskId}`

  // Funciones para persistir el estado del cronómetro
  const saveTimerState = (isTracking: boolean, startTime: Date | null, elapsedTime: number) => {
    const timerState = {
      isTracking,
      startTime: startTime?.toISOString() || null,
      elapsedTime,
      savedAt: new Date().toISOString()
    }
    localStorage.setItem(timerStorageKey, JSON.stringify(timerState))
  }

  const loadTimerState = () => {
    try {
      const saved = localStorage.getItem(timerStorageKey)
      if (saved) {
        const timerState = JSON.parse(saved)
        const startTime = timerState.startTime ? new Date(timerState.startTime) : null
        
        // Verificar si el timer sigue siendo válido basado en el tiempo estimado de la tarea
        if (currentTask?.task?.estimated_hours && startTime) {
          const estimatedHours = currentTask.task.estimated_hours
          const maxElapsedTime = estimatedHours * 60 * 60 * 1000 // Convertir a milisegundos
          
          // Si el tiempo transcurrido supera el tiempo estimado, limpiar el estado
          if (timerState.elapsedTime > maxElapsedTime) {
            localStorage.removeItem(timerStorageKey)
            return null
          }
        }
        
        // Verificar si el estado no es muy viejo (máximo 7 días como fallback)
        const savedAt = new Date(timerState.savedAt)
        const now = new Date()
        const daysDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60 * 24)
        
        if (daysDiff < 7) {
          return {
            isTracking: timerState.isTracking,
            startTime,
            elapsedTime: timerState.elapsedTime
          }
        } else {
          // Limpiar estado muy viejo
          localStorage.removeItem(timerStorageKey)
        }
      }
    } catch (error) {
      console.error('Error loading timer state:', error)
    }
    return null
  }

  const clearTimerState = () => {
    localStorage.removeItem(timerStorageKey)
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

        if (error) throw error
        console.log('TimeTracker - Current task loaded:', data)
        setCurrentTask(data)
      } catch (err) {
        console.error('Error fetching current task:', err)
      }
    }

    fetchCurrentTask()
  }, [taskId])

  // Cargar estado del cronómetro al montar el componente
  useEffect(() => {
    const savedState = loadTimerState()
    if (savedState) {
      setIsTracking(savedState.isTracking)
      setStartTime(savedState.startTime)
      setElapsedTime(savedState.elapsedTime)
    }
  }, [taskId, operarioId])

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
      const progress = Math.min((totalHoursWorked / currentTask.task.estimated_hours) * 100, 100)
      const roundedProgress = Math.round(progress)
      
      // Solo actualizar si el progreso ha cambiado significativamente y no es el mismo que ya enviamos
      if (roundedProgress !== lastSentProgress && Math.abs(roundedProgress - (currentTask.progressPercentage || 0)) > 1) {
        setLastSentProgress(roundedProgress)
        onProgressUpdate?.(roundedProgress)
      }
    }
  }, [totalHoursWorked, currentTask?.task?.estimated_hours, currentTask?.progressPercentage, lastSentProgress, onProgressUpdate])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isTracking && startTime) {
      interval = setInterval(() => {
        const newElapsedTime = Date.now() - startTime.getTime()
        
        // Verificar si se ha alcanzado el tiempo estimado de la tarea
        if (currentTask?.task?.estimated_hours) {
          const estimatedHours = currentTask.task.estimated_hours
          const maxElapsedTime = estimatedHours * 60 * 60 * 1000 // Convertir a milisegundos
          const warningThreshold = maxElapsedTime * 0.9 // 90% del tiempo estimado
          
          // Mostrar advertencia cuando se acerque al límite
          if (newElapsedTime >= warningThreshold && newElapsedTime < maxElapsedTime) {
            setIsNearLimit(true)
          } else {
            setIsNearLimit(false)
          }
          
          if (newElapsedTime >= maxElapsedTime) {
            // Detener automáticamente el cronómetro
            setIsTracking(false)
            setElapsedTime(maxElapsedTime)
            setIsNearLimit(false)
            saveTimerState(false, startTime, maxElapsedTime)
            if (interval) clearInterval(interval)
            return
          }
        }
        
        setElapsedTime(newElapsedTime)
        // Guardar estado cada segundo
        saveTimerState(isTracking, startTime, newElapsedTime)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTracking, startTime, currentTask?.task?.estimated_hours])

  // Limpiar estado al desmontar el componente si no está tracking
  useEffect(() => {
    return () => {
      if (!isTracking) {
        clearTimerState()
      }
    }
  }, [isTracking])

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`
  }

  const handleStart = () => {
    console.log('TimeTracker - handleStart called', { taskId, currentTask })
    if (!taskId) {
      console.log('TimeTracker - No taskId provided')
      return
    }
    if (!currentTask) {
      console.log('TimeTracker - No currentTask loaded')
      return
    }

    const now = new Date()
    setStartTime(now)
    setIsTracking(true)
    setElapsedTime(0)
    saveTimerState(true, now, 0)
    console.log('TimeTracker - Timer started')
  }

  const handlePause = () => {
    setIsTracking(false)
    saveTimerState(false, startTime, elapsedTime)
  }

  const handleStop = async () => {
    if (!startTime || !taskId || !currentTask) return

    const endTime = new Date()
    const hours = elapsedTime / (1000 * 60 * 60)

    const timeEntry = {
      user_id: operarioId,
      task_id: currentTask.task_id,
      project_id: currentTask.project_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      description: "",
      date: startTime.toISOString().split("T")[0],
    }

    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert(timeEntry)
        .select()

      if (error) {
        console.error('Error creating time entry:', error)
        throw error
      }

      console.log('Time entry created successfully:', data)
      onTimeEntryCreate?.(timeEntry)

      // Actualizar horas trabajadas y progreso
      const newTotalHours = totalHoursWorked + hours
      setTotalHoursWorked(newTotalHours)

      if (currentTask.task?.estimated_hours && currentTask.task.estimated_hours > 0) {
        const progress = Math.min((newTotalHours / currentTask.task.estimated_hours) * 100, 100)
        onProgressUpdate?.(Math.round(progress))
      }

      // Reset state
      setIsTracking(false)
      setStartTime(null)
      setElapsedTime(0)
      clearTimerState()
    } catch (err) {
      console.error('Error creating time entry:', err)
    }
  }

  return (
    <div className="space-y-4">

        {/* Cronómetro */}
        <div className="text-center space-y-4">
          <div className={`text-4xl font-mono font-bold ${isNearLimit ? 'text-orange-500' : ''}`}>
            {formatTime(elapsedTime)}
          </div>
          
          {/* Advertencia de límite */}
          {isNearLimit && (
            <div className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-2 rounded-lg">
              <p className="text-sm font-medium">
                ⚠️ Te estás acercando al tiempo estimado de la tarea
              </p>
            </div>
          )}
          
          {/* Horas trabajadas */}
          {currentTask?.task?.estimated_hours && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{totalHoursWorked.toFixed(1)}h</span> trabajadas de {currentTask.task.estimated_hours}h estimadas
            </div>
          )}
          
          <div className="flex justify-center gap-2">
            {!isTracking ? (
              <Button 
                onClick={handleStart}
                disabled={!currentTask}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Iniciar
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handlePause}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Pause className="h-4 w-4" />
                  Pausar
                </Button>
                <Button 
                  onClick={handleStop}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Detener
                </Button>
              </>
            )}
          </div>
        </div>

    </div>
  )
}
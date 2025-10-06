"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Play, Square, User, ExternalLink, ArrowRight, Zap } from 'lucide-react'
import { useTaskSelfAssignment } from '@/hooks/use-task-self-assignment'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { TaskCollaborators } from './task-collaborators'
import type { ProjectTask } from '@/lib/types'

interface TaskSelfAssignmentProps {
  projectTasks: ProjectTask[]
  projectId: string
  projectOperarios: Array<{ id: string; name: string; role: string }>
  onTaskUpdate?: () => void
}

export function TaskSelfAssignment({ projectTasks, projectId, projectOperarios, onTaskUpdate }: TaskSelfAssignmentProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { loading, selfAssignTask, startTask, unassignTask, completeTask } = useTaskSelfAssignment()
  const [calculatedHours, setCalculatedHours] = useState<Record<string, number>>({})
  const [completingTask, setCompletingTask] = useState<ProjectTask | null>(null)
  const [actualHours, setActualHours] = useState(0)
  const [notes, setNotes] = useState('')

  // Calcular horas reales desde time_entries
  useEffect(() => {
    const calculateAllHours = async () => {
      const hoursMap: Record<string, number> = {}
      
      for (const task of projectTasks) {
        if (task.taskId) {
          const realHours = await calculateActualHours(task.taskId)
          hoursMap[task.id] = realHours
        }
      }
      
      setCalculatedHours(hoursMap)
    }

    if (projectTasks.length > 0) {
      calculateAllHours()
    }
  }, [projectTasks])

  // Filtrar tareas por estado
  const availableTasks = projectTasks.filter(task => task.status === 'pending')
  const myAssignedTasks = projectTasks.filter(task => 
    task.assignedTo === user?.id && task.status === 'assigned'
  )
  const myTasks = projectTasks.filter(task => 
    task.assignedTo === user?.id && task.status === 'in_progress'
  )
  const completedTasks = projectTasks.filter(task => 
    task.assignedTo === user?.id && task.status === 'completed'
  )


  const handleSelfAssign = async (projectTaskId: string) => {
    if (!user?.id) return

    const result = await selfAssignTask({
      projectTaskId,
      userId: user.id
    })

    if (result.success) {
      onTaskUpdate?.()
    }
  }

  const handleStartTask = async (projectTaskId: string) => {
    const result = await startTask(projectTaskId)
    if (result.success) {
      onTaskUpdate?.()
    }
  }

  const handleUnassign = async (projectTaskId: string) => {
    const result = await unassignTask(projectTaskId)
    if (result.success) {
      onTaskUpdate?.()
    }
  }

  const handleComplete = async () => {
    if (!completingTask) return

    const result = await completeTask(completingTask.id, actualHours, notes)
    if (result.success) {
      setCompletingTask(null)
      setActualHours(0)
      setNotes('')
      onTaskUpdate?.()
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />
      case 'pending': return <Play className="h-4 w-4 text-yellow-500" />
      default: return <Play className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatHours = (hours: number) => {
    if (hours < 0.0001) {
      return '< 1m'
    }
    
    const totalMinutes = Math.round(hours * 60)
    const totalHours = Math.floor(hours)
    const minutes = totalMinutes % 60
    
    if (totalHours === 0) {
      return `${minutes}m`
    } else if (minutes === 0) {
      return `${totalHours}h`
    } else {
      return `${totalHours}h ${minutes}m`
    }
  }

  // Función para calcular horas reales desde time_entries
  const calculateActualHours = async (taskId: string) => {
    try {
      const { data: timeEntries, error } = await supabase
        .from('time_entries')
        .select('hours')
        .eq('task_id', taskId)

      if (error) throw error

      const totalHours = timeEntries?.reduce((sum, entry) => sum + parseFloat(entry.hours || 0), 0) || 0
      return totalHours
    } catch (err) {
      console.error('Error calculating actual hours:', err)
      return 0
    }
  }

  return (
    <div className="space-y-6">
      {/* Mis Tareas Asignadas (Listas para empezar) */}
      {myAssignedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Mis Tareas Asignadas
            </CardTitle>
            <CardDescription>
              Tareas que has tomado y están listas para empezar a trabajar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myAssignedTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{task.task?.title || 'Tarea sin título'}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.task?.description || 'Sin descripción'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                      >
                        Asignada
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {task.task?.estimatedHours || 0}h estimadas
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStartTask(task.id)}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar Trabajo
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnassign(task.id)}
                      disabled={loading}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Devolver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mis Tareas en Progreso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Mis Tareas en Progreso
          </CardTitle>
          <CardDescription>
            Tareas en las que estás trabajando activamente con cronómetro
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myTasks.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tienes tareas en progreso</h3>
              <p className="text-muted-foreground">
                {myAssignedTasks.length > 0 
                  ? 'Inicia una tarea asignada o toma una nueva de "Tareas Disponibles"'
                  : 'Toma una tarea de la sección "Tareas Disponibles"'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{task.task?.title || 'Tarea sin título'}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.task?.description || 'Sin descripción'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(task.status)}`}
                      >
                        En Progreso
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatHours(calculatedHours[task.id] || 0)} trabajadas de {task.task?.estimatedHours || 0}h estimadas
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <TaskCollaborators 
                      projectTask={task} 
                      projectOperarios={projectOperarios}
                      onUpdate={onTaskUpdate}
                    />
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => {
                        router.push(`/projects/${projectId}/task/${task.id}`)
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Continuar Trabajando
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnassign(task.id)}
                      disabled={loading}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Devolver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tareas Completadas */}
      {completedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Tareas Completadas
            </CardTitle>
            <CardDescription>
              Tareas que has terminado en este proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{task.task?.title || 'Tarea sin título'}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.task?.description || 'Sin descripción'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(task.status)}`}
                      >
                        Completada
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatHours(calculatedHours[task.id] || 0)} trabajadas
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tareas Disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Tareas Disponibles
          </CardTitle>
          <CardDescription>
            Tareas que puedes tomar para trabajar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableTasks.length === 0 ? (
            <div className="text-center py-8">
              <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay tareas disponibles</h3>
              <p className="text-muted-foreground">
                Todas las tareas han sido asignadas o están en progreso
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{task.task?.title || 'Tarea sin título'}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.task?.description || 'Sin descripción'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {task.task?.category || 'Sin categoría'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {task.task?.estimatedHours || 0}h estimadas
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSelfAssign(task.id)}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Tomar Tarea
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useProjectsPrisma } from "@/hooks/use-projects-prisma"
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard"
import { supabase } from "@/lib/supabase"
import { 
  ArrowLeft, 
  Target, 
  Timer, 
  Clock, 
  Calendar, 
  Users, 
  TrendingUp,
  Activity,
  FileText,
  User
} from "lucide-react"

interface ActiveSession {
  startTime: string
  elapsedHours: number
  operarioId: string
}

export default function TaskMetricsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string
  const taskId = params?.taskId as string
  const { projects, loading, refetch } = useProjectsPrisma()
  
  const project = projects?.find(p => p.id === projectId)
  const projectTask = project?.projectTasks?.find(pt => pt.id === taskId)
  const task = projectTask?.task

  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [calculatedHours, setCalculatedHours] = useState(0)
  const [loadingMetrics, setLoadingMetrics] = useState(true)
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [operarioName, setOperarioName] = useState<string>('')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [taskState, setTaskState] = useState<any>(null)

  useEffect(() => {
    if (projectTask) {
      setTaskState({
        startedByUser: projectTask.startedByUser,
        startedAt: projectTask.startedAt,
        completedByUser: projectTask.completedByUser,
        completedAt: projectTask.completedAt
      })
    }
  }, [projectTask])

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha'
    
    const date = dateString.includes('T') 
      ? new Date(dateString) 
      : new Date(dateString + 'T00:00:00')
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (hours: number) => {
    if (hours < 0.0001) return '< 1m'
    if (hours < 1) {
      const minutes = Math.round(hours * 60)
      return minutes < 1 ? '< 1m' : `${minutes}m`
    }
    return `${hours % 1 === 0 ? hours : hours.toFixed(1)}hs`
  }

  const formatWorkedTime = (hours: number) => {
    const totalMinutes = Math.round(hours * 60)
    const hoursPart = Math.floor(totalMinutes / 60)
    const minutesPart = totalMinutes % 60
    
    if (hoursPart === 0) {
      return `${minutesPart}min`
    } else if (minutesPart === 0) {
      return `${hoursPart}h`
    } else {
      return `${hoursPart}h ${minutesPart}min`
    }
  }

  // Función para formatear tiempo transcurrido
  const formatElapsedTime = (elapsedHours: number) => {
    const hours = Math.floor(elapsedHours)
    const minutes = Math.round((elapsedHours - hours) * 60)
    
    if (hours === 0) {
      return `${minutes}min`
    } else if (minutes === 0) {
      return `${hours}h`
    } else {
      return `${hours}h ${minutes}min`
    }
  }

  // Cargar métricas detalladas con tiempo real
  useEffect(() => {
    // Si aún estamos cargando proyectos, esperar
    if (loading) {
      return
    }

    // Si no hay projectTask después de cargar, detener loading
    if (!projectTask?.taskId) {
      setLoadingMetrics(false)
      return
    }

    const loadDetailedMetrics = async () => {
      setLoadingMetrics(true)
      try {
        // Cargar todas las entradas de tiempo (completadas y activas)
        const { data: entries, error } = await supabase
          .from('time_entries')
          .select(`
            *,
            user:users(name),
            task:tasks(title)
          `)
          .eq('task_id', projectTask.taskId)
          .eq('project_id', projectId)
          .order('start_time', { ascending: false })

        if (error) {
          console.error('Error loading time entries:', error)
        } else {
          setTimeEntries(entries || [])
          
          let totalHours = 0
          let currentActiveSession: ActiveSession | null = null

          // Calcular horas totales incluyendo sesiones activas
          entries?.forEach((entry: any) => {
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
              
              // Guardar información de sesión activa
              currentActiveSession = {
                startTime: entry.start_time,
                elapsedHours,
                operarioId: entry.user_id
              }
            }
          })

          setCalculatedHours(totalHours)
          setActiveSession(currentActiveSession)

          // El progreso se basa solo en el estado de la tarea, no en horas trabajadas
          // Solo actualizar si el estado es completed y el progreso no es 100%
          if (projectTask && projectTask.status === 'completed' && projectTask.progressPercentage !== 100) {
            try {
              await supabase
                .from('project_tasks')
                .update({ progress_percentage: 100 })
                .eq('id', projectTask.id)
            } catch (err) {
              console.error('Error actualizando progreso de tarea:', err)
            }
          }

          // Obtener nombre del operario si hay sesión activa
          if (currentActiveSession) {
            try {
              const { data: user, error: userError } = await supabase
                .from('users')
                .select('name')
                .eq('id', (currentActiveSession as ActiveSession).operarioId)
                .single()
              
              if (!userError && user) {
                setOperarioName(user.name)
              } else {
                setOperarioName('Operario desconocido')
              }
            } catch (err) {
              setOperarioName('Operario desconocido')
            }
          } else {
            setOperarioName('')
          }

          setLastUpdate(new Date())
        }
      } catch (err) {
        console.error('Error loading detailed metrics:', err)
      } finally {
        setLoadingMetrics(false)
      }
    }

    loadDetailedMetrics()
    
    // Actualizar cada 30 segundos para sesiones activas y cambios de estado
    const interval = setInterval(() => {
      if (projectTask?.taskId) {
        loadDetailedMetrics()
      }
    }, 30000)
    
    // Refrescar proyectos cada 30 segundos para detectar cambios de estado (como tareas completadas)
    const refreshInterval = setInterval(() => {
      if (refetch) {
        refetch()
      }
    }, 30000)
    
    return () => {
      clearInterval(interval)
      clearInterval(refreshInterval)
    }
  }, [loading, projectTask?.taskId, projectTask?.id]) // Depender de loading y valores estables

  // Si no hay proyecto o tarea después de cargar, mostrar error
  if (!loading && !loadingMetrics && (!project || !projectTask || !task)) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Tarea no encontrada</h3>
          <p className="text-muted-foreground mb-4">
            La tarea que buscas no existe o no tienes permisos para verla
          </p>
          <Button onClick={() => router.push(`/admin/projects/${projectId}/metrics`)} className="cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Métricas del Proyecto
          </Button>
        </div>
      </MainLayout>
    )
  }

  if (loading || loadingMetrics || !project || !projectTask || !task) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando métricas de la tarea...</p>
          </div>
        </div>
      </MainLayout>
    )
  }


  const actualHours = calculatedHours
  // Usar estimatedHours del projectTask (tiempo total del proyecto)
  // Si es 0 o no existe, calcularlo: task.estimatedHours * project.moduleCount
  let estimatedHours = projectTask.estimatedHours || 0
  if (estimatedHours === 0 && task?.estimatedHours && project?.moduleCount) {
    estimatedHours = task.estimatedHours * project.moduleCount
  } else if (estimatedHours === 0) {
    estimatedHours = task?.estimatedHours || 0
  }
  
  // El progreso se basa solo en el estado de la tarea, no en horas trabajadas
  let progressPercentage = projectTask.progressPercentage || 0
  if (projectTask.status === 'completed') {
    progressPercentage = 100
  } else if (projectTask.status === 'pending') {
    progressPercentage = 0
  }
  // Si está en "in_progress", mantener el progreso actual (no asignar un valor fijo)
  
  const efficiency = estimatedHours > 0 ? (actualHours / estimatedHours) * 100 : 0

  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push(`/admin/projects/${projectId}/metrics`)}
                className="cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
              <Badge 
                variant="outline" 
                className={`font-medium text-xs sm:text-sm ${
                  projectTask.status === 'completed' 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : projectTask.status === 'in_progress' 
                    ? 'bg-orange-50 text-orange-700 border-orange-200' 
                    : projectTask.status === 'pending'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                {projectTask.status === 'completed' ? 'Completada' : 
                 projectTask.status === 'in_progress' ? 'En Progreso' : 
                 projectTask.status === 'pending' ? 'Pendiente' : 
                 projectTask.status}
              </Badge>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold leading-tight break-words">{task.title}</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Métricas detalladas de la tarea
                {activeSession && (
                  <span className="ml-2 text-green-600 font-medium">
                    • {operarioName} trabajando ahora ({formatElapsedTime(activeSession.elapsedHours)})
                  </span>
                )}
              </p>
              <div className="text-xs text-muted-foreground mt-1">
                Actualizado: {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Información general de la tarea */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Target className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Tiempo Estimado</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold">{estimatedHours}hs</p>
                </div>
                
                <div className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Timer className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Tiempo Real</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold">{formatWorkedTime(actualHours)}</p>
                  {activeSession && (
                    <div className="text-xs text-green-600 font-medium">
                      Trabajando ahora: {formatElapsedTime(activeSession.elapsedHours)}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 p-3 border rounded-lg col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Eficiencia</span>
                  </div>
                  <div className="space-y-1">
                    {estimatedHours > 0 && (
                      <Badge variant="outline" className={`text-xs ${
                        actualHours <= estimatedHours 
                          ? 'text-green-600 border-green-300' 
                          : 'text-red-600 border-red-300'
                      }`}>
                        {(() => {
                          const diff = estimatedHours - actualHours
                          if (diff >= 0) {
                            return `Tiempo ahorrado: ${formatWorkedTime(diff)}`
                          } else {
                            return `Tiempo extra: ${formatWorkedTime(Math.abs(diff))}`
                          }
                        })()}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 p-3 border rounded-lg col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Activity className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Progreso</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold">{progressPercentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fechas y asignación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Fechas y Asignación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Fecha de Inicio</span>
                  </div>
                  <p className="font-medium text-sm sm:text-base">{formatDate(projectTask.startDate)}</p>
                  {(taskState?.startedByUser || projectTask.startedByUser) && (taskState?.startedAt || projectTask.startedAt) && (
                    <p className="text-xs text-muted-foreground">
                      Iniciada por: {(taskState?.startedByUser || projectTask.startedByUser)?.name} - {formatDateTime(taskState?.startedAt || projectTask.startedAt)}
                    </p>
                  )}
                  {projectTask.status === 'in_progress' && !(taskState?.startedByUser || projectTask.startedByUser) && (
                    <p className="text-xs text-muted-foreground italic">
                      Información de inicio no disponible
                    </p>
                  )}
                </div>
                
                <div className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Fecha de Fin</span>
                  </div>
                  <p className="font-medium text-sm sm:text-base">{formatDate(projectTask.endDate)}</p>
                  {(taskState?.completedByUser || projectTask.completedByUser) && (taskState?.completedAt || projectTask.completedAt) && (
                    <p className="text-xs text-muted-foreground">
                      Completada por: {(taskState?.completedByUser || projectTask.completedByUser)?.name} - {formatDateTime(taskState?.completedAt || projectTask.completedAt)}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2 p-3 border rounded-lg sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Operario Asignado</span>
                  </div>
                  <p className="font-medium text-sm sm:text-base truncate">
                    {projectTask.assignedUser?.name || 'Sin asignar'}
                  </p>
                  {activeSession && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">
                        {operarioName} trabajando ahora
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historial detallado de tiempo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historial Detallado de Tiempo
              </CardTitle>
              <CardDescription>
                Registro completo de todas las sesiones de trabajo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeEntries.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {timeEntries.map((entry, index) => (
                    <div key={entry.id} className="border rounded-lg p-3 sm:p-4">
                      {/* Indicador de sesión activa */}
                      {!entry.end_time && activeSession && activeSession.startTime === entry.start_time && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 font-medium">Sesión activa</span>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <span className="font-medium text-sm sm:text-base truncate">{entry.user?.name || 'Usuario desconocido'}</span>
                        </div>
                        <Badge variant="outline" className="text-xs self-start sm:self-auto">
                          {(() => {
                            if (entry.end_time) {
                              // Sesión completada - calcular tiempo desde start_time y end_time si hours no está disponible
                              let hours = entry.hours
                              if (!hours || hours === 0 || isNaN(hours)) {
                                const startTime = new Date(entry.start_time)
                                const endTime = new Date(entry.end_time)
                                const elapsedMs = endTime.getTime() - startTime.getTime()
                                hours = elapsedMs / (1000 * 60 * 60)
                              }
                              return formatWorkedTime(hours)
                            } else if (activeSession && activeSession.startTime === entry.start_time) {
                              // Sesión activa
                              return formatElapsedTime(activeSession.elapsedHours)
                            } else {
                              // Sesión sin end_time pero no activa (no debería pasar normalmente)
                              const startTime = new Date(entry.start_time)
                              const now = new Date()
                              const elapsedMs = now.getTime() - startTime.getTime()
                              const hours = elapsedMs / (1000 * 60 * 60)
                              return formatElapsedTime(hours)
                            }
                          })()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 min-w-0">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">Fecha: {formatDate(entry.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            Hora: {formatDateTime(entry.start_time)} - {
                              entry.end_time ? formatDateTime(entry.end_time) : 
                              activeSession && activeSession.startTime === entry.start_time ? 
                              'En curso' : 'Sin finalizar'
                            }
                          </span>
                        </div>
                      </div>
                      
                      {entry.description && (
                        <div className="mt-3 p-2 bg-muted rounded text-xs sm:text-sm">
                          <span className="font-medium">Descripción:</span> {entry.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay registros de tiempo</h3>
                  <p className="text-muted-foreground">
                    Esta tarea aún no tiene entradas de tiempo registradas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Colaboradores */}
          {projectTask.collaborators && projectTask.collaborators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Colaboradores
                </CardTitle>
                <CardDescription>
                  Operarios que han participado en esta tarea
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {projectTask.collaborators.map((collaborator: any) => (
                    <Badge key={collaborator.id} variant="outline" className="text-xs sm:text-sm">
                      <User className="h-3 w-3 mr-1" />
                      {collaborator.user?.name || 'Usuario'}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  )
}
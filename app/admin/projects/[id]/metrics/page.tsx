"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useProjects } from "@/hooks/use-projects"
import { AdminOnly } from "@/components/auth/route-guard"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Target, Timer, Clock, CheckCircle, AlertTriangle, Calendar, Users } from "lucide-react"
import Link from "next/link"

export default function ProjectMetricsPage() {
  const params = useParams()
  const projectId = params.id as string
  const { projects, loading } = useProjects()
  
  const project = projects.find(p => p.id === projectId)

  // Calcular horas reales desde time_entries
  const [calculatedHours, setCalculatedHours] = useState<Record<string, number>>({})

  useEffect(() => {
    const calculateAllHours = async () => {
      if (!project) return
      
      const hoursMap: Record<string, number> = {}
      
      for (const task of project.projectTasks) {
        if (task.taskId) {
          try {
            const { data: timeEntries, error } = await supabase
              .from('time_entries')
              .select('hours')
              .eq('task_id', task.taskId)

            if (error) {
              console.error('Error fetching time entries:', error)
              hoursMap[task.id] = 0
              continue
            }

            const totalHours = timeEntries?.reduce((sum, entry) => sum + parseFloat(entry.hours || 0), 0) || 0
            hoursMap[task.id] = totalHours
          } catch (err) {
            console.error('Error calculating hours for task:', task.id, err)
            hoursMap[task.id] = 0
          }
        } else {
          hoursMap[task.id] = 0
        }
      }
      
      setCalculatedHours(hoursMap)
    }

    if (project && project.projectTasks.length > 0) {
      calculateAllHours()
    }
  }, [project])

  // Función para determinar el color de eficiencia
  const getEfficiencyColor = (actualHours: number, estimatedHours: number) => {
    if (actualHours <= estimatedHours) return 'text-green-600' // Terminó antes o a tiempo
    return 'text-red-600'                                      // Terminó después del estimado
  }

  const getEfficiencyBgColor = (actualHours: number, estimatedHours: number) => {
    if (actualHours <= estimatedHours) return 'bg-green-100' // Terminó antes o a tiempo
    return 'bg-red-100'                                      // Terminó después del estimado
  }

  // Función para formatear fechas
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha'
    
    // Si la fecha viene en formato YYYY-MM-DD (sin hora), agregar tiempo local para evitar problemas de zona horaria
    const date = dateString.includes('T') 
      ? new Date(dateString) 
      : new Date(dateString + 'T00:00:00')
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "planning":
        return "bg-blue-500"
      case "paused":
        return "bg-yellow-500"
      case "completed":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  // Función para obtener el texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activo"
      case "planning":
        return "Planificación"
      case "paused":
        return "Pausado"
      case "completed":
        return "Completado"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid gap-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Proyecto no encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              El proyecto que buscas no existe o no tienes permisos para verlo
            </p>
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Calcular métricas del proyecto
  const totalTasks = project.projectTasks.length
  const completedTasks = project.projectTasks.filter((pt: any) => pt.status === 'completed').length
  const inProgressTasks = project.projectTasks.filter((pt: any) => pt.status === 'in_progress').length
  const pendingTasks = project.projectTasks.filter((pt: any) => pt.status === 'pending').length
  const totalOperarios = project.projectOperarios.length
  
  // Calcular horas totales estimadas y trabajadas
  const estimatedHours = project.projectTasks.reduce((sum: number, pt: any) => 
    sum + (pt.task?.estimatedHours || 0), 0
  )
  const actualHours = Math.round(Object.values(calculatedHours).reduce((sum: number, hours: number) => 
    sum + hours, 0
  ) * 100) / 100 // Redondear a 2 decimales para evitar problemas de precisión

  // Calcular progreso de tiempo estimado y eficiencia real
  const completedEstimatedHours = project.projectTasks
    .filter((pt: any) => pt.status === 'completed')
    .reduce((sum: number, pt: any) => sum + (pt.task?.estimatedHours || 0), 0)
  
  const completedActualHours = Math.round(project.projectTasks
    .filter((pt: any) => pt.status === 'completed')
    .reduce((sum: number, pt: any) => sum + (calculatedHours[pt.id] || 0), 0) * 100
  ) / 100

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{project.name}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Métricas detalladas del proyecto</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`} />
            <Badge variant="outline" className="text-xs sm:text-sm">{getStatusText(project.status)}</Badge>
          </div>
        </div>

        {/* Resumen del proyecto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Resumen del Proyecto
            </CardTitle>
            <CardDescription>
              Métricas generales y progreso del proyecto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Métricas generales */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-lg sm:text-2xl font-bold">{totalTasks}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Tareas</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-green-600">{completedTasks}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Completadas</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">{inProgressTasks}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">En Progreso</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-gray-600">{pendingTasks}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Pendientes</div>
              </div>
            </div>

            {/* Barras de progreso del proyecto */}
            <div className="space-y-4">
              {/* Progreso de Tareas */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                  <span className="flex items-center gap-1 text-sm">
                    <Target className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Progreso de Tareas</span>
                  </span>
                  <span className="font-semibold text-sm sm:text-base">
                    {totalTasks > 0 
                      ? `${Math.round((completedTasks / totalTasks) * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <Progress 
                  value={totalTasks > 0 
                    ? (completedTasks / totalTasks) * 100
                    : 0
                  } 
                  className="h-2" 
                />
              </div>

              {/* Tiempo Estimado Completado */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                  <span className="flex items-center gap-1 text-sm">
                    <Timer className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Tiempo Estimado Completado</span>
                  </span>
                  <span className="font-semibold text-sm sm:text-base">
                    {estimatedHours > 0 
                      ? `${completedEstimatedHours % 1 === 0 ? completedEstimatedHours : completedEstimatedHours}h de ${estimatedHours % 1 === 0 ? estimatedHours : estimatedHours}h`
                      : '0h de 0h'
                    }
                  </span>
                </div>
                <Progress 
                  value={estimatedHours > 0 
                    ? Math.min((completedEstimatedHours / estimatedHours) * 100, 100)
                    : 0
                  } 
                  className="h-2" 
                />
              </div>

              {/* Progreso Real del Proyecto */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <span className="flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Progreso Real</span>
                  </span>
                  {estimatedHours > 0 ? (
                    <div className="text-left sm:text-right">
                      <span className="font-semibold text-blue-600 text-sm sm:text-base">
                        {actualHours % 1 === 0 ? actualHours : actualHours.toFixed(1)}h trabajadas
                      </span>
                      <div className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 mt-1 inline-block">
                        {(() => {
                          const progress = (actualHours / estimatedHours) * 100
                          const remainingHours = estimatedHours - actualHours
                          const remainingFormatted = remainingHours % 1 === 0 ? remainingHours : remainingHours.toFixed(1)
                          return `${Math.round(progress)}% completado (${remainingFormatted}h restantes)`
                        })()}
                      </div>
                    </div>
                  ) : (
                    <span className="font-semibold text-gray-500 text-sm sm:text-base">Sin datos</span>
                  )}
                </div>
                {estimatedHours > 0 ? (
                  <Progress 
                    value={Math.min((actualHours / estimatedHours) * 100, 100)} 
                    className="h-2" 
                  />
                ) : (
                  <div className="h-2 bg-primary/20 rounded-full">
                  </div>
                )}
              </div>
            </div>

            {/* Información adicional */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{totalOperarios} operarios asignados</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">Inicio: {formatDate(project.startDate)}</span>
              </div>
              {project.endDate && (
                <div className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-1">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">Fin: {formatDate(project.endDate)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Distribución por operario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Distribución por Operario
            </CardTitle>
            <CardDescription>
              Resumen de tareas trabajadas por operario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                // Agrupar tareas por operario (solo las trabajadas)
                const operarioStats = project.projectTasks
                  .filter((pt: any) => pt.assignedUser) // Solo tareas trabajadas
                  .reduce((acc: any, pt: any) => {
                    const operarioName = pt.assignedUser.name
                    if (!acc[operarioName]) {
                      acc[operarioName] = {
                        name: operarioName,
                        total: 0,
                        completed: 0,
                        inProgress: 0,
                        assigned: 0,
                        pending: 0,
                        totalHours: 0,
                        actualHours: 0
                      }
                    }
                    acc[operarioName].total++
                    
                    // Contar por estado
                    if (pt.status === 'completed') acc[operarioName].completed++
                    else if (pt.status === 'in_progress') acc[operarioName].inProgress++
                    else if (pt.status === 'assigned') acc[operarioName].assigned++
                    else if (pt.status === 'pending') acc[operarioName].pending++
                    
                    acc[operarioName].totalHours += pt.task?.estimatedHours || 0
                    acc[operarioName].actualHours += calculatedHours[pt.id] || 0
                    return acc
                  }, {})

                // Contar tareas completadas sin operario asignado
                const completedWithoutOperario = project.projectTasks.filter((pt: any) => 
                  pt.status === 'completed' && !pt.assignedUser
                ).length

                const operarioStatsArray = Object.values(operarioStats)
                
                if (operarioStatsArray.length === 0 && completedWithoutOperario === 0) {
                  return (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No hay operarios trabajando</h3>
                      <p className="text-muted-foreground">
                        Ningún operario ha tomado tareas de este proyecto aún
                      </p>
                    </div>
                  )
                }

                return (
                  <>
                    {operarioStatsArray.map((stats: any) => (
                      <div key={stats.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {stats.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium truncate">{stats.name}</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {stats.total} tareas • {stats.totalHours % 1 === 0 ? stats.totalHours : stats.totalHours}h estimadas
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          {stats.inProgress > 0 && (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                              {stats.inProgress} en progreso
                            </Badge>
                          )}
                          {stats.assigned > 0 && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {stats.assigned} asignadas
                            </Badge>
                          )}
                          {stats.pending > 0 && (
                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                              {stats.pending} pendientes
                            </Badge>
                          )}
                          {stats.completed > 0 && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              {stats.completed} completadas
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {completedWithoutOperario > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg border-orange-200 bg-orange-50 gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                            ⚠️
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-orange-800 truncate">Tareas completadas sin operario</h4>
                            <p className="text-xs sm:text-sm text-orange-600">
                              {completedWithoutOperario} tareas completadas sin asignar a operario
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 self-start sm:self-auto">
                          {completedWithoutOperario} sin asignar
                        </Badge>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Métricas por tarea */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Métricas por Tarea
            </CardTitle>
            <CardDescription>
              Progreso detallado de cada tarea del proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {project.projectTasks
                .sort((a: any, b: any) => {
                  const statusOrder: Record<string, number> = { in_progress: 0, assigned: 1, pending: 2, completed: 3, cancelled: 4 }
                  return (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999)
                })
                .map((projectTask: any, index: number) => {
                const task = projectTask.task
                const actualHours = calculatedHours[projectTask.id] || 0
                const estimatedHours = task?.estimatedHours || 0
                const progressPercentage = projectTask.progressPercentage || 0
                
                return (
                  <div key={projectTask.id} className="border rounded-lg p-3 space-y-3 relative">
                    {/* Header compacto con numeración */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="font-semibold text-sm truncate">
                          {task?.title || 'Tarea sin título'}
                        </span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs font-medium self-start sm:self-auto ${
                          projectTask.status === 'completed' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : projectTask.status === 'in_progress' 
                            ? 'bg-orange-50 text-orange-700 border-orange-200' 
                            : projectTask.status === 'assigned'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : projectTask.status === 'pending'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {projectTask.status === 'completed' ? 'Completada' : 
                         projectTask.status === 'in_progress' ? 'En Progreso' : 
                         projectTask.status === 'assigned' ? 'Asignada' :
                         projectTask.status === 'pending' ? 'Pendiente' : 
                         projectTask.status}
                      </Badge>
                    </div>

                    {/* Información compacta */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
                      {/* Progreso */}
                      <div className="flex items-center gap-1 min-w-0">
                        <Target className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Progreso:</span>
                        <span className="font-semibold">
                          {projectTask.status === 'completed' ? '100%' : 
                           projectTask.status === 'in_progress' ? `${progressPercentage}%` : 
                           projectTask.status === 'pending' ? '0%' : 
                           '0%'}
                        </span>
                      </div>

                      {/* Tiempo estimado */}
                      <div className="flex items-center gap-1 min-w-0">
                        <Target className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Estimado:</span>
                        <span className="font-semibold">
                          {estimatedHours % 1 === 0 ? estimatedHours : estimatedHours}hs
                        </span>
                      </div>

                      {/* Operario asignado */}
                      <div className="flex items-center gap-1 min-w-0 sm:col-span-2">
                        <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Operario:</span>
                        {projectTask.assignedUser ? (
                          <Badge variant="secondary" className="text-xs truncate">
                            {projectTask.assignedUser.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Sin asignar
                          </Badge>
                        )}
                      </div>

                      {/* Tiempo trabajado */}
                      <div className="flex items-center gap-1 min-w-0 sm:col-span-2">
                        <Timer className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Trabajado:</span>
                        <span className="font-semibold">
                          {actualHours % 1 === 0 ? actualHours : actualHours}hs
                        </span>
                      </div>

                      {/* Fechas de inicio y fin */}
                      <div className="flex items-center gap-1 min-w-0">
                        <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Inicio:</span>
                        <span className="text-xs font-semibold truncate">
                          {projectTask.startDate ? formatDate(projectTask.startDate) : 'Sin fecha'}
                        </span>
                      </div>
                      
                      {projectTask.endDate && (
                        <div className="flex items-center gap-1 min-w-0">
                          <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Fin:</span>
                          <span className="text-xs font-semibold truncate">
                            {formatDate(projectTask.endDate)}
                          </span>
                        </div>
                      )}

                      {/* Colaboradores */}
                      {projectTask.collaborators && projectTask.collaborators.length > 0 && (
                        <div className="flex items-start gap-1 sm:col-span-2">
                          <Users className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="text-muted-foreground">Colaboradores:</span>
                            <div className="flex items-center gap-1 flex-wrap mt-1">
                              {projectTask.collaborators.slice(0, 2).map((collaborator: any) => (
                                <Badge key={collaborator.id} variant="outline" className="text-xs">
                                  {collaborator.user?.name || 'Usuario'}
                                </Badge>
                              ))}
                              {projectTask.collaborators.length > 2 && (
                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                  +{projectTask.collaborators.length - 2} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Eficiencia (solo para completadas) */}
                      {projectTask.status === 'completed' && (
                        <div className="flex flex-col gap-1 sm:col-span-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">Eficiencia:</span>
                            <span className={`font-semibold ${getEfficiencyColor(actualHours, estimatedHours)}`}>
                              {actualHours % 1 === 0 ? actualHours : actualHours}hs de {estimatedHours % 1 === 0 ? estimatedHours : estimatedHours}hs
                            </span>
                          </div>
                          <Badge variant="outline" className={`text-xs w-fit ${getEfficiencyColor(actualHours, estimatedHours)} border-current`}>
                            {(() => {
                              const diff = estimatedHours - actualHours
                              if (diff >= 0) {
                                const diffFormatted = diff % 1 === 0 ? diff : diff.toFixed(1)
                                return `Tiempo ahorrado: ${diffFormatted}hs`
                              } else {
                                const diffFormatted = Math.abs(diff) % 1 === 0 ? Math.abs(diff) : Math.abs(diff).toFixed(1)
                                return `Tiempo extra: ${diffFormatted}hs`
                              }
                            })()}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Botón Ver detalle */}
                    <div className="flex justify-end pt-2">
                      <Link href={`/admin/projects/${projectId}/metrics/task/${projectTask.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          Ver detalle
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

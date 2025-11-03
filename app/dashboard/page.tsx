"use client"

import { useState, useEffect } from 'react'
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useProjectsPrisma } from "@/hooks/use-projects-prisma"
import { useOperariosPrisma } from "@/hooks/use-operarios-prisma"
import { useClientsPrisma } from "@/hooks/use-clients-prisma"
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard"
import { supabase } from "@/lib/supabase"
import { FolderKanban, Users, Clock, TrendingUp, AlertTriangle, CheckCircle, UserPlus, Shield, Settings, Calendar, Target, Timer, User, Building2 } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { userProfile } = useAuth()
  const { projects, loading: projectsLoading } = useProjectsPrisma()
  const { operarios } = useOperariosPrisma()
  const { clients } = useClientsPrisma()
  
  // Estados para cálculo de tiempo real
  const [calculatedHours, setCalculatedHours] = useState<Record<string, number>>({})
  const [activeSessions, setActiveSessions] = useState<Record<string, any>>({})
  const [operarioNames, setOperarioNames] = useState<Record<string, string>>({})
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  
  // Calcular datos reales del dashboard
  const activeProjects = projects.filter(p => p.status === 'active')
  const totalOperarios = operarios.length
  const activeTasks = projects.reduce((sum, project) => 
    sum + project.projectTasks.filter(pt => pt.status === 'in_progress').length, 0
  )
  const completedTasks = projects.reduce((sum, project) => 
    sum + project.projectTasks.filter(pt => pt.status === 'completed').length, 0
  )
  const pendingTasks = projects.reduce((sum, project) => 
    sum + project.projectTasks.filter(pt => pt.status === 'pending').length, 0
  )
  const cancelledTasks = projects.reduce((sum, project) => 
    sum + project.projectTasks.filter(pt => pt.status === 'cancelled').length, 0
  )

  // useEffect para calcular horas reales desde time_entries (igual que en métricas del proyecto)
  useEffect(() => {
    const calculateAllHours = async () => {
      if (!projects || projects.length === 0) return
      
      const hoursMap: Record<string, number> = {}
      const activeSessionsMap: Record<string, any> = {}
      const operarioNamesMap: Record<string, string> = {}
      
      for (const project of projects) {
        for (const task of project.projectTasks) {
          if (task.taskId) {
            try {
              // Obtener todas las entradas de tiempo (completadas y activas)
              const { data: timeEntries, error } = await supabase
                .from('time_entries')
                .select('hours, start_time, end_time, user_id')
                .eq('task_id', task.taskId)
                .eq('project_id', project.id)
                .order('start_time', { ascending: false })

              if (error) {
                console.error('Error fetching time entries:', error)
                hoursMap[task.id] = 0
                continue
              }

              let totalHours = 0
              let activeSession: { startTime: string; elapsedHours: number; operarioId: string } | null = null

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
                  
                  // Guardar información de sesión activa
                  activeSession = {
                    startTime: entry.start_time,
                    elapsedHours,
                    operarioId: entry.user_id
                  }
                }
              })

              hoursMap[task.id] = totalHours
              if (activeSession) {
                activeSessionsMap[task.taskId] = activeSession
                
                // Obtener nombre del operario si no lo tenemos
                const operarioId = (activeSession as { operarioId: string }).operarioId
                if (!operarioNamesMap[operarioId]) {
                  try {
                    const { data: user, error: userError } = await supabase
                      .from('users')
                      .select('name')
                      .eq('id', operarioId)
                      .single()
                    
                    if (!userError && user) {
                      operarioNamesMap[operarioId] = user.name
                    } else {
                      operarioNamesMap[operarioId] = 'Operario desconocido'
                    }
                  } catch (err) {
                    operarioNamesMap[operarioId] = 'Operario desconocido'
                  }
                }
              }
            } catch (err) {
              console.error('Error calculating hours for task:', task.id, err)
              hoursMap[task.id] = 0
            }
          } else {
            hoursMap[task.id] = 0
          }
        }
      }
      
      setCalculatedHours(hoursMap)
      setActiveSessions(activeSessionsMap)
      setOperarioNames(operarioNamesMap)
      setLastUpdate(new Date())
    }

    if (projects && projects.length > 0) {
      calculateAllHours()
      
      // Actualizar cada 10 segundos para sesiones activas y cambios en sesiones completadas
      const interval = setInterval(calculateAllHours, 10000)
      return () => clearInterval(interval)
    }
  }, [projects])

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

  // Función para formatear tiempo trabajado (siempre en minutos, con horas cuando sea necesario)
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

  // Función para obtener nombre del operario
  const getOperarioName = (operarioId: string) => {
    return operarioNames[operarioId] || 'Operario desconocido'
  }

  // Función para calcular el progreso real del proyecto basado en progreso de tareas
  const calculateProjectProgress = (project: any) => {
    const totalTasks = project.projectTasks.length
    if (totalTasks === 0) return 0
    
    // Calcular progreso total considerando el progreso de cada tarea
    const totalProgress = project.projectTasks.reduce((sum: number, pt: any) => {
      if (pt.status === 'completed') {
        return sum + 100 // Tarea completada = 100%
      } else if (pt.status === 'in_progress') {
        return sum + (pt.progressPercentage || 0) // Progreso real de la tarea
      } else {
        return sum + 0 // Tarea pendiente = 0%
      }
    }, 0)
    
    return Math.round(totalProgress / totalTasks)
  }

  // Función para calcular métricas del proyecto
  const getProjectMetrics = (project: any) => {
    const totalTasks = project.projectTasks.length
    const completedTasks = project.projectTasks.filter((pt: any) => pt.status === 'completed').length
    const inProgressTasks = project.projectTasks.filter((pt: any) => pt.status === 'in_progress').length
    const pendingTasks = project.projectTasks.filter((pt: any) => pt.status === 'pending').length
    const totalOperarios = project.projectOperarios.length
    
    // Calcular horas totales estimadas y trabajadas usando calculatedHours (desde time_entries)
    // Usar estimatedHours del projectTask (tiempo total del proyecto) en lugar del tiempo base de la tarea
    // Si es 0 o no existe, calcularlo: task.estimatedHours * project.moduleCount
    const estimatedHours = project.projectTasks.reduce((sum: number, pt: any) => {
      let taskEstimated = pt.estimatedHours || 0
      if (taskEstimated === 0 && pt.task?.estimatedHours && project.moduleCount) {
        taskEstimated = pt.task.estimatedHours * project.moduleCount
      } else if (taskEstimated === 0) {
        taskEstimated = pt.task?.estimatedHours || 0
      }
      return sum + taskEstimated
    }, 0)
    const actualHours = Math.round(project.projectTasks.reduce((sum: number, pt: any) => 
      sum + (calculatedHours[pt.id] || 0), 0
    ) * 100) / 100 // Redondear a 2 decimales para evitar problemas de precisión

    // Calcular progreso de tiempo estimado y eficiencia real
    // Progreso de tiempo estimado: horas estimadas de tareas completadas vs total estimado
    const completedEstimatedHours = project.projectTasks
      .filter((pt: any) => pt.status === 'completed')
      .reduce((sum: number, pt: any) => {
        let taskEstimated = pt.estimatedHours || 0
        if (taskEstimated === 0 && pt.task?.estimatedHours && project.moduleCount) {
          taskEstimated = pt.task.estimatedHours * project.moduleCount
        } else if (taskEstimated === 0) {
          taskEstimated = pt.task?.estimatedHours || 0
        }
        return sum + taskEstimated
      }, 0)
    
    // Eficiencia real: horas trabajadas de tareas completadas vs horas estimadas totales del proyecto
    const completedActualHours = Math.round(project.projectTasks
      .filter((pt: any) => pt.status === 'completed')
      .reduce((sum: number, pt: any) => sum + (calculatedHours[pt.id] || 0), 0) * 100
    ) / 100

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      totalOperarios,
      estimatedHours: Math.round(estimatedHours * 10) / 10,
      actualHours: Math.round(actualHours * 10) / 10,
      completedEstimatedHours: Math.round(completedEstimatedHours * 10) / 10,
      completedActualHours: Math.round(completedActualHours * 10) / 10,
      hasEfficiencyData: completedEstimatedHours > 0
    }
  }

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-balance">Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {userProfile?.role === 'admin' 
                ? 'Panel de administración - Gestión completa del sistema'
                : 'Resumen general del sistema de gestión de operarios'
              }
            </p>
            <div className="text-xs text-muted-foreground mt-1">
              Actualizado: {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects.length}</div>
              <p className="text-xs text-muted-foreground">de {projects.length} proyectos totales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOperarios}</div>
              <p className="text-xs text-muted-foreground">operarios registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tareas Activas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTasks}</div>
              <p className="text-xs text-muted-foreground">tareas en progreso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients?.length || 0}</div>
              <p className="text-xs text-muted-foreground">clientes registrados</p>
            </CardContent>
          </Card>

        </div>

        {/* Admin and Supervisor Section */}
        {(userProfile?.role === 'admin' || userProfile?.role === 'supervisor') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {userProfile?.role === 'admin' ? 'Panel de Administración' : 'Panel de Supervisión'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${userProfile?.role === 'admin' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
                {/* Solo administradores pueden gestionar personal */}
                {userProfile?.role === 'admin' && (
                  <div className="p-4 border rounded-lg flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Control del Personal</h3>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Crea, edita y gestiona todo el personal del sistema
                    </p>
                    <Link href="/admin/users">
                      <Button size="sm" className="w-full cursor-pointer">
                        <Users className="h-3 w-3 mr-1" />
                        Gestionar personal
                      </Button>
                    </Link>
                  </div>
                )}
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Gestión de Tareas</h3>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Administra tareas estándar y personalizadas del sistema
                  </p>
                  <Link href="/admin/tasks">
                    <Button size="sm" variant="outline" className="w-full cursor-pointer">
                      <Target className="h-3 w-3 mr-1" />
                      Gestionar tareas
                    </Button>
                  </Link>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Gestión de Clientes</h3>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Administra la información de tus clientes y empresas
                  </p>
                  <Link href="/admin/clients">
                    <Button size="sm" variant="outline" className="w-full cursor-pointer">
                      <Building2 className="h-3 w-3 mr-1" />
                      Gestionar clientes
                    </Button>
                  </Link>
                </div>
                
                <div className="p-4 border rounded-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Estadísticas del Sistema</h3>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Monitorea el rendimiento y actividad del sistema
                    </p>
                  </div>
                  <Link href="/reports">
                    <Button size="sm" variant="outline" className="w-full cursor-pointer">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Ver Reportes
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Proyectos Activos</CardTitle>
                <CardDescription>Estado actual de los proyectos en curso</CardDescription>
              </div>
              <Link href="/admin/projects">
                <Button variant="outline" className="gap-2 cursor-pointer">
                  <FolderKanban className="h-4 w-4" />
                  Gestionar Proyectos
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando proyectos...</p>
                </div>
              </div>
            ) : activeProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProjects.map((project) => {
                  const metrics = getProjectMetrics(project)
                  const progress = calculateProjectProgress(project)
                  
                  // Contar sesiones activas únicas en este proyecto (operarios únicos)
                  // Solo mostrar si la tarea está asignada a un operario y en progreso
                  const projectActiveSessions = project.projectTasks
                    .filter((pt: any) => 
                      pt.taskId && 
                      activeSessions[pt.taskId] && 
                      pt.assignedUser && 
                      (pt.status === 'in_progress' || pt.status === 'assigned')
                    )
                    .map((pt: any) => activeSessions[pt.taskId].operarioId)
                    .filter((operarioId: string, index: number, array: string[]) => 
                      array.indexOf(operarioId) === index
                    ).length
                  
                  
                  return (
                    <Card key={project.id} className="hover:shadow-md transition-shadow relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">{project.name}</CardTitle>
                          </div>
                          <Badge variant="default" className="text-xs">
                            {project.status}
                          </Badge>
                        </div>
                        {project.description && (
                          <p className="text-base text-muted-foreground line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        
                        {/* Fechas */}
                        <div className="grid grid-cols-2 gap-2 pt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Inicio: {formatDate(project.startDate)}</span>
                          </div>
                          {project.endDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Fin: {formatDate(project.endDate)}</span>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Progreso de Tareas */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              Progreso de Tareas
                            </span>
                            <span className="font-semibold">
                              {metrics.totalTasks > 0 
                                ? `${Math.round((metrics.completedTasks / metrics.totalTasks) * 100)}%`
                                : '0%'
                              }
                            </span>
                          </div>
                          <Progress 
                            value={metrics.totalTasks > 0 
                              ? (metrics.completedTasks / metrics.totalTasks) * 100
                              : 0
                            } 
                            className="h-2" 
                          />
                        </div>

                        {/* Tiempo Estimado Completado */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Timer className="h-4 w-4" />
                              Tiempo Estimado Completado
                            </span>
                            <span className="font-semibold">
                              {metrics.completedEstimatedHours % 1 === 0 ? metrics.completedEstimatedHours : metrics.completedEstimatedHours}hs de {metrics.estimatedHours % 1 === 0 ? metrics.estimatedHours : metrics.estimatedHours}hs
                            </span>
                          </div>
                          <Progress 
                            value={metrics.estimatedHours > 0 
                              ? Math.min((metrics.completedEstimatedHours / metrics.estimatedHours) * 100, 100)
                              : 0
                            } 
                            className="h-2" 
                          />
                        </div>

                        {/* Progreso Real del Proyecto */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Progreso Real
                            </span>
                            {metrics.estimatedHours > 0 ? (
                              <span className="font-semibold text-white">
                                {formatWorkedTime(metrics.actualHours)}
                              </span>
                            ) : (
                              <span className="font-semibold text-gray-500">Sin datos</span>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="h-2 bg-primary/20 rounded-full">
                              {metrics.estimatedHours > 0 ? (
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    metrics.actualHours <= metrics.estimatedHours ? 'bg-green-500' : 'bg-orange-500'
                                  }`}
                                  style={{ 
                                    width: `${Math.min((metrics.actualHours / metrics.estimatedHours) * 100, 100)}%` 
                                  }}
                                />
                              ) : (
                                <div className="h-2 bg-primary/20 rounded-full" />
                              )}
                            </div>
                            {metrics.estimatedHours > 0 && (
                              <div className="text-center mt-3">
                                <div className="space-y-2">
                                  {(() => {
                                    const percentageUsed = Math.round((metrics.actualHours / metrics.estimatedHours) * 100)
                                    if (percentageUsed > 100) {
                                      const extraPercentage = percentageUsed - 100
                                      const remainingHours = metrics.estimatedHours - metrics.actualHours
                                      return (
                                        <div className="space-y-2">
                                          <div className="text-red-600 font-bold text-base">
                                            Tiempo extra utilizado: {extraPercentage}%
                                          </div>
                                          <div className="text-red-600 font-semibold text-sm">
                                            Retraso: {formatWorkedTime(Math.abs(remainingHours))}
                                          </div>
                                        </div>
                                      )
                                    } else {
                                      const remainingHours = metrics.estimatedHours - metrics.actualHours
                                      return (
                                        <div className="space-y-2">
                                          <div className="text-green-600 font-bold text-base">
                                            {percentageUsed}% del tiempo estimado utilizado
                                          </div>
                                          <div className="text-green-600 font-semibold text-sm">
                                            Tiempo restante: {formatWorkedTime(remainingHours)}
                                          </div>
                                        </div>
                                      )
                                    }
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Estado Temporal del Proyecto */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Timer className="h-4 w-4" />
                              Estado Temporal
                            </span>
                            {(() => {
                              // Si no hay fechas, calcular estado basado en progreso real vs estimado
                              if (!project.startDate || !project.endDate) {
                                if (metrics.estimatedHours > 0) {
                                  const progress = (metrics.actualHours / metrics.estimatedHours) * 100
                                  if (progress > 100) {
                                    return (
                                      <span className="font-semibold text-red-600">
                                        {Math.round(progress - 100)}% retrasado
                                      </span>
                                    )
                                  } else if (progress < 50) {
                                    return (
                                      <span className="font-semibold text-yellow-600">
                                        En progreso
                                      </span>
                                    )
                                  } else {
                                    return (
                                      <span className="font-semibold text-blue-600">
                                        En progreso
                                      </span>
                                    )
                                  }
                                } else {
                                  return (
                                    <span className="font-semibold text-gray-500">
                                      Sin datos
                                    </span>
                                  )
                                }
                              }
                              
                              const now = new Date()
                              const startDate = new Date(project.startDate)
                              const endDate = new Date(project.endDate)
                              
                              const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                              const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                              const expectedProgress = Math.min((elapsedDays / totalDays) * 100, 100)
                              const actualProgress = metrics.estimatedHours > 0 ? (metrics.actualHours / metrics.estimatedHours) * 100 : 0
                              const timeDifference = actualProgress - expectedProgress
                              
                              if (timeDifference > 5) {
                                return (
                                  <span className="font-semibold text-green-600">
                                    {Math.round(timeDifference)}% adelantado
                                  </span>
                                )
                              } else if (timeDifference < -5) {
                                return (
                                  <span className="font-semibold text-red-600">
                                    {Math.round(Math.abs(timeDifference))}% atrasado
                                  </span>
                                )
                              } else {
                                return (
                                  <span className="font-semibold text-blue-600">
                                    Según cronograma
                                  </span>
                                )
                              }
                            })()}
                          </div>
                        </div>

                        {/* Métricas de tareas */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-muted-foreground">Completadas</span>
                            <span className="font-semibold">{metrics.completedTasks}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span className="text-muted-foreground">En progreso</span>
                            <span className="font-semibold">{metrics.inProgressTasks}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <span className="text-muted-foreground">Pendientes</span>
                            <span className="font-semibold">{metrics.pendingTasks}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-500" />
                            <span className="text-muted-foreground">Operarios</span>
                            <span className="font-semibold">{metrics.totalOperarios}</span>
                          </div>
                          <div className="flex items-center gap-2 col-span-2">
                            {projectActiveSessions > 0 ? (
                              <>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-green-600 font-medium text-xs">
                                  {projectActiveSessions} operario{projectActiveSessions > 1 ? 's' : ''} trabajando ahora
                                </span>
                                <div className="text-xs text-muted-foreground">
                                  ({project.projectTasks
                                    .filter((pt: any) => 
                                      pt.taskId && 
                                      activeSessions[pt.taskId] && 
                                      pt.assignedUser && 
                                      (pt.status === 'in_progress' || pt.status === 'assigned')
                                    )
                                    .map((pt: any) => getOperarioName(activeSessions[pt.taskId].operarioId))
                                    .filter((name: string, index: number, array: string[]) => 
                                      array.indexOf(name) === index
                                    ).join(', ')})
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                Sin actividad
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Resumen de Horas */}
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Timer className="h-4 w-4" />
                              Horas Trabajadas
                            </span>
                            <span className="text-muted-foreground font-medium">
                              {formatWorkedTime(metrics.actualHours)} de {formatWorkedTime(metrics.estimatedHours)}
                            </span>
                          </div>
                        </div>


                        {/* Botones de acción */}
                        <div className="pt-2">
                          <Link href={`/admin/projects/${project.id}/metrics`}>
                            <Button variant="outline" size="sm" className="w-full cursor-pointer">
                              Ver Métricas
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No hay proyectos activos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comienza creando tu primer proyecto para gestionar las tareas de los operarios
                </p>
                <Link href="/admin/projects">
                  <Button className="gap-2 cursor-pointer">
                    <FolderKanban className="h-4 w-4" />
                    Crear Proyecto
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  )
}
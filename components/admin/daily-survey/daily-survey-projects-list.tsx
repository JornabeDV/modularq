"use client"

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProjectsPrisma } from '@/hooks/use-projects-prisma'
import { useIsMobile } from '@/hooks/use-mobile'
import { ClipboardList, ArrowRight, Calendar, Users } from 'lucide-react'
import { formatProjectDate } from '@/lib/utils/project-utils'
import {
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarRadiusAxis,
  Label,
} from 'recharts'
import {
  ChartContainer,
  type ChartConfig,
} from '@/components/ui/chart'

export function DailySurveyProjectsList() {
  const router = useRouter()
  const { projects, loading } = useProjectsPrisma()
  const isMobile = useIsMobile()

  // Filtrar solo proyectos activos
  const activeProjects = projects.filter(p => p.status === 'active')

  // Función para obtener el color del progreso
  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return "hsl(142, 76%, 36%)"; // green-600
    if (percentage >= 75) return "hsl(262, 83%, 58%)"; // purple-500
    if (percentage >= 50) return "hsl(25, 95%, 53%)"; // orange-500
    if (percentage >= 25) return "hsl(45, 93%, 47%)"; // yellow-500
    return "hsl(217, 91%, 60%)"; // blue-500
  }

  // Calcular estadísticas por proyecto
  const getProjectStats = (project: any) => {
    const totalTasks = project.projectTasks?.length || 0
    const completedTasks = project.projectTasks?.filter((pt: any) => pt.status === 'completed').length || 0
    const inProgressTasks = project.projectTasks?.filter((pt: any) => pt.status === 'in_progress').length || 0
    const pendingTasks = project.projectTasks?.filter((pt: any) => pt.status === 'pending').length || 0
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      progressPercentage
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando proyectos...</p>
        </div>
      </div>
    )
  }

  if (activeProjects.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No hay proyectos activos</h2>
        <p className="text-muted-foreground">
          No hay proyectos en estado "activo" para realizar el relevamiento diario
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">Relevamiento Diario</h1>
        <p className="text-xs sm:text-base text-muted-foreground">
          Revisa y actualiza el estado de las tareas de los proyectos activos
        </p>
      </div>

      {/* Lista de proyectos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        {activeProjects.map((project) => {
          const stats = getProjectStats(project)
          
          return (
            <Card 
              key={project.id} 
              className="bg-black text-white hover:shadow-lg transition-shadow cursor-pointer border-gray-800"
              onClick={() => router.push(`/admin/daily-survey/${project.id}`)}
            >
              <CardHeader className="p-3 sm:p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm sm:text-base mb-0.5 truncate text-white">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription className="text-[10px] sm:text-xs line-clamp-1 text-gray-300">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="outline" className="bg-green-600 text-white border-green-500 flex-shrink-0 text-[10px] px-1.5 py-0.5">
                    Activo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 space-y-2.5">
                {/* Progreso y Estadísticas en fila */}
                <div className="flex items-center gap-3">
                  {/* Gráfico Circular */}
                  {(() => {
                    const progressColor = getProgressColor(stats.progressPercentage)
                    const radialData = [
                      {
                        name: "progreso",
                        value: stats.progressPercentage,
                        fill: progressColor,
                      },
                    ]
                    const radialChartConfig = {
                      progreso: {
                        label: "Progreso",
                        color: progressColor,
                      },
                    } satisfies ChartConfig

                    return (
                      <ChartContainer
                        config={radialChartConfig}
                        className="aspect-square h-16 sm:h-20 flex-shrink-0"
                      >
                        <RadialBarChart
                          data={radialData}
                          endAngle={90 + stats.progressPercentage * 3.6}
                          innerRadius={isMobile ? 20 : 25}
                          outerRadius={isMobile ? 32 : 40}
                          startAngle={90}
                          width={isMobile ? 64 : 80}
                          height={isMobile ? 64 : 80}
                        >
                          <PolarGrid
                            gridType="circle"
                            radialLines={false}
                            stroke="none"
                            className="first:fill-muted last:fill-background"
                            polarRadius={isMobile ? [25, 15] : [30, 20]}
                          />
                          <RadialBar dataKey="value" background cornerRadius={6} />
                          <PolarRadiusAxis
                            tick={false}
                            tickLine={false}
                            axisLine={false}
                          >
                            <Label
                              content={({ viewBox }) => {
                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                  return (
                                    <text
                                      x={viewBox.cx}
                                      y={viewBox.cy}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                    >
                                      <tspan
                                        x={viewBox.cx}
                                        y={viewBox.cy}
                                        className={`fill-white font-bold ${
                                          isMobile ? "text-[10px]" : "text-xs"
                                        }`}
                                      >
                                        {stats.progressPercentage}%
                                      </tspan>
                                    </text>
                                  )
                                }
                              }}
                            />
                          </PolarRadiusAxis>
                        </RadialBarChart>
                      </ChartContainer>
                    )
                  })()}

                  {/* Estadísticas de tareas */}
                  <div className="flex-1 grid grid-cols-3 gap-1.5 text-center">
                    <div className="p-1.5 bg-green-900/50 border border-green-700/50 rounded-md">
                      <div className="text-sm sm:text-base font-bold text-green-400">{stats.completedTasks}</div>
                      <div className="text-[9px] sm:text-[10px] text-green-300">Completadas</div>
                    </div>
                    <div className="p-1.5 bg-orange-900/50 border border-orange-700/50 rounded-md">
                      <div className="text-sm sm:text-base font-bold text-orange-400">{stats.inProgressTasks}</div>
                      <div className="text-[9px] sm:text-[10px] text-orange-300">En Progreso</div>
                    </div>
                    <div className="p-1.5 bg-yellow-900/50 border border-yellow-700/50 rounded-md">
                      <div className="text-sm sm:text-base font-bold text-yellow-400">{stats.pendingTasks}</div>
                      <div className="text-[9px] sm:text-[10px] text-yellow-300">Pendientes</div>
                    </div>
                  </div>
                </div>

                {/* Información adicional - Compacta en una línea */}
                <div className="flex items-center gap-3 text-[10px] sm:text-xs text-gray-300">
                  {project.startDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{formatProjectDate(project.startDate)}</span>
                    </div>
                  )}
                  {project.projectOperarios && project.projectOperarios.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 flex-shrink-0" />
                      <span>{project.projectOperarios.length} operario{project.projectOperarios.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {/* Botón de acción */}
                <Button 
                  size="sm"
                  className="w-full cursor-pointer text-[11px] sm:text-xs h-7 sm:h-8 bg-black border border-gray-700 text-white hover:bg-gray-900 hover:border-gray-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/admin/daily-survey/${project.id}`)
                  }}
                >
                  Revisar Tareas
                  <ArrowRight className="h-3 w-3 ml-1.5" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}


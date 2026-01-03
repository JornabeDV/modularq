"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjectsPrisma } from "@/hooks/use-projects-prisma";
import { useIsMobile } from "@/hooks/use-mobile";
import { ClipboardList, ArrowRight, Calendar, Users } from "lucide-react";
import { formatProjectDate, getProgressColor } from "@/lib/utils/project-utils";
import {
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarRadiusAxis,
  Label,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

export function DailySurveyProjectsList() {
  const router = useRouter();
  const { projects, loading } = useProjectsPrisma();
  const isMobile = useIsMobile();

  // Filtrar solo proyectos activos
  const activeProjects = projects.filter((p) => p.status === "active");

  // Calcular estadísticas por proyecto
  const getProjectStats = (project: any) => {
    const totalTasks = project.projectTasks?.length || 0;
    const completedTasks =
      project.projectTasks?.filter((pt: any) => pt.status === "completed")
        .length || 0;
    const inProgressTasks =
      project.projectTasks?.filter((pt: any) => pt.status === "in_progress")
        .length || 0;
    const pendingTasks =
      project.projectTasks?.filter((pt: any) => pt.status === "pending")
        .length || 0;
    const progressPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      progressPercentage,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  if (activeProjects.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No hay proyectos activos</h2>
        <p className="text-muted-foreground">
          No hay proyectos en estado "activo" para realizar el relevamiento
          diario
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Relevamiento Diario</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Revisa y actualiza el estado de las tareas de los proyectos activos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        {activeProjects.map((project) => {
          const stats = getProjectStats(project);

          return (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-shadow cursor-pointer gap-0 py-0"
              onClick={() => router.push(`/admin/daily-survey/${project.id}`)}
            >
              <CardHeader className="p-3 sm:p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg mb-0.5 truncate">
                      {project.name}
                    </CardTitle>
                    {project.description && (
                      <CardDescription className="text-xs sm:text-sm line-clamp-1">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 flex-shrink-0 text-xs sm:text-sm px-1.5 py-0.5"
                  >
                    Activo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 space-y-2.5">
                {/* Progreso y Estadísticas en fila */}
                <div className="flex items-center gap-3">
                  {/* Gráfico Circular */}
                  {(() => {
                    const progressColor = getProgressColor(
                      stats.progressPercentage
                    );
                    const radialData = [
                      {
                        name: "progreso",
                        value: stats.progressPercentage,
                        fill: progressColor,
                      },
                    ];
                    const radialChartConfig = {
                      progreso: {
                        label: "Progreso",
                        color: progressColor,
                      },
                    } satisfies ChartConfig;

                    return (
                      <ChartContainer
                        config={radialChartConfig}
                        className="aspect-square h-36 sm:h-44 flex-shrink-0"
                      >
                        <RadialBarChart
                          data={radialData}
                          endAngle={90 + stats.progressPercentage * 3.6}
                          innerRadius={isMobile ? 45 : 55}
                          outerRadius={isMobile ? 72 : 88}
                          startAngle={90}
                          width={isMobile ? 144 : 176}
                          height={isMobile ? 144 : 176}
                        >
                          <PolarGrid
                            gridType="circle"
                            radialLines={false}
                            stroke="none"
                            className="first:fill-muted last:fill-background"
                            polarRadius={isMobile ? [55, 35] : [65, 40]}
                          />
                          <RadialBar
                            dataKey="value"
                            background
                            cornerRadius={6}
                          />
                          <PolarRadiusAxis
                            tick={false}
                            tickLine={false}
                            axisLine={false}
                          >
                            <Label
                              content={({ viewBox }) => {
                                if (
                                  viewBox &&
                                  "cx" in viewBox &&
                                  "cy" in viewBox
                                ) {
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
                                        className={`fill-foreground font-bold ${
                                          isMobile ? "text-sm" : "text-base"
                                        }`}
                                      >
                                        {stats.progressPercentage}%
                                      </tspan>
                                    </text>
                                  );
                                }
                              }}
                            />
                          </PolarRadiusAxis>
                        </RadialBarChart>
                      </ChartContainer>
                    );
                  })()}

                  <div className="flex-1 grid grid-cols-1 gap-1 text-center min-w-[80px]">
                    <div className="p-1 border rounded-md">
                      <div className="text-xs sm:text-sm font-bold text-foreground">
                        {stats.completedTasks}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Completadas
                      </div>
                    </div>
                    <div className="p-1 border rounded-md">
                      <div className="text-xs sm:text-sm font-bold text-foreground">
                        {stats.inProgressTasks}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        En Progreso
                      </div>
                    </div>
                    <div className="p-1 border rounded-md">
                      <div className="text-xs sm:text-sm font-bold text-foreground">
                        {stats.pendingTasks}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Pendientes
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                  {project.startDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        Inicio proyecto: {formatProjectDate(project.startDate)}
                      </span>
                    </div>
                  )}
                  {project.projectOperarios &&
                    project.projectOperarios.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 flex-shrink-0" />
                        <span>
                          {project.projectOperarios.length} operario
                          {project.projectOperarios.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                </div>

                {/* Botón de acción */}
                <Button
                  size="sm"
                  className="w-full cursor-pointer text-xs sm:text-sm h-7 sm:h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/admin/daily-survey/${project.id}`);
                  }}
                >
                  Revisar Tareas
                  <ArrowRight className="h-3 w-3 ml-1.5" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

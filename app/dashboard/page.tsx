"use client";

import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useProjectsPrisma } from "@/hooks/use-projects-prisma";
import { useOperariosPrisma } from "@/hooks/use-operarios-prisma";
import { useClientsPrisma } from "@/hooks/use-clients-prisma";
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard";
import {
  FolderKanban,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Shield,
  Calendar,
  Target,
  Timer,
  Building2,
} from "lucide-react";
import Link from "next/link";
import {
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarRadiusAxis,
  Label,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";
import { getProgressColor } from "@/lib/utils/project-utils";
import { formatDate } from "@/lib/utils";
import { getStatusText } from "@/components/admin/metrics/metrics-helpers";

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const { projects, loading: projectsLoading } = useProjectsPrisma();
  const { operarios } = useOperariosPrisma();
  const { clients } = useClientsPrisma();
  const isMobile = useIsMobile();

  const activeProjects = projects.filter((p) => p.status === "active");
  const totalOperarios = operarios.length;
  const activeTasks = projects.reduce(
    (sum, project) =>
      sum +
      project.projectTasks.filter((pt) => pt.status === "in_progress").length,
    0
  );

  const getProjectMetrics = (project: any) => {
    const activeTasks = project.projectTasks.filter(
      (pt: any) => pt.status !== "cancelled"
    );
    const totalTasks = activeTasks.length;
    const completedTasks = activeTasks.filter(
      (pt: any) => pt.status === "completed"
    ).length;
    const inProgressTasks = activeTasks.filter(
      (pt: any) => pt.status === "in_progress"
    ).length;
    const pendingTasks = activeTasks.filter(
      (pt: any) => pt.status === "pending"
    ).length;
    const cancelledTasks = project.projectTasks.filter(
      (pt: any) => pt.status === "cancelled"
    ).length;
    const totalOperarios = project.projectOperarios.length;

    const estimatedHours = activeTasks.reduce((sum: number, pt: any) => {
      let taskEstimated = pt.estimatedHours || 0;
      if (
        taskEstimated === 0 &&
        pt.task?.estimatedHours &&
        project.moduleCount
      ) {
        taskEstimated = pt.task.estimatedHours * project.moduleCount;
      } else if (taskEstimated === 0) {
        taskEstimated = pt.task?.estimatedHours || 0;
      }
      return sum + taskEstimated;
    }, 0);

    const completedEstimatedHours = activeTasks
      .filter((pt: any) => pt.status === "completed")
      .reduce((sum: number, pt: any) => {
        let taskEstimated = pt.estimatedHours || 0;
        if (
          taskEstimated === 0 &&
          pt.task?.estimatedHours &&
          project.moduleCount
        ) {
          taskEstimated = pt.task.estimatedHours * project.moduleCount;
        } else if (taskEstimated === 0) {
          taskEstimated = pt.task?.estimatedHours || 0;
        }
        return sum + taskEstimated;
      }, 0);

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      cancelledTasks,
      totalOperarios,
      estimatedHours: Math.round(estimatedHours * 10) / 10,
      completedEstimatedHours: Math.round(completedEstimatedHours * 10) / 10,
    };
  };

  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-balance">
                Dashboard
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {userProfile?.role === "admin"
                  ? "Panel de administración - Gestión completa del sistema"
                  : "Resumen general del sistema de gestión de operarios"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <Card className="py-3 sm:py-3 flex justify-between flex-col">
              <CardHeader className="flex flex-row items-start sm:items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Proyectos Activos
                </CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {activeProjects.length}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  de {projects.length} proyectos totales
                </p>
              </CardContent>
            </Card>

            <Card className="py-3 sm:py-3 flex justify-between flex-col">
              <CardHeader className="flex flex-row items-start sm:items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Operarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOperarios}</div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  operarios registrados
                </p>
              </CardContent>
            </Card>

            <Card className="py-3 sm:py-3 flex justify-between flex-col">
              <CardHeader className="flex flex-row items-start sm:items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tareas Activas
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeTasks}</div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  tareas en progreso
                </p>
              </CardContent>
            </Card>

            <Card className="py-3 sm:py-3 flex justify-between flex-col">
              <CardHeader className="flex flex-row items-start sm:items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clients?.length || 0}</div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  clientes registrados
                </p>
              </CardContent>
            </Card>
          </div>

          {(userProfile?.role === "admin" ||
            userProfile?.role === "supervisor") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {userProfile?.role === "admin"
                    ? "Panel de Administración"
                    : "Panel de Supervisión"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 ${
                    userProfile?.role === "admin"
                      ? "lg:grid-cols-4"
                      : "lg:grid-cols-3"
                  } gap-4`}
                >
                  {userProfile?.role === "admin" && (
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
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full cursor-pointer"
                      >
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
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full cursor-pointer"
                      >
                        <Building2 className="h-3 w-3 mr-1" />
                        Gestionar clientes
                      </Button>
                    </Link>
                  </div>

                  <div className="p-4 border rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">
                          Estadísticas del Sistema
                        </h3>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Monitorea el rendimiento y actividad del sistema
                      </p>
                    </div>
                    <Link href="/reports">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full cursor-pointer"
                      >
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
          <Card className="max-sm:gap-3">
            <CardHeader>
              <div className="flex max-sm:flex-col max-sm:gap-4 sm:items-center justify-between">
                <div className="max-sm:flex max-sm:flex-col max-sm:gap-3">
                  <CardTitle>Proyectos Activos</CardTitle>
                  <CardDescription>
                    Estado actual de los proyectos en curso
                  </CardDescription>
                </div>
                <Link href="/admin/projects" className="max-sm:w-full">
                  <Button
                    variant="outline"
                    className="gap-2 cursor-pointer max-sm:w-full"
                  >
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
                    <p className="mt-2 text-muted-foreground">
                      Cargando proyectos...
                    </p>
                  </div>
                </div>
              ) : activeProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {activeProjects.map((project) => {
                    const metrics = getProjectMetrics(project);

                    return (
                      <Card
                        key={project.id}
                        className="hover:shadow-md transition-shadow relative flex flex-col justify-between "
                      >
                        <CardHeader className="px-3 sm:px-6 pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-xl">
                                {project.name}
                              </CardTitle>
                            </div>
                            <Badge variant="default" className="text-xs">
                              {getStatusText(project.status)}
                            </Badge>
                          </div>
                          {project.description && (
                            <p className="text-base text-muted-foreground line-clamp-2">
                              {project.description}
                            </p>
                          )}

                          {/* Fechas */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Inicio: {formatDate(project.startDate)}
                              </span>
                            </div>
                            {project.endDate && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Fin: {formatDate(project.endDate)}</span>
                              </div>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4 max-sm:px-3">
                          <div className="flex max-sm:flex-col justify-between gap-4">
                            {(() => {
                              const taskProgress =
                                metrics.totalTasks > 0
                                  ? Math.round(
                                      (metrics.completedTasks /
                                        metrics.totalTasks) *
                                        100
                                    )
                                  : 0;
                              const progressColor =
                                getProgressColor(taskProgress);
                              const radialData = [
                                {
                                  name: "progreso",
                                  value: taskProgress,
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
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1 text-sm">
                                    <Target className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">
                                      Progreso de Tareas
                                    </span>
                                  </div>
                                  <ChartContainer
                                    config={radialChartConfig}
                                    className="mx-auto aspect-square max-h-[140px] sm:max-h-[160px]"
                                  >
                                    <RadialBarChart
                                      data={radialData}
                                      endAngle={90 + taskProgress * 3.6}
                                      innerRadius={isMobile ? 40 : 50}
                                      outerRadius={isMobile ? 60 : 70}
                                      startAngle={90}
                                      width={isMobile ? 140 : 160}
                                      height={isMobile ? 140 : 160}
                                    >
                                      <PolarGrid
                                        gridType="circle"
                                        radialLines={false}
                                        stroke="none"
                                        className="first:fill-muted last:fill-background"
                                        polarRadius={
                                          isMobile ? [50, 35] : [60, 40]
                                        }
                                      />
                                      <RadialBar
                                        dataKey="value"
                                        background
                                        cornerRadius={8}
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
                                                      isMobile
                                                        ? "text-xl"
                                                        : "text-2xl"
                                                    }`}
                                                  >
                                                    {taskProgress}%
                                                  </tspan>
                                                </text>
                                              );
                                            }
                                          }}
                                        />
                                      </PolarRadiusAxis>
                                    </RadialBarChart>
                                  </ChartContainer>
                                </div>
                              );
                            })()}

                            {(() => {
                              const timeProgress =
                                metrics.estimatedHours > 0
                                  ? Math.min(
                                      Math.round(
                                        (metrics.completedEstimatedHours /
                                          metrics.estimatedHours) *
                                          100
                                      ),
                                      100
                                    )
                                  : 0;
                              const progressColor =
                                getProgressColor(timeProgress);
                              const radialData = [
                                {
                                  name: "tiempo",
                                  value: timeProgress,
                                  fill: progressColor,
                                },
                              ];
                              const radialChartConfig = {
                                tiempo: {
                                  label: "Tiempo",
                                  color: progressColor,
                                },
                              } satisfies ChartConfig;

                              return (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-1">
                                      <Timer className="h-4 w-4 flex-shrink-0" />
                                      <span className="truncate">
                                        Tiempo Completado
                                      </span>
                                    </span>
                                  </div>
                                  <ChartContainer
                                    config={radialChartConfig}
                                    className="mx-auto aspect-square max-h-[140px] sm:max-h-[160px]"
                                  >
                                    <RadialBarChart
                                      data={radialData}
                                      endAngle={90 + timeProgress * 3.6}
                                      innerRadius={isMobile ? 40 : 50}
                                      outerRadius={isMobile ? 60 : 70}
                                      startAngle={90}
                                      width={isMobile ? 140 : 160}
                                      height={isMobile ? 140 : 160}
                                    >
                                      <PolarGrid
                                        gridType="circle"
                                        radialLines={false}
                                        stroke="none"
                                        className="first:fill-muted last:fill-background"
                                        polarRadius={
                                          isMobile ? [50, 35] : [60, 40]
                                        }
                                      />
                                      <RadialBar
                                        dataKey="value"
                                        background
                                        cornerRadius={8}
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
                                                      isMobile
                                                        ? "text-xl"
                                                        : "text-2xl"
                                                    }`}
                                                  >
                                                    {timeProgress}%
                                                  </tspan>
                                                </text>
                                              );
                                            }
                                          }}
                                        />
                                      </PolarRadiusAxis>
                                    </RadialBarChart>
                                  </ChartContainer>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Métricas de tareas */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-muted-foreground">
                                Completadas
                              </span>
                              <span className="font-semibold">
                                {metrics.completedTasks}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-500" />
                              <span className="text-muted-foreground">
                                En progreso
                              </span>
                              <span className="font-semibold">
                                {metrics.inProgressTasks}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              <span className="text-muted-foreground">
                                Pendientes
                              </span>
                              <span className="font-semibold">
                                {metrics.pendingTasks}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-purple-500" />
                              <span className="text-muted-foreground">
                                Operarios
                              </span>
                              <span className="font-semibold">
                                {metrics.totalOperarios}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                        <div className="px-3 sm:px-6">
                          <Link href={`/admin/projects/${project.id}/metrics`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full cursor-pointer"
                            >
                              Ver Métricas
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No hay proyectos activos
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comienza creando tu primer proyecto para gestionar las
                    tareas de los operarios
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
  );
}

"use client";

import { useParams } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarRadiusAxis,
  Label,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { useProjectsPrisma } from "@/hooks/use-projects-prisma";
import { useProjectFiles } from "@/hooks/use-project-files";
import { useAuth } from "@/lib/auth-context";
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard";
import { useIsMobile } from "@/hooks/use-mobile";
import { SupabaseFileStorage } from "@/lib/supabase-storage";
import {
  ArrowLeft,
  Target,
  Timer,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Users,
  FileText,
  Download,
  Eye,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { getProgressColor } from "@/lib/utils/project-utils";
import { formatDate } from "@/lib/utils";

export default function ProjectMetricsPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const { projects, loading, refetch } = useProjectsPrisma();
  const { user } = useAuth();
  const { files: projectFiles, loading: filesLoading } = useProjectFiles(
    projectId,
    user?.id || "",
    true
  );

  const project = projects?.find((p) => p.id === projectId);
  const isMobile = useIsMobile();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownload = async (file: any) => {
    try {
      const url = await SupabaseFileStorage.getSignedUrl(file.storage_path);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Error al obtener el archivo");
      }

      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file.file_name;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const handleView = async (file: any) => {
    try {
      const url = await SupabaseFileStorage.getSignedUrl(file.storage_path);
      if (url) {
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Error viewing file:", error);
    }
  };

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "planning":
        return "bg-blue-500";
      case "paused":
        return "bg-yellow-500";
      case "completed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  // Función para obtener el texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activo";
      case "planning":
        return "Planificación";
      case "paused":
        return "Pausado";
      case "completed":
        return "Completado";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Cargando métricas del proyecto...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Proyecto no encontrado
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              El proyecto que buscas no existe o no tienes permisos para verlo
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="cursor-pointer">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Calcular métricas del proyecto (excluyendo tareas canceladas)
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

  // Calcular horas totales estimadas (solo de tareas activas)
  // Usar estimatedHours del projectTask (tiempo total del proyecto) en lugar del tiempo base de la tarea
  // Si es 0 o no existe, calcularlo: task.estimatedHours * project.moduleCount
  const estimatedHours = activeTasks.reduce((sum: number, pt: any) => {
    let taskEstimated = pt.estimatedHours || 0;
    if (taskEstimated === 0 && pt.task?.estimatedHours && project.moduleCount) {
      taskEstimated = pt.task.estimatedHours * project.moduleCount;
    } else if (taskEstimated === 0) {
      taskEstimated = pt.task?.estimatedHours || 0;
    }
    return sum + taskEstimated;
  }, 0);

  // Calcular progreso de tiempo estimado (solo de tareas activas)
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

  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Volver</span>
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold truncate">
                  {project.name}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Métricas detalladas del proyecto
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(
                  project.status
                )}`}
              />
              <Badge variant="outline" className="text-xs sm:text-sm">
                {getStatusText(project.status)}
              </Badge>
            </div>
          </div>

          {/* Resumen del proyecto */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Resumen del Proyecto
                  </CardTitle>
                  <CardDescription>
                    Métricas generales y progreso del proyecto
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 px-6">
              {/* Métricas generales */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold">
                    {totalTasks}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Total Activas
                  </div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    {completedTasks}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Completadas
                  </div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">
                    {inProgressTasks}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    En Progreso
                  </div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-gray-600">
                    {pendingTasks}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Pendientes
                  </div>
                </div>
              </div>

              {/* Gráficos circulares del proyecto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Progreso de Tareas - Gráfico Circular */}
                {(() => {
                  const taskProgress =
                    totalTasks > 0
                      ? Math.round((completedTasks / totalTasks) * 100)
                      : 0;
                  const progressColor = getProgressColor(taskProgress);
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
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                        <span className="flex items-center gap-1 text-sm">
                          <Target className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">Progreso de Tareas</span>
                        </span>
                        <span className="font-semibold text-sm sm:text-base">
                          {taskProgress}%
                        </span>
                      </div>
                      <ChartContainer
                        config={radialChartConfig}
                        className="aspect-square h-36 sm:h-44 flex-shrink-0 mx-auto"
                      >
                        <RadialBarChart
                          data={radialData}
                          endAngle={90 + taskProgress * 3.6}
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
                                          isMobile ? "text-lg" : "text-xl"
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

                {/* Tiempo Estimado Completado - Gráfico Circular */}
                {(() => {
                  const timeProgress =
                    estimatedHours > 0
                      ? Math.min(
                          Math.round(
                            (completedEstimatedHours / estimatedHours) * 100
                          ),
                          100
                        )
                      : 0;
                  const progressColor = getProgressColor(timeProgress);
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
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                        <span className="flex items-center gap-1 text-sm">
                          <Timer className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            Tiempo Estimado Completado
                          </span>
                        </span>
                        <span className="font-semibold text-sm sm:text-base">
                          {estimatedHours > 0
                            ? `${
                                completedEstimatedHours % 1 === 0
                                  ? completedEstimatedHours
                                  : completedEstimatedHours
                              }h de ${
                                estimatedHours % 1 === 0
                                  ? estimatedHours
                                  : estimatedHours
                              }h`
                            : "0h de 0h"}
                        </span>
                      </div>
                      <ChartContainer
                        config={radialChartConfig}
                        className="aspect-square h-36 sm:h-44 flex-shrink-0 mx-auto"
                      >
                        <RadialBarChart
                          data={radialData}
                          endAngle={90 + timeProgress * 3.6}
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
                                          isMobile ? "text-lg" : "text-xl"
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
              {/* Información adicional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-8 border-t">
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">
                    {totalOperarios} operarios asignados
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">
                    Inicio: {formatDate(project.startDate)}
                  </span>
                </div>
                {project.endDate && (
                  <div className="flex items-center gap-2 text-sm sm:text-base sm:col-span-2 lg:col-span-1">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">
                      Fin: {formatDate(project.endDate)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Archivos del Proyecto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Archivos del Proyecto
              </CardTitle>
              <CardDescription>
                Documentos y archivos asociados al proyecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">
                      Cargando archivos...
                    </p>
                  </div>
                </div>
              ) : projectFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">
                    No hay archivos en este proyecto
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex hover:bg-accent/50 transition-colors flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg"
                    >
                      <div
                        className="flex items-center cursor-pointer rounded-lg p-2 -m-2 flex-1"
                        onClick={() => handleView(file)}
                        title="Hacer clic para ver el archivo"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {file.file_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                            <span>{formatFileSize(file.file_size)}</span>
                            <span>{formatDate(file.uploaded_at)}</span>
                            <span className="capitalize">{file.file_type}</span>
                          </div>
                          {file.description && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {file.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-auto">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleView(file)}
                                className="h-8 w-8 p-0 cursor-pointer"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver archivo</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(file)}
                                className="h-8 w-8 p-0 cursor-pointer"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Descargar archivo</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                      const operarioName = pt.assignedUser.name;
                      if (!acc[operarioName]) {
                        acc[operarioName] = {
                          name: operarioName,
                          total: 0,
                          completed: 0,
                          inProgress: 0,
                          assigned: 0,
                          pending: 0,
                          totalHours: 0,
                        };
                      }
                      acc[operarioName].total++;

                      // Contar por estado
                      const status = pt.status;
                      if (status === "completed") acc[operarioName].completed++;
                      else if (status === "in_progress")
                        acc[operarioName].inProgress++;
                      else if (status === "assigned")
                        acc[operarioName].assigned++;
                      else if (status === "pending")
                        acc[operarioName].pending++;

                      // Usar estimatedHours del projectTask (tiempo total del proyecto)
                      // Si es 0 o no existe, calcularlo: task.estimatedHours * project.moduleCount
                      let taskEstimated = pt.estimatedHours || 0;
                      if (
                        taskEstimated === 0 &&
                        pt.task?.estimatedHours &&
                        project.moduleCount
                      ) {
                        taskEstimated =
                          pt.task.estimatedHours * project.moduleCount;
                      } else if (taskEstimated === 0) {
                        taskEstimated = pt.task?.estimatedHours || 0;
                      }
                      acc[operarioName].totalHours += taskEstimated;
                      return acc;
                    }, {});

                  // Contar tareas completadas sin operario asignado
                  const completedWithoutOperario = project.projectTasks.filter(
                    (pt: any) => {
                      return pt.status === "completed" && !pt.assignedUser;
                    }
                  ).length;

                  const operarioStatsArray = Object.values(operarioStats);

                  if (
                    operarioStatsArray.length === 0 &&
                    completedWithoutOperario === 0
                  ) {
                    return (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          No hay operarios trabajando
                        </h3>
                        <p className="text-muted-foreground">
                          Ningún operario ha tomado tareas de este proyecto aún
                        </p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {operarioStatsArray.map((stats: any) => (
                        <div
                          key={stats.name}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {stats.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium truncate">
                                {stats.name}
                              </h4>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {stats.total} tareas •{" "}
                                {stats.totalHours % 1 === 0
                                  ? stats.totalHours
                                  : stats.totalHours}
                                h estimadas
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            {stats.inProgress > 0 && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                              >
                                {stats.inProgress} en progreso
                              </Badge>
                            )}
                            {stats.assigned > 0 && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {stats.assigned} asignadas
                              </Badge>
                            )}
                            {stats.pending > 0 && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                              >
                                {stats.pending} pendientes
                              </Badge>
                            )}
                            {stats.completed > 0 && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-green-50 text-green-700 border-green-200"
                              >
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
                              <h4 className="font-medium text-orange-800 truncate">
                                Tareas completadas sin operario
                              </h4>
                              <p className="text-xs sm:text-sm text-orange-600">
                                {completedWithoutOperario} tareas completadas
                                sin asignar a operario
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs border-orange-300 text-orange-700 self-start sm:self-auto"
                          >
                            {completedWithoutOperario} sin asignar
                          </Badge>
                        </div>
                      )}
                    </>
                  );
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
                    const statusOrder: Record<string, number> = {
                      in_progress: 0,
                      assigned: 1,
                      pending: 2,
                      completed: 3,
                      cancelled: 4,
                    };
                    const statusA = a.status;
                    const statusB = b.status;
                    const orderA = statusOrder[statusA] ?? 999;
                    const orderB = statusOrder[statusB] ?? 999;

                    if (orderA === orderB) {
                      return 0;
                    }

                    return orderA - orderB;
                  })
                  .map((projectTask: any, index: number) => {
                    const task = projectTask.task;
                    let estimatedHours = projectTask.estimatedHours || 0;
                    if (
                      estimatedHours === 0 &&
                      task?.estimatedHours &&
                      project?.moduleCount
                    ) {
                      estimatedHours =
                        task.estimatedHours * project.moduleCount;
                    } else if (estimatedHours === 0) {
                      estimatedHours = task?.estimatedHours || 0;
                    }
                    const progressPercentage =
                      projectTask.progressPercentage || 0;

                    return (
                      <div
                        key={projectTask.id}
                        className="border rounded-lg p-3 space-y-3 relative"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <span className="font-semibold text-sm truncate">
                              {task?.title || "Tarea sin título"}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium self-start sm:self-auto ${
                              projectTask.status === "completed"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : projectTask.status === "in_progress"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : projectTask.status === "assigned"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : projectTask.status === "pending"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                          >
                            {projectTask.status === "completed"
                              ? "Completada"
                              : projectTask.status === "in_progress"
                              ? "En Progreso"
                              : projectTask.status === "assigned"
                              ? "Asignada"
                              : projectTask.status === "pending"
                              ? "Pendiente"
                              : projectTask.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
                          <div className="flex items-center gap-1 min-w-0">
                            <Target className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">
                              Progreso:
                            </span>
                            <span className="font-semibold">
                              {projectTask.status === "completed"
                                ? "100%"
                                : `${progressPercentage}%`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 min-w-0">
                            <Target className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">
                              Estimado:
                            </span>
                            <span className="font-semibold">
                              {estimatedHours % 1 === 0
                                ? estimatedHours
                                : estimatedHours}
                              hs
                            </span>
                          </div>

                          <div className="flex items-center gap-1 min-w-0 sm:col-span-2">
                            <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">
                              Operario:
                            </span>
                            {projectTask.assignedUser ? (
                              <Badge
                                variant="secondary"
                                className="text-xs truncate"
                              >
                                {projectTask.assignedUser.name}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-xs text-muted-foreground"
                              >
                                Sin asignar
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-1 min-w-0">
                            <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">
                              Inicio:
                            </span>
                            <span className="text-xs font-semibold truncate">
                              {projectTask.startDate
                                ? formatDate(projectTask.startDate)
                                : "Sin fecha"}
                            </span>
                          </div>

                          {projectTask.endDate && (
                            <div className="flex items-center gap-1 min-w-0">
                              <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground">
                                Fin:
                              </span>
                              <span className="text-xs font-semibold truncate">
                                {formatDate(projectTask.endDate)}
                              </span>
                            </div>
                          )}

                          {projectTask.collaborators &&
                            projectTask.collaborators.length > 0 && (
                              <div className="flex items-start gap-1 sm:col-span-2">
                                <Users className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <span className="text-muted-foreground">
                                    Colaboradores:
                                  </span>
                                  <div className="flex items-center gap-1 flex-wrap mt-1">
                                    {projectTask.collaborators
                                      .slice(0, 2)
                                      .map((collaborator: any) => (
                                        <Badge
                                          key={collaborator.id}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {collaborator.user?.name || "Usuario"}
                                        </Badge>
                                      ))}
                                    {projectTask.collaborators.length > 2 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs text-muted-foreground"
                                      >
                                        +{projectTask.collaborators.length - 2}{" "}
                                        más
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                          <Link
                            href={`/admin/projects/${projectId}/metrics/task/${projectTask.id}`}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs cursor-pointer"
                            >
                              Ver detalle
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  );
}

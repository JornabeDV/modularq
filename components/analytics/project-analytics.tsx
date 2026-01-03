"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjectsPrisma } from "@/hooks/use-projects-prisma";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  PlayCircle,
  Target,
  FolderKanban,
  Package,
} from "lucide-react";
import Link from "next/link";
import { getProgressColor } from "@/lib/utils/project-utils";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarRadiusAxis,
  Label,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Estados reales del proyecto según el schema
export type ProjectStatusType =
  | "planning"
  | "active"
  | "paused"
  | "completed"
  | "delivered";

interface ProjectStatusInfo {
  type: ProjectStatusType;
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

const STATUS_CONFIG: ProjectStatusInfo[] = [
  {
    type: "planning",
    label: "Planificación",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    icon: <Target className="h-4 w-4" />,
  },
  {
    type: "active",
    label: "Activo",
    color: "text-green-600",
    bgColor: "bg-green-100",
    icon: <PlayCircle className="h-4 w-4" />,
  },
  {
    type: "paused",
    label: "En Pausa",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    type: "completed",
    label: "Completado",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  {
    type: "delivered",
    label: "Entregado",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    icon: <Package className="h-4 w-4" />,
  },
];

// Función para obtener la información del estado real del proyecto
function getStatusInfo(status: ProjectStatusType): ProjectStatusInfo {
  return (
    STATUS_CONFIG.find((config) => config.type === status) || STATUS_CONFIG[0]
  );
}

// Función para obtener el nivel de progreso basado en tareas completadas (para métricas)
function getProgressLevel(completionPercentage: number): string {
  if (completionPercentage === 0) return "No iniciado";
  if (completionPercentage >= 1 && completionPercentage <= 25)
    return "Iniciado";
  if (completionPercentage >= 26 && completionPercentage <= 50)
    return "En progreso";
  if (completionPercentage >= 51 && completionPercentage <= 75)
    return "Avanzado";
  if (completionPercentage >= 76 && completionPercentage <= 99)
    return "Casi completado";
  if (completionPercentage === 100) return "Completado";
  return "No iniciado";
}

export function ProjectAnalytics() {
  const { projects, loading } = useProjectsPrisma();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatusType | "all">(
    "all"
  );
  const isMobile = useIsMobile();

  // Calcular métricas para cada proyecto usando el estado real del proyecto
  const projectsWithStatus = useMemo(() => {
    if (!projects) return [];

    return projects.map((project) => {
      const totalTasks = project.projectTasks?.length || 0;
      const completedTasks =
        project.projectTasks?.filter((task: any) => task.status === "completed")
          .length || 0;
      const inProgressTasks =
        project.projectTasks?.filter(
          (task: any) =>
            task.status === "in_progress" || task.status === "assigned"
        ).length || 0;
      const pendingTasks =
        project.projectTasks?.filter((task: any) => task.status === "pending")
          .length || 0;

      const completionPercentage =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Usar el estado real del proyecto (planning, active, paused, completed)
      const status = project.status as ProjectStatusType;
      const statusInfo = getStatusInfo(status);
      const progressLevel = getProgressLevel(completionPercentage);

      return {
        ...project,
        status,
        statusInfo,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionPercentage,
        progressLevel,
      };
    });
  }, [projects]);

  // Filtrar proyectos
  const filteredProjects = useMemo(() => {
    return projectsWithStatus.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client?.companyName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projectsWithStatus, searchTerm, statusFilter]);

  // Calcular estadísticas agregadas basadas en estados reales
  const stats = useMemo(() => {
    const totalProjects = projectsWithStatus.length;
    const statusCounts = STATUS_CONFIG.reduce((acc, config) => {
      acc[config.type] = projectsWithStatus.filter(
        (p) => p.status === config.type
      ).length;
      return acc;
    }, {} as Record<ProjectStatusType, number>);

    const totalTasks = projectsWithStatus.reduce(
      (sum, p) => sum + p.totalTasks,
      0
    );
    const totalCompletedTasks = projectsWithStatus.reduce(
      (sum, p) => sum + p.completedTasks,
      0
    );
    const averageCompletion =
      totalProjects > 0
        ? Math.round(
            projectsWithStatus.reduce(
              (sum, p) => sum + p.completionPercentage,
              0
            ) / totalProjects
          )
        : 0;

    // Proyectos activos con progreso
    const activeProjects = projectsWithStatus.filter(
      (p) => p.status === "active"
    );
    const activeProjectsAverage =
      activeProjects.length > 0
        ? Math.round(
            activeProjects.reduce((sum, p) => sum + p.completionPercentage, 0) /
              activeProjects.length
          )
        : 0;

    return {
      totalProjects,
      statusCounts,
      totalTasks,
      totalCompletedTasks,
      averageCompletion,
      activeProjectsAverage,
      activeProjectsCount: activeProjects.length,
    };
  }, [projectsWithStatus]);

  // Configuración de colores para los gráficos
  const chartConfig = {
    proyectos: {
      label: "Proyectos Creados",
      color: "hsl(var(--chart-1))",
    },
    planning: {
      label: "Planificación",
      color: "#3b82f6", // Azul
    },
    active: {
      label: "Activo",
      color: "#22c55e", // Verde
    },
    paused: {
      label: "En Pausa",
      color: "#f59e0b", // Naranja/Ámbar más oscuro
    },
    completed: {
      label: "Completado",
      color: "#64748b", // Gris slate más oscuro
    },
    delivered: {
      label: "Entregado",
      color: "#a855f7", // Púrpura
    },
  };

  // Mapa de colores para el gráfico de torta
  const statusColors: Record<ProjectStatusType, string> = {
    planning: "#3b82f6", // Azul
    active: "#22c55e", // Verde
    paused: "#f59e0b", // Naranja/Ámbar
    completed: "#64748b", // Gris slate
    delivered: "#a855f7", // Púrpura
  };

  // Preparar datos para gráficos
  const chartData = useMemo(() => {
    return STATUS_CONFIG.map((config) => ({
      name: config.label,
      value: stats.statusCounts[config.type] || 0,
      fill: statusColors[config.type] || "#64748b",
    }));
  }, [stats.statusCounts]);

  // Función para obtener el inicio de la semana (lunes)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0); // Resetear a medianoche
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que lunes sea el primer día
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  // Preparar datos para gráfico semanal de proyectos creados
  const weeklyChartData = useMemo(() => {
    if (!projects || projects.length === 0) {
      // Si no hay proyectos, mostrar solo la semana actual
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayWeekStart = getWeekStart(today);
      const weekEnd = new Date(todayWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekStartStr = todayWeekStart.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
      });
      const weekEndStr = weekEnd.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
      });

      return [
        {
          semana: `${weekStartStr} - ${weekEndStr}`,
          proyectos: 0,
          fecha: todayWeekStart.toISOString().split("T")[0],
        },
      ];
    }

    // Obtener todas las fechas de creación
    const projectDates = projects.map((p) => new Date(p.createdAt));

    // Encontrar la fecha más antigua
    const minDate = new Date(Math.min(...projectDates.map((d) => d.getTime())));

    // Siempre incluir hasta la semana actual
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWeekStart = getWeekStart(today);

    // Generar todas las semanas desde la más antigua hasta la semana actual
    const weeks: { weekStart: Date; count: number }[] = [];
    const currentWeek = getWeekStart(minDate);

    while (currentWeek <= todayWeekStart) {
      const weekEnd = new Date(currentWeek);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999); // Hasta el final del día

      const count = projects.filter((p) => {
        const projectDate = new Date(p.createdAt);
        projectDate.setHours(0, 0, 0, 0);
        return projectDate >= currentWeek && projectDate <= weekEnd;
      }).length;

      weeks.push({
        weekStart: new Date(currentWeek),
        count,
      });

      // Avanzar a la siguiente semana
      const nextWeek = new Date(currentWeek);
      nextWeek.setDate(nextWeek.getDate() + 7);
      currentWeek.setTime(nextWeek.getTime());
    }

    // Formatear para el gráfico
    return weeks.map((week) => {
      const weekStartStr = week.weekStart.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
      });
      const weekEnd = new Date(week.weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekEndStr = weekEnd.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
      });

      return {
        semana: `${weekStartStr} - ${weekEndStr}`,
        proyectos: week.count,
        fecha: week.weekStart.toISOString().split("T")[0],
      };
    });
  }, [projects]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Sin fecha";
    const date = dateString.includes("T")
      ? new Date(dateString)
      : new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
            Analytics de Proyectos
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Estado y progreso de todos los proyectos basado en tareas
            completadas
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Gráfico de Pie - Porcentaje por Estado */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">
              Distribución Porcentual por Estado
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Porcentaje de proyectos en cada estado del proyecto
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-4 sm:pb-6">
            <div className="w-full overflow-hidden relative max-w-full">
              <ChartContainer
                config={chartConfig}
                className="h-[250px] sm:h-[300px] w-full !aspect-auto [&>div]:overflow-hidden [&>div]:max-w-full"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, value }) => {
                      // Mostrar label solo si hay valor
                      if (value === 0) return "";
                      return `${name}\n${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={isMobile ? 40 : 60}
                    innerRadius={isMobile ? 15 : 20}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="name" />}
                    verticalAlign="bottom"
                    height={36}
                  />
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico Semanal - Proyectos Creados por Semana */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">
              Proyectos Creados por Semana
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Evolución semanal de proyectos creados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-4 sm:pb-6">
            {weeklyChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-muted-foreground text-sm">
                <p>No hay datos suficientes para mostrar</p>
              </div>
            ) : (
              <div className="w-full overflow-hidden relative max-w-full">
                <ChartContainer
                  config={chartConfig}
                  className="h-[250px] sm:h-[300px] w-full !aspect-auto [&>div]:overflow-hidden [&>div]:max-w-full"
                >
                  <LineChart
                    data={weeklyChartData}
                    margin={{
                      top: 5,
                      right: isMobile ? 5 : 10,
                      left: isMobile ? -5 : 0,
                      bottom: isMobile ? 50 : 35,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="semana"
                      angle={isMobile ? -90 : -45}
                      textAnchor={isMobile ? "middle" : "end"}
                      height={isMobile ? 70 : 50}
                      interval={weeklyChartData.length > 6 ? 1 : 0}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: isMobile ? 8 : 10 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      domain={[0, "auto"]}
                      tick={{ fontSize: isMobile ? 8 : 10 }}
                      width={isMobile ? 30 : 40}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => {
                            const itemConfig =
                              chartConfig[name as keyof typeof chartConfig];
                            const label = itemConfig?.label || name;
                            return (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-xs sm:text-sm">
                                  {label}
                                </span>
                                <span className="text-foreground font-mono font-medium tabular-nums text-xs sm:text-sm">
                                  {typeof value === "number"
                                    ? value.toLocaleString()
                                    : value}
                                </span>
                              </div>
                            );
                          }}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      type="monotone"
                      dataKey="proyectos"
                      stroke="#3b82f6"
                      strokeWidth={isMobile ? 2 : 3}
                      dot={{
                        fill: "#3b82f6",
                        r: isMobile ? 3 : 4,
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                      activeDot={{
                        r: isMobile ? 5 : 6,
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lista de Proyectos - Vista Gráfica con Radial Charts */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FolderKanban className="h-4 w-4 sm:h-5 sm:w-5" />
            Progreso de Proyectos ({filteredProjects.length})
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Estado y progreso de cada proyecto basado en tareas completadas
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">
                No se encontraron proyectos
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Intenta ajustar los filtros de búsqueda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredProjects.map((project) => {
                const statusInfo = project.statusInfo;

                const progressColor = getProgressColor(
                  project.completionPercentage
                );

                // Datos para el gráfico radial
                const radialData = [
                  {
                    name: "progreso",
                    value: project.completionPercentage,
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
                  <Link
                    key={project.id}
                    href={`/admin/projects/${project.id}/metrics`}
                    className="block"
                  >
                    <Card className="hover:shadow-lg max-sm:gap-2 transition-all cursor-pointer h-full flex flex-col !py-2 sm:!py-6">
                      <CardHeader className="items-start pb-1 sm:pb-2 px-2 sm:px-6 pt-0 sm:pt-0">
                        <Badge
                          variant="outline"
                          className={`${statusInfo.color} border-current text-xs mb-1 sm:mb-2`}
                        >
                          {statusInfo.label}
                        </Badge>
                        <CardTitle className="text-xs sm:text-base line-clamp-2 text-left leading-tight">
                          {project.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 pb-0 sm:pb-0 px-2 sm:px-6">
                        <ChartContainer
                          config={radialChartConfig}
                          className="mx-auto aspect-square max-h-[180px] sm:max-h-[220px]"
                        >
                          <RadialBarChart
                            data={radialData}
                            endAngle={90 + project.completionPercentage * 3.6}
                            innerRadius={isMobile ? 55 : 65}
                            outerRadius={isMobile ? 85 : 100}
                            startAngle={90}
                            width={isMobile ? 180 : 220}
                            height={isMobile ? 180 : 220}
                          >
                            <PolarGrid
                              gridType="circle"
                              radialLines={false}
                              stroke="none"
                              className="first:fill-muted last:fill-background"
                              polarRadius={isMobile ? [60, 50] : [70, 60]}
                            />
                            <RadialBar
                              dataKey="value"
                              background
                              cornerRadius={10}
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
                                            isMobile ? "text-2xl" : "text-3xl"
                                          }`}
                                        >
                                          {project.completionPercentage}%
                                        </tspan>
                                        <tspan
                                          x={viewBox.cx}
                                          y={
                                            (viewBox.cy || 0) +
                                            (isMobile ? 16 : 20)
                                          }
                                          className="fill-muted-foreground text-xs"
                                        >
                                          Completado
                                        </tspan>
                                      </text>
                                    );
                                  }
                                }}
                              />
                            </PolarRadiusAxis>
                          </RadialBarChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

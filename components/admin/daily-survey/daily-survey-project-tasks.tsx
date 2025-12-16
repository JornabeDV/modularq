"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProjectsPrisma } from "@/hooks/use-projects-prisma";
import { useProjectTasksPrisma } from "@/hooks/use-project-tasks-prisma";
import { useProjectOperariosPrisma } from "@/hooks/use-project-operarios-prisma";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft, AlertCircle, Target } from "lucide-react";
import {
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarRadiusAxis,
  Label,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { DailySurveyTaskCard } from "./daily-survey-task-card";

interface DailySurveyProjectTasksProps {
  projectId: string;
}

export function DailySurveyProjectTasks({
  projectId,
}: DailySurveyProjectTasksProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { projects, loading: projectsLoading } = useProjectsPrisma();
  const {
    projectTasks,
    updateProjectTask,
    loading: tasksLoading,
  } = useProjectTasksPrisma(projectId);
  const { projectOperarios, loading: operariosLoading } =
    useProjectOperariosPrisma(projectId);

  const project = projects.find((p) => p.id === projectId);
  const loading = projectsLoading || tasksLoading || operariosLoading;
  const isMobile = useIsMobile();

  // Calcular estadísticas
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter(
    (pt) => pt.status === "completed"
  ).length;
  const inProgressTasks = projectTasks.filter(
    (pt) => pt.status === "in_progress"
  ).length;
  const pendingTasks = projectTasks.filter(
    (pt) => pt.status === "pending"
  ).length;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Función para obtener el color del progreso
  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return "hsl(142, 76%, 36%)"; // green-600
    if (percentage >= 75) return "hsl(262, 83%, 58%)"; // purple-500
    if (percentage >= 50) return "hsl(25, 95%, 53%)"; // orange-500
    if (percentage >= 25) return "hsl(45, 93%, 47%)"; // yellow-500
    return "hsl(217, 91%, 60%)"; // blue-500
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    // Calcular progreso basado en estado
    let progressPercentage = 0;
    if (newStatus === "completed") {
      progressPercentage = 100;
    } else if (newStatus === "in_progress") {
      progressPercentage = 50;
    } else {
      progressPercentage = 0;
    }

    // Obtener la tarea actual para verificar fechas existentes
    const currentTask = projectTasks.find((t) => t.id === taskId);
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Preparar datos de actualización con fechas según el estado
    const updateData: any = {
      status: newStatus as any,
      progressPercentage,
    };

    // Guardar fechas según el cambio de estado
    if (newStatus === "in_progress") {
      // Si pasa a "en progreso" y no tiene fecha de inicio, guardarla
      if (!currentTask?.startDate) {
        updateData.startDate = today;
      }
      // Si estaba completada y vuelve a otro estado, limpiar fecha de fin
      if (currentTask?.endDate) {
        updateData.endDate = null; // null para limpiar el campo
      }
    } else if (newStatus === "completed") {
      // Si se completa, guardar fecha de fin
      updateData.endDate = today;
      // Si no tiene fecha de inicio, guardarla también
      if (!currentTask?.startDate) {
        updateData.startDate = today;
      }
    } else if (newStatus === "pending") {
      // Si vuelve a pendiente, limpiar fechas
      if (currentTask?.startDate) {
        updateData.startDate = null; // null para limpiar el campo
      }
      if (currentTask?.endDate) {
        updateData.endDate = null; // null para limpiar el campo
      }
    }

    const result = await updateProjectTask(taskId, updateData);

    if (result.success) {
      toast({
        title: "✓ Estado actualizado",
        description: "El estado de la tarea ha sido actualizado",
        variant: "default",
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la tarea",
        variant: "destructive",
      });
    }
  };

  const handleAssignOperario = async (taskId: string, operarioId: string) => {
    const result = await updateProjectTask(taskId, {
      assignedTo: operarioId === "none" ? undefined : operarioId,
    });

    if (result.success) {
      toast({
        title: "✓ Operario asignado",
        description: "El operario ha sido asignado a la tarea",
        variant: "default",
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo asignar el operario",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Proyecto no encontrado</h2>
        <Button
          onClick={() => router.push("/admin/daily-survey")}
          className="cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Relevamiento Diario
        </Button>
      </div>
    );
  }

  // Ordenar tareas: en progreso primero, luego pendientes, luego completadas
  const sortedTasks = [...projectTasks].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      in_progress: 0,
      pending: 1,
      completed: 2,
      cancelled: 3,
    };
    return (statusOrder[a.status] ?? 999) - (statusOrder[b.status] ?? 999);
  });

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/daily-survey")}
          className="cursor-pointer h-8 sm:h-9"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          Volver
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-1">
            {project.name}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Relevamiento diario de tareas
          </p>
        </div>
      </div>

      {/* Resumen del proyecto */}
      <Card className="p-2.5 sm:p-4">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-base sm:text-lg">
            Resumen del Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-700">
                {completedTasks}
              </div>
              <div className="text-xs text-green-600">Completadas</div>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded-lg">
              <div className="text-xl font-bold text-orange-700">
                {inProgressTasks}
              </div>
              <div className="text-xs text-orange-600">En Progreso</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded-lg">
              <div className="text-xl font-bold text-yellow-700">
                {pendingTasks}
              </div>
              <div className="text-xs text-yellow-600">Pendientes</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-700">
                {totalTasks}
              </div>
              <div className="text-xs text-blue-600">Total</div>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center justify-between text-xs sm:text-sm mb-2 sm:mb-3">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                Progreso General
              </span>
              <span className="font-semibold">{progressPercentage}%</span>
            </div>
            {(() => {
              const progressColor = getProgressColor(progressPercentage);
              const radialData = [
                {
                  name: "progreso",
                  value: progressPercentage,
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
                  className="mx-auto aspect-square max-h-[120px] sm:max-h-[150px]"
                >
                  <RadialBarChart
                    data={radialData}
                    endAngle={90 + progressPercentage * 3.6}
                    innerRadius={isMobile ? 30 : 35}
                    outerRadius={isMobile ? 45 : 50}
                    startAngle={90}
                    width={isMobile ? 120 : 150}
                    height={isMobile ? 120 : 150}
                  >
                    <PolarGrid
                      gridType="circle"
                      radialLines={false}
                      stroke="none"
                      className="first:fill-muted last:fill-background"
                      polarRadius={isMobile ? [35, 25] : [40, 30]}
                    />
                    <RadialBar dataKey="value" background cornerRadius={8} />
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
                                  className={`fill-foreground font-bold ${
                                    isMobile ? "text-lg" : "text-xl"
                                  }`}
                                >
                                  {progressPercentage}%
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
          </div>
        </CardContent>
      </Card>

      {/* Lista de tareas */}
      <div className="space-y-2.5 sm:space-y-4">
        <h2 className="text-base sm:text-xl font-semibold">
          Tareas del Proyecto
        </h2>
        {sortedTasks.length === 0 ? (
          <Card className="p-2.5 sm:p-4">
            <CardContent className="py-8 sm:py-12 text-center p-0">
              <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-muted-foreground text-sm sm:text-base">
                No hay tareas asignadas a este proyecto
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {sortedTasks.map((task, index) => (
              <DailySurveyTaskCard
                key={task.id}
                task={task}
                taskNumber={index + 1}
                projectOperarios={projectOperarios || []}
                onStatusChange={handleStatusChange}
                onAssignOperario={handleAssignOperario}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

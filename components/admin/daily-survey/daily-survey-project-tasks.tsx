"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProjectsPrisma } from "@/hooks/use-projects-prisma";
import { useProjectTasksPrisma } from "@/hooks/use-project-tasks-prisma";
import { useProjectOperariosPrisma } from "@/hooks/use-project-operarios-prisma";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, AlertCircle, Search, Plus } from "lucide-react";
import { getProgressColor } from "@/lib/utils/project-utils";
import { REQUIRE_OPERARIO_FOR_TASK } from "@/lib/constants";
import {
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarRadiusAxis,
  Label,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { DailySurveyTaskCard } from "./daily-survey-task-card";
import { Input } from "@/components/ui/input";
import { TaskForm } from "@/components/admin/tasks/task-form";
import { useTasksPrisma } from "@/hooks/use-tasks-prisma";
import type { ProjectTask } from "@/lib/types";

interface DailySurveyProjectTasksProps {
  projectId: string;
}

export function DailySurveyProjectTasks({
  projectId,
}: DailySurveyProjectTasksProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { projects, loading: projectsLoading } = useProjectsPrisma();
  const {
    projectTasks,
    updateProjectTask,
    createProjectTask,
    deleteProjectTask,
    loading: tasksLoading,
  } = useProjectTasksPrisma(projectId);
  const { projectOperarios, loading: operariosLoading } =
    useProjectOperariosPrisma(projectId);
  const { createTask, updateTask } = useTasksPrisma();

  const project = projects.find((p) => p.id === projectId);
  const loading = projectsLoading || tasksLoading || operariosLoading;
  const isMobile = useIsMobile();

  const activeTasks = projectTasks.filter((pt) => pt.status !== "cancelled");
  const totalTasks = activeTasks.length;
  const completedTasks = activeTasks.filter(
    (pt) => pt.status === "completed",
  ).length;
  const inProgressTasks = activeTasks.filter(
    (pt) => pt.status === "in_progress",
  ).length;
  const pendingTasks = activeTasks.filter(
    (pt) => pt.status === "pending",
  ).length;
  const cancelledTasks = projectTasks.filter(
    (pt) => pt.status === "cancelled",
  ).length;
  const validTasks = totalTasks - cancelledTasks;
  const progressPercentage =
    validTasks > 0 ? Math.round((completedTasks / validTasks) * 100) : 0;

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const currentTask = projectTasks.find((t) => t.id === taskId);

    if (
      REQUIRE_OPERARIO_FOR_TASK &&
      (newStatus === "in_progress" || newStatus === "completed") &&
      !currentTask?.assignedTo
    ) {
      toast({
        title: "Operario requerido",
        description:
          "Debes asignar un operario antes de cambiar el estado a 'En Progreso' o 'Completada'",
        variant: "destructive",
      });
      return;
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const updateData: any = {
      status: newStatus as any,
    };

    if (newStatus === "completed") {
      updateData.progressPercentage = 100;
    } else if (newStatus === "pending" || newStatus === "cancelled") {
      updateData.progressPercentage = 0;
    }

    if (newStatus === "in_progress") {
      if (!currentTask?.startDate) {
        updateData.startDate = today;
      }
      if (currentTask?.endDate) {
        updateData.endDate = null;
      }
    } else if (newStatus === "completed") {
      updateData.endDate = today;
      if (!currentTask?.startDate) {
        updateData.startDate = today;
      }
    } else if (newStatus === "pending" || newStatus === "cancelled") {
      if (currentTask?.startDate) {
        updateData.startDate = null;
      }
      if (currentTask?.endDate) {
        updateData.endDate = null;
      }
    }

    const result = await updateProjectTask(taskId, updateData, true, user?.id);

    if (result.success) {
      toast({
        title: "✓ Estado actualizado",
        description: "El estado de la tarea ha sido actualizado",
        variant: "default",
      });
    } else {
      toast({
        title: "Error",
        description:
          result.error || "No se pudo actualizar el estado de la tarea",
        variant: "destructive",
      });
    }
  };

  const handleAssignOperario = async (taskId: string, operarioId: string) => {
    const currentTask = projectTasks.find((t) => t.id === taskId);
    const isDesasignando = operarioId === "none";

    const userIdToResolve = isDesasignando
      ? currentTask?.assignedTo
      : operarioId;

    const selectedUser = projectOperarios.find(
      (operario) => operario.user_id === userIdToResolve,
    );

    const selectedRole = selectedUser?.user?.role;

    const updateData: any = {
      assignedTo: isDesasignando ? null : operarioId,
    };

    if (
      isDesasignando &&
      currentTask &&
      (currentTask.status === "in_progress" ||
        currentTask.status === "completed")
    ) {
      updateData.status = "pending";
      updateData.progressPercentage = 0;
      if (currentTask.startDate) {
        updateData.startDate = null;
      }
      if (currentTask.endDate) {
        updateData.endDate = null;
      }
    }

    const result = await updateProjectTask(taskId, updateData, true, user?.id);

    if (result.success) {
      toast({
        title: isDesasignando
          ? selectedRole === "subcontratista"
            ? "✓ Subcontratista desasignado"
            : "✓ Operario desasignado"
          : selectedRole === "subcontratista"
            ? "✓ Subcontratista asignado"
            : "✓ Operario asignado",

        description: isDesasignando
          ? selectedRole === "subcontratista"
            ? "El subcontratista ha sido desasignado de la tarea"
            : currentTask?.status === "in_progress" ||
                currentTask?.status === "completed"
              ? "El operario ha sido desasignado y el estado se cambió a 'Pendiente'"
              : "El operario ha sido desasignado de la tarea"
          : selectedRole === "subcontratista"
            ? "El subcontratista ha sido asignado a la tarea"
            : "El operario ha sido asignado a la tarea",

        variant: "default",
      });
    } else {
      toast({
        title: "Error",
        description:
          result.error || "No se pudo actualizar la asignación del operario",
        variant: "destructive",
      });
    }
  };

  const handleCollaboratorsChange = () => {};

  const handleCreateTask = async (taskData: any) => {
    if (!user?.id || !projectId) return;
    setIsCreatingTask(true);

    const result = await createTask({
      title: taskData.title,
      description: taskData.description || "",
      estimatedHours: taskData.estimatedHours,
      category: taskData.category || "",
      type: "custom",
      createdBy: user.id,
    });

    if (result.success && result.taskId) {
      const projectTaskResult = await createProjectTask({
        projectId,
        taskId: result.taskId,
        status: "pending",
      });

      if (projectTaskResult.success) {
        toast({
          title: "✓ Tarea creada",
          description: `"${taskData.title}" se agregó al proyecto`,
        });
        setIsCreateTaskOpen(false);
      } else {
        toast({
          title: "Error al asignar tarea",
          description:
            projectTaskResult.error || "No se pudo asignar la tarea al proyecto",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Error al crear tarea",
        description: result.error || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    }

    setIsCreatingTask(false);
  };

  const handleEditTask = (task: ProjectTask) => {
    setEditingTask(task);
    setIsEditTaskOpen(true);
  };

  const handleUpdateTask = async (taskData: any) => {
    if (!editingTask?.task?.id) return;
    setIsUpdatingTask(true);

    const result = await updateTask(editingTask.task.id, {
      title: taskData.title,
      description: taskData.description || "",
      estimated_hours: taskData.estimatedHours,
      category: taskData.category || "",
      type: taskData.type || "custom",
    });

    if (result.success) {
      toast({
        title: "✓ Tarea actualizada",
        description: `"${taskData.title}" se actualizó correctamente`,
      });
      setIsEditTaskOpen(false);
      setEditingTask(null);
    } else {
      toast({
        title: "Error al actualizar tarea",
        description: result.error || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    }

    setIsUpdatingTask(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    const result = await deleteProjectTask(taskId);
    if (result.success) {
      toast({
        title: "✓ Tarea eliminada",
        description: "La tarea se eliminó del proyecto",
      });
    } else {
      toast({
        title: "Error al eliminar tarea",
        description: result.error || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    }
  };

  const sortedTasks = [...projectTasks].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      in_progress: 0,
      pending: 1,
      completed: 2,
      cancelled: 3,
    };
    return (statusOrder[a.status] ?? 999) - (statusOrder[b.status] ?? 999);
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);

  const filteredTasks = sortedTasks.filter((task) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = task.task?.title?.toLowerCase().includes(query);
    const descriptionMatch = task.task?.description?.toLowerCase().includes(query);
    const statusMatch = task.status?.toLowerCase().includes(query);
    return nameMatch || descriptionMatch || statusMatch;
  });

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
          <ArrowLeft className="h-4 w-4" />
          Volver a Relevamiento Diario
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
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

      <Card className="p-2.5 sm:p-4 gap-0 sm:gap-4">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-base sm:text-lg">
            Resumen del Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex sm:flex-col items-center gap-3">
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
                  className="aspect-square h-36 sm:h-44 flex-shrink-0"
                >
                  <RadialBarChart
                    data={radialData}
                    endAngle={90 + progressPercentage * 3.6}
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
                                  className={`fill-foreground font-bold ${
                                    isMobile ? "text-sm" : "text-base"
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

            <div
              className={`flex-1 grid grid-cols-1 sm:grid-cols-2 ${
                cancelledTasks > 0 ? "lg:grid-cols-5" : "lg:grid-cols-4"
              } gap-1 text-center min-w-[80px] w-full`}
            >
              <div className="p-1 border rounded-md">
                <div className="text-xs sm:text-sm font-bold text-foreground">
                  {completedTasks}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Completadas
                </div>
              </div>
              <div className="p-1 border rounded-md">
                <div className="text-xs sm:text-sm font-bold text-foreground">
                  {inProgressTasks}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  En Progreso
                </div>
              </div>
              <div className="p-1 border rounded-md">
                <div className="text-xs sm:text-sm font-bold text-foreground">
                  {pendingTasks}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Pendientes
                </div>
              </div>
              <div className="p-1 border rounded-md">
                <div className="text-xs sm:text-sm font-bold text-foreground">
                  {totalTasks}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Total Activas
                </div>
              </div>
              {cancelledTasks > 0 && (
                <div className="p-1 border rounded-md">
                  <div className="text-xs sm:text-sm font-bold text-foreground">
                    {cancelledTasks}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Canceladas
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <h2 className="text-base sm:text-xl font-semibold max-sm:mt-6">
            Tareas del Proyecto
          </h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar tarea..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 cursor-pointer h-9"
              onClick={() => setIsCreateTaskOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Agregar tarea</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          </div>
        </div>
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
            {filteredTasks.length === 0 ? (
              <Card className="p-2.5 sm:p-4">
                <CardContent className="py-6 sm:py-8 text-center p-0">
                  <Search className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mx-auto mb-2 sm:mb-3" />
                  <p className="text-muted-foreground text-sm sm:text-base">
                    No se encontraron tareas para "{searchQuery}"
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map((task, index) => (
                <DailySurveyTaskCard
                  key={task.id}
                  task={task}
                  taskNumber={index + 1}
                  projectOperarios={projectOperarios || []}
                  projectSubcontractors={(projectOperarios || []).filter(
                    (operario) => operario.user?.role === "subcontratista",
                  )}
                  onStatusChange={handleStatusChange}
                  onAssignOperario={handleAssignOperario}
                  onCollaboratorsChange={handleCollaboratorsChange}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              ))
            )}
          </div>
        )}
      </div>

      <TaskForm
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onSubmit={handleCreateTask}
        isEditing={false}
        projectId={projectId}
        isLoading={isCreatingTask}
      />

      {editingTask && (
        <TaskForm
          isOpen={isEditTaskOpen}
          onClose={() => {
            setIsEditTaskOpen(false);
            setEditingTask(null);
          }}
          onSubmit={handleUpdateTask}
          isEditing={true}
          initialData={editingTask.task || undefined}
          projectId={projectId}
          isLoading={isUpdatingTask}
        />
      )}
    </div>
  );
}

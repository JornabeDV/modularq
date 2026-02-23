"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { useProjectsPrisma } from "@/hooks/use-projects-prisma";
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard";
import { StatusBadge } from "@/components/admin/metrics/status-badge";
import {
  ArrowLeft,
  Target,
  Calendar,
  Users,
  FileText,
  User,
} from "lucide-react";

function getDisplayStartDate(projectTask: any) {
  if (!projectTask) return null;

  if (projectTask.startedAt) {
    return new Date(projectTask.startedAt);
  }

  if (
    projectTask.status === "completed" &&
    projectTask.completedAt &&
    projectTask.task?.estimatedHours &&
    projectTask.task.estimatedHours > 0
  ) {
    const end = new Date(projectTask.completedAt);
    return new Date(
      end.getTime() - projectTask.task.estimatedHours * 60 * 60 * 1000,
    );
  }

  return null;
}

export default function TaskMetricsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const taskId = params?.taskId as string;
  const { projects, loading, refetch } = useProjectsPrisma();

  const project = projects?.find((p) => p.id === projectId);
  const projectTask = project?.projectTasks?.find((pt) => pt.id === taskId);
  const task = projectTask?.task;

  const [taskState, setTaskState] = useState<any>(null);

  useEffect(() => {
    if (projectTask) {
      setTaskState({
        startedByUser: projectTask.startedByUser,
        startedAt: projectTask.startedAt,
        completedByUser: projectTask.completedByUser,
        completedAt: projectTask.completedAt,
      });
    }
  }, [projectTask]);

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || date.getTime() === 0) return null;
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayStartedAt = projectTask
    ? getDisplayStartDate(projectTask)
    : null;

  const isEstimatedStart =
    !!projectTask && !projectTask.startedAt && !!displayStartedAt;

  if (!loading && (!project || !projectTask || !task)) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Tarea no encontrada</h3>
          <p className="text-muted-foreground mb-4">
            La tarea que buscas no existe o no tienes permisos para verla
          </p>
          <Button
            onClick={() => router.push(`/admin/projects/${projectId}/metrics`)}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Métricas del Proyecto
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (loading || !project || !projectTask || !task) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">
              Cargando métricas de la tarea...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  let estimatedHours = projectTask.estimatedHours || 0;
  if (estimatedHours === 0 && task?.estimatedHours && project?.moduleCount) {
    estimatedHours = task.estimatedHours * project.moduleCount;
  } else if (estimatedHours === 0) {
    estimatedHours = task?.estimatedHours || 0;
  }

  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/admin/projects/${projectId}/metrics`)
                }
                className="cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
              <StatusBadge
                status={projectTask.status}
                className="font-medium text-xs sm:text-sm"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold leading-tight break-words">
                {task.title}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Métricas detalladas de la tarea
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Target className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Tiempo Estimado</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold">
                    {estimatedHours}hs
                  </p>
                </div>
                <div className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {projectTask.assignedUser
                        ? projectTask.assignedUser.role === "subcontratista"
                          ? "Subcontratista Asignado:"
                          : "Operario Asignado:"
                        : "Operario Asignado:"}
                    </span>
                  </div>
                  <p className="font-medium text-sm sm:text-base truncate">
                    {projectTask.assignedUser?.name || "Sin asignar"}
                  </p>
                </div>
                <div className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Fecha de Inicio</span>
                  </div>
                  {(() => {
                    const startedAt = taskState?.startedAt || displayStartedAt;

                    const formattedDate = formatDateTime(startedAt);

                    const startedByUser =
                      taskState?.startedByUser || projectTask.startedByUser;

                    if (formattedDate) {
                      return (
                        <>
                          <p className="font-medium text-sm sm:text-base">
                            {formattedDate}
                            {isEstimatedStart && !startedByUser && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (estimada)
                              </span>
                            )}
                          </p>

                          {startedByUser && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Iniciada por:{" "}
                              <span className="font-semibold text-foreground">
                                {startedByUser.name}
                              </span>
                            </p>
                          )}
                        </>
                      );
                    }

                    return (
                      <p className="font-medium text-sm sm:text-base text-foreground">
                        Sin fecha
                      </p>
                    );
                  })()}
                </div>
                <div className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Fecha de Fin</span>
                  </div>
                  {(() => {
                    const endDate =
                      taskState?.completedAt ||
                      projectTask.completedAt ||
                      projectTask.endDate;
                    const formattedDate = formatDateTime(endDate);

                    if (formattedDate) {
                      return (
                        <>
                          <p className="font-medium text-sm sm:text-base">
                            {formattedDate}
                          </p>
                          {(taskState?.completedByUser ||
                            projectTask.completedByUser) && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Completada por:{" "}
                              <span className="font-semibold text-foreground">
                                {
                                  (
                                    taskState?.completedByUser ||
                                    projectTask.completedByUser
                                  )?.name
                                }
                              </span>
                            </p>
                          )}
                        </>
                      );
                    }

                    return (
                      <p className="font-medium text-sm sm:text-base text-foreground">
                        Sin fecha
                      </p>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
          {projectTask.collaborators &&
            projectTask.collaborators.length > 0 && (
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
                      <Badge
                        key={collaborator.id}
                        variant="outline"
                        className="text-xs sm:text-sm"
                      >
                        <User className="h-3 w-3 mr-1" />
                        {collaborator.user?.name || "Usuario"}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  );
}

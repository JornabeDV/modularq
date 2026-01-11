"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, CheckCircle, Target, Users } from "lucide-react";
import { StatusBadge } from "./status-badge";

type Props = {
  project: any;
  projectId: string;
};

export function TaskMetricsCard({ project, projectId }: Props) {
  const orderedTasks = [...project.projectTasks].sort((a: any, b: any) => {
    const statusOrder: Record<string, number> = {
      in_progress: 0,
      assigned: 1,
      pending: 2,
      completed: 3,
      cancelled: 4,
    };
    const orderA = statusOrder[a.status] ?? 999;
    const orderB = statusOrder[b.status] ?? 999;
    return orderA - orderB;
  });

  return (
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
          {orderedTasks.map((projectTask: any, index: number) => {
            const task = projectTask.task;
            let estimatedHours = projectTask.estimatedHours || 0;
            if (
              estimatedHours === 0 &&
              task?.estimatedHours &&
              project?.moduleCount
            ) {
              estimatedHours = task.estimatedHours * project.moduleCount;
            } else if (estimatedHours === 0) {
              estimatedHours = task?.estimatedHours || 0;
            }

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
                  <StatusBadge
                    status={projectTask.status}
                    className="self-start sm:self-auto"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
                  <div className="flex items-center gap-1 min-w-0">
                    <Target className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">Estimado:</span>
                    <span className="font-semibold">
                      {estimatedHours}
                      hs
                    </span>
                  </div>

                  <div className="flex items-center gap-1 min-w-0 sm:col-span-2">
                    <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">Operario:</span>
                    {projectTask.assignedUser ? (
                      <Badge variant="secondary" className="text-xs truncate">
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
                    <span className="text-muted-foreground">Inicio:</span>
                    <span className="text-xs font-semibold truncate">
                      {projectTask.startDate
                        ? formatDate(projectTask.startDate)
                        : "Sin fecha"}
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

                  {projectTask.collaborators &&
                    projectTask.collaborators.length > 0 && (
                      <div className="flex items-start gap-1 sm:col-span-2">
                        <div className="flex items-center gap-1 min-w-0 sm:col-span-2 h-[22px]">
                          <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
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
                                +{projectTask.collaborators.length - 2} más
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
  );
}

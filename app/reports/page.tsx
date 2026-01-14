"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjectsPrisma } from "@/hooks/use-projects-prisma";
import { CheckCircle, FolderKanban, Calendar } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function ReportsPage() {
  return (
    <AdminOrSupervisorOnly>
      <ReportsContent />
    </AdminOrSupervisorOnly>
  );
}

function ReportsContent() {
  const { projects, loading: projectsLoading } = useProjectsPrisma();

  const completedProjects = projects.filter((p) => p.status === "completed");

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Reportes</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Proyectos completados y análisis históricos
            </p>
          </div>
        </div>

        {/* Proyectos Completados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Proyectos Completados
            </CardTitle>
            <CardDescription>
              Proyectos que han sido finalizados exitosamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">
                    Cargando proyectos...
                  </p>
                </div>
              </div>
            ) : completedProjects.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No hay proyectos completados
                </h3>
                <p className="text-muted-foreground mb-4">
                  Los proyectos completados aparecerán aquí cuando todas sus
                  tareas estén terminadas
                </p>
                <Link href="/admin/projects">
                  <Button className="gap-2 cursor-pointer">
                    <FolderKanban className="h-4 w-4" />
                    Ver Todos los Proyectos
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {completedProjects.map((project) => {
                  const totalTasks = project.projectTasks.length;

                  return (
                    <Card key={project.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base sm:text-lg">
                              {project.name}
                            </CardTitle>
                            <CardDescription className="line-clamp-2 text-sm">
                              {project.description}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="text-xs">Completado</Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Información del proyecto */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">
                              Inicio:
                            </span>
                            <span className="truncate">{formatDate(project.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">Fin:</span>
                            <span className="truncate">{formatDate(project.endDate)}</span>
                          </div>
                        </div>

                        {/* Métricas del proyecto */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-semibold">
                              {totalTasks}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Tareas
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold">
                              {project.projectOperarios.length}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Operarios
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold">100%</div>
                            <div className="text-xs text-muted-foreground">
                              Completado
                            </div>
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="pt-2">
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
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

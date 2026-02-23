"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FolderOpen, Users } from "lucide-react";
import { formatProjectDate, getStatusInfo } from "@/lib/utils/project-utils";
import type { Project } from "@/lib/types";

interface ProjectInfoCardsProps {
  project: Project;
  projectTasksCount: number;
  projectFilesCount: number;
  showFiles?: boolean;
}

export function ProjectInfoCards({
  project,
  projectTasksCount,
  projectFilesCount,
  showFiles = false,
}: ProjectInfoCardsProps) {
  const statusInfo = getStatusInfo(project.status);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Información del Proyecto
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Creado
              </label>
              <p className="text-sm">{formatProjectDate(project.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Última Actualización
              </label>
              <p className="text-sm">{formatProjectDate(project.updatedAt)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Fecha de Inicio
              </label>
              <p className="text-sm">{formatProjectDate(project.startDate)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Fecha de Finalización
              </label>
              <p className="text-sm">{formatProjectDate(project.endDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:col-span-2">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={statusInfo.color}>{statusInfo.label}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Condición</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={project.condition === 'alquiler' ? 'default' : 'outline'}>
                {project.condition === 'alquiler' ? 'Alquiler' : 'Venta'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectTasksCount}</div>
            <p className="text-sm text-muted-foreground">Tareas asignadas</p>
          </CardContent>
        </Card>

        {showFiles && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Archivos</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectFilesCount}</div>
              <p className="text-sm text-muted-foreground">
                Archivo{projectFilesCount !== 1 ? "s" : ""} subido
                {projectFilesCount !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

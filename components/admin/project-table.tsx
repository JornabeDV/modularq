"use client";

import React, { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataPagination } from "@/components/ui/data-pagination";
import { DraggableProjectRow } from "./draggable-project-row";
import { ProjectFilters } from "./project-filters";
import type { Project } from "@/lib/types";

type SortField =
  | "name"
  | "clientName"
  | "status"
  | "condition"
  | "startDate"
  | "endDate"
  | "progress";

interface ProjectTableProps {
  projects: Project[];
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onStatusChange?: (projectId: string, newStatus: string) => Promise<void>;
  onReorderProjects?: (
    projectOrders: { id: string; projectOrder: number }[],
  ) => void;
  isReadOnly?: boolean;
  sortField?: SortField;
  sortOrder?: "asc" | "desc";
  onSort?: (field: SortField) => void;
}

export function ProjectTable({
  projects,
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onEditProject,
  onDeleteProject,
  onStatusChange,
  onReorderProjects,
  isReadOnly = false,
  sortField,
  sortOrder,
  onSort,
}: ProjectTableProps) {
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(
    null,
  );
  const [localProjects, setLocalProjects] = useState(projects);

  // Sincronizar localProjects con projects cuando cambien
  React.useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  // Funciones de drag and drop
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedProjectId(projectId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", projectId);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedProjectId(null);
    setDragOverProjectId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetProjectId: string) => {
    e.preventDefault();

    if (!draggedProjectId || draggedProjectId === targetProjectId) {
      setDragOverProjectId(null);
      return;
    }

    // Encontrar las posiciones de los proyectos
    const draggedIndex = localProjects.findIndex(
      (project) => project.id === draggedProjectId,
    );
    const targetIndex = localProjects.findIndex(
      (project) => project.id === targetProjectId,
    );

    if (draggedIndex === -1 || targetIndex === -1) {
      setDragOverProjectId(null);
      return;
    }

    // Crear nuevo array con los proyectos reordenados
    const newProjects = [...localProjects];
    const [draggedProject] = newProjects.splice(draggedIndex, 1);
    newProjects.splice(targetIndex, 0, draggedProject);

    // Actualizar el orden de los proyectos
    const projectOrders = newProjects.map((project, index) => ({
      id: project.id,
      projectOrder: index + 1,
    }));

    // Actualización optimista: mostrar el nuevo orden inmediatamente
    setLocalProjects(
      newProjects.map((project, index) => ({
        ...project,
        projectOrder: index + 1,
      })),
    );

    try {
      // Actualizar en el backend (sin loading state)
      await onReorderProjects?.(projectOrders);
    } catch (error) {
      // Si falla, revertir al estado anterior
      setLocalProjects(projects);
      console.error("Error reordering projects:", error);
    }

    setDragOverProjectId(null);
  };

  return (
    <Card>
      <CardHeader>
        <ProjectFilters
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-background">
                <TableHead className="text-center min-w-[60px]">#</TableHead>
                <TableHead
                  className="cursor-pointer min-w-[200px]"
                  onClick={() => onSort?.("name")}
                >
                  <div className="flex items-center gap-1">
                    Proyecto
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-center min-w-[120px]"
                  onClick={() => onSort?.("clientName")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Cliente
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-center min-w-[120px]"
                  onClick={() => onSort?.("status")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Estado
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-center min-w-[120px]"
                  onClick={() => onSort?.("condition")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Condición
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-center min-w-[120px]"
                  onClick={() => onSort?.("startDate")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Fecha Inicio
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-center min-w-[120px]"
                  onClick={() => onSort?.("endDate")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Fecha Fin
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-center min-w-[120px]"
                  onClick={() => onSort?.("progress")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Progreso
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="text-center min-w-[120px]">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No se encontraron proyectos
                  </td>
                </tr>
              ) : (
                localProjects.map((project, index) => {
                  // Calcular el número de fila considerando la paginación
                  const rowNumber =
                    (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <DraggableProjectRow
                      key={project.id}
                      project={project}
                      index={rowNumber}
                      onEdit={onEditProject}
                      onDelete={onDeleteProject}
                      onStatusChange={onStatusChange}
                      isDragging={draggedProjectId === project.id}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      isReadOnly={isReadOnly}
                    />
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalItems > 0 && (
          <div className="pt-4 border-t">
            <DataPagination
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={onPageChange}
              onItemsPerPageChange={onItemsPerPageChange}
              itemsPerPageOptions={[5, 10, 20, 50]}
              itemsText="proyectos"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

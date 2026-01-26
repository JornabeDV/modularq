"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTasksPrisma } from "@/hooks/use-tasks-prisma";
import { DraggableTaskCard } from "./draggable-task-card";
import type { ProjectTask } from "@/lib/types";

interface ProjectTaskManagerProps {
  projectId: string;
  projectTasks: ProjectTask[];
  projectStatus?: string;
  onAssignTask: (taskId: string) => void;
  onUnassignTask: (projectTaskId: string) => void;
  onEditTask?: (task: ProjectTask) => void;
  onCompleteTask?: (task: ProjectTask) => void;
  onCreateTask?: () => void;
  onReorderTasks?: (taskOrders: { id: string; taskOrder: number }[]) => void;
  isReadOnly?: boolean;
}

export function ProjectTaskManager({
  projectId,
  projectTasks,
  projectStatus,
  onAssignTask,
  onUnassignTask,
  onEditTask,
  onCompleteTask,
  onCreateTask,
  onReorderTasks,
  isReadOnly = false,
}: ProjectTaskManagerProps) {
  const { tasks, loading: tasksLoading } = useTasksPrisma();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "standard" | "custom">(
    "all",
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  const availableTasks =
    tasks?.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description &&
          task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === "all" || task.type === filterType;
      const notAssigned = !projectTasks.some((pt) => pt.taskId === task.id);

      return matchesSearch && matchesType && notAssigned;
    }) || [];

  const standardTasks = availableTasks.filter((t) => t.type === "standard");
  const customTasks = availableTasks.filter((t) => t.type === "custom");

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();

    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      setDragOverTaskId(null);
      return;
    }

    const draggedIndex = projectTasks.findIndex(
      (task) => task.id === draggedTaskId,
    );
    const targetIndex = projectTasks.findIndex(
      (task) => task.id === targetTaskId,
    );

    if (draggedIndex === -1 || targetIndex === -1) {
      setDragOverTaskId(null);
      return;
    }

    const newTasks = [...projectTasks];
    const [draggedTask] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, draggedTask);

    const taskOrders = newTasks.map((task, index) => ({
      id: task.id,
      taskOrder: index + 1,
    }));

    onReorderTasks?.(taskOrders);
    setDragOverTaskId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">
            Gestión de Tareas del Proyecto
          </h3>
        </div>
        <div className="flex flex-row gap-2">
          {!isReadOnly && onCreateTask && (
            <Button
              variant="outline"
              onClick={onCreateTask}
              className="cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">
                Crear Tarea Personalizada
              </span>
              <span className="sm:hidden">Crear Tarea</span>
            </Button>
          )}
          {!isReadOnly && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">
                    Asignar Tarea Existente
                  </span>
                  <span className="sm:hidden">Asignar Tarea</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-4xl max-h-[80vh] overflow-y-auto overflow-x-hidden">
                <DialogHeader>
                  <DialogTitle>Asignar Tarea al Proyecto</DialogTitle>
                </DialogHeader>

                {/* Filtros */}
                <div className="space-y-4 overflow-x-hidden">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Buscar tareas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Select
                      value={filterType}
                      onValueChange={(value: any) => setFilterType(value)}
                    >
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filtrar por tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las tareas</SelectItem>
                        <SelectItem value="standard">Solo estándar</SelectItem>
                        <SelectItem value="custom">
                          Solo personalizadas
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lista de tareas disponibles */}
                  <div className="space-y-4">
                    {standardTasks.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          Tareas Reutilizables ({standardTasks.length})
                        </h4>
                        <div className="grid gap-2">
                          {standardTasks.map((task) => (
                            <Card
                              key={task.id}
                              className="p-3 hover:bg-muted/50 transition-colors overflow-hidden"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                                <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                                  <h5 className="font-medium text-sm sm:text-base break-words">
                                    {task.title}
                                  </h5>
                                  {task.description && (
                                    <p className="text-sm text-muted-foreground break-words line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge
                                      variant="outline"
                                      className="text-xs whitespace-nowrap"
                                    >
                                      {task.category}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      {task.estimatedHours}h estimadas
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="cursor-pointer w-full sm:w-auto flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAssignTask(task.id);
                                  }}
                                >
                                  Asignar
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {customTasks.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          Tareas Específicas ({customTasks.length})
                        </h4>
                        <div className="grid gap-2">
                          {customTasks.map((task) => (
                            <Card
                              key={task.id}
                              className="p-3 hover:bg-muted/50 transition-colors overflow-hidden"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                                <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                                  <h5 className="font-medium text-sm sm:text-base break-words">
                                    {task.title}
                                  </h5>
                                  {task.description && (
                                    <p className="text-sm text-muted-foreground break-words line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge
                                      variant="outline"
                                      className="text-xs whitespace-nowrap"
                                    >
                                      {task.category}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      {task.estimatedHours}h estimadas
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="cursor-pointer w-full sm:w-auto flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAssignTask(task.id);
                                  }}
                                >
                                  Asignar
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {availableTasks.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No hay tareas disponibles para asignar</p>
                        <p className="text-sm">
                          Todas las tareas ya están asignadas a este proyecto
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">
          Tareas Asignadas ({projectTasks.length})
          {!isReadOnly && (
            <span className="text-sm text-muted-foreground ml-2">
              - Arrastra y suelta para reordenar
            </span>
          )}
        </h4>
        <div className="space-y-3">
          {projectTasks
            .sort((a, b) => {
              const statusOrder = {
                in_progress: 0,
                pending: 1,
                completed: 2,
                cancelled: 3,
              };
              return statusOrder[a.status] - statusOrder[b.status];
            })
            .map((projectTask, index) => (
              <DraggableTaskCard
                key={projectTask.id}
                projectTask={projectTask}
                taskNumber={index + 1}
                onUnassign={onUnassignTask}
                onEdit={onEditTask || (() => {})}
                onComplete={onCompleteTask}
                isDragging={draggedTaskId === projectTask.id}
                isReadOnly={isReadOnly}
                projectStatus={projectStatus}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

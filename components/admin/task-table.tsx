"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataPagination } from "@/components/ui/data-pagination";
import { DraggableTaskRow } from "./draggable-task-row";
import { TaskFilters } from "./task-filters";
import type { Task } from "@/lib/types";

interface TaskTableProps {
  tasks: Task[];
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onReorderTasks?: (taskOrders: { id: string; taskOrder: number }[]) => void;
  isReadOnly?: boolean;
}

export function TaskTable({
  tasks,
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  typeFilter,
  onTypeFilterChange,
  onEditTask,
  onDeleteTask,
  onReorderTasks,
  isReadOnly = false,
}: TaskTableProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState(tasks);
  const [isReordering, setIsReordering] = useState(false);

  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

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

  const handleDrop = async (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();

    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      setDragOverTaskId(null);
      return;
    }

    const draggedIndex = localTasks.findIndex(
      (task) => task.id === draggedTaskId,
    );
    const targetIndex = localTasks.findIndex(
      (task) => task.id === targetTaskId,
    );

    if (draggedIndex === -1 || targetIndex === -1) {
      setDragOverTaskId(null);
      return;
    }

    const newTasks = [...localTasks];
    const [draggedTask] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, draggedTask);

    const taskOrders = newTasks.map((task, index) => ({
      id: task.id,
      taskOrder: index + 1,
    }));

    setLocalTasks(
      newTasks.map((task, index) => ({
        ...task,
        taskOrder: index + 1,
      })),
    );
    setIsReordering(true);

    try {
      await onReorderTasks?.(taskOrders);
    } catch (error) {
      setLocalTasks(tasks);
      console.error("Error reordering tasks:", error);
    } finally {
      setIsReordering(false);
    }

    setDragOverTaskId(null);
  };

  return (
    <Card>
      <CardHeader>
        <TaskFilters
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
          typeFilter={typeFilter}
          onTypeFilterChange={onTypeFilterChange}
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-background">
                <TableHead className="text-center min-w-[60px]">#</TableHead>
                <TableHead className="min-w-[200px]">Tarea</TableHead>
                <TableHead className="text-center min-w-[120px]">
                  Categoría
                </TableHead>
                <TableHead className="text-center min-w-[100px]">
                  Tipo
                </TableHead>
                {!isReadOnly && (
                  <TableHead className="text-center min-w-[120px]">
                    Acciones
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={isReadOnly ? 4 : 5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No se encontraron tareas
                  </td>
                </tr>
              ) : (
                localTasks.map((task, index) => {
                  const rowNumber =
                    (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <DraggableTaskRow
                      key={task.id}
                      task={task}
                      index={rowNumber}
                      onEdit={onEditTask}
                      onRowClick={onEditTask}
                      onDelete={onDeleteTask}
                      isDragging={draggedTaskId === task.id}
                      isReordering={isReordering}
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

        {totalItems > 0 && (
          <div className="pt-4 border-t">
            <DataPagination
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={onPageChange}
              onItemsPerPageChange={onItemsPerPageChange}
              itemsPerPageOptions={[5, 10, 20, 50]}
              itemsText="tareas"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

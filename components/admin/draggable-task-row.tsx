"use client";

import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, GripVertical } from "lucide-react";
import { DeleteTaskButton } from "./delete-task-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Task } from "@/lib/types";

interface DraggableTaskRowProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isDragging?: boolean;
  isReordering?: boolean;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, taskId: string) => void;
  isReadOnly?: boolean;
}

export function DraggableTaskRow({
  task,
  index,
  onEdit,
  onDelete,
  isDragging = false,
  isReordering = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isReadOnly = false,
}: DraggableTaskRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleEdit = () => {
    onEdit(task);
  };

  return (
    <TooltipProvider>
      <TableRow
        className={`transition-all duration-200 select-none ${
          isDragging
            ? "opacity-50 shadow-lg"
            : isReordering
            ? "opacity-75"
            : isHovered
            ? "shadow-md"
            : isReadOnly
            ? "hover:!bg-background"
            : "hover:shadow-sm"
        }`}
        style={isReadOnly ? { backgroundColor: "transparent" } : undefined}
        draggable={!isReadOnly}
        onDragStart={(e) => !isReadOnly && onDragStart?.(e, task.id)}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={(e) => !isReadOnly && onDrop?.(e, task.id)}
        onMouseEnter={() => !isReadOnly && setIsHovered(true)}
        onMouseLeave={() => !isReadOnly && setIsHovered(false)}
      >
        <TableCell className="text-center">
          <div className="flex items-center justify-center gap-2">
            {!isReadOnly && (
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            )}
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
              {index}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="font-medium">{task.title}</div>
        </TableCell>
        <TableCell className="text-center">
          <Badge variant="secondary">{task.category}</Badge>
        </TableCell>
        <TableCell className="text-center">
          <Badge variant={task.type === "standard" ? "default" : "outline"}>
            {task.type === "standard" ? "Estándar" : "Personalizada"}
          </Badge>
        </TableCell>
        {!isReadOnly && (
          <TableCell className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="cursor-pointer"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar tarea</p>
                </TooltipContent>
              </Tooltip>
              <DeleteTaskButton
                taskId={task.id}
                taskTitle={task.title}
                onDelete={onDelete}
              />
            </div>
          </TableCell>
        )}
      </TableRow>
    </TooltipProvider>
  );
}

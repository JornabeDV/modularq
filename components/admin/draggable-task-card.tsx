"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GripVertical, CheckCircle, User } from "lucide-react";
import type { ProjectTask } from "@/lib/types";

interface DraggableTaskCardProps {
  projectTask: ProjectTask;
  onUnassign: (projectTaskId: string) => void;
  onEdit: (task: ProjectTask) => void;
  onComplete?: (task: ProjectTask) => void;
  isDragging?: boolean;
  taskNumber?: number;
  isReadOnly?: boolean;
  projectStatus?: string;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, taskId: string) => void;
}

export function DraggableTaskCard({
  projectTask,
  onUnassign,
  onEdit,
  onComplete,
  isDragging = false,
  taskNumber = 1,
  isReadOnly = false,
  projectStatus,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: DraggableTaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("[data-drag-handle]") ||
      target.closest('[role="button"]')
    ) {
      return;
    }
    onEdit(projectTask);
  };

  return (
    <Card
      className={`p-4 transition-all duration-200 select-none ${
        isReadOnly || projectStatus === "active"
          ? "cursor-default"
          : "cursor-pointer"
      } ${
        isDragging
          ? "opacity-50 shadow-lg"
          : isHovered && projectStatus !== "active"
          ? "shadow-md bg-muted/50 border-primary/20"
          : projectStatus !== "active"
          ? "hover:shadow-md hover:bg-muted/30 hover:border-primary/10"
          : ""
      }`}
      onDragOver={
        !isReadOnly && projectStatus !== "active" ? onDragOver : undefined
      }
      onDrop={
        !isReadOnly && projectStatus !== "active"
          ? (e) => onDrop?.(e, projectTask.id)
          : undefined
      }
      onMouseEnter={() => projectStatus !== "active" && setIsHovered(true)}
      onMouseLeave={() => projectStatus !== "active" && setIsHovered(false)}
      onClick={projectStatus !== "active" ? handleCardClick : undefined}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold">
              {taskNumber}
            </div>

            {!isReadOnly && projectStatus !== "active" && (
              <div
                data-drag-handle
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors cursor-grab active:cursor-grabbing"
                draggable={true}
                onDragStart={(e) => {
                  e.stopPropagation();
                  onDragStart?.(e, projectTask.id);
                }}
                onDragEnd={(e) => {
                  e.stopPropagation();
                  onDragEnd?.(e);
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-5 w-5" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h5 className="font-medium text-sm sm:text-base truncate">
                {projectTask.task?.title}
              </h5>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {projectTask.task?.category}
                </Badge>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                {projectTask.assignedUser ? (
                  <Badge variant="outline" className="text-xs">
                    <User className="h-3 w-3 mr-1" />
                    {projectTask.assignedUser.name}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs text-muted-foreground"
                  >
                    <User className="h-3 w-3 mr-1" />
                    Sin asignar
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end sm:justify-start sm:flex-shrink-0">
            <div className="flex items-center gap-2">
              {projectStatus !== "active" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(projectTask);
                    }}
                    className="cursor-pointer"
                  >
                    <span className="hidden sm:inline">Editar</span>
                    <span className="sm:hidden">Editar</span>
                  </Button>

                  {!isReadOnly && (
                    <>
                      {onComplete &&
                        projectTask.status !== "completed" &&
                        projectStatus === "active" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={(e) => {
                              e.stopPropagation();
                              onComplete(projectTask);
                            }}
                            className="cursor-pointer bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Completar</span>
                            <span className="sm:hidden">✓</span>
                          </Button>
                        )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnassign(projectTask.id);
                        }}
                        className="cursor-pointer"
                      >
                        Quitar
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

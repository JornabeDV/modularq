"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Clock, AlertCircle, User, XCircle } from "lucide-react";
import type { ProjectTask } from "@/lib/types";

interface DailySurveyTaskCardProps {
  task: ProjectTask;
  taskNumber: number;
  projectOperarios: any[];
  onStatusChange: (taskId: string, newStatus: string) => void;
  onAssignOperario: (taskId: string, operarioId: string) => void;
}

export function DailySurveyTaskCard({
  task,
  taskNumber,
  projectOperarios,
  onStatusChange,
  onAssignOperario,
}: DailySurveyTaskCardProps) {
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const hasOperario = !!task.assignedTo;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />;
      case "in_progress":
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />;
      case "pending":
        return (
          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
        );
      case "cancelled":
        return <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "in_progress":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completada";
      case "in_progress":
        return "En Progreso";
      case "pending":
        return "Pendiente";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (
      (newStatus === "in_progress" || newStatus === "completed") &&
      !hasOperario
    ) {
      return;
    }

    setIsChangingStatus(true);
    onStatusChange(task.id, newStatus);
    setIsChangingStatus(false);
  };

  return (
    <Card className="hover:shadow-md transition-shadow py-0 sm:py-4">
      <CardContent className="p-2.5 sm:p-4">
        <div className="space-y-2.5 sm:space-y-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
              {taskNumber}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <h3 className="font-semibold text-base sm:text-lg truncate">
                  {task.task?.title || "Tarea sin título"}
                </h3>
                <Badge
                  variant="outline"
                  className={`flex-shrink-0 text-[10px] sm:text-xs ${getStatusColor(
                    task.status
                  )}`}
                >
                  <span className="flex items-center gap-0.5 sm:gap-1">
                    {getStatusIcon(task.status)}
                    <span className="hidden sm:inline">
                      {getStatusLabel(task.status)}
                    </span>
                  </span>
                </Badge>
              </div>

              {task.task?.description && (
                <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 mb-2 sm:mb-3">
                  {task.task.description}
                </p>
              )}
            </div>
          </div>

          <div className="sm:grid max-sm:flex sm:grid-cols-2 gap-2 sm:gap-3">
            {projectOperarios.length > 0 && (
              <div className="min-w-0">
                <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                  Operario
                </label>
                <Select
                  value={task.assignedTo || "none"}
                  onValueChange={(value) => onAssignOperario(task.id, value)}
                >
                  <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm truncate">
                    <SelectValue placeholder="Seleccionar operario..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">Sin asignar</span>
                    </SelectItem>
                    {projectOperarios.map((operario) => (
                      <SelectItem
                        key={operario.user_id}
                        value={operario.user_id}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="text-xs sm:text-sm truncate min-w-0">
                            {operario.user?.name || "Operario"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                Estado
              </label>
              <Select
                value={task.status}
                onValueChange={(value) => handleStatusChange(value)}
                disabled={isChangingStatus}
              >
                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem
                    value="in_progress"
                    disabled={!hasOperario}
                    className={
                      !hasOperario ? "opacity-50 cursor-not-allowed" : ""
                    }
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>En Progreso</span>
                      {!hasOperario && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Requiere operario)
                        </span>
                      )}
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="completed"
                    disabled={!hasOperario}
                    className={
                      !hasOperario ? "opacity-50 cursor-not-allowed" : ""
                    }
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>Completada</span>
                      {!hasOperario && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Requiere operario)
                        </span>
                      )}
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

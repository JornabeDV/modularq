"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  User,
  Users,
  Crown,
  Save,
  X as XIcon,
} from "lucide-react";
import { useTaskCollaborators } from "@/hooks/use-task-collaborators";
import { useAuth } from "@/lib/auth-context";
import type { ProjectTask, TaskCollaborator } from "@/lib/types";
import { getStatusIcon, getStatusLabel } from "@/lib/utils/status-label";

interface DailySurveyTaskCardProps {
  task: ProjectTask;
  taskNumber: number;
  projectOperarios: any[];
  onStatusChange: (taskId: string, newStatus: string) => void;
  onAssignOperario: (taskId: string, operarioId: string) => void;
  onCollaboratorsChange?: () => void;
}

export function DailySurveyTaskCard({
  task,
  taskNumber,
  projectOperarios,
  onStatusChange,
  onAssignOperario,
  onCollaboratorsChange,
}: DailySurveyTaskCardProps) {
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [collaborators, setCollaborators] = useState<TaskCollaborator[]>([]);
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [pendingAdditions, setPendingAdditions] = useState<Set<string>>(
    new Set()
  );
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(
    new Set()
  );

  const { user } = useAuth();
  const { addCollaborator, removeCollaborator, getCollaborators } =
    useTaskCollaborators();

  const hasOperario = !!task.assignedTo;

  useEffect(() => {
    loadCollaborators();
  }, [task.id]);

  useEffect(() => {
    if (isCollaboratorsOpen) {
      setPendingAdditions(new Set());
      setPendingRemovals(new Set());
    }
  }, [isCollaboratorsOpen]);

  const loadCollaborators = async () => {
    const data = await getCollaborators(task.id);
    setCollaborators(data);
  };

  const availableOperarios = projectOperarios.filter(
    (operario) =>
      operario.user_id !== task.assignedTo &&
      !collaborators.some((c) => c.userId === operario.user_id)
  );

  const currentCollaborators = collaborators.filter(
    (c) => !pendingRemovals.has(c.id)
  );
  const availableForAddition = availableOperarios.filter(
    (operario) => !pendingAdditions.has(operario.user_id)
  );

  const pendingAdditionOperarios = availableOperarios.filter((operario) =>
    pendingAdditions.has(operario.user_id)
  );

  const hasPendingChanges =
    pendingAdditions.size > 0 || pendingRemovals.size > 0;

  const handleToggleCollaborator = (
    operarioId: string,
    isCurrentlyCollaborator: boolean
  ) => {
    if (isCurrentlyCollaborator) {
      const collaborator = collaborators.find((c) => c.userId === operarioId);
      if (collaborator) {
        const newRemovals = new Set(pendingRemovals);
        if (newRemovals.has(collaborator.id)) {
          newRemovals.delete(collaborator.id);
        } else {
          newRemovals.add(collaborator.id);
        }
        setPendingRemovals(newRemovals);
      }
    } else {
      const newAdditions = new Set(pendingAdditions);
      if (newAdditions.has(operarioId)) {
        newAdditions.delete(operarioId);
      } else {
        newAdditions.add(operarioId);
      }
      setPendingAdditions(newAdditions);
    }
  };

  const handleSaveChanges = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      for (const operarioId of pendingAdditions) {
        const result = await addCollaborator({
          projectTaskId: task.id,
          userId: operarioId,
          addedBy: user.id,
        });
        if (!result.success) {
          throw new Error(result.error || "Error al agregar colaborador");
        }
      }

      for (const collaboratorId of pendingRemovals) {
        const result = await removeCollaborator(collaboratorId);
        if (!result.success) {
          throw new Error(result.error || "Error al remover colaborador");
        }
      }

      setPendingAdditions(new Set());
      setPendingRemovals(new Set());
      await loadCollaborators();
      onCollaboratorsChange?.();

      setIsCollaboratorsOpen(false);
    } catch (error) {
      console.error("Error saving collaborator changes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelChanges = () => {
    setPendingAdditions(new Set());
    setPendingRemovals(new Set());
    setIsCollaboratorsOpen(false);
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

          {hasOperario && (
            <div className="space-y-2 pt-3 border-t">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-medium">
                  Colaboradores ({collaborators.length})
                </label>
                <Dialog
                  open={isCollaboratorsOpen}
                  onOpenChange={setIsCollaboratorsOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs cursor-pointer"
                      onClick={() => setIsCollaboratorsOpen(true)}
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Gestionar
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="w-full h-full max-w-full max-h-full md:w-[90vw] md:h-auto md:max-w-lg md:max-h-[90vh] md:rounded-lg rounded-none m-0 md:m-6 overflow-y-auto top-0 left-0 translate-x-0 translate-y-0 md:top-[50%] md:left-[50%] md:translate-x-[-50%] md:translate-y-[-50%]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                        Gestionar Colaboradores
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
                      <div className="space-y-3">
                        <h4 className="text-sm sm:text-base font-medium text-muted-foreground">
                          Responsable
                        </h4>
                        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                          <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {task.assignedUser?.name
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("") || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-medium truncate">
                              {task.assignedUser?.name || "Sin asignar"}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Responsable principal
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-sm sm:text-base font-medium text-muted-foreground">
                          Colaboradores Actuales
                        </h4>
                        {currentCollaborators.length === 0 ? (
                          <p className="text-sm sm:text-base text-muted-foreground text-center py-8 sm:py-6">
                            No hay colaboradores asignados
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {currentCollaborators.map((collaborator) => {
                              const willBeRemoved = pendingRemovals.has(
                                collaborator.id
                              );
                              return (
                                <div
                                  key={collaborator.id}
                                  className="flex items-center gap-3 p-4 border rounded-lg"
                                >
                                  <Checkbox
                                    checked={!willBeRemoved}
                                    onCheckedChange={() =>
                                      handleToggleCollaborator(
                                        collaborator.userId!,
                                        true
                                      )
                                    }
                                    disabled={isLoading}
                                    className="flex-shrink-0"
                                  />
                                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                                    <AvatarFallback className="text-xs">
                                      {collaborator.user?.name
                                        ?.split(" ")
                                        .map((n: string) => n[0])
                                        .join("") || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`text-sm sm:text-base font-medium truncate ${
                                        willBeRemoved ? "line-through" : ""
                                      }`}
                                    >
                                      {collaborator.user?.name || "Usuario"}
                                    </p>
                                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                      Agregado por{" "}
                                      {collaborator.addedByUser?.name}
                                      {willBeRemoved && (
                                        <span className="ml-1">
                                          (se removerá)
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {pendingAdditionOperarios.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm sm:text-base font-medium text-muted-foreground">
                            Se agregarán
                          </h4>
                          <div className="space-y-3">
                            {pendingAdditionOperarios.map((operario) => (
                              <div
                                key={operario.user_id}
                                className="flex items-center gap-3 p-4 border rounded-lg"
                              >
                                <Checkbox
                                  checked={true}
                                  onCheckedChange={() =>
                                    handleToggleCollaborator(
                                      operario.user_id,
                                      false
                                    )
                                  }
                                  disabled={isLoading}
                                  className="flex-shrink-0"
                                />
                                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                                  <AvatarFallback className="text-xs">
                                    {operario.user?.name
                                      ?.split(" ")
                                      .map((n: string) => n[0])
                                      .join("") || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm sm:text-base font-medium truncate">
                                    {operario.user?.name || "Operario"}
                                  </p>
                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                    Se agregará como colaborador
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {availableForAddition.length > 0 && (
                        <div className="space-y-3 pt-6 border-t">
                          <h4 className="text-sm sm:text-base font-medium text-muted-foreground">
                            Operarios Disponibles
                          </h4>
                          <div className="space-y-3">
                            {availableForAddition.map((operario) => {
                              const willBeAdded = pendingAdditions.has(
                                operario.user_id
                              );
                              return (
                                <div
                                  key={operario.user_id}
                                  className={`flex items-center gap-3 p-4 border rounded-lg ${
                                    willBeAdded
                                      ? "border-green-200 bg-green-50"
                                      : "border-border"
                                  }`}
                                >
                                  <Checkbox
                                    checked={willBeAdded}
                                    onCheckedChange={() =>
                                      handleToggleCollaborator(
                                        operario.user_id,
                                        false
                                      )
                                    }
                                    disabled={isLoading}
                                    className="flex-shrink-0"
                                  />
                                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                                    <AvatarFallback className="text-xs">
                                      {operario.user?.name
                                        ?.split(" ")
                                        .map((n: string) => n[0])
                                        .join("") || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm sm:text-base font-medium truncate">
                                      {operario.user?.name || "Operario"}
                                    </p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                      Disponible
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t justify-end">
                        <Button
                          variant="outline"
                          onClick={handleCancelChanges}
                          disabled={isLoading}
                          className="cursor-pointer h-10 sm:h-9"
                          size="sm"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleSaveChanges}
                          disabled={!hasPendingChanges || isLoading}
                          className="cursor-pointer h-10 sm:h-9"
                          size="sm"
                        >
                          {isLoading
                            ? "Guardando..."
                            : hasPendingChanges
                            ? `Guardar (${
                                pendingAdditions.size > 0
                                  ? `+${pendingAdditions.size}`
                                  : ""
                              }${
                                pendingRemovals.size > 0
                                  ? `-${pendingRemovals.size}`
                                  : ""
                              })`
                            : "Guardar Cambios"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {collaborators.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {collaborators.slice(0, 3).map((collaborator) => (
                    <Badge
                      key={collaborator.id}
                      variant="secondary"
                      className="text-xs px-2 py-0.5"
                    >
                      <User className="h-3 w-3 mr-1" />
                      {collaborator.user?.name?.split(" ")[0] || "Colaborador"}
                    </Badge>
                  ))}
                  {collaborators.length > 3 && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      +{collaborators.length - 3} más
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

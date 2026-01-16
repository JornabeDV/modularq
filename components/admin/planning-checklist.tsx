"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, Save } from "lucide-react";
import { useProjectPlanningChecklist } from "@/hooks/use-project-planning-checklist";
import { cn } from "@/lib/utils";

interface PlanningChecklistProps {
  projectId: string;
  userId: string;
  onChecklistChange?: (updatedChecklist?: any[]) => void;
  isReadOnly?: boolean;
  className?: string;
}

export function PlanningChecklist({
  projectId,
  userId,
  onChecklistChange,
  isReadOnly = false,
  className,
}: PlanningChecklistProps) {
  const {
    checklist,
    loading,
    error,
    updateChecklistItem,
    isAllCompleted,
    getProgress,
    checklistItems,
    checklistLabels,
  } = useProjectPlanningChecklist(projectId, userId);

  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  const handleToggleItem = async (item: string) => {
    setUpdatingItems((prev) => new Set(prev).add(item));

    const currentItem = checklist.find((c) => c.checklist_item === item);
    const newCompleted = !currentItem?.is_completed;

    const success = await updateChecklistItem(item as any, {
      is_completed: newCompleted,
    });

    if (success) {
      const updatedChecklist = checklist.map((c) =>
        c.checklist_item === item ? { ...c, is_completed: newCompleted } : c
      );

      if (onChecklistChange) {
        onChecklistChange(updatedChecklist);
      }
    }

    setUpdatingItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(item);
      return newSet;
    });
  };

  const handleNotesChange = (item: string, notes: string) => {
    setLocalNotes((prev) => ({ ...prev, [item]: notes }));
  };

  const handleSaveNotes = async (item: string) => {
    const notes = localNotes[item];
    if (!notes?.trim()) return;

    setUpdatingItems((prev) => new Set(prev).add(item));

    const success = await updateChecklistItem(item as any, { notes });

    if (success) {
      setLocalNotes((prev) => {
        const newNotes = { ...prev };
        delete newNotes[item];
        return newNotes;
      });

      if (onChecklistChange) {
        onChecklistChange(checklist);
      }
    }

    setUpdatingItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(item);
      return newSet;
    });
  };

  const getNotesValue = (item: string): string => {
    const checklistItem = checklist.find((c) => c.checklist_item === item);
    return localNotes[item] ?? checklistItem?.notes ?? "";
  };

  const hasUnsavedNotes = (item: string): boolean => {
    const checklistItem = checklist.find((c) => c.checklist_item === item);
    const currentNotes = localNotes[item];
    const savedNotes = checklistItem?.notes || "";
    return currentNotes !== undefined && currentNotes !== savedNotes;
  };

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Planificación del Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Cargando checklist...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Planificación del Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive">
            <p>Error al cargar el checklist: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = getProgress();

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Planificación del Proyecto
            {isReadOnly && (
              <Badge variant="outline" className="text-xs">
                Referencia
              </Badge>
            )}
          </CardTitle>
          <Badge variant={isAllCompleted() ? "default" : "secondary"}>
            {progress.completed}/{progress.total} completado
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {isReadOnly
            ? "Información de planificación completada para referencia del proyecto"
            : "Complete todos los elementos antes de activar el proyecto"
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {checklistItems.map((item) => {
          const checklistItem = checklist.find(
            (c) => c.checklist_item === item
          );
          const isUpdating = updatingItems.has(item);
          const unsavedNotes = hasUnsavedNotes(item);

          return (
            <div key={item} className="space-y-3">
              <div className={cn(
                "p-4 rounded-lg transition-colors",
                isReadOnly
                  ? "bg-muted/20 border border-muted/30"
                  : "bg-muted/10 hover:bg-muted/20 border border-transparent hover:border-muted/20"
              )}>
                {!isReadOnly && (
                  <div className="flex items-start space-x-3 mb-3">
                    <Checkbox
                      id={item}
                      checked={checklistItem?.is_completed || false}
                      onCheckedChange={() => handleToggleItem(item)}
                      disabled={isUpdating}
                      className="mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <Label
                        htmlFor={item}
                        className={cn(
                          "text-sm font-medium block cursor-pointer",
                          checklistItem?.is_completed && "line-through text-muted-foreground"
                        )}
                      >
                        {checklistLabels[item]}
                      </Label>
                    </div>
                    {isUpdating && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary flex-shrink-0"></div>
                    )}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">
                      {checklistLabels[item]}
                    </h4>

                    <div className="flex items-center gap-2">
                      {checklistItem?.is_completed && (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">
                            Completado
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {isReadOnly && getNotesValue(item).trim() && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-md border border-blue-200/30 dark:border-blue-800/30">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                            Notas de planificación:
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed break-words">
                            {getNotesValue(item)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isReadOnly && isUpdating && (
                    <div className="flex justify-end mt-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
              </div>

              {!isReadOnly && (
                <div className="ml-7 space-y-2">
                  <Textarea
                    placeholder="Agregar notas (opcional)..."
                    value={getNotesValue(item)}
                    onChange={(e) => handleNotesChange(item, e.target.value)}
                    className={cn(
                      "min-h-[60px] text-sm resize-none",
                      unsavedNotes && "border-amber-300 bg-amber-50/30"
                    )}
                    disabled={isUpdating}
                  />
                  {unsavedNotes && (
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleSaveNotes(item)}
                        disabled={isUpdating}
                        className="text-xs cursor-pointer"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        {isUpdating ? "Guardando..." : "Guardar notas"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!isReadOnly && (
          <div className="pt-4 border-t">
            {isAllCompleted() ? (
              <div className="flex items-center gap-2 text-green-600">
                <span className="text-sm font-medium">
                  ¡Planificación completa! Ya puede activar el proyecto.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <span className="text-sm">
                  Complete los {progress.total - progress.completed} elementos
                  restantes para activar el proyecto.
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

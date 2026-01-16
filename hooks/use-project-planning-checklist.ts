"use client";

import { useState, useEffect, useCallback } from "react";
import { PrismaTypedService } from "@/lib/prisma-typed-service";
import { useToast } from "@/hooks/use-toast";

export type PlanningChecklistItem =
  | "requirements"
  | "general_plan"
  | "electrical_plan"
  | "sanitary_plan"
  | "materials"
  | "carpentry_plans";

export interface PlanningChecklistData {
  id: string;
  checklist_item: PlanningChecklistItem;
  is_completed: boolean;
  notes?: string;
  completed_at?: string;
  completed_by?: string;
}

const CHECKLIST_ITEMS: PlanningChecklistItem[] = [
  "requirements",
  "general_plan",
  "electrical_plan",
  "sanitary_plan",
  "materials",
  "carpentry_plans"
];

const CHECKLIST_LABELS: Record<PlanningChecklistItem, string> = {
  requirements: "Requerimientos del cliente",
  general_plan: "Plano general y de estructura",
  electrical_plan: "Plano de instalación eléctrica y listado materiales",
  sanitary_plan: "Plano de instalación sanitaria y listado de materiales",
  materials: "Materiales necesarios para dar inicio",
  carpentry_plans: "Planos de carpintería"
};

export function useProjectPlanningChecklist(projectId: string, userId?: string) {
  const [checklist, setChecklist] = useState<PlanningChecklistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchChecklist = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await PrismaTypedService.getProjectPlanningChecklist(projectId);

      if (!data || data.length === 0) {
        const initialChecklist = CHECKLIST_ITEMS.map(item => ({
          id: `${projectId}-${item}`,
          checklist_item: item,
          is_completed: false,
          notes: "",
        }));
        setChecklist(initialChecklist);
      } else {
        setChecklist(data);
      }
    } catch (err) {
      console.error("Error fetching planning checklist:", err);
      setError(err instanceof Error ? err.message : "Error al cargar checklist");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const updateChecklistItem = useCallback(async (
    item: PlanningChecklistItem,
    updates: { is_completed?: boolean; notes?: string }
  ): Promise<boolean> => {
    if (!projectId || !userId) return false;

    try {
      setError(null);

      const result = await PrismaTypedService.updateProjectPlanningChecklistItem(
        projectId,
        item,
        {
          is_completed: updates.is_completed,
          notes: updates.notes,
          completed_by: updates.is_completed ? userId : undefined,
          completed_at: updates.is_completed ? new Date().toISOString() : undefined,
        }
      );

      if (result.success) {
        setChecklist(prev =>
          prev.map(checkItem =>
            checkItem.checklist_item === item
              ? { ...checkItem, ...updates }
              : checkItem
          )
        );

        return true;
      } else {
        console.error("Error updating checklist item:", result.error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el checklist",
          variant: "destructive",
        });
        return false;
      }
    } catch (err) {
      console.error("Error updating checklist item:", err);
      toast({
        title: "Error",
        description: "Error al actualizar el checklist",
        variant: "destructive",
      });
      return false;
    }
  }, [projectId, userId, toast]);

  const toggleItem = useCallback(async (item: PlanningChecklistItem): Promise<boolean> => {
    const currentItem = checklist.find(c => c.checklist_item === item);
    if (!currentItem) return false;

    const newCompleted = !currentItem.is_completed;
    return await updateChecklistItem(item, { is_completed: newCompleted });
  }, [checklist, updateChecklistItem]);

  const isAllCompleted = useCallback((): boolean => {
    return CHECKLIST_ITEMS.every(item =>
      checklist.find(c => c.checklist_item === item)?.is_completed === true
    );
  }, [checklist]);

  const getProgress = useCallback((): { completed: number; total: number } => {
    const completed = checklist.filter(c => c.is_completed).length;
    return { completed, total: CHECKLIST_ITEMS.length };
  }, [checklist]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  return {
    checklist,
    loading,
    error,
    updateChecklistItem,
    toggleItem,
    isAllCompleted,
    getProgress,
    checklistItems: CHECKLIST_ITEMS,
    checklistLabels: CHECKLIST_LABELS,
    refetch: fetchChecklist
  };
}

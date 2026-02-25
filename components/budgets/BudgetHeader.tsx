"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { Budget } from "@/lib/prisma-typed-service";
import { BUDGET_STATUS_LABELS, BUDGET_STATUS_COLORS } from "@/lib/constants";

interface BudgetHeaderProps {
  budget: Budget;
  isEditable: boolean;
  saving: boolean;
  pendingChangesCount: number;
  onAddItem: () => void;
  onApprove: () => void;
  onDelete?: () => void;
}

export function BudgetHeader({
  budget,
  isEditable,
  saving,
  pendingChangesCount,
  onAddItem,
  onApprove,
  onDelete,
}: BudgetHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/budgets">
            <Button variant="ghost" size="sm" className="cursor-pointer">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <span className="font-mono text-sm text-muted-foreground">
            {budget.budget_code}
          </span>
          <Badge className={BUDGET_STATUS_COLORS[budget.status]}>
            {BUDGET_STATUS_LABELS[budget.status]}
          </Badge>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          {budget.client_name}
        </h1>
        <p className="text-muted-foreground text-sm lg:text-base">
          {budget.location} • {budget.description || "Sin descripción"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {isEditable && (
          <>
            <Button
              variant="outline"
              onClick={onAddItem}
              size="sm"
              className="lg:size-default cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1 lg:mr-2" />
              <span className="hidden sm:inline">Agregar</span> Ítem
            </Button>
            <Button
              onClick={onApprove}
              disabled={saving || pendingChangesCount > 0}
              size="sm"
              className="lg:size-default cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-1 lg:mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Aprobar
            </Button>
            {onDelete && (
              <Button
                variant="destructive"
                onClick={onDelete}
                disabled={saving}
                size="sm"
                className="lg:size-default cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-1 lg:mr-2" />
                Eliminar
              </Button>
            )}
          </>
        )}
        {budget.project_id && (
          <Link href={`/admin/projects/${budget.project_id}`}>
            <Button variant="outline" size="sm" className="lg:size-default">
              <FileText className="w-4 h-4 mr-1 lg:mr-2" />
              <span className="hidden sm:inline">Ver</span> Proyecto
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

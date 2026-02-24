"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, FileText, Loader2, Plus } from "lucide-react";
import { Budget } from "@/lib/prisma-typed-service";
import { BUDGET_STATUS_LABELS, BUDGET_STATUS_COLORS } from "@/lib/constants";

interface BudgetHeaderProps {
  budget: Budget;
  isEditable: boolean;
  saving: boolean;
  pendingChangesCount: number;
  onAddItem: () => void;
  onApprove: () => void;
}

export function BudgetHeader({
  budget,
  isEditable,
  saving,
  pendingChangesCount,
  onAddItem,
  onApprove,
}: BudgetHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Link href="/admin/budgets">
            <Button variant="ghost" size="sm">
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
        <h1 className="text-3xl font-bold tracking-tight">
          {budget.client_name}
        </h1>
        <p className="text-muted-foreground">
          {budget.location} • {budget.description || "Sin descripción"}
        </p>
      </div>

      <div className="flex gap-2">
        {isEditable && (
          <>
            <Button variant="outline" onClick={onAddItem}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Ítem
            </Button>
            <Button
              variant="outline"
              onClick={onApprove}
              disabled={saving || pendingChangesCount > 0}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Aprobar
            </Button>
          </>
        )}
        {budget.project_id && (
          <Link href={`/admin/projects/${budget.project_id}`}>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Ver Proyecto
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

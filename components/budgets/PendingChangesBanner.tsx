"use client";

import { Button } from "@/components/ui/button";
import { Pencil, CheckCircle, Loader2 } from "lucide-react";

interface PendingChangesBannerProps {
  count: number;
  saving: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

export function PendingChangesBanner({
  count,
  saving,
  onDiscard,
  onSave,
}: PendingChangesBannerProps) {
  if (count === 0) return null;

  return (
    <div className="border rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-muted p-2 rounded-full shrink-0">
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm sm:text-base">
            {count} cambio{count > 1 ? "s" : ""} sin guardar
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Edita las cantidades y luego guarda
          </p>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
          Descartar
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-1 sm:mr-2" />
          )}
          <span className="hidden sm:inline">Guardar cambios</span>
          <span className="sm:hidden">Guardar</span>
        </Button>
      </div>
    </div>
  );
}

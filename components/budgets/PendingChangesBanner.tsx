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
    <div className="border rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-muted p-2 rounded-full">
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">
            {count} cambio{count > 1 ? "s" : ""} sin guardar
          </p>
          <p className="text-sm text-muted-foreground">
            Edita las cantidades y luego guarda todos los cambios juntos
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
          Descartar
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}

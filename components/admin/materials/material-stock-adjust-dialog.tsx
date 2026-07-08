"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMaterialStockAdjust } from "@/hooks/use-stock-movements";
import type { Material } from "@/hooks/use-materials-prisma";

interface MaterialStockAdjustDialogProps {
  material: Material;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MaterialStockAdjustDialog({
  material,
  open,
  onOpenChange,
  onSuccess,
}: MaterialStockAdjustDialogProps) {
  const [newStock, setNewStock] = useState<string>(material.stockQuantity.toString());
  const [reason, setReason] = useState<string>("");
  const { adjustStock, loading } = useMaterialStockAdjust();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const stockValue = parseFloat(newStock);
    if (Number.isNaN(stockValue) || stockValue < 0) return;

    const result = await adjustStock(material.id, stockValue, reason || "Ajuste manual");

    if (result.success) {
      onSuccess?.();
      onOpenChange(false);
      setReason("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajustar stock</DialogTitle>
            <DialogDescription>
              {material.name} ({material.code}) — Stock actual: {" "}
              <strong>
                {material.stockQuantity} {material.unit}
              </strong>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new_stock">Nuevo stock</Label>
              <Input
                id="new_stock"
                type="number"
                step="0.01"
                min="0"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Diferencia: {" "}
                {(() => {
                  const diff = parseFloat(newStock) - material.stockQuantity;
                  if (Number.isNaN(diff)) return "—";
                  const sign = diff > 0 ? "+" : "";
                  return `${sign}${diff.toLocaleString("es-AR")} ${material.unit}`;
                })()}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Motivo del ajuste</Label>
              <Textarea
                id="reason"
                placeholder="Ej: Diferencia de inventario, stock roto, corrección..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="cursor-pointer max-sm:order-2"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="cursor-pointer max-sm:order-1">
              {loading ? "Guardando..." : "Guardar ajuste"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

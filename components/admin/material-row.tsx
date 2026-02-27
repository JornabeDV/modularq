"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Material } from "@/hooks/use-materials-prisma";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface MaterialRowProps {
  material: Material;
  onEdit: (material: Material) => void;
  onDelete: (materialId: string) => void;
  isReadOnly?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  estructura: "Estructura",
  paneles: "Paneles",
  herrajes: "Herrajes",
  aislacion: "Aislación",
  electricidad: "Electricidad",
  sanitarios: "Sanitarios",
  otros: "Otros",
};

const UNIT_LABELS: Record<string, string> = {
  unidad: "Unidad",
  metro: "m",
  metro_cuadrado: "m²",
  metro_cubico: "m³",
  kilogramo: "kg",
  litro: "L",
};

export function MaterialRow({
  material,
  onEdit,
  onDelete,
  isReadOnly = false,
}: MaterialRowProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isLowStock = material.stockQuantity <= material.minStock;

  return (
    <>
      <TableRow>
        <TableCell className="font-mono text-xs">{material.code}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="font-medium">{material.name}</span>
            {isLowStock && (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">
            {CATEGORY_LABELS[material.category] || material.category}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className={isLowStock ? "text-destructive font-medium" : ""}>
              {material.stockQuantity}{" "}
              {UNIT_LABELS[material.unit] || material.unit}
            </span>
            {material.minStock > 0 && (
              <span className="text-xs text-muted-foreground">
                Mín: {material.minStock}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          {material.unitPrice ? (
            <span>
              $
              {material.unitPrice.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell
          className="max-w-[150px] truncate"
          title={material.supplier || ""}
        >
          {material.supplier || "-"}
        </TableCell>
        {!isReadOnly && (
          <TableCell className="text-right">
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(material)}
                className="cursor-pointer"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        )}
      </TableRow>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar material?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar el material{" "}
              <strong>{material.name}</strong> ({material.code}). Esta acción no
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(material.id);
                setShowDeleteDialog(false);
              }}
              className="cursor-pointer"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

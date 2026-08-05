"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownLeft, ArrowUpRight, Scale, Package } from "lucide-react";
import type {
  StockMovement,
  StockMovementType,
  StockMovementSource,
} from "@/hooks/use-stock-movements";


interface StockMovementListProps {
  movements: StockMovement[];
  loading?: boolean;
}

const TYPE_CONFIG: Record<
  StockMovementType,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  in: {
    label: "Entrada",
    variant: "default",
    icon: <ArrowDownLeft className="h-3.5 w-3.5" />,
  },
  out: {
    label: "Salida",
    variant: "destructive",
    icon: <ArrowUpRight className="h-3.5 w-3.5" />,
  },
  adjustment: {
    label: "Ajuste",
    variant: "secondary",
    icon: <Scale className="h-3.5 w-3.5" />,
  },
};

const SOURCE_LABELS: Record<StockMovementSource, string> = {
  purchase_receipt: "Recepción de OC",
  project_assignment: "Asignación a proyecto",
  project_removal: "Devolución de proyecto",
  project_update: "Ajuste en proyecto",
  manual_adjustment: "Ajuste manual",
  initial_stock: "Stock inicial",
};

function formatQuantity(quantity: number) {
  return quantity.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

export function StockMovementList({ movements, loading }: StockMovementListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <Package className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm">No hay movimientos registrados para este material.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead className="text-right">Stock después</TableHead>
            <TableHead>Origen</TableHead>
            <TableHead>Referencia</TableHead>
            <TableHead>Notas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => {
            const typeConfig = TYPE_CONFIG[movement.type];
            return (
              <TableRow key={movement.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(movement.createdAt).toLocaleString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={typeConfig.variant} className="gap-1">
                    {typeConfig.icon}
                    {typeConfig.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {movement.type === "out" ? "-" : "+"}
                  {formatQuantity(movement.quantity)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatQuantity(movement.stockAfter)}
                </TableCell>
                <TableCell className="text-xs">
                  {SOURCE_LABELS[movement.sourceType]}
                </TableCell>
                <TableCell className="text-xs max-w-[180px] truncate" title={movement.reference}>
                  {movement.reference || "-"}
                </TableCell>
                <TableCell className="text-xs max-w-[180px] truncate" title={movement.notes}>
                  {movement.notes || "-"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

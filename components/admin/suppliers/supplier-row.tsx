"use client"

import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Eye } from "lucide-react"
import { DeleteSupplierButton } from "./delete-supplier-button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Supplier } from "@/hooks/use-suppliers"

interface SupplierRowProps {
  supplier: Supplier
  onEdit: (supplier: Supplier) => void
  onView: (supplier: Supplier) => void
  onDelete: (supplierId: string) => void
  isReadOnly?: boolean
}

export function SupplierRow({
  supplier,
  onEdit,
  onView,
  onDelete,
  isReadOnly = false,
}: SupplierRowProps) {
  const handleEdit = () => {
    onEdit(supplier)
  }

  const handleView = () => {
    onView(supplier)
  }

  return (
    <TooltipProvider>
      <TableRow
        className={
          isReadOnly
            ? "hover:!bg-background cursor-default"
            : "cursor-pointer hover:bg-muted/50"
        }
        style={isReadOnly ? { backgroundColor: "transparent" } : undefined}
        onClick={isReadOnly ? undefined : handleView}
      >
        <TableCell className="font-medium">{supplier.name}</TableCell>
        <TableCell>{supplier.contact_name || "—"}</TableCell>
        <TableCell>{supplier.email || "—"}</TableCell>
        <TableCell>{supplier.phone || "—"}</TableCell>
        <TableCell>{supplier.cuit || "—"}</TableCell>
        {!isReadOnly && (
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleView()
                    }}
                    className="cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver proveedor</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit()
                    }}
                    className="cursor-pointer"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar proveedor</p>
                </TooltipContent>
              </Tooltip>
              <div onClick={(e) => e.stopPropagation()}>
                <DeleteSupplierButton
                  supplierId={supplier.id}
                  supplierName={supplier.name}
                  onDelete={onDelete}
                />
              </div>
            </div>
          </TableCell>
        )}
      </TableRow>
    </TooltipProvider>
  )
}

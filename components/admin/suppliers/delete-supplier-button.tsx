"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DeleteSupplierButtonProps {
  supplierId: string
  supplierName: string
  onDelete: (supplierId: string) => void
}

export function DeleteSupplierButton({
  supplierId,
  supplierName,
  onDelete,
}: DeleteSupplierButtonProps) {
  const handleDelete = async () => {
    try {
      onDelete(supplierId)
    } catch (error) {
      console.error("Error deleting supplier:", error)
    }
  }

  return (
    <TooltipProvider>
      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Eliminar proveedor</p>
          </TooltipContent>
        </Tooltip>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              proveedor "{supplierName}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="cursor-pointer">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}

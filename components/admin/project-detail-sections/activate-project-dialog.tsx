"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, ClipboardList } from "lucide-react";

interface ActivateProjectDialogProps {
  isOpen: boolean;
  type: "activate" | "deactivate";
  onClose: () => void;
  onConfirm: () => void;
}

export function ActivateProjectDialog({
  isOpen,
  type,
  onClose,
  onConfirm,
}: ActivateProjectDialogProps) {
  const isActivate = type === "activate";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isActivate ? (
              <>
                <Zap className="h-5 w-5 text-green-600" />
                Activar Proyecto
              </>
            ) : (
              <>
                <ClipboardList className="h-5 w-5 text-orange-600" />
                Volver a Planificación
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isActivate
              ? "¿Estás seguro de que quieres activar este proyecto?"
              : "¿Estás seguro de que quieres volver este proyecto a estado de planificación?"}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            className={`${
              isActivate
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            } text-white cursor-pointer`}
            onClick={onConfirm}
          >
            {isActivate ? (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Sí, Activar Proyecto
              </>
            ) : (
              <>
                <ClipboardList className="h-4 w-4 mr-2" />
                Sí, Volver a Planificación
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

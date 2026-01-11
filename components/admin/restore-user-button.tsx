"use client";

import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import { RotateCcw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUsersPrisma } from "@/hooks/use-users-prisma";
import { useToast } from "@/hooks/use-toast";

interface RestoreUserButtonProps {
  userId: string;
  userName: string;
  onRestore?: (userId: string) => void;
}

export function RestoreUserButton({
  userId,
  userName,
  onRestore,
}: RestoreUserButtonProps) {
  const { restoreUser } = useUsersPrisma();
  const { toast } = useToast();

  const handleRestore = async () => {
    const result = await restoreUser(userId);
    if (result.success) {
      toast({
        title: "Usuario restaurado",
        description: `El usuario "${userName}" ha sido restaurado exitosamente.`,
        variant: "default",
      });
      onRestore?.(userId);
    } else {
      toast({
        title: "Error",
        description: result.error || "No se pudo restaurar el usuario",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="cursor-pointer">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Restaurar usuario</p>
          </TooltipContent>
        </Tooltip>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restaurar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              El usuario "{userName}" será restaurado y podrá volver a acceder
              al sistema. Todos sus datos históricos se mantendrán intactos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>
              Restaurar Usuario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}

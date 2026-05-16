"use client"

import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useUsersPrisma } from '@/hooks/use-users-prisma'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

interface DeleteUserButtonProps {
  userId: string
  userName: string
  currentUserId?: string
  onDelete?: (userId: string) => void
}

export function DeleteUserButton({
  userId,
  userName,
  currentUserId,
  onDelete
}: DeleteUserButtonProps) {
  const { deleteUser } = useUsersPrisma()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteUser(userId, currentUserId)
      if (result.success) {
        toast({
          title: "Usuario eliminado",
          description: `El usuario "${userName}" ha sido eliminado.`,
          variant: "default",
        })
        onDelete?.(userId)
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar el usuario",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const isDisabled = currentUserId === userId

  return (
    <TooltipProvider>
      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={isDisabled}
                className="cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isDisabled ? "No puedes eliminarte a ti mismo" : "Eliminar usuario"}</p>
          </TooltipContent>
        </Tooltip>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario
              <strong> &quot;{userName}&quot;</strong> y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="cursor-pointer"
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
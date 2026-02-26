"use client"

import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ProjectMaterial } from '@/hooks/use-project-materials-prisma'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'

interface ProjectMaterialRowProps {
  projectMaterial: ProjectMaterial
  onEdit: (projectMaterial: ProjectMaterial) => void
  onDelete: (projectMaterialId: string) => void
  isReadOnly?: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  estructura: 'Estructura',
  paneles: 'Paneles',
  herrajes: 'Herrajes',
  aislacion: 'Aislación',
  electricidad: 'Electricidad',
  sanitarios: 'Sanitarios',
  otros: 'Otros'
}

const UNIT_LABELS: Record<string, string> = {
  unidad: 'Unidad',
  metro: 'm',
  metro_cuadrado: 'm²',
  metro_cubico: 'm³',
  kilogramo: 'kg',
  litro: 'L'
}

export function ProjectMaterialRow({ projectMaterial, onEdit, onDelete, isReadOnly = false }: ProjectMaterialRowProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const material = projectMaterial.material
  
  if (!material) return null

  const totalValue = (projectMaterial.quantity * (projectMaterial.unitPrice || material.unit_price || 0))

  return (
    <>
      <TableRow>
        <TableCell className="font-mono text-xs">{material.code}</TableCell>
        <TableCell>
          <div>
            <span className="font-medium">{material.name}</span>
            {material.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1" title={material.description}>
                {material.description}
              </p>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{CATEGORY_LABELS[material.category] || material.category}</Badge>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium">
              {projectMaterial.quantity} {UNIT_LABELS[material.unit] || material.unit}
            </span>
            <span className="text-xs text-muted-foreground">
              Stock: {material.stock_quantity} {UNIT_LABELS[material.unit] || material.unit}
            </span>
          </div>
        </TableCell>
        <TableCell>
          {projectMaterial.unitPrice ? (
            <span>${projectMaterial.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell>
          <span className="font-medium">
            ${totalValue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </TableCell>
        <TableCell className="max-w-[200px] truncate" title={projectMaterial.notes || ''}>
          {projectMaterial.notes || '-'}
        </TableCell>
        {!isReadOnly && (
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(projectMaterial)}
                className="cursor-pointer"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="cursor-pointer text-destructive hover:text-destructive"
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
            <AlertDialogTitle>¿Eliminar material del proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar <strong>{material.name}</strong> ({material.code}) del proyecto.
              El stock se devolverá automáticamente al inventario.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(projectMaterial.id)
                setShowDeleteDialog(false)
              }}
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
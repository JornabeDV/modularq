"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface EditTaskModalProps {
  isOpen: boolean
  onClose: () => void
  actualHours: number
  progressPercentage: number
  notes: string
  onActualHoursChange: (value: number) => void
  onProgressChange: (value: number) => void
  onNotesChange: (value: string) => void
  onSave: () => void
}

export function EditTaskModal({
  isOpen,
  onClose,
  actualHours,
  progressPercentage,
  notes,
  onActualHoursChange,
  onProgressChange,
  onNotesChange,
  onSave
}: EditTaskModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Actualizar Progreso</CardTitle>
          <CardDescription>
            Actualiza el progreso y las horas trabajadas en esta tarea
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="actualHours">Horas Reales Trabajadas</Label>
            <Input
              id="actualHours"
              type="number"
              step="0.5"
              min="0"
              value={actualHours}
              onChange={(e) => onActualHoursChange(parseFloat(e.target.value) || 0)}
              placeholder="Ej: 2.5"
            />
          </div>
          <div>
            <Label htmlFor="progress">Progreso (%)</Label>
            <Input
              id="progress"
              type="number"
              min="0"
              max="100"
              value={progressPercentage}
              onChange={(e) => onProgressChange(parseInt(e.target.value) || 0)}
              placeholder="Ej: 75"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Comentarios sobre el progreso..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="cursor-pointer">
              Cancelar
            </Button>
            <Button onClick={onSave} className="cursor-pointer">
              Guardar Cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface StopTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, customReason?: string) => void
  elapsedTime: number
  formatTime: (milliseconds: number) => string
}

const stopReasons = [
  { value: 'break', label: 'Necesito un descanso' },
  { value: 'other_task', label: 'Necesito hacer otra tarea' },
  { value: 'meeting', label: 'Tengo una reunión' },
  { value: 'end_day', label: 'Terminé mi jornada' },
  { value: 'other', label: 'Otro (especificar)' }
]

export function StopTaskModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  elapsedTime, 
  formatTime 
}: StopTaskModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  const handleConfirm = () => {
    if (!selectedReason) return
    
    let finalReason = ''
    if (selectedReason === 'other' && customReason.trim()) {
      finalReason = customReason.trim()
    } else {
      const reason = stopReasons.find(r => r.value === selectedReason)
      finalReason = reason ? reason.label : 'Sesión de trabajo completada'
    }
    
    onConfirm(finalReason, customReason)
  }

  const handleCancel = () => {
    setSelectedReason('')
    setCustomReason('')
    onClose()
  }

  const handleReasonChange = (value: string) => {
    setSelectedReason(value)
    if (value !== 'other') {
      setCustomReason('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Detener Sesión de Trabajo</CardTitle>
          <CardDescription>
            Tiempo trabajado: <span className="font-medium">{formatTime(elapsedTime)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className='flex flex-col gap-2'>
            <Label htmlFor="stopReason">
              ¿Por qué detienes la tarea?
            </Label>
            <Select value={selectedReason} onValueChange={handleReasonChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una opción..." />
              </SelectTrigger>
              <SelectContent>
                {stopReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedReason === 'other' && (
            <div>
              <Label htmlFor="customReason">
                Especifica el motivo
              </Label>
              <Textarea
                id="customReason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describe por qué detienes la tarea..."
                rows={3}
              />
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleCancel}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              variant="destructive"
              disabled={!selectedReason || (selectedReason === 'other' && !customReason.trim())}
            >
              Detener
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
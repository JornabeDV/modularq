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
  { value: 'other_task', label: 'Cambio a otra tarea' },
  { value: 'meeting', label: 'Tengo una reunión' },
  { value: 'end_day', label: 'Terminé mi jornada' },
  { value: 'other', label: 'Otro motivo (escribir)' }
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-lg mx-2 sm:mx-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl sm:text-2xl text-center">Detener Trabajo</CardTitle>
          <CardDescription className="text-center text-base sm:text-lg">
            Tiempo trabajado: <span className="font-bold text-lg sm:text-xl">{formatTime(elapsedTime)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          <div className='flex flex-col gap-2 sm:gap-3'>
            <Label htmlFor="stopReason" className="text-base sm:text-lg font-semibold">
              ¿Por qué detienes la tarea?
            </Label>
            <Select value={selectedReason} onValueChange={handleReasonChange}>
              <SelectTrigger className="h-10 sm:h-12 text-base sm:text-lg">
                <SelectValue placeholder="Selecciona una opción..." />
              </SelectTrigger>
              <SelectContent>
                {stopReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value} className="text-base sm:text-lg">
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedReason === 'other' && (
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="customReason" className="text-base sm:text-lg font-semibold">
                Escribe el motivo
              </Label>
              <Textarea
                id="customReason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describe por qué detienes la tarea..."
                rows={3}
                className="text-base sm:text-lg"
              />
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4">
            <Button
              onClick={handleCancel}
              variant="outline"
              size="lg"
              className="h-10 sm:h-12 px-6 sm:px-8 text-base sm:text-lg w-full sm:w-auto cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="h-10 sm:h-12 px-6 sm:px-8 text-base sm:text-lg bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto cursor-pointer"
              disabled={!selectedReason || (selectedReason === 'other' && !customReason.trim())}
            >
              Detener Trabajo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
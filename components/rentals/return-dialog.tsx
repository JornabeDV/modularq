"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReturnDialogProps {
  contractId: string
  moduleName: string
  onClose: () => void
  onSuccess: () => void
}

const currentYear = new Date().getFullYear()
const calendarStartMonth = new Date(currentYear, 0, 1)
const calendarEndMonth = new Date(currentYear + 10, 11, 31)

function formatDateLabel(dateString: string) {
  if (!dateString) return null
  return new Date(dateString + "T00:00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export function ReturnDialog({ contractId, moduleName, onClose, onSuccess }: ReturnDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0])
  const [returnDateOpen, setReturnDateOpen] = useState(false)
  const [returnNotes, setReturnNotes] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/rental-contracts/${contractId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ return_date: returnDate, return_notes: returnNotes || undefined }),
      })
      if (!res.ok) throw new Error("Error al registrar devolución")
      toast({ title: "Devolución registrada", description: `El módulo ${moduleName} volvió a estar disponible.` })
      onSuccess()
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "No se pudo registrar la devolución.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Devolución</DialogTitle>
          <DialogDescription>
            El módulo <strong>{moduleName}</strong> está siendo devuelto. Se liberará para nuevo alquiler.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Fecha de Devolución *</Label>
            <Popover open={returnDateOpen} onOpenChange={setReturnDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm",
                    !returnDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateLabel(returnDate) || "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  captionLayout="dropdown-years"
                  startMonth={calendarStartMonth}
                  endMonth={calendarEndMonth}
                  selected={returnDate ? new Date(returnDate + "T00:00:00") : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setReturnDate(date.toISOString().split("T")[0])
                      setReturnDateOpen(false)
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Notas de Devolución</Label>
            <Input value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} placeholder="Estado del módulo, observaciones..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Procesando..." : "Confirmar Devolución"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

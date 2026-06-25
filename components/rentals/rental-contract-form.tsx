"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PriceInput } from "@/components/ui/price-input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useClientsPrisma } from "@/hooks/use-clients-prisma"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface RentalContractFormProps {
  rentalModuleId: string
  onClose: () => void
  onSuccess: () => void
  prefilledClientId?: string
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

export function RentalContractForm({ rentalModuleId, onClose, onSuccess, prefilledClientId }: RentalContractFormProps) {
  const { clients } = useClientsPrisma()
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    client_id: prefilledClientId || "",
    start_date: "",
    end_date: "",
    delivery_date: "",
    monthly_price: "",
    currency: "USD",
    delivery_notes: "",
  })

  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [deliveryDateOpen, setDeliveryDateOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.client_id || !formData.start_date || !formData.end_date || !formData.monthly_price) return

    setLoading(true)
    try {
      const res = await fetch("/api/rental-contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rental_module_id: rentalModuleId,
          client_id: formData.client_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          delivery_date: formData.delivery_date || undefined,
          monthly_price: parseFloat(formData.monthly_price.replace(",", ".")),
          currency: formData.currency,
          delivery_notes: formData.delivery_notes || undefined,
          created_by: userProfile?.id,
        }),
      })
      if (!res.ok) throw new Error("Error al crear contrato")
      toast({ title: "Contrato creado", description: "El contrato de alquiler se registró correctamente." })
      onSuccess()
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "No se pudo crear el contrato.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg h-full sm:h-auto max-h-screen sm:max-h-[calc(100vh-4rem)] rounded-none sm:rounded-lg top-0 sm:top-[50%] translate-y-0 sm:translate-y-[-50%]">
        <DialogHeader>
          <DialogTitle>Nuevo Contrato de Alquiler</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fecha de Inicio *</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateLabel(formData.start_date) || "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown-years"
                    startMonth={calendarStartMonth}
                    endMonth={calendarEndMonth}
                    selected={formData.start_date ? new Date(formData.start_date + "T00:00:00") : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, start_date: date.toISOString().split("T")[0] })
                        setStartDateOpen(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Fecha de Finalización *</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm",
                      !formData.end_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateLabel(formData.end_date) || "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown-years"
                    startMonth={calendarStartMonth}
                    endMonth={calendarEndMonth}
                    selected={formData.end_date ? new Date(formData.end_date + "T00:00:00") : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, end_date: date.toISOString().split("T")[0] })
                        setEndDateOpen(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fecha de Entrega</Label>
            <Popover open={deliveryDateOpen} onOpenChange={setDeliveryDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm",
                    !formData.delivery_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateLabel(formData.delivery_date) || "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  captionLayout="dropdown-years"
                  startMonth={calendarStartMonth}
                  endMonth={calendarEndMonth}
                  selected={formData.delivery_date ? new Date(formData.delivery_date + "T00:00:00") : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setFormData({ ...formData, delivery_date: date.toISOString().split("T")[0] })
                      setDeliveryDateOpen(false)
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Precio Mensual *</Label>
              <PriceInput required value={formData.monthly_price} onChange={(v) => setFormData({ ...formData, monthly_price: v })} />
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="ARS">ARS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas de Entrega</Label>
            <Input value={formData.delivery_notes} onChange={(e) => setFormData({ ...formData, delivery_notes: e.target.value })} />
          </div>

          <DialogFooter className="pt-2 flex">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto max-sm:order-2">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto max-sm:order-1">
              {loading ? "Guardando..." : "Crear Contrato"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

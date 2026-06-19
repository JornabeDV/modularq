"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProjectsPrisma } from "@/hooks/use-projects-prisma"
import { useToast } from "@/hooks/use-toast"

interface CreateModuleFormProps {
  onClose: () => void
  onSuccess: () => void
}

export function CreateModuleForm({ onClose, onSuccess }: CreateModuleFormProps) {
  const { projects, loading: loadingProjects } = useProjectsPrisma()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    project_id: "",
    modulation: "standard",
    height: "2.0",
    width: "1.5",
    depth: "0.8",
    module_count: "1",
    location: "factory",
  })

  const rentalProjects = useMemo(() => {
    return projects.filter(
      (p) => p.condition === "alquiler" && (p.status === "rented" || p.status === "completed")
    )
  }, [projects])

  const selectedProject = rentalProjects.find((p) => p.id === formData.project_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code.trim() || !formData.name.trim()) return

    setLoading(true)
    try {
      const payload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description || undefined,
        project_id: formData.project_id || undefined,
        modulation: formData.modulation,
        height: parseFloat(formData.height) || 2.0,
        width: parseFloat(formData.width) || 1.5,
        depth: parseFloat(formData.depth) || 0.8,
        module_count: parseInt(formData.module_count) || 1,
        location: formData.location,
      }

      const res = await fetch("/api/rental-modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al crear módulo")
      }

      toast({ title: "Módulo creado", description: "El módulo de alquiler se registró correctamente." })
      onSuccess()
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error al crear módulo", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Módulo de Alquiler</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Proyecto Origen</Label>
            <Select
              value={formData.project_id}
              onValueChange={(v) => {
                if (v === "none") {
                  setFormData((prev) => ({ ...prev, project_id: "" }))
                  return
                }
                const p = rentalProjects.find((proj) => proj.id === v)
                if (p) {
                  setFormData((prev) => ({
                    ...prev,
                    project_id: v,
                    name: p.name,
                    modulation: p.modulation || "standard",
                    height: String(p.height || 2.0),
                    width: String(p.width || 1.5),
                    depth: String(p.depth || 0.8),
                    module_count: String(p.moduleCount || 1),
                  }))
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingProjects ? "Cargando proyectos..." : "Seleccionar proyecto (opcional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin proyecto asociado</SelectItem>
                {rentalProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Solo se muestran proyectos con condición &quot;Alquiler&quot; y estado &quot;En Alquiler&quot; o &quot;Completado&quot;.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Código *</Label>
            <Input
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Ej: MOD-001"
            />
          </div>

          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre del módulo"
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción opcional"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Altura (m)</Label>
              <Input type="number" step="0.1" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ancho (m)</Label>
              <Input type="number" step="0.1" value={formData.width} onChange={(e) => setFormData({ ...formData, width: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Profundidad (m)</Label>
              <Input type="number" step="0.1" value={formData.depth} onChange={(e) => setFormData({ ...formData, depth: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Cantidad de Módulos</Label>
              <Input type="number" value={formData.module_count} onChange={(e) => setFormData({ ...formData, module_count: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Modulación</Label>
            <Input value={formData.modulation} onChange={(e) => setFormData({ ...formData, modulation: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Ubicación</Label>
            <Select value={formData.location} onValueChange={(v) => setFormData({ ...formData, location: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="factory">Fábrica</SelectItem>
                <SelectItem value="destination">En destino</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Módulo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

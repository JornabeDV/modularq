"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MaterialForm } from "@/components/admin/materials/material-form"
import { type Material } from "@/hooks/use-materials-prisma"
import { useToast } from "@/hooks/use-toast"

interface CreateMaterialDialogProps {
  materials: Material[]
  createMaterial: (data: {
    code: string
    name: string
    description?: string
    category: Material["category"]
    unit: Material["unit"]
    stock_quantity?: number
    min_stock?: number
    unit_price?: number
    supplier?: string
    brand?: string
  }) => Promise<{ success: boolean; error?: string; material?: Material }>
  onMaterialCreated: (material: Material) => void
  trigger?: React.ReactNode
}

export function CreateMaterialDialog({
  materials,
  createMaterial,
  onMaterialCreated,
  trigger,
}: CreateMaterialDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (data: Parameters<typeof createMaterial>[0]) => {
    setIsLoading(true)
    try {
      const result = await createMaterial(data)

      if (!result.success || !result.material) {
        throw new Error(result.error || "No se pudo crear el material")
      }

      toast({
        title: "Material creado",
        description: `${result.material.name} se agregó al catálogo.`,
      })

      onMaterialCreated(result.material)
      setOpen(false)
    } catch (error) {
      toast({
        title: "Error al crear material",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {trigger || (
        <Button
          type="button"
          variant="outline"
          size="default"
          className="cursor-pointer whitespace-nowrap"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Nuevo
        </Button>
      )}
      <MaterialForm
        isOpen={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        isEditing={false}
        isLoading={isLoading}
        existingMaterials={materials}
      />
    </>
  )
}

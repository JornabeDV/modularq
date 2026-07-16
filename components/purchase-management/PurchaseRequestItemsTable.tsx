"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2, Plus } from "lucide-react"
import { type Material } from "@/hooks/use-materials-prisma"
import { MaterialSelector } from "@/components/ui/material-selector"
import { CreateMaterialDialog } from "./CreateMaterialDialog"

export interface PurchaseRequestItemInput {
  id?: string
  material_id?: string
  description: string
  quantity: number
  unit: string
}

interface PurchaseRequestItemsTableProps {
  items: PurchaseRequestItemInput[]
  onChange: (items: PurchaseRequestItemInput[]) => void
  materials: Material[]
  materialsLoading: boolean
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
}

const UNITS = [
  { value: "unidad", label: "Unidad" },
  { value: "metro", label: "Metro" },
  { value: "metro_cuadrado", label: "m²" },
  { value: "metro_cubico", label: "m³" },
  { value: "kilogramo", label: "Kg" },
  { value: "litro", label: "Litro" },
]

export function PurchaseRequestItemsTable({
  items,
  onChange,
  materials,
  materialsLoading,
  createMaterial,
}: PurchaseRequestItemsTableProps) {
  const [editingQuantities, setEditingQuantities] = useState<Record<number, string>>({})

  const materialsById = useMemo(() => {
    const map: Record<string, typeof materials[0]> = {}
    for (const m of materials) map[m.id] = m
    return map
  }, [materials])

  const handleAddItem = () => {
    onChange([
      ...items,
      {
        description: "",
        quantity: 1,
        unit: "unidad",
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleUpdateItem = (index: number, field: keyof PurchaseRequestItemInput, value: unknown) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }

    if (field === "material_id" && value) {
      const material = materialsById[value as string]
      if (material) {
        updated[index].description = material.name
        updated[index].unit = material.unit
      }
    }

    onChange(updated)
  }

  const handleMaterialCreated = (index: number, material: Material) => {
    const updated = [...items]
    updated[index] = {
      ...updated[index],
      material_id: material.id,
      description: material.name,
      unit: material.unit,
    }
    onChange(updated)
  }

  const handleQuantityChange = (index: number, value: string) => {
    setEditingQuantities((prev) => ({ ...prev, [index]: value }))
  }

  const handleQuantityBlur = (index: number) => {
    const raw = editingQuantities[index]
    if (raw === undefined) return
    const num = parseFloat(raw.replace(",", "."))
    if (!isNaN(num) && num >= 0) {
      handleUpdateItem(index, "quantity", num)
    }
    setEditingQuantities((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto sm:rounded-md sm:border">
        <Table className="min-w-[360px] sm:min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-[70px] sm:w-[100px]">Cantidad</TableHead>
              <TableHead className="w-[80px] sm:w-[110px]">Unidad</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No hay ítems. Agregue al menos uno.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="text-muted-foreground text-sm text-center">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <MaterialSelector
                          materials={materials}
                          selectedId={item.material_id}
                          loading={materialsLoading}
                          onSelect={(materialId) => handleUpdateItem(index, "material_id", materialId)}
                        />
                      </div>
                      <CreateMaterialDialog
                        materials={materials}
                        createMaterial={createMaterial}
                        onMaterialCreated={(material) => handleMaterialCreated(index, material)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(e) => handleUpdateItem(index, "description", e.target.value)}
                      placeholder="Descripción del ítem"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={editingQuantities[index] ?? item.quantity}
                      onChange={(e) => {
                        const val = e.target.value.replace(",", ".")
                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                          handleQuantityChange(index, val)
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      onBlur={() => handleQuantityBlur(index)}
                      className="w-full sm:w-[70px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.unit}
                      onValueChange={(value) => handleUpdateItem(index, "unit", value)}
                    >
                      <SelectTrigger className="w-full sm:w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Button type="button" variant="outline" className="cursor-pointer" onClick={handleAddItem}>
        <Plus className="h-4 w-4 mr-1" /> Agregar ítem
      </Button>
    </div>
  )
}

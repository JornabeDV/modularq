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
import { Trash2, Plus, Loader2 } from "lucide-react"
import { useMaterialsPrisma } from "@/hooks/use-materials-prisma"

export interface PurchaseOrderItemInput {
  id?: string
  material_id?: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
}

interface PurchaseOrderItemsTableProps {
  items: PurchaseOrderItemInput[]
  onChange: (items: PurchaseOrderItemInput[]) => void
}

const UNITS = [
  { value: "unidad", label: "Unidad" },
  { value: "metro", label: "Metro" },
  { value: "metro_cuadrado", label: "m²" },
  { value: "metro_cubico", label: "m³" },
  { value: "kilogramo", label: "Kg" },
  { value: "litro", label: "Litro" },
]

export function PurchaseOrderItemsTable({ items, onChange }: PurchaseOrderItemsTableProps) {
  const { materials, loading: materialsLoading } = useMaterialsPrisma()
  const [editingQuantities, setEditingQuantities] = useState<Record<number, string>>({})
  const [editingPrices, setEditingPrices] = useState<Record<number, string>>({})

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
        unit_price: 0,
        total_price: 0,
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleUpdateItem = (index: number, field: keyof PurchaseOrderItemInput, value: unknown) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }

    // Si cambió el material, autocompletar descripción y unidad
    if (field === "material_id" && value) {
      const material = materialsById[value as string]
      if (material) {
        updated[index].description = material.name
        updated[index].unit = material.unit
      }
    }

    // Recalcular total
    if (["quantity", "unit_price"].includes(field)) {
      updated[index].total_price = updated[index].quantity * updated[index].unit_price
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

  const handlePriceChange = (index: number, value: string) => {
    setEditingPrices((prev) => ({ ...prev, [index]: value }))
  }

  const handlePriceBlur = (index: number) => {
    const raw = editingPrices[index]
    if (raw === undefined) return
    const num = parseFloat(raw.replace(",", "."))
    if (!isNaN(num) && num >= 0) {
      handleUpdateItem(index, "unit_price", num)
    }
    setEditingPrices((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-[100px]">Cantidad</TableHead>
              <TableHead className="w-[110px]">Unidad</TableHead>
              <TableHead className="w-[120px]">Precio Unit.</TableHead>
              <TableHead className="w-[120px] text-right">Total</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No hay ítems. Agregue al menos uno.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="text-muted-foreground text-xs">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.material_id || "custom"}
                      onValueChange={(value) =>
                        handleUpdateItem(index, "material_id", value === "custom" ? undefined : value)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Manual (sin catálogo)</SelectItem>
                        {materialsLoading ? (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          materials.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              <div className="flex items-center justify-between w-full gap-2">
                                <span className="truncate">{m.code} - {m.name}</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  Stock: {m.stockQuantity}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
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
                      className="w-[90px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.unit}
                      onValueChange={(value) => handleUpdateItem(index, "unit", value)}
                    >
                      <SelectTrigger className="w-[100px]">
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
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={editingPrices[index] ?? item.unit_price}
                      onChange={(e) => {
                        const val = e.target.value.replace(",", ".")
                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                          handlePriceChange(index, val)
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      onBlur={() => handlePriceBlur(index)}
                      className="w-[100px]"
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${item.total_price.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
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

      <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
        <Plus className="h-4 w-4 mr-1" /> Agregar ítem
      </Button>
    </div>
  )
}

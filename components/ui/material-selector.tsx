"use client"

import { useState, useMemo } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { Material } from "@/hooks/use-materials-prisma"

interface MaterialSelectorProps {
  materials: Material[]
  selectedId?: string
  loading?: boolean
  onSelect: (materialId: string | undefined) => void
  placeholder?: string
}

export function MaterialSelector({
  materials,
  selectedId,
  loading = false,
  onSelect,
  placeholder = "Seleccionar material",
}: MaterialSelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedMaterial = useMemo(() => {
    return materials.find((m) => m.id === selectedId)
  }, [materials, selectedId])

  const selectedLabel = selectedId
    ? selectedMaterial
      ? `${selectedMaterial.code} - ${selectedMaterial.name}`
      : "Material seleccionado"
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selectedId && "text-muted-foreground")}>{selectedLabel}</span>
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] sm:w-[360px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por código o nombre..." className="h-9" />
          <CommandList>
            <CommandEmpty>No se encontró el material.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="custom"
                onSelect={() => {
                  onSelect(undefined)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    !selectedId ? "opacity-100" : "hidden"
                  )}
                />
                <span>Manual (sin catálogo)</span>
              </CommandItem>
              {materials.map((material) => (
                <CommandItem
                  key={material.id}
                  value={`${material.code} ${material.name}`}
                  onSelect={() => {
                    onSelect(material.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      selectedId === material.id ? "opacity-100" : "hidden"
                    )}
                  />
                  <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                    <span className="truncate text-sm">
                      {material.code} - {material.name}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      Stock: {material.stockQuantity}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

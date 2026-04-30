"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

interface CustomModuleFormProps {
  onAdd: (item: {
    name: string;
    description: string;
    unitPrice: number;
    quantity: number;
  }) => void;
}

export function CustomModuleForm({ onAdd }: CustomModuleFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");

  function handleSubmit() {
    const unitPrice = Number(price);
    const qty = Number(quantity);
    if (!name.trim() || isNaN(unitPrice) || unitPrice < 0 || isNaN(qty) || qty < 1) return;

    onAdd({
      name: name.trim(),
      description: description.trim(),
      unitPrice,
      quantity: qty,
    });

    setName("");
    setDescription("");
    setPrice("");
    setQuantity("1");
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Nombre del módulo *</Label>
        <Input
          placeholder="Ej: Planta Libre Especial"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Descripción</Label>
        <Textarea
          placeholder="Características del módulo..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Precio unitario *</Label>
          <Input
            type="number"
            placeholder="0"
            min={0}
            step={1000}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Cantidad</Label>
          <Input
            type="number"
            placeholder="1"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
      </div>
      <Button
        className="w-full cursor-pointer"
        onClick={handleSubmit}
        disabled={!name.trim() || !price || Number(price) < 0}
      >
        <Plus className="w-4 h-4 mr-2" />
        Agregar módulo personalizado
      </Button>
    </div>
  );
}

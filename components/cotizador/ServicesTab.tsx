"use client";

import { useState } from "react";
import { Plus, Wrench, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PriceInput } from "@/components/ui/price-input";
import { Textarea } from "@/components/ui/textarea";
import { ExchangeRate } from "@/lib/exchange-rate";

export interface ServiceCatalogItem {
  id: string;
  name: string;
  description?: string;
  unit_price: number;
  unit: string;
  is_active: boolean;
}

interface ServicesTabProps {
  services: ServiceCatalogItem[];
  loading: boolean;
  onAddService: (service: ServiceCatalogItem) => void;
  onAddCustomService: (item: {
    name: string;
    description: string;
    unitPrice: number;
    quantity: number;
    unit: string;
  }) => void;
  exchangeRate: ExchangeRate | null;
  currency: 'ARS' | 'USD';
}

function formatUSD(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatARS(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function ServicesTab({ services, loading, onAddService, onAddCustomService, exchangeRate, currency }: ServicesTabProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("unidad");

  function handleAddCustom() {
    const unitPrice = Number(price.replace(",", "."));
    const qty = Number(quantity);
    if (!name.trim() || isNaN(unitPrice) || unitPrice < 0 || isNaN(qty) || qty < 1) return;

    onAddCustomService({
      name: name.trim(),
      description: description.trim(),
      unitPrice,
      quantity: qty,
      unit,
    });

    setName("");
    setDescription("");
    setPrice("");
    setQuantity("1");
    setUnit("unidad");
    setShowCustom(false);
  }

  return (
    <div className="space-y-4">
      {/* Servicios predefinidos */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando servicios...</p>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground text-sm">
            <Wrench className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No hay servicios predefinidos.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {services.map((svc) => (
            <Card
              key={svc.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onAddService(svc)}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{svc.name}</p>
                    {svc.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {svc.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Unidad: {svc.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col items-end">
                      {exchangeRate ? (
                        <>
                          <span className="text-sm font-semibold tabular-nums">
                            {currency === 'USD'
                              ? formatUSD(svc.unit_price)
                              : formatARS(svc.unit_price * exchangeRate.venta)}
                          </span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {currency === 'USD'
                              ? formatARS(svc.unit_price * exchangeRate.venta)
                              : formatUSD(svc.unit_price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-semibold tabular-nums">
                          {formatUSD(svc.unit_price)}
                        </span>
                      )}
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 cursor-pointer">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Servicio libre */}
      {!showCustom ? (
        <Button
          variant="outline"
          className="w-full cursor-pointer"
          onClick={() => setShowCustom(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar servicio libre
        </Button>
      ) : (
        <Card>
          <CardContent className="py-4 px-4 space-y-3">
            <p className="text-sm font-medium">Nuevo servicio</p>
            <div className="space-y-1">
              <Label className="text-xs">Nombre *</Label>
              <Input
                placeholder="Ej: Transporte especial"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descripción</Label>
              <Textarea
                placeholder="Detalles del servicio..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Precio ({currency}) *</Label>
                <PriceInput
                  placeholder="0"
                  value={price}
                  onChange={(val) => setPrice(val)}
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
              <div className="space-y-1">
                <Label className="text-xs">Unidad</Label>
                <Input
                  placeholder="unidad"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 cursor-pointer"
                onClick={handleAddCustom}
                disabled={!name.trim() || !price || Number(price.replace(",", ".")) < 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </Button>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setShowCustom(false)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

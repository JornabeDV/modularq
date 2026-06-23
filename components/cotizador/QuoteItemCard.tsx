"use client";

import { useState, useRef, useCallback } from "react";
import {
  X,
  Plus,
  Minus,
  ChevronDown,
  FileText,
  Trash2,
  Upload,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PriceInput } from "@/components/ui/price-input";
import { ExchangeRate } from "@/lib/exchange-rate";

export type QuoteItemType = "standard_module" | "custom_module" | "service";

export interface SelectedAdicional {
  id: string;
  name: string;
  price: number;
}

export interface QuoteItemAttachment {
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  storage_path: string;
}

export interface ModuleDescriptionSection {
  section: string;
  description: string;
}

export interface QuoteItemState {
  key: string;
  type: QuoteItemType;
  standardModuleId?: string;
  name: string;
  description?: string;
  moduleDescriptionSections?: ModuleDescriptionSection[];
  unitPrice: number;
  quantity: number;
  adicionales: SelectedAdicional[];
  attachments?: QuoteItemAttachment[];
}

const TYPE_LABELS: Record<QuoteItemType, string> = {
  standard_module: "Módulo Estándar",
  custom_module: "Módulo Personalizado",
  service: "Servicio",
};

const TYPE_BADGE_COLORS: Record<QuoteItemType, string> = {
  standard_module: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  custom_module: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  service: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
};

interface QuoteItemCardProps {
  item: QuoteItemState;
  adicionalesDisponibles: { id: string; name: string; unit_price: number }[];
  onRemove: (key: string) => void;
  onUpdateQuantity: (key: string, quantity: number) => void;
  onUpdatePrice: (key: string, price: number) => void;
  onToggleAdicional: (
    itemKey: string,
    adicional: { id: string; name: string; unit_price: number },
  ) => void;
  onAddAttachment?: (itemKey: string, attachment: QuoteItemAttachment) => void;
  onRemoveAttachment?: (itemKey: string, storagePath: string) => void;
  onStartEdit?: (itemKey: string) => void;
  exchangeRate: ExchangeRate | null;
  currency: "ARS" | "USD";
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

export function QuoteItemCard({
  item,
  adicionalesDisponibles,
  onRemove,
  onUpdateQuantity,
  onUpdatePrice,
  onToggleAdicional,
  onAddAttachment,
  onRemoveAttachment,
  onStartEdit,
  exchangeRate,
  currency,
}: QuoteItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);

  const itemSubtotal = item.unitPrice * item.quantity;
  const adicionalesTotal = item.adicionales.reduce((a, ad) => a + ad.price, 0);
  const total = itemSubtotal + adicionalesTotal;

  const canHaveAdicionales =
    item.type === "standard_module" || item.type === "custom_module";
  const canHaveAttachments = item.type === "custom_module";
  const canEdit =
    item.type === "custom_module" || item.type === "standard_module";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!onAddAttachment) return;
      if (file.type !== "application/pdf") return;
      if (file.size > 10 * 1024 * 1024) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/quote-items/upload-attachment", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Error al subir archivo");
        const { attachment } = await res.json();
        onAddAttachment(item.key, attachment);
      } catch {
        // silently fail
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [item.key, onAddAttachment],
  );

  return (
    <Card>
      <CardContent className="py-0 px-4">
        {/* Header siempre visible */}
        <div className="flex flex-col gap-2">
          {/* Fila 1: nombre/badge + botones de acción */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <p className="font-medium text-sm truncate">{item.name}</p>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] px-1.5 py-0 shrink-0",
                  TYPE_BADGE_COLORS[item.type],
                )}
              >
                {TYPE_LABELS[item.type]}
              </Badge>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {canEdit && onStartEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    onStartEdit(item.key);
                  }}
                  title="Editar información del ítem"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onRemove(item.key)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Fila 2: precios + badges (solo cuando no expandido) */}
          {!isExpanded && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  x{item.quantity}
                </span>
                <div className="flex flex-col items-start">
                  {exchangeRate ? (
                    <>
                      <span className="text-sm font-semibold tabular-nums leading-tight">
                        {currency === "USD"
                          ? formatUSD(total)
                          : formatARS(total)}
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums leading-tight">
                        {currency === "USD"
                          ? formatARS(total * exchangeRate.venta)
                          : formatUSD(total / exchangeRate.venta)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-semibold tabular-nums">
                      {formatARS(total)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {item.adicionales.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1 py-0 h-4"
                  >
                    +{item.adicionales.length}
                  </Badge>
                )}
                {item.attachments && item.attachments.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[14px] px-1 py-1 h-5 w-5 rounded-full"
                  >
                    {item.attachments.length}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {isExpanded && item.description && (
            <p className="text-xs text-muted-foreground truncate">
              {item.description}
            </p>
          )}
        </div>

        {/* Contenido expandible */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isExpanded
              ? "grid-rows-[1fr] opacity-100 mt-3"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden space-y-3">
            {/* Secciones descriptivas (solo lectura) */}
            {item.moduleDescriptionSections &&
              item.moduleDescriptionSections.length > 0 && (
                <div className="space-y-2">
                  {item.moduleDescriptionSections.map((sec, i) => (
                    <div key={i} className="border-l-2 border-primary/40 pl-3">
                      <p className="font-medium text-sm">{sec.section}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {sec.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

            {/* Precio y cantidad */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() =>
                    onUpdateQuantity(item.key, Math.max(1, item.quantity - 1))
                  }
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-sm font-medium w-6 text-center tabular-nums">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onUpdateQuantity(item.key, item.quantity + 1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex-1">
                <PriceInput
                  value={item.unitPrice.toFixed(2).replace(".", ",")}
                  onChange={(val) => {
                    const parsed = parseFloat(val.replace(",", ".")) || 0;
                    onUpdatePrice(item.key, parsed);
                  }}
                  className="w-full text-sm border rounded px-2 py-1 tabular-nums"
                />
              </div>
              <div className="flex flex-col items-end shrink-0">
                {exchangeRate ? (
                  <>
                    <span className="text-sm font-semibold tabular-nums">
                      {currency === "USD"
                        ? formatUSD(itemSubtotal)
                        : formatARS(itemSubtotal)}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {currency === "USD"
                        ? formatARS(itemSubtotal * exchangeRate.venta)
                        : formatUSD(itemSubtotal / exchangeRate.venta)}
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-semibold tabular-nums">
                    {currency === "USD" ? formatUSD(itemSubtotal) : formatARS(itemSubtotal)}
                  </span>
                )}
              </div>
            </div>

            {/* Adicionales (solo módulos) */}
            {canHaveAdicionales && adicionalesDisponibles.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Adicionales
                </p>
                <div className="space-y-1">
                  {adicionalesDisponibles.map((ad) => {
                    const selected = item.adicionales.some(
                      (a) => a.id === ad.id,
                    );
                    return (
                      <button
                        key={ad.id}
                        type="button"
                        onClick={() => onToggleAdicional(item.key, ad)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border text-xs select-none transition-colors cursor-pointer ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        <span>{ad.name}</span>
                        <span className="tabular-nums font-medium">
                          {exchangeRate
                            ? currency === "USD"
                              ? formatUSD(ad.unit_price)
                              : formatARS(ad.unit_price)
                            : formatARS(ad.unit_price)}
                        </span>
                        {exchangeRate && (
                          <span className="text-[10px] text-muted-foreground tabular-nums ml-1">
                            {currency === "USD"
                              ? formatARS(ad.unit_price * exchangeRate.venta)
                              : formatUSD(ad.unit_price / exchangeRate.venta)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Attachments (solo módulos personalizados) */}
            {canHaveAttachments && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Archivos adjuntos (PDFs)
                </p>
                {item.attachments && item.attachments.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {item.attachments.map((att) => (
                      <div
                        key={att.storage_path}
                        className="flex items-center gap-2 p-2 bg-muted/40 rounded-md text-xs border"
                      >
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 truncate hover:underline text-primary"
                        >
                          {att.original_name}
                        </a>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {(att.size / 1024).toFixed(0)} KB
                        </span>
                        {onRemoveAttachment && (
                          <button
                            type="button"
                            onClick={() =>
                              onRemoveAttachment(item.key, att.storage_path)
                            }
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div
                  className="border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer hover:bg-muted/30"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                    }}
                  />
                  {uploading ? (
                    <p className="text-xs text-muted-foreground">Subiendo...</p>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Hacé clic para subir un PDF
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Total con adicionales */}
            {adicionalesTotal > 0 && (
              <div className="text-xs text-right text-muted-foreground border-t pt-2">
                Subtotal:{" "}
                {exchangeRate ? (
                  <>
                    <span className="font-semibold tabular-nums text-foreground">
                      {currency === "USD"
                        ? formatUSD(total)
                        : formatARS(total)}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums ml-1">
                      (
                      {currency === "USD"
                        ? formatARS(total * exchangeRate.venta)
                        : formatUSD(total / exchangeRate.venta)}
                      )
                    </span>
                  </>
                ) : (
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatARS(total)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

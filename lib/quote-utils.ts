import type { QuoteItemState } from "@/components/cotizador/QuoteItemCard";

export function parsePriceInput(value: string): number {
  const cleaned = value.replace(/\./g, "").replace(/,/g, ".");
  return parseFloat(cleaned) || 0;
}

/**
 * Ajusta los ítems para el PDF distribuyendo la diferencia entre
 * el subtotal calculado y el finalTotal al ítem de mayor valor.
 * Solo aplica cuando finalTotal es mayor que subtotal (aumento).
 * En caso de descuento los ítems se mantienen sin modificación
 * y el descuento se muestra como línea separada en el PDF.
 */
export function getPDFItems(
  items: QuoteItemState[],
  subtotal: number,
  finalTotal: number
) {
  const diff = finalTotal - subtotal;

  const mapped = items.map((item) => ({
    type: item.type,
    moduleId: item.standardModuleId ?? item.key,
    moduleName: item.name,
    moduleDescription: item.description,
    moduleDescriptionSections: item.moduleDescriptionSections,
    basePrice: item.unitPrice,
    quantity: item.quantity,
    isOptional: item.isOptional,
    adicionales: item.adicionales,
  }));

  if (diff <= 0 || items.length === 0) return mapped;

  let maxIndex = 0;
  let maxValue = items[0].unitPrice * items[0].quantity;
  for (let i = 1; i < items.length; i++) {
    const val = items[i].unitPrice * items[i].quantity;
    if (val > maxValue) {
      maxValue = val;
      maxIndex = i;
    }
  }

  const adjustmentPerUnit = diff / items[maxIndex].quantity;
  mapped[maxIndex] = {
    ...mapped[maxIndex],
    basePrice: Math.max(0, mapped[maxIndex].basePrice + adjustmentPerUnit),
  };

  return mapped;
}

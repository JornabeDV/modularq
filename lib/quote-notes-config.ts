/**
 * Configuración y tipos para las notas del cotizador.
 *
 * Soporta:
 * - Notas libres (texto libre)
 * - Notas agrupadas (ej: "Forma de Pago" con subincisos a/b/c seleccionables)
 */

export interface FreeNote {
  type: 'free';
  content: string;
}

export interface GroupNoteItem {
  label: string;
  content: string;
  checked: boolean;
  /** Link opcional que se renderiza como texto azul clickeable */
  link?: { url: string; text: string };
}

export interface GroupNote {
  type: 'group';
  title: string;
  items: GroupNoteItem[];
}

export type NoteItem = FreeNote | GroupNote;

/** Opciones predefinidas de forma de pago */
export const DEFAULT_PAYMENT_OPTIONS: Omit<GroupNoteItem, 'checked'>[] = [
  {
    label: 'a',
    content: 'Contado anticipado aplica un 5% de descuento.',
  },
  {
    label: 'b',
    content: '50% anticipo y 50% previa a entrega.',
  },
  {
    label: 'c',
    content: 'Posibilidad de financiación 0.30.60.90.120 echeqs anticipados.',
  },
];

/** Opciones predefinidas de lugar de entrega */
export const DEFAULT_DELIVERY_OPTIONS: Omit<GroupNoteItem, 'checked'>[] = [
  {
    label: 'a',
    content: 'Calle Maurín 6688 sur Pocito San Juan',
    link: { text: 'Ubicación en mapa', url: 'https://mc.ht/s/0Zf7BLQ' },
  },
  {
    label: 'b',
    content: 'Con transporte a destino.',
  },
];

/** Crea una nota de grupo "Forma de Pago" con todas las opciones desmarcadas */
export function createPaymentNote(): GroupNote {
  return {
    type: 'group',
    title: 'Forma de Pago',
    items: DEFAULT_PAYMENT_OPTIONS.map((opt) => ({ ...opt, checked: false })),
  };
}

/** Crea una nota de grupo "Lugar de entrega" con todas las opciones desmarcadas */
export function createDeliveryNote(): GroupNote {
  return {
    type: 'group',
    title: 'Lugar de entrega',
    items: DEFAULT_DELIVERY_OPTIONS.map((opt) => ({ ...opt, checked: false })),
  };
}

/**
 * Convierte un array de notas legacy (string[]) al nuevo formato.
 * También sanitiza datos mixtos provenientes de JSONB.
 */
export function migrateNotesList(notesList: unknown): NoteItem[] {
  if (!Array.isArray(notesList)) return [];

  return notesList.map((item): NoteItem => {
    // Formato nuevo ya tipado
    if (item && typeof item === 'object') {
      if (item.type === 'free' && typeof item.content === 'string') {
        return { type: 'free', content: item.content };
      }
      if (
        item.type === 'group' &&
        typeof item.title === 'string' &&
        Array.isArray(item.items)
      ) {
        return {
          type: 'group',
          title: item.title,
          items: item.items.map((sub: unknown): GroupNoteItem => {
            if (sub && typeof sub === 'object') {
              return {
                label: String((sub as any).label ?? ''),
                content: String((sub as any).content ?? ''),
                checked: Boolean((sub as any).checked),
                link: (sub as any).link
                  ? {
                      text: String((sub as any).link.text ?? ''),
                      url: String((sub as any).link.url ?? ''),
                    }
                  : undefined,
              };
            }
            return { label: '', content: String(sub ?? ''), checked: false };
          }),
        };
      }
    }

    // Fallback: string plano (formato viejo)
    return { type: 'free', content: String(item ?? '') };
  });
}

/** Verifica si una nota de grupo tiene al menos un ítem seleccionado */
export function groupHasCheckedItems(note: GroupNote): boolean {
  return note.items.some((i) => i.checked);
}

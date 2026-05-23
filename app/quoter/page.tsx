"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Download,
  CheckCircle2,
  Loader2,
  History,
  ChevronsUpDown,
  Check,
  UserPlus,
  Calendar as CalendarIcon,
  Plus,
  Save,
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PriceInput } from "@/components/ui/price-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  useStandardModules,
  StandardModule,
} from "@/hooks/use-standard-modules";
import {
  getExchangeRate,
  formatExchangeRate,
  ExchangeRate,
} from "@/lib/exchange-rate";
import {
  useClientsPrisma,
  Client,
  CreateClientData,
} from "@/hooks/use-clients-prisma";
import { StandardModulesTab } from "@/components/cotizador/StandardModulesTab";
import { CustomModuleForm } from "@/components/cotizador/CustomModuleForm";
import { CustomModuleEditor } from "@/components/cotizador/CustomModuleEditor";
import { ServicesTab, ServiceCatalogItem } from "@/components/cotizador/ServicesTab";
import { QuoteItemCard, QuoteItemState, ModuleDescriptionSection } from "@/components/cotizador/QuoteItemCard";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type FreeNote,
  type GroupNote,
  createPaymentNote,
  createDeliveryNote,
  createAdditionalServicesNote,
  migrateNotesList,
  groupHasCheckedItems,
} from "@/lib/quote-notes-config";

const ALLOWED_ROLES = ["admin", "supervisor", "vendedor"];

// ── Quick-create client dialog ──────────────────────────────────────────────
function QuickCreateClientDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (client: Client) => void;
}) {
  const { createClient } = useClientsPrisma();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cuit: "",
    company_name: "",
    representative: "",
    email: "",
    phone: "",
  });

  function reset() {
    setForm({ cuit: "", company_name: "", representative: "", email: "", phone: "" });
  }

  async function handleSubmit() {
    if (!form.cuit.trim() || !form.company_name.trim()) return;
    setSaving(true);
    try {
      const data: CreateClientData = {
        cuit: form.cuit.trim(),
        company_name: form.company_name.trim(),
        representative: form.representative.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
      };
      const result = await createClient(data);
      if (result.success && result.client) {
        toast({ title: `Cliente "${data.company_name}" creado` });
        onCreate(result.client);
        reset();
        onClose();
      } else {
        toast({ title: result.error ?? "Error al crear cliente", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">CUIT *</Label>
            <Input
              placeholder="20-12345678-9"
              value={form.cuit}
              onChange={(e) => setForm((f) => ({ ...f, cuit: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Razón Social *</Label>
            <Input
              placeholder="Empresa S.A."
              value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Contacto</Label>
            <Input
              placeholder="Nombre del contacto"
              value={form.representative}
              onChange={(e) => setForm((f) => ({ ...f, representative: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                placeholder="mail@empresa.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Teléfono</Label>
              <Input
                placeholder="+54 11..."
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !form.cuit.trim() || !form.company_name.trim()}
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Crear cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Client selector combobox ─────────────────────────────────────────────────
function ClientSelector({
  clients,
  selected,
  onSelect,
  onCreateNew,
}: {
  clients: Client[];
  selected: Client | null;
  onSelect: (client: Client | null) => void;
  onCreateNew: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selected ? selected.companyName : "Buscar cliente..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por empresa o CUIT..." className="h-9" />
          <CommandList>
            <CommandEmpty>
              <div className="py-3 px-2 text-center space-y-2">
                <p className="text-sm text-muted-foreground">No se encontró el cliente.</p>
                <Button size="sm" variant="outline" className="w-full" onClick={() => { setOpen(false); onCreateNew(); }}>
                  <UserPlus className="w-3.5 h-3.5 mr-2" />
                  Crear nuevo cliente
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`${client.companyName} ${client.cuit}`}
                  onSelect={() => {
                    onSelect(selected?.id === client.id ? null : client);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      selected?.id === client.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{client.companyName}</p>
                    <p className="text-xs text-muted-foreground">{client.cuit}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <div className="border-t p-1">
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start text-muted-foreground"
                onClick={() => { setOpen(false); onCreateNew(); }}
              >
                <UserPlus className="w-3.5 h-3.5 mr-2" />
                Crear nuevo cliente
              </Button>
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── Resumen card ─────────────────────────────────────────────────────────────
function parsePriceInput(value: string): number {
  const cleaned = value.replace(/\./g, "").replace(/,/g, ".");
  return parseFloat(cleaned) || 0;
}

function ResumenCard({
  quoteItems,
  subtotal,
  finalTotal,
  finalTotalUSD,
  exchangeRate,
  currency,
  generating,
  savingDraft,
  selectedClient,
  savedQuote,
  onGeneratePDF,
  onSaveDraft,
  onUpdateFinalTotal,
}: {
  quoteItems: QuoteItemState[];
  subtotal: number;
  finalTotal: number;
  finalTotalUSD: number;
  exchangeRate: ExchangeRate | null;
  currency: 'ARS' | 'USD';
  generating: boolean;
  savingDraft: boolean;
  selectedClient: Client | null;
  savedQuote: { id: string; number: string } | null;
  onGeneratePDF: () => void;
  onSaveDraft: () => void;
  onUpdateFinalTotal: (value: number) => void;
}) {
  const hasAdjustment = finalTotal !== subtotal;
  const [totalInput, setTotalInput] = useState(
    finalTotal === 0 ? "" : finalTotal.toString().replace(".", ","),
  );
  const [totalUSDInput, setTotalUSDInput] = useState(
    finalTotalUSD === 0 ? "" : finalTotalUSD.toFixed(2).replace(".", ","),
  );

  const iva = finalTotal * 0.21;
  const totalConIva = finalTotal * 1.21;
  const ivaUSD = finalTotalUSD * 0.21;
  const totalConIvaUSD = finalTotalUSD * 1.21;

  useEffect(() => {
    setTotalInput(finalTotal === 0 ? "" : finalTotal.toString().replace(".", ","));
  }, [finalTotal]);

  useEffect(() => {
    setTotalUSDInput(
      finalTotalUSD === 0 ? "" : finalTotalUSD.toFixed(2).replace(".", ","),
    );
  }, [finalTotalUSD]);

  const fmtARS = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(n);

  const fmtUSD = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(n);

  return (
    <Card>
      <CardContent className="space-y-4">
        {exchangeRate && currency === 'USD' && (
          <div className="flex justify-end">
            <Badge
              variant="outline"
              className="text-xs px-2 py-1 border-none bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            >
              Dólar BNA: {formatExchangeRate(exchangeRate)}
            </Badge>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Ítems seleccionados</span>
          <span className="font-semibold">{quoteItems.length}</span>
        </div>
        <div className="flex justify-between items-center border-t pt-3">
          <span className="text-sm text-muted-foreground">Subtotal calculado</span>
          <span className="text-sm font-medium tabular-nums">{fmtARS(subtotal)}</span>
        </div>
        {hasAdjustment && (
          <p className="text-xs text-muted-foreground text-right">
            Diferencia: {fmtARS(finalTotal - subtotal)}
          </p>
        )}

        {/* Inputs editables: subtotal sin IVA */}
        <div className="space-y-2 border-t pt-3">
          <div className="flex justify-between items-center gap-3">
            <span className="font-semibold whitespace-nowrap text-sm">Subtotal sin IVA</span>
            <div className="flex items-center gap-2">
              <PriceInput
                className={`w-32 text-right text-sm font-bold tabular-nums border rounded px-2 py-1 ${
                  hasAdjustment ? "border-primary bg-primary/5" : ""
                }`}
                value={totalInput}
                onChange={(val) => setTotalInput(val)}
                onBlur={() => {
                  const parsed = parsePriceInput(totalInput);
                  setTotalInput(parsed === 0 ? "" : parsed.toFixed(2).replace(".", ","));
                  onUpdateFinalTotal(parsed);
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
              />
            </div>
          </div>
          {currency === 'USD' && (
            <div className="flex justify-between items-center gap-3">
              <span className="font-semibold text-muted-foreground whitespace-nowrap text-sm">Subtotal sin IVA (USD)</span>
              <div className="flex items-center gap-2">
                <PriceInput
                  className={`w-32 text-right text-sm font-bold tabular-nums border rounded px-2 py-1 text-blue-700 dark:text-blue-300 ${
                    hasAdjustment ? "border-primary bg-primary/5" : ""
                  }`}
                  value={totalUSDInput}
                  onChange={(val) => setTotalUSDInput(val)}
                  onBlur={() => {
                    const parsedUSD = parsePriceInput(totalUSDInput);
                    const formatted = parsedUSD.toFixed(2).replace(".", ",");
                    setTotalUSDInput(formatted);
                    if (exchangeRate && exchangeRate.venta > 0) {
                      onUpdateFinalTotal(parsedUSD * exchangeRate.venta);
                    }
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Desglose IVA */}
        <div className="space-y-2 border-t pt-3">
          <div className="flex justify-between items-center gap-3">
            <span className="text-sm text-muted-foreground">IVA 21%</span>
            <span className="text-sm font-medium tabular-nums">{fmtARS(iva)}</span>
          </div>
          {currency === 'USD' && (
            <div className="flex justify-between items-center gap-3">
              <span className="text-sm text-muted-foreground">IVA 21% (USD)</span>
              <span className="text-sm font-medium tabular-nums text-blue-700 dark:text-blue-300">{fmtUSD(ivaUSD)}</span>
            </div>
          )}
        </div>

        {/* Total con IVA */}
        <div className="flex justify-between items-center gap-3 bg-muted/40 rounded-lg px-3 py-2">
          <span className="font-bold whitespace-nowrap text-sm">Total con IVA</span>
          <span className="text-base font-bold tabular-nums">{fmtARS(totalConIva)}</span>
        </div>
        {currency === 'USD' && (
          <div className="flex justify-between items-center gap-3 bg-muted/40 rounded-lg px-3 py-2">
            <span className="font-bold whitespace-nowrap text-sm text-blue-700 dark:text-blue-300">Total con IVA (USD)</span>
            <span className="text-base font-bold tabular-nums text-blue-700 dark:text-blue-300">{fmtUSD(totalConIvaUSD)}</span>
          </div>
        )}

        <Button
          className="w-full cursor-pointer"
          onClick={onSaveDraft}
          disabled={savingDraft || generating || !selectedClient || quoteItems.length === 0}
        >
          <Save className="w-4 h-4 mr-2" />
          {savingDraft ? "Guardando..." : "Guardar borrador"}
        </Button>

        <Button
          className="w-full cursor-pointer"
          variant="secondary"
          onClick={onGeneratePDF}
          disabled={generating || !savedQuote || quoteItems.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          {generating ? "Generando PDF..." : "Generar PDF"}
        </Button>
        {savedQuote && (
          <div className="rounded-lg border bg-muted/40 px-3 py-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Guardada como</span>
              <Badge variant="secondary">{savedQuote.number}</Badge>
            </div>
            <Link
              href="/quoter/history"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <History className="w-3 h-3" />
              Ver historial de cotizaciones
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Ajusta los ítems para el PDF distribuyendo la diferencia entre
 * el subtotal calculado y el finalTotal al ítem de mayor valor.
 * Solo aplica cuando finalTotal es mayor que subtotal (aumento).
 * En caso de descuento los ítems se mantienen sin modificación
 * y el descuento se muestra como línea separada en el PDF.
 */
function getPDFItems(
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
    adicionales: item.adicionales,
  }));

  if (diff <= 0 || items.length === 0) return mapped;

  // Encontrar ítem con mayor valor total (unitPrice * quantity)
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

// ── Main page ────────────────────────────────────────────────────────────────
export default function CotizadorPage() {
  const { modules, loading: modulesLoading } = useStandardModules(true);
  const { clients } = useClientsPrisma();
  const { toast } = useToast();
  const { userProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [quoteType, setQuoteType] = useState<'sale' | 'rental'>('sale');
  const [freeNotes, setFreeNotes] = useState<FreeNote[]>([]);
  const [paymentNote, setPaymentNote] = useState<GroupNote>(createPaymentNote());
  const [deliveryNote, setDeliveryNote] = useState<GroupNote>(createDeliveryNote());
  const [additionalServicesNote, setAdditionalServicesNote] = useState<GroupNote>(createAdditionalServicesNote());
  const [quoteItems, setQuoteItems] = useState<QuoteItemState[]>([]);
  const [generating, setGenerating] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savedQuote, setSavedQuote] = useState<{ id: string; number: string } | null>(null);
  const [sourcePdfUrl, setSourcePdfUrl] = useState<string | null>(null);
  const [adicionales, setAdicionales] = useState<{ id: string; name: string; unit_price: number }[]>([]);
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [loadingSource, setLoadingSource] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);
  const [finalTotal, setFinalTotal] = useState(0);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [quoteCurrency, setQuoteCurrency] = useState<'ARS' | 'USD'>('USD');

  // Fecha de vencimiento por defecto: hoy + 30 días
  const getDefaultValidUntil = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };
  const [validUntilDate, setValidUntilDate] = useState<string>(getDefaultValidUntil());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [quoteHeaderExpanded, setQuoteHeaderExpanded] = useState(true);

  useEffect(() => {
    if (!authLoading && !userProfile) {
      router.push("/login");
      return;
    }
    if (!authLoading && userProfile && !ALLOWED_ROLES.includes(userProfile.role)) {
      router.push("/projects");
    }
  }, [authLoading, userProfile, router]);

  useEffect(() => {
    fetch("/api/cotizador/adicionales")
      .then((r) => r.json())
      .then((d) => setAdicionales(d.adicionales ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setServicesLoading(true);
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setServices(d.services ?? []))
      .catch(() => {})
      .finally(() => setServicesLoading(false));
  }, []);

  // ── Duplicar / Editar cotización ───────────────────────────────────────────
  useEffect(() => {
    const duplicateId = searchParams.get("duplicate");
    const editId = searchParams.get("edit");
    const sourceId = duplicateId || editId;
    const isEdit = !!editId;

    if (!sourceId || !clients || clients.length === 0) return;

    setLoadingSource(true);
    fetch(`/api/quotes/${sourceId}`)
      .then((r) => r.json())
      .then((data) => {
        const quote = data.quote;
        if (!quote) {
          toast({ title: "Cotización no encontrada", variant: "destructive" });
          return;
        }

        // Precargar cliente
        const client = clients.find((c: Client) => c.id === quote.client_id);
        if (client) setSelectedClient(client);

        // Precargar tipo de cotización
        setQuoteType(quote.quote_type === 'rental' ? 'rental' : 'sale');
        setQuoteCurrency(quote.currency === 'ARS' ? 'ARS' : 'USD');

        // Precargar notas (nuevo formato tipado, o fallback a texto plano)
        const migrated = migrateNotesList(
          quote.notes_list && Array.isArray(quote.notes_list) && quote.notes_list.length > 0
            ? quote.notes_list
            : quote.notes
            ? [quote.notes]
            : []
        );
        setFreeNotes(migrated.filter((n) => n.type === 'free') as FreeNote[]);
        const existingPayment = migrated.find(
          (n) => n.type === 'group' && n.title === 'Forma de Pago'
        ) as GroupNote | undefined;
        setPaymentNote(existingPayment ?? createPaymentNote());
        const existingDelivery = migrated.find(
          (n) => n.type === 'group' && n.title === 'Lugar de entrega'
        ) as GroupNote | undefined;
        setDeliveryNote(existingDelivery ?? createDeliveryNote());
        const existingAdditionalServices = migrated.find(
          (n) => n.type === 'group' && n.title === 'Servicios adicionales'
        ) as GroupNote | undefined;
        setAdditionalServicesNote(existingAdditionalServices ?? createAdditionalServicesNote());

        // Precargar fecha de vencimiento
        if (quote.valid_until) {
          setValidUntilDate(quote.valid_until.split('T')[0]);
        } else {
          setValidUntilDate(getDefaultValidUntil());
        }

        // Precargar items
        const items: QuoteItemState[] = (quote.items ?? []).map((item: any) => ({
          key: `${item.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: item.type,
          standardModuleId: item.standard_module_id ?? undefined,
          name: item.name,
          description: item.description ?? undefined,
          moduleDescriptionSections: item.module_description ?? undefined,
          unitPrice: item.unit_price,
          quantity: item.quantity,
          adicionales: (item.additionals ?? []).map((ad: any) => ({
            id: ad.material_id ?? ad.id,
            name: ad.name,
            price: ad.unit_price,
          })),
          attachments: item.attachments ?? [],
        }));
        setQuoteItems(items);

        // Precargar total (si existe en la cotización original)
        setFinalTotal(quote.total ?? quote.subtotal ?? 0);

        if (isEdit) {
          setEditingQuoteId(sourceId);
          setSavedQuote({ id: sourceId, number: quote.number });
          setSourcePdfUrl(quote.pdf_url ?? null);
          // No mostrar toast al cargar para editar; el badge del header ya lo indica
        } else {
          setEditingQuoteId(null);
          setSavedQuote(null);
          setSourcePdfUrl(null);
          toast({ title: `Cotización ${quote.number} duplicada` });
        }
      })
      .catch(() => {
        toast({ title: "Error al cargar cotización", variant: "destructive" });
      })
      .finally(() => setLoadingSource(false));
  }, [searchParams, clients, toast]);

  const subtotal = quoteItems.reduce((acc, item) => {
    const itemTotal = item.unitPrice * item.quantity;
    const adicionalesTotal = item.adicionales.reduce((a, ad) => a + ad.price, 0);
    return acc + itemTotal + adicionalesTotal;
  }, 0);

  useEffect(() => {
    setFinalTotal(subtotal);
  }, [subtotal]);

  useEffect(() => {
    getExchangeRate().then(setExchangeRate).catch(() => {});
  }, []);

  // Atajo Ctrl+S / Cmd+S para guardar borrador
  const handleSaveDraftRef = useRef(handleSaveDraft);
  handleSaveDraftRef.current = handleSaveDraft;
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraftRef.current();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!ALLOWED_ROLES.includes(userProfile.role)) return null;

  // ── Actions ───────────────────────────────────────────────────────────────

  function addStandardModule(mod: StandardModule) {
    const key = `${mod.id}-${Date.now()}`;
    setQuoteItems((prev) => [
      ...prev,
      {
        key,
        type: "standard_module",
        standardModuleId: mod.id,
        name: mod.name,
        description: mod.description ?? undefined,
        moduleDescriptionSections: mod.module_description ?? undefined,
        unitPrice: mod.base_price,
        quantity: 1,
        adicionales: [],
      },
    ]);
  }

  function addCustomModule(item: { name: string; description: string; moduleDescriptionSections?: Array<{ section: string; description: string }>; unitPrice: number; quantity: number; attachments?: { filename: string; original_name: string; mime_type: string; size: number; url: string; storage_path: string }[] }) {
    const key = `custom-${Date.now()}`;
    setQuoteItems((prev) => [
      ...prev,
      {
        key,
        type: "custom_module",
        name: item.name,
        description: item.description || undefined,
        moduleDescriptionSections: item.moduleDescriptionSections ?? undefined,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        adicionales: [],
        attachments: item.attachments ?? [],
      },
    ]);
  }

  function addService(svc: ServiceCatalogItem) {
    const key = `svc-${svc.id}-${Date.now()}`;
    setQuoteItems((prev) => [
      ...prev,
      {
        key,
        type: "service",
        name: svc.name,
        description: svc.description || undefined,
        unitPrice: svc.unit_price,
        quantity: 1,
        adicionales: [],
      },
    ]);
  }

  function addCustomService(item: { name: string; description: string; unitPrice: number; quantity: number; unit: string }) {
    const key = `svc-custom-${Date.now()}`;
    setQuoteItems((prev) => [
      ...prev,
      {
        key,
        type: "service",
        name: item.name,
        description: item.description || undefined,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        adicionales: [],
      },
    ]);
  }

  function removeItem(key: string) {
    setQuoteItems((prev) => prev.filter((m) => m.key !== key));
  }

  function updateQuantity(key: string, quantity: number) {
    setQuoteItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, quantity } : item))
    );
  }

  function updatePrice(key: string, unitPrice: number) {
    setQuoteItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, unitPrice } : item))
    );
  }

  function handleAddAttachment(key: string, attachment: { filename: string; original_name: string; mime_type: string; size: number; url: string; storage_path: string }) {
    setQuoteItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, attachments: [...(item.attachments ?? []), attachment] }
          : item
      )
    );
  }

  function handleRemoveAttachment(key: string, storagePath: string) {
    setQuoteItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, attachments: (item.attachments ?? []).filter((a) => a.storage_path !== storagePath) }
          : item
      )
    );
  }

  const editingItem = editingItemKey
    ? quoteItems.find((i) => i.key === editingItemKey)
    : null;

  function handleStartEdit(key: string) {
    setEditingItemKey(key);
  }

  function handleSaveEdit(updates: {
    key: string;
    name: string;
    description: string;
    moduleDescriptionSections: ModuleDescriptionSection[];
    unitPrice: number;
    quantity: number;
    attachments: { filename: string; original_name: string; mime_type: string; size: number; url: string; storage_path: string }[];
  }) {
    setQuoteItems((prev) =>
      prev.map((item) =>
        item.key === updates.key
          ? {
              ...item,
              name: updates.name,
              description: updates.description || undefined,
              moduleDescriptionSections:
                updates.moduleDescriptionSections.length > 0
                  ? updates.moduleDescriptionSections
                  : undefined,
              unitPrice: updates.unitPrice,
              quantity: updates.quantity,
              attachments: updates.attachments,
            }
          : item
      )
    );
    setEditingItemKey(null);
    toast({ title: "Módulo personalizado actualizado" });
  }

  function handleCancelEdit() {
    setEditingItemKey(null);
  }

  function toggleAdicional(
    itemKey: string,
    adicional: { id: string; name: string; unit_price: number }
  ) {
    setQuoteItems((prev) =>
      prev.map((item) => {
        if (item.key !== itemKey) return item;
        const exists = item.adicionales.find((a) => a.id === adicional.id);
        return {
          ...item,
          adicionales: exists
            ? item.adicionales.filter((a) => a.id !== adicional.id)
            : [...item.adicionales, { id: adicional.id, name: adicional.name, price: adicional.unit_price }],
        };
      })
    );
  }

  // ── Save draft ────────────────────────────────────────────────────────────
  async function handleSaveDraft() {
    if (!selectedClient) {
      toast({ title: "Seleccioná un cliente", variant: "destructive" });
      return;
    }
    if (quoteItems.length === 0) {
      toast({ title: "Seleccioná al menos un ítem", variant: "destructive" });
      return;
    }

    setSavingDraft(true);
    try {
      const quoteData = {
        client_id: selectedClient.id,
        client_name: selectedClient.companyName,
        client_company: selectedClient.companyName,
        client_phone: selectedClient.phone,
        client_email: selectedClient.email,
        quote_type: quoteType,
        currency: quoteCurrency,
        notes_list: [
          ...freeNotes,
          ...(groupHasCheckedItems(paymentNote) ? [paymentNote] : []),
          ...(groupHasCheckedItems(deliveryNote) ? [deliveryNote] : []),
          ...(groupHasCheckedItems(additionalServicesNote) ? [additionalServicesNote] : []),
        ],
        subtotal,
        total: finalTotal,
        valid_until: validUntilDate,
        created_by: userProfile.id,
        items: quoteItems.map((item, i) => ({
          type: item.type,
          standard_module_id: item.standardModuleId,
          name: item.name,
          description: item.description,
          unit_price: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.unitPrice * item.quantity + item.adicionales.reduce((a, ad) => a + ad.price, 0),
          sort_order: i,
          module_description: item.moduleDescriptionSections ?? null,
          additionals: item.adicionales.map((ad) => ({
            material_id: ad.id,
            name: ad.name,
            unit_price: ad.price,
            quantity: 1,
            subtotal: ad.price,
          })),
          attachments: item.attachments ?? [],
        })),
      };

      const res = await fetch("/api/quotes/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteData, existingQuoteId: editingQuoteId ?? undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al guardar el borrador");
      }

      const { quoteId, quoteNumber } = await res.json();
      setSavedQuote({ id: quoteId, number: quoteNumber });
      setEditingQuoteId(quoteId);
      toast({ title: `Borrador ${quoteNumber} guardado` });

      // Actualizar URL para que al refrescar se siga editando el mismo borrador
      if (!editingQuoteId) {
        router.replace(`/quoter?edit=${quoteId}`);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al guardar el borrador",
        variant: "destructive",
      });
    } finally {
      setSavingDraft(false);
    }
  }

  // ── PDF generation ────────────────────────────────────────────────────────
  async function handleGeneratePDF() {
    if (!selectedClient) {
      toast({ title: "Seleccioná un cliente", variant: "destructive" });
      return;
    }
    if (quoteItems.length === 0) {
      toast({ title: "Seleccioná al menos un ítem", variant: "destructive" });
      return;
    }
    if (!savedQuote) {
      toast({ title: "Guardá el borrador primero", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      const now = new Date();
      const date = now.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const validUntilObj = new Date(validUntilDate + 'T00:00:00');
      const validUntil = validUntilObj.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const standardModuleIds = [
        ...new Set(
          quoteItems
            .filter((i) => i.type === "standard_module" && i.standardModuleId)
            .map((i) => i.standardModuleId!)
        ),
      ];

      const quoteData = {
        client_id: selectedClient.id,
        client_name: selectedClient.companyName,
        client_company: selectedClient.companyName,
        client_phone: selectedClient.phone,
        client_email: selectedClient.email,
        quote_type: quoteType,
        currency: quoteCurrency,
        notes_list: [
          ...freeNotes,
          ...(groupHasCheckedItems(paymentNote) ? [paymentNote] : []),
          ...(groupHasCheckedItems(deliveryNote) ? [deliveryNote] : []),
          ...(groupHasCheckedItems(additionalServicesNote) ? [additionalServicesNote] : []),
        ],
        subtotal,
        total: finalTotal,
        valid_until: validUntilDate,
        created_by: userProfile.id,
        items: quoteItems.map((item, i) => ({
          type: item.type,
          standard_module_id: item.standardModuleId,
          name: item.name,
          description: item.description,
          unit_price: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.unitPrice * item.quantity + item.adicionales.reduce((a, ad) => a + ad.price, 0),
          sort_order: i,
          module_description: item.moduleDescriptionSections ?? null,
          additionals: item.adicionales.map((ad) => ({
            material_id: ad.id,
            name: ad.name,
            unit_price: ad.price,
            quantity: 1,
            subtotal: ad.price,
          })),
          attachments: item.attachments ?? [],
        })),
      };

      const quoteId = savedQuote.id;
      const quoteNumber = savedQuote.number;

      // ── Paso 1: generar el PDF con el número ──
      const { pdf } = await import("@react-pdf/renderer");
      const { CotizadorPDFDocument } = await import("@/components/cotizador/CotizadorPDFDocument");

      const pdfBlob = await pdf(
        <CotizadorPDFDocument
          quoteNumber={quoteNumber}
          notesList={[
            ...freeNotes,
            ...(groupHasCheckedItems(paymentNote) ? [paymentNote] : []),
            ...(groupHasCheckedItems(deliveryNote) ? [deliveryNote] : []),
            ...(groupHasCheckedItems(additionalServicesNote) ? [additionalServicesNote] : []),
          ]}
          quoteType={quoteType}
          items={getPDFItems(quoteItems, subtotal, finalTotal)}
          date={date}
          validUntil={validUntil}
          generatorName={userProfile.name ?? userProfile.email ?? undefined}
          finalTotal={finalTotal}
          discount={subtotal > finalTotal ? subtotal - finalTotal : undefined}
          client={
            selectedClient
              ? {
                  name: selectedClient.companyName,
                  cuit: selectedClient.cuit || undefined,
                  contact: selectedClient.representative || undefined,
                  email: selectedClient.email || undefined,
                  phone: selectedClient.phone || undefined,
                }
              : undefined
          }
          exchangeRate={exchangeRate ?? undefined}
          currency={quoteCurrency}
        />
      ).toBlob();

      // ── Paso 3: subir el PDF final ──
      const uploadFormData = new FormData();
      uploadFormData.append("pdf", pdfBlob, "cotizacion.pdf");
      uploadFormData.append("moduleIds", JSON.stringify(standardModuleIds));
      uploadFormData.append("quoteData", JSON.stringify(quoteData));
      uploadFormData.append("existingQuoteId", quoteId);

      const res = await fetch("/api/cotizador/generate-pdf", {
        method: "POST",
        body: uploadFormData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al generar PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const clientSlug = selectedClient.companyName
        .replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 30);
      a.download = `${quoteNumber ?? "Cotizacion"}_${clientSlug}_${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setSourcePdfUrl('generated');
      toast({ title: `PDF de ${quoteNumber} generado correctamente` });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al generar PDF",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="p-4 sm:p-6 mx-auto space-y-4 sm:space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Cotizador</h1>
            {loadingSource && (
              <Badge variant="secondary" className="text-xs">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Cargando cotización...
              </Badge>
            )}
            {searchParams.get("duplicate") && !loadingSource && quoteItems.length > 0 && (
              <Badge variant="outline" className="text-xs">
                Cotización duplicada
              </Badge>
            )}
            {savedQuote && !loadingSource && (
              <Badge variant="default" className="text-xs">
                Borrador {savedQuote.number}
                {sourcePdfUrl && <span className="opacity-75 ml-1">· PDF listo</span>}
              </Badge>
            )}
            {editingQuoteId && !savedQuote && !loadingSource && (
              <Badge variant="default" className="text-xs">
                Editando borrador
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Generá un presupuesto seleccionando módulos estándar, personalizados o servicios.
          </p>
        </div>

        {/* ── Fila 1: Datos de la cotización ─────────────────────────────── */}
        <Card className="sm:gap-3">
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setQuoteHeaderExpanded((v) => !v)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Datos de la cotización</CardTitle>
              <div className="flex items-center gap-2">
                {selectedClient && !quoteHeaderExpanded && (
                  <span className="text-xs text-muted-foreground truncate max-w-[160px] sm:max-w-[240px]">
                    {selectedClient.companyName}
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                    quoteHeaderExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>
          </CardHeader>
          <div
            className={`grid transition-all duration-300 ease-in-out ${
              quoteHeaderExpanded
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <CardContent className="space-y-4">
                {/* Tipo de cotización + Moneda */}
                <div className="flex items-center gap-3 sm:flex-wrap">
                  <Label className="text-xs shrink-0 max-sm:hidden">Tipo</Label>
                  <div className="flex rounded-md border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuoteType('sale')}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        quoteType === 'sale'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      Venta
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuoteType('rental')}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors border-l ${
                        quoteType === 'rental'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      Alquiler
                    </button>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <Label className="text-xs shrink-0 max-sm:hidden">Moneda</Label>
                    <div className="flex rounded-md border overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQuoteCurrency('USD')}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          quoteCurrency === 'USD'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        USD
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuoteCurrency('ARS')}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors border-l ${
                          quoteCurrency === 'ARS'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        ARS
                      </button>
                    </div>
                  </div>
                </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cliente */}
              <div className="space-y-3">
                <Label className="text-xs">Cliente</Label>
                <ClientSelector
                  clients={clients ?? []}
                  selected={selectedClient}
                  onSelect={setSelectedClient}
                  onCreateNew={() => setCreateClientOpen(true)}
                />
                {selectedClient && (
                  <div className="rounded-md bg-muted/40 px-3 py-2 text-sm space-y-0.5">
                    {selectedClient.representative && (
                      <p className="text-muted-foreground text-xs">
                        Contacto: {selectedClient.representative}
                      </p>
                    )}
                    {selectedClient.email && (
                      <p className="text-muted-foreground text-xs">{selectedClient.email}</p>
                    )}
                    {selectedClient.phone && (
                      <p className="text-muted-foreground text-xs">{selectedClient.phone}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Fecha de validez */}
              <div className="space-y-3">
                <Label className="text-xs">Válida hasta</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal text-sm",
                        !validUntilDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {validUntilDate
                        ? new Date(validUntilDate + 'T00:00:00').toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })
                        : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={validUntilDate ? new Date(validUntilDate + 'T00:00:00') : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setValidUntilDate(date.toISOString().split('T')[0]);
                          setCalendarOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Notas */}
            <div className="pt-4 border-t space-y-3">
              <Label className="text-xs">Notas para el PDF</Label>

              {/* Notas libres */}
              <div className="space-y-2">
                {/* Nota fija: precio de venta / dólar (solo si cotiza en USD) */}
                {exchangeRate && quoteCurrency === 'USD' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">1.</span>
                    <input
                      type="text"
                      value={`Precio de venta: Se cotiza en dólar oficial BNA vendedor del dia de la fecha de la facturación.`}
                      disabled
                      className="flex-1 text-xs border rounded px-2 py-1 bg-muted/50 text-muted-foreground"
                    />
                    <div className="h-6 w-6 shrink-0" /> {/* spacer para alinear */}
                  </div>
                )}
                {freeNotes.map((note, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">{i + 2}.</span>
                    <input
                      type="text"
                      value={note.content}
                      onChange={(e) => {
                        const updated = [...freeNotes];
                        updated[i] = { ...note, content: e.target.value };
                        setFreeNotes(updated);
                      }}
                      className="flex-1 text-xs border rounded px-2 py-1"
                      placeholder="Nota..."
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => setFreeNotes((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setFreeNotes((prev) => [...prev, { type: 'free', content: '' }])}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar nota
                </Button>
              </div>

              {/* Forma de pago + Lugar de entrega + Servicios adicionales — 3 cols en desktop */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Forma de pago */}
                <div className="rounded border bg-muted/30 p-3 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    {paymentNote.title}
                  </span>
                  <div className="space-y-1.5 pl-1">
                    {paymentNote.items.map((item, idx) => (
                      <label
                        key={idx}
                        className="flex items-start gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={(checked) => {
                            setPaymentNote((prev) => ({
                              ...prev,
                              items: prev.items.map((it, j) =>
                                j === idx ? { ...it, checked: checked === true } : it
                              ),
                            }));
                          }}
                          className="mt-0.5"
                        />
                        <span className="text-xs text-muted-foreground leading-tight">
                          {item.label}) {item.content}
                          {item.link && (
                            <a
                              href={item.link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline ml-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {item.link.text}
                            </a>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Lugar de entrega */}
                <div className="rounded border bg-muted/30 p-3 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    {deliveryNote.title}
                  </span>
                  <div className="space-y-1.5 pl-1">
                    {deliveryNote.items.map((item, idx) => (
                      <label
                        key={idx}
                        className="flex items-start gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={(checked) => {
                            setDeliveryNote((prev) => ({
                              ...prev,
                              items: prev.items.map((it, j) =>
                                j === idx
                                  ? { ...it, checked: checked === true }
                                  : { ...it, checked: false }
                              ),
                            }));
                          }}
                          className="mt-0.5"
                        />
                        <span className="text-xs text-muted-foreground leading-tight">
                          {item.label}) {item.content}
                          {item.link && (
                            <a
                              href={item.link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline ml-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {item.link.text}
                            </a>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Servicios adicionales */}
                <div className="rounded border bg-muted/30 p-3 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    {additionalServicesNote.title}
                  </span>
                  <div className="space-y-1.5 pl-1">
                    {additionalServicesNote.items.map((item, idx) => (
                      <label
                        key={idx}
                        className="flex items-start gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={(checked) => {
                            setAdditionalServicesNote((prev) => ({
                              ...prev,
                              items: prev.items.map((it, j) =>
                                j === idx ? { ...it, checked: checked === true } : it
                              ),
                            }));
                          }}
                          className="mt-0.5"
                        />
                        <span className="text-xs text-muted-foreground leading-tight">
                          {item.label}) {item.content}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
            </div>
          </div>
        </Card>

        {/* ── Fila 2: Builder (Catálogo + Cotización) ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Izquierda: Catálogo o Editor (3/5 = 60%) */}
          <div className="lg:col-span-3 space-y-4">
            {editingItem ? (
              <CustomModuleEditor
                item={editingItem}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
              />
            ) : (
              <Tabs defaultValue="standard" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="standard">Estándar</TabsTrigger>
                  <TabsTrigger value="custom">Personalizados</TabsTrigger>
                  <TabsTrigger value="services">Servicios</TabsTrigger>
                </TabsList>
                <TabsContent value="standard" className="mt-4">
                  <StandardModulesTab
                    modules={modules}
                    loading={modulesLoading}
                    onAddModule={addStandardModule}
                  />
                </TabsContent>
                <TabsContent value="custom" className="mt-4">
                  <CustomModuleForm onAdd={addCustomModule} />
                </TabsContent>
                <TabsContent value="services" className="mt-4">
                  <ServicesTab
                    services={services}
                    loading={servicesLoading}
                    onAddService={addService}
                    onAddCustomService={addCustomService}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* Derecha: Cotización armada + Resumen (2/5 = 40%) */}
          <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Cotización
              </h2>
              {quoteItems.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {quoteItems.length} ítem{quoteItems.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            {quoteItems.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Agregá ítems desde las pestañas.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {quoteItems.map((item) => (
                  <QuoteItemCard
                    key={item.key}
                    item={item}
                    adicionalesDisponibles={adicionales}
                    onRemove={removeItem}
                    onUpdateQuantity={updateQuantity}
                    onUpdatePrice={updatePrice}
                    onToggleAdicional={toggleAdicional}
                    onAddAttachment={handleAddAttachment}
                    onRemoveAttachment={handleRemoveAttachment}
                    onStartEdit={handleStartEdit}
                  />
                ))}
              </div>
            )}

            <ResumenCard
              quoteItems={quoteItems}
              subtotal={subtotal}
              finalTotal={finalTotal}
              finalTotalUSD={exchangeRate && exchangeRate.venta > 0 ? finalTotal / exchangeRate.venta : 0}
              exchangeRate={exchangeRate}
              currency={quoteCurrency}
              generating={generating}
              savingDraft={savingDraft}
              selectedClient={selectedClient}
              savedQuote={savedQuote}
              onGeneratePDF={handleGeneratePDF}
              onSaveDraft={handleSaveDraft}
              onUpdateFinalTotal={setFinalTotal}
            />
          </div>
        </div>
      </div>

      <QuickCreateClientDialog
        open={createClientOpen}
        onClose={() => setCreateClientOpen(false)}
        onCreate={(client) => setSelectedClient(client)}
      />
    </MainLayout>
  );
}

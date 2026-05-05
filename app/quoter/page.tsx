"use client";

import { useState, useEffect } from "react";
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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { ServicesTab, ServiceCatalogItem } from "@/components/cotizador/ServicesTab";
import { QuoteItemCard, QuoteItemState } from "@/components/cotizador/QuoteItemCard";

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
function formatARSInput(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value);
}

function parseARSInput(value: string): number {
  const cleaned = value
    .replace(/[^0-9,]/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  return Number(cleaned) || 0;
}

function formatUSDInput(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseUSDInput(value: string): number {
  const cleaned = value
    .replace(/[^0-9,]/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  return Number(cleaned) || 0;
}

function ResumenCard({
  quoteItems,
  subtotal,
  finalTotal,
  finalTotalUSD,
  exchangeRate,
  generating,
  selectedClient,
  savedQuote,
  onGeneratePDF,
  onUpdateFinalTotal,
}: {
  quoteItems: QuoteItemState[];
  subtotal: number;
  finalTotal: number;
  finalTotalUSD: number;
  exchangeRate: ExchangeRate | null;
  generating: boolean;
  selectedClient: Client | null;
  savedQuote: { id: string; number: string } | null;
  onGeneratePDF: () => void;
  onUpdateFinalTotal: (value: number) => void;
}) {
  const hasAdjustment = finalTotal !== subtotal;
  const [totalInput, setTotalInput] = useState(formatARSInput(finalTotal));
  const [totalUSDInput, setTotalUSDInput] = useState(formatUSDInput(finalTotalUSD));

  useEffect(() => {
    setTotalInput(formatARSInput(finalTotal));
  }, [finalTotal]);

  useEffect(() => {
    setTotalUSDInput(formatUSDInput(finalTotalUSD));
  }, [finalTotalUSD]);

  return (
    <Card>
      <CardContent className="space-y-4">
        {exchangeRate && (
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
          <span className="text-sm font-medium tabular-nums">
            {new Intl.NumberFormat("es-AR", {
              style: "currency",
              currency: "ARS",
              minimumFractionDigits: 0,
            }).format(subtotal)}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-3">
            <span className="font-semibold whitespace-nowrap text-sm">Total final</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value)}
                onBlur={(e) => {
                  const parsed = parseARSInput(e.target.value);
                  setTotalInput(formatARSInput(parsed));
                  onUpdateFinalTotal(parsed);
                }}
                className={`w-36 text-right text-base font-bold tabular-nums border rounded px-2 py-1 ${
                  hasAdjustment ? "border-primary bg-primary/5" : ""
                }`}
              />
            </div>
          </div>
          <div className="flex justify-between items-center gap-3">
            <span className="font-semibold text-muted-foreground whitespace-nowrap text-sm">Total final (USD)</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={totalUSDInput}
                onChange={(e) => setTotalUSDInput(e.target.value)}
                onBlur={(e) => {
                  const parsedUSD = parseUSDInput(e.target.value);
                  setTotalUSDInput(formatUSDInput(parsedUSD));
                  if (exchangeRate && exchangeRate.venta > 0) {
                    onUpdateFinalTotal(parsedUSD * exchangeRate.venta);
                  }
                }}
                className={`w-36 text-right text-base font-bold tabular-nums border rounded px-2 py-1 text-blue-700 dark:text-blue-300 ${
                  hasAdjustment ? "border-primary bg-primary/5" : ""
                }`}
              />
            </div>
          </div>
        </div>
        {hasAdjustment && (
          <p className="text-xs text-muted-foreground text-right">
            Ajuste: {new Intl.NumberFormat("es-AR", {
              style: "currency",
              currency: "ARS",
              signDisplay: "exceptZero",
              minimumFractionDigits: 0,
            }).format(finalTotal - subtotal)}
          </p>
        )}
        <Button
          className="w-full cursor-pointer"
          onClick={onGeneratePDF}
          disabled={generating || !selectedClient || quoteItems.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          {generating ? "Generando PDF..." : "Descargar cotización PDF"}
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
  const [notesList, setNotesList] = useState<string[]>([]);
  const [quoteItems, setQuoteItems] = useState<QuoteItemState[]>([]);
  const [generating, setGenerating] = useState(false);
  const [savedQuote, setSavedQuote] = useState<{ id: string; number: string } | null>(null);
  const [adicionales, setAdicionales] = useState<{ id: string; name: string; unit_price: number }[]>([]);
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [loadingDuplicate, setLoadingDuplicate] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [finalTotal, setFinalTotal] = useState(0);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);

  // Fecha de vencimiento por defecto: hoy + 30 días
  const getDefaultValidUntil = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };
  const [validUntilDate, setValidUntilDate] = useState<string>(getDefaultValidUntil());
  const [calendarOpen, setCalendarOpen] = useState(false);

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

    setLoadingDuplicate(true);
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

        // Precargar notas (nuevo formato lista, o fallback a texto plano)
        if (quote.notes_list && Array.isArray(quote.notes_list) && quote.notes_list.length > 0) {
          setNotesList(quote.notes_list as string[]);
        } else if (quote.notes) {
          setNotesList([quote.notes]);
        } else {
          setNotesList([]);
        }

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
          toast({ title: `Editando borrador ${quote.number}` });
        } else {
          setEditingQuoteId(null);
          setSavedQuote(null);
          toast({ title: `Cotización ${quote.number} duplicada` });
        }
      })
      .catch(() => {
        toast({ title: "Error al cargar cotización", variant: "destructive" });
      })
      .finally(() => setLoadingDuplicate(false));
  }, [searchParams, clients, toast]);

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

  function addCustomModule(item: { name: string; description: string; unitPrice: number; quantity: number; attachments?: { filename: string; original_name: string; mime_type: string; size: number; url: string; storage_path: string }[] }) {
    const key = `custom-${Date.now()}`;
    setQuoteItems((prev) => [
      ...prev,
      {
        key,
        type: "custom_module",
        name: item.name,
        description: item.description || undefined,
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

  function handleUpdateName(key: string, name: string) {
    setQuoteItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, name } : item))
    );
  }

  function handleUpdateDescription(key: string, description: string) {
    setQuoteItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, description } : item))
    );
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

    setGenerating(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { CotizadorPDFDocument } = await import("@/components/cotizador/CotizadorPDFDocument");

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

      const pdfBlob = await pdf(
        <CotizadorPDFDocument
          notesList={notesList.length > 0 ? notesList : undefined}
          items={quoteItems.map((item) => ({
            type: item.type,
            moduleId: item.standardModuleId ?? item.key,
            moduleName: item.name,
            moduleDescription: item.description,
            moduleDescriptionSections: item.moduleDescriptionSections,
            basePrice: item.unitPrice,
            quantity: item.quantity,
            adicionales: item.adicionales,
          }))}
          date={date}
          validUntil={validUntil}
          generatorName={userProfile.name ?? userProfile.email ?? undefined}
          finalTotal={finalTotal}
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
        />
      ).toBlob();

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
        notes_list: notesList.length > 0 ? notesList : undefined,
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

      const formData = new FormData();
      formData.append("pdf", pdfBlob, "cotizacion.pdf");
      formData.append("moduleIds", JSON.stringify(standardModuleIds));
      formData.append("quoteData", JSON.stringify(quoteData));
      if (editingQuoteId) {
        formData.append("existingQuoteId", editingQuoteId);
      }

      const res = await fetch("/api/cotizador/generate-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al generar PDF");
      }

      const quoteId = res.headers.get("X-Quote-Id");
      const quoteNumber = res.headers.get("X-Quote-Number");
      if (quoteId && quoteNumber) {
        setSavedQuote({ id: quoteId, number: quoteNumber });
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

      toast({ title: quoteNumber ? `Cotización ${quoteNumber} guardada` : "PDF generado correctamente" });
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
            {loadingDuplicate && (
              <Badge variant="secondary" className="text-xs">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Cargando duplicado...
              </Badge>
            )}
            {searchParams.get("duplicate") && !loadingDuplicate && quoteItems.length > 0 && (
              <Badge variant="outline" className="text-xs">
                Cotización duplicada
              </Badge>
            )}
            {editingQuoteId && !loadingDuplicate && (
              <Badge variant="default" className="text-xs">
                Editando borrador
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Generá un presupuesto seleccionando módulos estándar, personalizados o servicios.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1: cliente + resumen (solo desktop) */}
          <div className="md:space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                <div className="space-y-1">
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
                <div className="space-y-1">
                  <Label className="text-xs">Notas para el PDF</Label>
                  <div className="space-y-2">
                    {notesList.map((note, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => {
                            const updated = [...notesList];
                            updated[i] = e.target.value;
                            setNotesList(updated);
                          }}
                          className="flex-1 text-xs border rounded px-2 py-1"
                          placeholder="Nota..."
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => setNotesList((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setNotesList((prev) => [...prev, ""])}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Agregar nota
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumen visible solo en desktop */}
            <div className="hidden lg:block">
              <ResumenCard
                quoteItems={quoteItems}
                subtotal={subtotal}
                finalTotal={finalTotal}
                finalTotalUSD={exchangeRate && exchangeRate.venta > 0 ? finalTotal / exchangeRate.venta : 0}
                exchangeRate={exchangeRate}
                generating={generating}
                selectedClient={selectedClient}
                savedQuote={savedQuote}
                onGeneratePDF={handleGeneratePDF}
                onUpdateFinalTotal={setFinalTotal}
              />
            </div>
          </div>

          {/* Col 2: Tabs de catálogo */}
          <div className="space-y-4">
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
          </div>

          {/* Col 3: Cotización armada */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Cotización
            </h2>
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
                    onUpdateName={handleUpdateName}
                    onUpdateDescription={handleUpdateDescription}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resumen visible solo en mobile, al final */}
        <div className="lg:hidden">
          <ResumenCard
            quoteItems={quoteItems}
            subtotal={subtotal}
            finalTotal={finalTotal}
            finalTotalUSD={exchangeRate && exchangeRate.venta > 0 ? finalTotal / exchangeRate.venta : 0}
            exchangeRate={exchangeRate}
            generating={generating}
            selectedClient={selectedClient}
            savedQuote={savedQuote}
            onGeneratePDF={handleGeneratePDF}
            onUpdateFinalTotal={setFinalTotal}
          />
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

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { getExchangeRate, type ExchangeRate } from "@/lib/exchange-rate";
import { getPDFItems } from "@/lib/quote-utils";
import {
  type FreeNote,
  type GroupNote,
  createPaymentNote,
  createDeliveryNote,
  createAdditionalServicesNote,
  migrateNotesList,
  groupHasCheckedItems,
} from "@/lib/quote-notes-config";
import type {
  QuoteItemState,
  ModuleDescriptionSection,
} from "@/components/cotizador/QuoteItemCard";
import type { StandardModule } from "@/hooks/use-standard-modules";
import type { ServiceCatalogItem } from "@/components/cotizador/ServicesTab";
import type { Client } from "@/hooks/use-clients-prisma";

const ALLOWED_ROLES = ["admin", "supervisor", "vendedor"];

export function useQuoterState({ clients }: { clients: Client[] }) {
  const { toast } = useToast();
  const { userProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── State ──────────────────────────────────────────────────────────────────
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
  const [taxPct, setTaxPct] = useState(21);

  const getDefaultValidUntil = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };
  const [validUntilDate, setValidUntilDate] = useState<string>(getDefaultValidUntil());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [quoteHeaderExpanded, setQuoteHeaderExpanded] = useState(true);

  // ── Auth redirect ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !userProfile) {
      router.push("/login");
      return;
    }
    if (!authLoading && userProfile && !ALLOWED_ROLES.includes(userProfile.role)) {
      router.push("/projects");
    }
  }, [authLoading, userProfile, router]);

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    const loadAdicionales = () => {
      fetch(`/api/cotizador/adicionales?_t=${Date.now()}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setAdicionales(d.adicionales ?? []))
        .catch(() => {});
    };

    loadAdicionales();

    // Recargar al volver a la pestaña para reflejar cambios desde gestión de stock
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadAdicionales();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    setServicesLoading(true);
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setServices(d.services ?? []))
      .catch(() => {})
      .finally(() => setServicesLoading(false));
  }, []);

  // ── Duplicate / Edit quote loader ──────────────────────────────────────────
  useEffect(() => {
    const duplicateId = searchParams.get("duplicate");
    const editId = searchParams.get("edit");
    const sourceId = duplicateId || editId;
    const isEdit = !!editId;

    if (!sourceId || clients.length === 0) return;

    setLoadingSource(true);
    fetch(`/api/quotes/${sourceId}`)
      .then((r) => r.json())
      .then((data) => {
        const quote = data.quote;
        if (!quote) {
          toast({ title: "Cotización no encontrada", variant: "destructive" });
          return;
        }

        const client = clients.find((c: Client) => c.id === quote.client_id);
        if (client) setSelectedClient(client);

        setQuoteType(quote.quote_type === 'rental' ? 'rental' : 'sale');
        setQuoteCurrency(quote.currency === 'ARS' ? 'ARS' : 'USD');
        setTaxPct(quote.tax_pct ?? 21);

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

        if (quote.valid_until) {
          setValidUntilDate(quote.valid_until.split('T')[0]);
        } else {
          setValidUntilDate(getDefaultValidUntil());
        }

        const loadRate = quote.exchange_rate ?? exchangeRate?.venta ?? 0;
        const isOldUSD = quote.total_ars == null && (quote.currency === 'USD' || !quote.currency) && loadRate > 0;

        const items: QuoteItemState[] = (quote.items ?? []).map((item: any) => ({
          key: `${item.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: item.type,
          standardModuleId: item.standard_module_id ?? undefined,
          name: item.name,
          description: item.description ?? undefined,
          moduleDescriptionSections: item.module_description ?? undefined,
          unitPrice: isOldUSD ? item.unit_price / loadRate : item.unit_price,
          quantity: item.quantity,
          isOptional: item.is_optional ?? false,
          adicionales: (item.additionals ?? []).map((ad: any) => ({
            id: ad.material_id ?? ad.id,
            name: ad.name,
            price: isOldUSD ? ad.unit_price / loadRate : ad.unit_price,
          })),
          attachments: item.attachments ?? [],
        }));
        setQuoteItems(items);

        if (quote.total_ars != null) {
          setFinalTotal(quote.total);
        } else {
          const rate = quote.exchange_rate ?? exchangeRate?.venta ?? 0;
          if ((quote.currency === 'USD' || !quote.currency) && rate > 0) {
            setFinalTotal(quote.total / rate);
          } else {
            setFinalTotal(quote.total ?? quote.subtotal ?? 0);
          }
        }

        if (isEdit) {
          setEditingQuoteId(sourceId);
          setSavedQuote({ id: sourceId, number: quote.number });
          setSourcePdfUrl(quote.pdf_url ?? null);
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
  }, [searchParams, clients, toast, exchangeRate]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const subtotal = useMemo(() => {
    return quoteItems.reduce((acc, item) => {
      // Los servicios marcados como opcionales no suman al total del presupuesto
      if (item.type === 'service' && item.isOptional) return acc;
      return acc + item.unitPrice * item.quantity;
    }, 0);
  }, [quoteItems]);

  useEffect(() => {
    setFinalTotal(subtotal);
  }, [subtotal]);

  useEffect(() => {
    getExchangeRate().then(setExchangeRate).catch(() => {});
  }, []);

  // ── Keyboard shortcut ──────────────────────────────────────────────────────
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

  // ── Item actions ───────────────────────────────────────────────────────────
  function addStandardModule(mod: StandardModule) {
    const key = `${mod.id}-${Date.now()}`;
    const rate = exchangeRate?.venta ?? 0;
    const unitPrice = quoteCurrency === 'ARS' && rate > 0 ? mod.base_price * rate : mod.base_price;
    setQuoteItems((prev) => [
      ...prev,
      {
        key,
        type: "standard_module",
        standardModuleId: mod.id,
        name: mod.name,
        description: mod.description ?? undefined,
        moduleDescriptionSections: mod.module_description ?? undefined,
        unitPrice,
        quantity: 1,
        adicionales: [],
        attachments: (mod.attachments ?? []).map((att) => ({
          filename: att.filename,
          original_name: att.original_name,
          mime_type: att.mime_type,
          size: att.size,
          url: att.url,
          storage_path: att.storage_path,
        })),
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
    const rate = exchangeRate?.venta ?? 0;
    const unitPrice = quoteCurrency === 'ARS' && rate > 0 ? svc.unit_price * rate : svc.unit_price;
    setQuoteItems((prev) => [
      ...prev,
      {
        key,
        type: "service",
        name: svc.name,
        description: svc.description || undefined,
        unitPrice,
        quantity: 1,
        isOptional: false,
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
        isOptional: false,
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

  function toggleItemOptional(key: string) {
    setQuoteItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, isOptional: !item.isOptional } : item
      )
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
    toast({ title: "Ítem actualizado" });
  }

  function handleCancelEdit() {
    setEditingItemKey(null);
  }

  function toggleAdicional(
    itemKey: string,
    adicional: { id: string; name: string; unit_price: number }
  ) {
    // Los adicionales se guardan en pesos (ARS) en stock. Al agregarlos a una
    // cotización, convertimos al valor equivalente en la moneda de la cotización.
    const rate = exchangeRate?.venta ?? 0;
    const priceInQuoteCurrency =
      quoteCurrency === "ARS" || rate <= 0
        ? adicional.unit_price
        : adicional.unit_price / rate;

    setQuoteItems((prev) =>
      prev.map((item) => {
        if (item.key !== itemKey) return item;
        const exists = item.adicionales.find((a) => a.id === adicional.id);
        return {
          ...item,
          adicionales: exists
            ? item.adicionales.filter((a) => a.id !== adicional.id)
            : [
                ...item.adicionales,
                { id: adicional.id, name: adicional.name, price: priceInQuoteCurrency },
              ],
        };
      })
    );
  }

  // ── Save draft ─────────────────────────────────────────────────────────────
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
        total_ars: quoteCurrency === 'USD' && exchangeRate && exchangeRate.venta > 0
          ? Number((finalTotal * exchangeRate.venta).toFixed(2))
          : finalTotal,
        exchange_rate: exchangeRate?.venta ?? null,
        exchange_rate_date: exchangeRate?.actualizado ?? new Date().toISOString(),
        valid_until: validUntilDate,
        tax_pct: taxPct,
        created_by: userProfile!.id,
        items: quoteItems.map((item, i) => ({
          type: item.type,
          standard_module_id: item.standardModuleId,
          name: item.name,
          description: item.description,
          unit_price: item.unitPrice,
          quantity: item.quantity,
          is_optional: item.isOptional ?? false,
          subtotal: item.unitPrice * item.quantity,
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

  // ── Generate PDF ───────────────────────────────────────────────────────────
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
        total_ars: quoteCurrency === 'USD' && exchangeRate && exchangeRate.venta > 0
          ? Number((finalTotal * exchangeRate.venta).toFixed(2))
          : finalTotal,
        exchange_rate: exchangeRate?.venta ?? null,
        exchange_rate_date: exchangeRate?.actualizado ?? new Date().toISOString(),
        valid_until: validUntilDate,
        tax_pct: taxPct,
        created_by: userProfile!.id,
        items: quoteItems.map((item, i) => ({
          type: item.type,
          standard_module_id: item.standardModuleId,
          name: item.name,
          description: item.description,
          unit_price: item.unitPrice,
          quantity: item.quantity,
          is_optional: item.isOptional ?? false,
          subtotal: item.unitPrice * item.quantity,
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
          generatorName={userProfile!.name ?? userProfile!.email ?? undefined}
          finalTotal={finalTotal}
          taxPct={taxPct}
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

  return {
    // Config
    quoteType, setQuoteType,
    quoteCurrency, setQuoteCurrency,
    taxPct, setTaxPct,
    selectedClient, setSelectedClient,
    createClientOpen, setCreateClientOpen,
    validUntilDate, setValidUntilDate,
    calendarOpen, setCalendarOpen,
    quoteHeaderExpanded, setQuoteHeaderExpanded,
    // Notes
    freeNotes, setFreeNotes,
    paymentNote, setPaymentNote,
    deliveryNote, setDeliveryNote,
    additionalServicesNote, setAdditionalServicesNote,
    // Items
    quoteItems,
    subtotal,
    finalTotal, setFinalTotal,
    // Data
    adicionales,
    services, servicesLoading,
    // Status
    generating, savingDraft,
    savedQuote, sourcePdfUrl,
    loadingSource,
    editingQuoteId,
    editingItemKey, setEditingItemKey,
    exchangeRate,
    // Auth
    authLoading, userProfile,
    // Actions
    addStandardModule,
    addCustomModule,
    addService,
    addCustomService,
    removeItem,
    updateQuantity,
    toggleItemOptional,
    updatePrice,
    handleAddAttachment,
    handleRemoveAttachment,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    toggleAdicional,
    handleSaveDraft,
    handleGeneratePDF,
    // Editing
    editingItem,
  };
}

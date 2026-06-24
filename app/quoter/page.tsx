"use client";

import { useSearchParams } from "next/navigation";
import {
  Loader2,
  ChevronDown,
  Plus,
  X,
  CalendarIcon,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStandardModules } from "@/hooks/use-standard-modules";
import { useClientsPrisma } from "@/hooks/use-clients-prisma";
import { useAuth } from "@/lib/auth-context";
import { useQuoterState } from "@/hooks/use-quoter-state";
import { ClientSelector } from "@/components/cotizador/ClientSelector";
import { QuickCreateClientDialog } from "@/components/cotizador/QuickCreateClientDialog";
import { ResumenCard } from "@/components/cotizador/ResumenCard";
import { StandardModulesTab } from "@/components/cotizador/StandardModulesTab";
import { CustomModuleForm } from "@/components/cotizador/CustomModuleForm";
import { CustomModuleEditor } from "@/components/cotizador/CustomModuleEditor";
import { ServicesTab } from "@/components/cotizador/ServicesTab";
import { QuoteItemCard } from "@/components/cotizador/QuoteItemCard";

export default function CotizadorPage() {
  const { modules, loading: modulesLoading } = useStandardModules(true);
  const { clients } = useClientsPrisma();
  const { userProfile, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  const q = useQuoterState({ clients: clients ?? [] });

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Cotizador</h1>
            {q.loadingSource && (
              <Badge variant="secondary" className="text-xs">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Cargando cotización...
              </Badge>
            )}
            {searchParams.get("duplicate") && !q.loadingSource && q.quoteItems.length > 0 && (
              <Badge variant="outline" className="text-xs">
                Cotización duplicada
              </Badge>
            )}
            {q.savedQuote && !q.loadingSource && (
              <Badge variant="default" className="text-xs">
                Borrador {q.savedQuote.number}
                {q.sourcePdfUrl && <span className="opacity-75 ml-1">· PDF listo</span>}
              </Badge>
            )}
            {q.editingQuoteId && !q.savedQuote && !q.loadingSource && (
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
            onClick={() => q.setQuoteHeaderExpanded((v) => !v)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Datos de la cotización</CardTitle>
              <div className="flex items-center gap-2">
                {q.selectedClient && !q.quoteHeaderExpanded && (
                  <span className="text-xs text-muted-foreground truncate max-w-[160px] sm:max-w-[240px]">
                    {q.selectedClient.companyName}
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                    q.quoteHeaderExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>
          </CardHeader>
          <div
            className={`grid transition-all duration-300 ease-in-out ${
              q.quoteHeaderExpanded
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <CardContent className="space-y-4">
                {/* Tipo + Moneda */}
                <div className="flex items-center gap-3 sm:flex-wrap">
                  <Label className="text-xs shrink-0 max-sm:hidden">Tipo</Label>
                  <div className="flex rounded-md border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => q.setQuoteType('sale')}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        q.quoteType === 'sale'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      Venta
                    </button>
                    <button
                      type="button"
                      onClick={() => q.setQuoteType('rental')}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors border-l ${
                        q.quoteType === 'rental'
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
                        onClick={() => q.setQuoteCurrency('USD')}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          q.quoteCurrency === 'USD'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        USD
                      </button>
                      <button
                        type="button"
                        onClick={() => q.setQuoteCurrency('ARS')}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors border-l ${
                          q.quoteCurrency === 'ARS'
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
                      selected={q.selectedClient}
                      onSelect={q.setSelectedClient}
                      onCreateNew={() => q.setCreateClientOpen(true)}
                    />
                    {q.selectedClient && (
                      <div className="rounded-md bg-muted/40 px-3 py-2 text-sm space-y-0.5">
                        {q.selectedClient.representative && (
                          <p className="text-muted-foreground text-xs">
                            Contacto: {q.selectedClient.representative}
                          </p>
                        )}
                        {q.selectedClient.email && (
                          <p className="text-muted-foreground text-xs">{q.selectedClient.email}</p>
                        )}
                        {q.selectedClient.phone && (
                          <p className="text-muted-foreground text-xs">{q.selectedClient.phone}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fecha de validez */}
                  <div className="space-y-3">
                    <Label className="text-xs">Válida hasta</Label>
                    <Popover open={q.calendarOpen} onOpenChange={q.setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal text-sm",
                            !q.validUntilDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {q.validUntilDate
                            ? new Date(q.validUntilDate + 'T00:00:00').toLocaleDateString("es-AR", {
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
                          selected={q.validUntilDate ? new Date(q.validUntilDate + 'T00:00:00') : undefined}
                          onSelect={(date) => {
                            if (date) {
                              q.setValidUntilDate(date.toISOString().split('T')[0]);
                              q.setCalendarOpen(false);
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
                    {q.exchangeRate && q.quoteCurrency === 'USD' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5">1.</span>
                        <input
                          type="text"
                          value={`Precio de venta: Se cotiza en dólar oficial BNA vendedor del dia de la fecha de la facturación.`}
                          disabled
                          className="flex-1 text-xs border rounded px-2 py-1 bg-muted/50 text-muted-foreground"
                        />
                        <div className="h-6 w-6 shrink-0" />
                      </div>
                    )}
                    {q.freeNotes.map((note, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5">{i + 2}.</span>
                        <input
                          type="text"
                          value={note.content}
                          onChange={(e) => {
                            const updated = [...q.freeNotes];
                            updated[i] = { ...note, content: e.target.value };
                            q.setFreeNotes(updated);
                          }}
                          className="flex-1 text-xs border rounded px-2 py-1"
                          placeholder="Nota..."
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => q.setFreeNotes((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => q.setFreeNotes((prev) => [...prev, { type: 'free', content: '' }])}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Agregar nota
                    </Button>
                  </div>

                  {/* Forma de pago + Lugar de entrega + Servicios adicionales */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Forma de pago */}
                    <div className="rounded border bg-muted/30 p-3 space-y-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">
                        {q.paymentNote.title}
                      </span>
                      <div className="space-y-1.5 pl-1">
                        {q.paymentNote.items.map((item, idx) => (
                          <label key={idx} className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                              checked={item.checked}
                              onCheckedChange={(checked) => {
                                q.setPaymentNote((prev) => ({
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
                        {q.deliveryNote.title}
                      </span>
                      <div className="space-y-1.5 pl-1">
                        {q.deliveryNote.items.map((item, idx) => (
                          <label key={idx} className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                              checked={item.checked}
                              onCheckedChange={(checked) => {
                                q.setDeliveryNote((prev) => ({
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
                        {q.additionalServicesNote.title}
                      </span>
                      <div className="space-y-1.5 pl-1">
                        {q.additionalServicesNote.items.map((item, idx) => (
                          <label key={idx} className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                              checked={item.checked}
                              onCheckedChange={(checked) => {
                                q.setAdditionalServicesNote((prev) => ({
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
          {/* Izquierda: Catálogo o Editor */}
          <div className="lg:col-span-3 space-y-4">
            {q.editingItem ? (
              <CustomModuleEditor
                item={q.editingItem}
                onSave={q.handleSaveEdit}
                onCancel={q.handleCancelEdit}
                exchangeRate={q.exchangeRate}
                currency={q.quoteCurrency}
                allowAttachments={
                  q.editingItem.type === "custom_module" ||
                  q.editingItem.type === "standard_module"
                }
                subtitle={
                  q.editingItem.type === "standard_module"
                    ? "Estos cambios solo afectan esta cotización, no el módulo del catálogo."
                    : undefined
                }
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
                    onAddModule={q.addStandardModule}
                    exchangeRate={q.exchangeRate}
                    currency={q.quoteCurrency}
                  />
                </TabsContent>
                <TabsContent value="custom" className="mt-4">
                  <CustomModuleForm onAdd={q.addCustomModule} exchangeRate={q.exchangeRate} currency={q.quoteCurrency} />
                </TabsContent>
                <TabsContent value="services" className="mt-4">
                  <ServicesTab
                    services={q.services}
                    loading={q.servicesLoading}
                    onAddService={q.addService}
                    onAddCustomService={q.addCustomService}
                    exchangeRate={q.exchangeRate}
                    currency={q.quoteCurrency}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* Derecha: Cotización armada + Resumen */}
          <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Cotización
              </h2>
              {q.quoteItems.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {q.quoteItems.length} ítem{q.quoteItems.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            {q.quoteItems.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Agregá ítems desde las pestañas.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {q.quoteItems.map((item) => (
                  <QuoteItemCard
                    key={item.key}
                    item={item}
                    adicionalesDisponibles={q.adicionales}
                    onRemove={q.removeItem}
                    onUpdateQuantity={q.updateQuantity}
                    onUpdatePrice={q.updatePrice}
                    onToggleAdicional={q.toggleAdicional}
                    onAddAttachment={q.handleAddAttachment}
                    onRemoveAttachment={q.handleRemoveAttachment}
                    onStartEdit={q.handleStartEdit}
                    exchangeRate={q.exchangeRate}
                    currency={q.quoteCurrency}
                  />
                ))}
              </div>
            )}

            <ResumenCard
              quoteItems={q.quoteItems}
              subtotal={q.subtotal}
              finalTotal={q.finalTotal}
              exchangeRate={q.exchangeRate}
              currency={q.quoteCurrency}
              taxPct={q.taxPct}
              generating={q.generating}
              savingDraft={q.savingDraft}
              selectedClient={q.selectedClient}
              savedQuote={q.savedQuote}
              onGeneratePDF={q.handleGeneratePDF}
              onSaveDraft={q.handleSaveDraft}
              onUpdateFinalTotal={q.setFinalTotal}
              onTaxPctChange={q.setTaxPct}
            />
          </div>
        </div>
      </div>

      <QuickCreateClientDialog
        open={q.createClientOpen}
        onClose={() => q.setCreateClientOpen(false)}
        onCreate={(client) => q.setSelectedClient(client)}
      />
    </MainLayout>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Download,
  Plus,
  X,
  Package,
  CheckCircle2,
  Loader2,
  History,
  ChevronsUpDown,
  Check,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  useStandardModules,
  StandardModule,
  ModuleDescriptionSection,
} from "@/hooks/use-standard-modules";
import {
  useClientsPrisma,
  Client,
  CreateClientData,
} from "@/hooks/use-clients-prisma";

interface SelectedAdicional {
  id: string;
  name: string;
  price: number;
}

interface SelectedModule {
  key: string;
  moduleId: string;
  moduleName: string;
  moduleDescription?: string;
  moduleDescriptionSections?: ModuleDescriptionSection[];
  basePrice: number;
  adicionales: SelectedAdicional[];
}

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

// ── Resumen card (shared between desktop col-1 and mobile bottom) ────────────
function ResumenCard({
  selectedModules,
  subtotal,
  generating,
  selectedClient,
  savedQuote,
  onGeneratePDF,
}: {
  selectedModules: SelectedModule[];
  subtotal: number;
  generating: boolean;
  selectedClient: Client | null;
  savedQuote: { id: string; number: string } | null;
  onGeneratePDF: () => void;
}) {
  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Módulos seleccionados</span>
          <span className="font-semibold">{selectedModules.length}</span>
        </div>
        <div className="flex justify-between items-center border-t pt-3">
          <span className="font-semibold">Total</span>
          <span className="text-lg font-bold tabular-nums">
            {new Intl.NumberFormat("es-AR", {
              style: "currency",
              currency: "ARS",
              minimumFractionDigits: 0,
            }).format(subtotal)}
          </span>
        </div>
        <Button
          className="w-full cursor-pointer"
          onClick={onGeneratePDF}
          disabled={generating || !selectedClient || selectedModules.length === 0}
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
  const { modules, loading } = useStandardModules(true);
  const { clients } = useClientsPrisma();
  const { toast } = useToast();
  const { userProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
  const [generating, setGenerating] = useState(false);
  const [savedQuote, setSavedQuote] = useState<{ id: string; number: string } | null>(null);
  const [adicionales, setAdicionales] = useState<
    { id: string; name: string; unit_price: number }[]
  >([]);

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


  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!ALLOWED_ROLES.includes(userProfile.role)) return null;

  function addModule(mod: StandardModule) {
    const key = `${mod.id}-${Date.now()}`;
    setSelectedModules((prev) => [
      ...prev,
      {
        key,
        moduleId: mod.id,
        moduleName: mod.name,
        moduleDescription: mod.description,
        moduleDescriptionSections: mod.module_description,
        basePrice: mod.base_price,
        adicionales: [],
      },
    ]);
  }

  function removeModule(key: string) {
    setSelectedModules((prev) => prev.filter((m) => m.key !== key));
  }

  function toggleAdicional(
    moduleKey: string,
    adicional: { id: string; name: string; unit_price: number },
  ) {
    setSelectedModules((prev) =>
      prev.map((m) => {
        if (m.key !== moduleKey) return m;
        const exists = m.adicionales.find((a) => a.id === adicional.id);
        return {
          ...m,
          adicionales: exists
            ? m.adicionales.filter((a) => a.id !== adicional.id)
            : [...m.adicionales, { id: adicional.id, name: adicional.name, price: adicional.unit_price }],
        };
      }),
    );
  }

  const subtotal = selectedModules.reduce(
    (acc, m) => acc + m.basePrice + m.adicionales.reduce((a, ad) => a + ad.price, 0),
    0,
  );

  async function handleGeneratePDF() {
    if (!selectedClient) {
      toast({ title: "Seleccioná un cliente", variant: "destructive" });
      return;
    }
    if (selectedModules.length === 0) {
      toast({ title: "Seleccioná al menos un módulo", variant: "destructive" });
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
      const validUntilDate = new Date(now);
      validUntilDate.setDate(validUntilDate.getDate() + 30);
      const validUntil = validUntilDate.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const pdfBlob = await pdf(
        <CotizadorPDFDocument
          notes={notes || undefined}
          items={selectedModules.map((m) => ({
            moduleId: m.moduleId,
            moduleName: m.moduleName,
            moduleDescription: m.moduleDescription,
            moduleDescriptionSections: m.moduleDescriptionSections,
            basePrice: m.basePrice,
            adicionales: m.adicionales,
          }))}
          date={date}
          validUntil={validUntil}
          generatorName={userProfile.name ?? userProfile.email ?? undefined}
        />,
      ).toBlob();

      const moduleIds = [...new Set(selectedModules.map((m) => m.moduleId))];

      const quoteData = {
        client_id: selectedClient.id,
        client_name: selectedClient.companyName,
        client_company: selectedClient.companyName,
        client_phone: selectedClient.phone,
        client_email: selectedClient.email,
        notes: notes || undefined,
        subtotal,
        total: subtotal,
        created_by: userProfile.id,
        modules: selectedModules.map((m, i) => ({
          standard_module_id: m.moduleId,
          module_name: m.moduleName,
          module_description: m.moduleDescription,
          base_price: m.basePrice,
          subtotal: m.basePrice + m.adicionales.reduce((a, ad) => a + ad.price, 0),
          sort_order: i,
          additionals: m.adicionales.map((ad) => ({
            material_id: ad.id,
            name: ad.name,
            unit_price: ad.price,
            quantity: 1,
            subtotal: ad.price,
          })),
        })),
      };

      const formData = new FormData();
      formData.append("pdf", pdfBlob, "cotizacion.pdf");
      formData.append("moduleIds", JSON.stringify(moduleIds));
      formData.append("quoteData", JSON.stringify(quoteData));

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

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 mx-auto space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Cotizador</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generá un presupuesto rápido seleccionando módulos y adicionales.
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
                  <Label htmlFor="notes" className="text-xs">Notas para el PDF</Label>
                  <Textarea
                    id="notes"
                    placeholder="Condiciones, aclaraciones..."
                    className="text-sm"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Resumen visible solo en desktop */}
            <div className="hidden lg:block">
              <ResumenCard
                selectedModules={selectedModules}
                subtotal={subtotal}
                generating={generating}
                selectedClient={selectedClient}
                savedQuote={savedQuote}
                onGeneratePDF={handleGeneratePDF}
              />
            </div>
          </div>

          {/* Col 2: Catálogo */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Módulos disponibles
            </h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando módulos...</p>
            ) : modules.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No hay módulos disponibles.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {modules.map((mod) => (
                  <Card
                    key={mod.id}
                    className="cursor-pointer hover:shadow-md transition-shadow md:py-4"
                    onClick={() => addModule(mod)}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{mod.name}</p>
                          {mod.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {mod.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-semibold tabular-nums">
                            {new Intl.NumberFormat("es-AR", {
                              style: "currency",
                              currency: "ARS",
                              minimumFractionDigits: 0,
                            }).format(mod.base_price)}
                          </span>
                          <Button size="icon" variant="ghost" className="h-7 w-7">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Col 3: Cotización armada */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Cotización
            </h2>
            {selectedModules.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Hacé clic en un módulo para agregarlo.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {selectedModules.map((m) => (
                  <Card key={m.key}>
                    <CardContent className="py-3 px-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{m.moduleName}</p>
                          <p className="text-xs tabular-nums text-muted-foreground">
                            {new Intl.NumberFormat("es-AR", {
                              style: "currency",
                              currency: "ARS",
                              minimumFractionDigits: 0,
                            }).format(m.basePrice)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => removeModule(m.key)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {adicionales.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">
                            Adicionales
                          </p>
                          <div className="space-y-1">
                            {adicionales.map((ad) => {
                              const selected = m.adicionales.some((a) => a.id === ad.id);
                              return (
                                <button
                                  key={ad.id}
                                  type="button"
                                  onClick={() => toggleAdicional(m.key, ad)}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border text-xs select-none transition-colors cursor-pointer ${
                                    selected
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-background text-foreground border-border hover:bg-muted"
                                  }`}
                                >
                                  <span>{ad.name}</span>
                                  <span className="tabular-nums font-medium">
                                    {new Intl.NumberFormat("es-AR", {
                                      style: "currency",
                                      currency: "ARS",
                                      minimumFractionDigits: 0,
                                    }).format(ad.unit_price)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {m.adicionales.length > 0 && (
                        <div className="text-xs text-right text-muted-foreground border-t pt-2">
                          Subtotal:{" "}
                          <span className="font-semibold tabular-nums text-foreground">
                            {new Intl.NumberFormat("es-AR", {
                              style: "currency",
                              currency: "ARS",
                              minimumFractionDigits: 0,
                            }).format(
                              m.basePrice + m.adicionales.reduce((a, ad) => a + ad.price, 0),
                            )}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resumen visible solo en mobile, al final */}
        <div className="lg:hidden">
          <ResumenCard
            selectedModules={selectedModules}
            subtotal={subtotal}
            generating={generating}
            selectedClient={selectedClient}
            savedQuote={savedQuote}
            onGeneratePDF={handleGeneratePDF}
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

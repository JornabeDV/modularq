"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Download,
  Plus,
  X,
  Package,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  useStandardModules,
  StandardModule,
} from "@/hooks/use-standard-modules";

interface SelectedAdicional {
  id: string;
  name: string;
  price: number;
}

interface SelectedModule {
  key: string; // unique key per instance (moduleId + index)
  moduleId: string;
  moduleName: string;
  moduleDescription?: string;
  basePrice: number;
  adicionales: SelectedAdicional[];
}

const ALLOWED_ROLES = ["admin", "supervisor", "vendedor"];

export default function CotizadorPage() {
  const { modules, loading } = useStandardModules(true);
  const { toast } = useToast();
  const { userProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
  const [generating, setGenerating] = useState(false);
  const [adicionales, setAdicionales] = useState<
    { id: string; name: string; unit_price: number }[]
  >([]);

  useEffect(() => {
    if (
      !authLoading &&
      userProfile &&
      !ALLOWED_ROLES.includes(userProfile.role)
    ) {
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

  if (!ALLOWED_ROLES.includes(userProfile.role)) {
    return null;
  }

  function addModule(mod: StandardModule) {
    const key = `${mod.id}-${Date.now()}`;
    setSelectedModules((prev) => [
      ...prev,
      {
        key,
        moduleId: mod.id,
        moduleName: mod.name,
        moduleDescription: mod.description,
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
            : [
                ...m.adicionales,
                {
                  id: adicional.id,
                  name: adicional.name,
                  price: adicional.unit_price,
                },
              ],
        };
      }),
    );
  }

  const subtotal = selectedModules.reduce(
    (acc, m) =>
      acc + m.basePrice + m.adicionales.reduce((a, ad) => a + ad.price, 0),
    0,
  );

  async function handleGeneratePDF() {
    if (!clientName.trim()) {
      toast({ title: "Ingresá el nombre del cliente", variant: "destructive" });
      return;
    }
    if (selectedModules.length === 0) {
      toast({ title: "Seleccioná al menos un módulo", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      // 1. Generar el PDF en el cliente con react-pdf
      const { pdf } = await import("@react-pdf/renderer");
      const { CotizadorPDFDocument } =
        await import("@/components/cotizador/CotizadorPDFDocument");

      const date = new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const pdfBlob = await pdf(
        <CotizadorPDFDocument
          clientName={clientName}
          clientCompany={clientCompany || undefined}
          clientPhone={clientPhone || undefined}
          clientEmail={clientEmail || undefined}
          notes={notes || undefined}
          items={selectedModules.map((m) => ({
            moduleId: m.moduleId,
            moduleName: m.moduleName,
            moduleDescription: m.moduleDescription,
            basePrice: m.basePrice,
            adicionales: m.adicionales,
          }))}
          date={date}
        />,
      ).toBlob();

      // 2. Enviar al servidor para mergear con adjuntos de los módulos
      const moduleIds = [...new Set(selectedModules.map((m) => m.moduleId))];
      const formData = new FormData();
      formData.append("pdf", pdfBlob, "cotizacion.pdf");
      formData.append("moduleIds", JSON.stringify(moduleIds));

      const res = await fetch("/api/cotizador/generate-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al generar PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const clientSlug = clientName
        .replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 30);
      a.download = `Cotizacion_${clientSlug}_${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "PDF generado correctamente" });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Error al generar PDF",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Cotizador</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generá un presupuesto rápido seleccionando módulos y adicionales.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: datos del cliente */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Datos del cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="clientName" className="text-xs">
                    Nombre / Contacto *
                  </Label>
                  <Input
                    id="clientName"
                    placeholder="Nombre del cliente"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="clientCompany" className="text-xs">
                    Empresa
                  </Label>
                  <Input
                    id="clientCompany"
                    placeholder="Empresa (opcional)"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="clientPhone" className="text-xs">
                    Teléfono
                  </Label>
                  <Input
                    id="clientPhone"
                    placeholder="Teléfono (opcional)"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="clientEmail" className="text-xs">
                    Email
                  </Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="Email (opcional)"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="notes" className="text-xs">
                    Notas
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Notas adicionales..."
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Resumen y acción */}
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Módulos seleccionados
                  </span>
                  <span className="font-semibold">
                    {selectedModules.length}
                  </span>
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
                  className="w-full"
                  onClick={handleGeneratePDF}
                  disabled={
                    generating ||
                    !clientName.trim() ||
                    selectedModules.length === 0
                  }
                >
                  <Download className="w-4 h-4 mr-2" />
                  {generating ? "Generando PDF..." : "Descargar cotización PDF"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Columna central: catálogo de módulos */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Módulos disponibles
            </h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Cargando módulos...
              </p>
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
                    className="cursor-pointer hover:shadow-md transition-shadow"
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
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                          >
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

          {/* Columna derecha: módulos seleccionados + adicionales */}
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
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Adicionales
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {adicionales.map((ad) => {
                              const selected = m.adicionales.some(
                                (a) => a.id === ad.id,
                              );
                              return (
                                <Badge
                                  key={ad.id}
                                  variant={selected ? "default" : "outline"}
                                  className="cursor-pointer text-xs py-1 px-2 select-none"
                                  onClick={() => toggleAdicional(m.key, ad)}
                                >
                                  {ad.name}
                                  {selected && (
                                    <span className="ml-1 tabular-nums">
                                      +
                                      {new Intl.NumberFormat("es-AR", {
                                        style: "currency",
                                        currency: "ARS",
                                        minimumFractionDigits: 0,
                                      }).format(ad.unit_price)}
                                    </span>
                                  )}
                                </Badge>
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
                              m.basePrice +
                                m.adicionales.reduce(
                                  (a, ad) => a + ad.price,
                                  0,
                                ),
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
      </div>
    </MainLayout>
  );
}

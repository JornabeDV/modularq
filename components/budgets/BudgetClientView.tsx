"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Edit2,
  Check,
  Loader2,
  Building2,
  MapPin,
  Phone,
  CreditCard,
  Building,
  Factory,
} from "lucide-react";
import Image from "next/image";
import { Budget, PrismaTypedService, ModuleDescriptionSection } from "@/lib/prisma-typed-service";
import { useToast } from "@/hooks/use-toast";
import { BudgetPDFDownload } from "./BudgetPDFDownload";
import { ModuleDescriptionEditor } from "./ModuleDescriptionEditor";

interface BudgetClientViewProps {
  budget: Budget;
  currentExchangeRate?: number;
  onSaveModuleDescription?: (sections: ModuleDescriptionSection[]) => void;
  savingModuleDesc?: boolean;
}

// Datos de la empresa ModulArq
const COMPANY_INFO = {
  name: "ModulArq",
  slogan: "Módulos Habitacionales",
  address: "Maurín 6688 Sur, Pocito, San Juan, Argentina",
  phone: "+54 264 555-5555",
  cuit: "30-71144558-3",
  bankName: "Banco Supervielle Argentina",
  accountType: "Cuenta Corriente en Pesos",
  cbu: "0270091510016725020039",
  alias: "PARRA.TAMBOR.BESO",
};

export function BudgetClientView({
  budget,
  currentExchangeRate,
  onSaveModuleDescription,
  savingModuleDesc = false,
}: BudgetClientViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [budgetData, setBudgetData] = useState({
    validityDays: budget.validity_days || 30,
    paymentTerms: budget.payment_terms || "50% anticipo, 50% contra entrega",
    deliveryTerms: budget.delivery_terms || "Coordinada con el cliente",
    deliveryLocation:
      budget.delivery_location || "Predio ModulArq - Maurín 6688 Sur, Pocito",
    notes: budget.notes || "",
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await PrismaTypedService.updateBudget(budget.id, {
        validity_days: budgetData.validityDays,
        payment_terms: budgetData.paymentTerms,
        delivery_terms: budgetData.deliveryTerms,
        delivery_location: budgetData.deliveryLocation,
        notes: budgetData.notes,
      });
      setIsEditing(false);
      toast({
        title: "Condiciones guardadas",
        description: "Las condiciones comerciales han sido actualizadas.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar las condiciones.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Usar el tipo de cambio guardado en el presupuesto (si está aprobado) o el actual
  const exchangeRateToUse = budget.exchange_rate || currentExchangeRate || 1;
  const totalUSD = budget.final_price / exchangeRateToUse;
  const ivaAmount = totalUSD * 0.105;

  // Convertir número a palabras (simplificado)
  const numberToWords = (num: number) => {
    const entero = Math.floor(num);
    const decimal = Math.round((num - entero) * 100);
    return `Dólares ${entero.toLocaleString("es-AR")} con ${decimal.toString().padStart(2, "0")}/100`;
  };

  return (
    <div className="space-y-6">
      {/* Encabezado con Logo */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-muted p-3 rounded-lg">
                <Image
                  src="/assets/logo.png"
                  alt="ModulArq"
                  width={120}
                  height={60}
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{COMPANY_INFO.name}</h2>
                <p className="text-muted-foreground text-sm">
                  {COMPANY_INFO.slogan}
                </p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <h1 className="text-3xl font-bold">PRESUPUESTO</h1>
              <p className="text-muted-foreground font-mono">
                {budget.budget_code}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Fecha: {new Date(budget.created_at).toLocaleDateString("es-AR")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{COMPANY_INFO.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Factory className="w-4 h-4 text-muted-foreground" />
              <span>Piacenza SRL</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span>CUIT: {COMPANY_INFO.cuit}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos del cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="text-lg font-medium">{budget.client_name}</p>
              <p className="text-muted-foreground">{budget.location}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Proyecto</p>
              <p className="text-lg font-medium">
                {budget.description || "Sin descripción"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Descripción del módulo - Editor */}
      {onSaveModuleDescription && (
        <ModuleDescriptionEditor
          sections={budget.module_description || []}
          onSave={onSaveModuleDescription}
          isSaving={savingModuleDesc}
        />
      )}

      {/* Descripción del módulo - Vista (solo lectura) */}
      {!onSaveModuleDescription && budget.module_description && budget.module_description.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalle del Módulo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {budget.module_description.map((section, index) => (
                <div key={index} className="flex gap-3">
                  <span className="font-medium text-sm min-w-[120px]">{section.section}:</span>
                  <span className="text-sm text-muted-foreground">{section.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total del presupuesto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Importe del Presupuesto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-mono">
                USD{" "}
                {totalUSD.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>IVA 10,5%:</span>
              <span className="font-mono">
                USD{" "}
                {ivaAmount.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>TOTAL:</span>
              <span className="font-mono">
                USD{" "}
                {(totalUSD + ivaAmount).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Condiciones comerciales editables */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Condiciones Comerciales
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={isSaving}
          >
            {isEditing ? (
              <>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-1" />
                )}{" "}
                Guardar
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 mr-1" /> Editar
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Validez de la oferta (días)</Label>
                  <Input
                    type="number"
                    value={budgetData.validityDays}
                    onChange={(e) =>
                      setBudgetData({
                        ...budgetData,
                        validityDays: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Condiciones de pago</Label>
                  <Input
                    value={budgetData.paymentTerms}
                    onChange={(e) =>
                      setBudgetData({
                        ...budgetData,
                        paymentTerms: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Términos de entrega</Label>
                <Input
                  value={budgetData.deliveryTerms}
                  onChange={(e) =>
                    setBudgetData({
                      ...budgetData,
                      deliveryTerms: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Lugar de entrega</Label>
                <Input
                  value={budgetData.deliveryLocation}
                  onChange={(e) =>
                    setBudgetData({
                      ...budgetData,
                      deliveryLocation: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Notas adicionales</Label>
                <Textarea
                  value={budgetData.notes}
                  onChange={(e) =>
                    setBudgetData({ ...budgetData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-muted-foreground">
                    1- VALIDEZ DE LA OFERTA:
                  </span>
                  <p className="mt-1">
                    {budgetData.validityDays} días desde la fecha de emisión
                  </p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    2- MONEDA:
                  </span>
                  <p className="mt-1">
                    Dólar oficial BNA vendedor al día del efectivo pago
                  </p>
                </div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  3- CONDICIONES DE PAGO:
                </span>
                <p className="mt-1">{budgetData.paymentTerms}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  4- FECHA DE ENTREGA:
                </span>
                <p className="mt-1">{budgetData.deliveryTerms}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  5- LUGAR DE ENTREGA:
                </span>
                <p className="mt-1">{budgetData.deliveryLocation}</p>
              </div>
              {budgetData.notes && (
                <div>
                  <span className="font-medium text-muted-foreground">
                    6- NOTAS:
                  </span>
                  <p className="mt-1">{budgetData.notes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Datos bancarios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Datos para Transferencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Razón Social</p>
              <p className="font-medium">Piacenza SRL</p>
            </div>
            <div>
              <p className="text-muted-foreground">CUIT</p>
              <p className="font-medium">{COMPANY_INFO.cuit}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Banco</p>
              <p className="font-medium">{COMPANY_INFO.bankName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tipo de Cuenta</p>
              <p className="font-medium">{COMPANY_INFO.accountType}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-muted-foreground">CBU</p>
              <p className="font-mono font-medium">{COMPANY_INFO.cbu}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Alias</p>
              <p className="font-mono font-medium">{COMPANY_INFO.alias}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Cotización al {new Date().toLocaleDateString("es-AR")}
        </p>
        <BudgetPDFDownload budget={budget} currentExchangeRate={currentExchangeRate} />
      </div>
    </div>
  );
}

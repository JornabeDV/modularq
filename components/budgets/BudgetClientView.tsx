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
  X,
} from "lucide-react";
import Image from "next/image";
import {
  Budget,
  BudgetAttachment,
  PrismaTypedService,
  ModuleDescriptionSection,
} from "@/lib/prisma-typed-service";
import { useToast } from "@/hooks/use-toast";
import { BudgetPDFDownload } from "./BudgetPDFDownload";
import { ModuleDescriptionEditor } from "./ModuleDescriptionEditor";
import { BudgetAttachments } from "./BudgetAttachments";

interface BudgetClientViewProps {
  budget: Budget;
  currentExchangeRate?: number;
  onSaveModuleDescription?: (sections: ModuleDescriptionSection[]) => void;
  savingModuleDesc?: boolean;
  attachments?: BudgetAttachment[];
  onAttachmentsChange?: (attachments: BudgetAttachment[]) => void;
  isEditable?: boolean;
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
  attachments = [],
  onAttachmentsChange,
  isEditable = true,
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

  // Precio calculado original y precio ajustado
  const exchangeRateToUse = budget.exchange_rate || currentExchangeRate || 1;
  const calculatedPriceUSD = budget.calculated_price / exchangeRateToUse;
  const finalPriceUSD = budget.final_price / exchangeRateToUse;
  // Usar final_price si existe y es diferente de 0, sino usar calculated_price
  const initialPriceUSD =
    finalPriceUSD > 0 ? finalPriceUSD : calculatedPriceUSD;
  const [adjustedPriceUSD, setAdjustedPriceUSD] = useState(initialPriceUSD);
  const [isEditingPrice, setIsEditingPrice] = useState(false);

  // Estado para el input de precio (string mientras se edita)
  const [priceInputValue, setPriceInputValue] = useState(
    initialPriceUSD.toFixed(2),
  );

  // Calcular porcentaje de variación
  const variationPercentage =
    calculatedPriceUSD > 0
      ? ((adjustedPriceUSD - calculatedPriceUSD) / calculatedPriceUSD) * 100
      : 0;
  const isDiscount = variationPercentage < 0;
  const isIncrease = variationPercentage > 0;

  const handleSave = async () => {
    setIsSaving(true);
    const newFinalPrice = adjustedPriceUSD * exchangeRateToUse;
    console.log("Guardando presupuesto:", {
      budgetId: budget.id,
      adjustedPriceUSD,
      exchangeRateToUse,
      newFinalPrice,
    });
    try {
      const result = await PrismaTypedService.updateBudget(budget.id, {
        validity_days: budgetData.validityDays,
        payment_terms: budgetData.paymentTerms,
        delivery_terms: budgetData.deliveryTerms,
        delivery_location: budgetData.deliveryLocation,
        notes: budgetData.notes,
        final_price: newFinalPrice,
      });
      console.log("Resultado de updateBudget:", result);
      setIsEditing(false);
      setIsEditingPrice(false);
      toast({
        title: "Condiciones guardadas",
        description:
          "Las condiciones comerciales y el precio han sido actualizados.",
      });
    } catch (error) {
      console.error("Error guardando:", error);
      toast({
        title: "Error",
        description:
          "No se pudieron guardar las condiciones. Ver consola para detalles.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Usar el tipo de cambio guardado en el presupuesto (si está aprobado) o el actual
  const totalUSD = adjustedPriceUSD;
  const ivaAmount = totalUSD * 0.105;

  // Convertir número a palabras (simplificado)
  const numberToWords = (num: number) => {
    const entero = Math.floor(num);
    const decimal = Math.round((num - entero) * 100);
    return `Dólares ${entero.toLocaleString("es-AR")} con ${decimal.toString().padStart(2, "0")}/100`;
  };

  // Precio total con IVA en palabras
  const totalPriceWithIVA = totalUSD + ivaAmount;

  return (
    <div className="space-y-6">
      {/* Encabezado con Logo */}
      <Card>
        <CardContent>
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
              <h1 className="text-xl sm:text-3xl font-bold">PRESUPUESTO</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
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
      {!onSaveModuleDescription &&
        budget.module_description &&
        budget.module_description.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalle del Módulo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {budget.module_description.map((section, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="font-medium text-sm min-w-[120px]">
                      {section.section}:
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {section.description}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Total del presupuesto */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Importe del Presupuesto</CardTitle>
          <Button
            size="sm"
            onClick={() =>
              isEditingPrice
                ? handleSave()
                : (setIsEditingPrice(true),
                  setPriceInputValue(
                    adjustedPriceUSD.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
                  ))
            }
            disabled={isSaving}
            className="cursor-pointer"
          >
            {isEditingPrice ? (
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
                <Edit2 className="w-4 h-4 mr-1" /> Ajustar Precio
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Subtotal:</span>
              {isEditingPrice ? (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">USD</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={priceInputValue}
                    onChange={(e) => {
                      let rawValue = e.target.value;

                      // Si no hay coma y el último carácter es punto, convertir a coma (iniciar decimales)
                      if (!rawValue.includes(",") && rawValue.endsWith(".")) {
                        rawValue = rawValue.slice(0, -1) + ",";
                      }

                      // Permitir números, puntos (miles) y una sola coma (decimal)
                      if (!/^[\d.,]*$/.test(rawValue)) return;

                      // Separar parte entera de decimal
                      const parts = rawValue.split(",");
                      if (parts.length > 2) return; // Solo una coma permitida

                      // Limitar decimales a 2
                      if (parts[1] && parts[1].length > 2) {
                        parts[1] = parts[1].slice(0, 2);
                      }

                      // Formatear parte entera: quitar puntos existentes y agregar nuevos cada 3 dígitos
                      let integerPart = parts[0].replace(/\./g, "");
                      integerPart = integerPart.replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ".",
                      );

                      // Reconstruir valor
                      const formattedValue =
                        parts.length > 1
                          ? `${integerPart},${parts[1] || ""}`
                          : integerPart;

                      setPriceInputValue(formattedValue);
                    }}
                    onBlur={() => {
                      // Al perder foco, asegurar 2 decimales
                      let value = priceInputValue;
                      if (!value.includes(",")) {
                        value = value + ",00";
                      } else {
                        const parts = value.split(",");
                        while (parts[1].length < 2) parts[1] += "0";
                        value = parts.join(",");
                      }

                      const cleanValue = value
                        .replace(/\./g, "")
                        .replace(",", ".");
                      const numValue = parseFloat(cleanValue) || 0;
                      setAdjustedPriceUSD(numValue);
                      setPriceInputValue(value);
                    }}
                    onFocus={(e) => {
                      e.target.select();
                    }}
                    className="w-40 text-right font-mono"
                    placeholder="0,00"
                  />
                </div>
              ) : (
                <span className="font-mono">
                  USD{" "}
                  {totalUSD.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              )}
            </div>

            {/* Mostrar porcentaje de variación - Solo en UI, NO en PDF */}
            {variationPercentage !== 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {isDiscount ? "Descuento aplicado:" : "Recargo aplicado:"}
                </span>
                <span
                  className={`font-medium ${isDiscount ? "text-green-600" : "text-amber-600"}`}
                >
                  {isDiscount ? "-" : "+"}
                  {Math.abs(variationPercentage).toFixed(2)}%
                </span>
              </div>
            )}

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

          {/* Info del precio calculado original */}
          {isEditingPrice && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Precio calculado original: USD{" "}
              {calculatedPriceUSD.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Condiciones comerciales editables */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Condiciones Comerciales
          </CardTitle>
          <div className="flex max-sm:flex-col gap-2">
            {(isEditing || isEditingPrice) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setIsEditingPrice(false);
                  setAdjustedPriceUSD(initialPriceUSD);
                  setPriceInputValue(
                    initialPriceUSD.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
                  );
                }}
                disabled={isSaving}
                className="cursor-pointer"
              >
                <X className="w-4 h-4 mr-1" /> Cancelar
              </Button>
            )}
            <Button
              size="sm"
              onClick={() =>
                isEditing || isEditingPrice ? handleSave() : setIsEditing(true)
              }
              disabled={isSaving}
              className="cursor-pointer"
            >
              {isEditing || isEditingPrice ? (
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
          </div>
        </CardHeader>
        <CardContent>
          {isEditing || isEditingPrice ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Columna izquierda */}
                <div className="space-y-4">
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

                  <div>
                    <span className="font-medium text-muted-foreground">
                      3- CONDICIONES DE PAGO:
                    </span>
                    <p className="mt-1">{budgetData.paymentTerms}</p>
                  </div>
                </div>

                {/* Columna derecha */}
                <div className="space-y-4">
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
              </div>
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

      {/* Archivos Adjuntos */}
      <BudgetAttachments
        budgetId={budget.id}
        attachments={attachments}
        onAttachmentsChange={onAttachmentsChange || (() => {})}
        isEditable={isEditable && budget.status === "draft"}
      />

      {/* Footer */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Cotización al {new Date().toLocaleDateString("es-AR")}
        </p>
        <BudgetPDFDownload
          budget={budget}
          currentExchangeRate={currentExchangeRate}
          attachments={attachments}
        />
      </div>
    </div>
  );
}

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Client } from "@/hooks/use-clients-prisma";

interface ClientViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

export function ClientViewDialog({
  isOpen,
  onClose,
  client,
}: ClientViewDialogProps) {
  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-w-full max-h-full md:w-[90vw] md:h-auto md:max-w-4xl md:max-h-[85vh] md:rounded-lg rounded-none m-0 md:m-4 overflow-y-auto top-0 left-0 translate-x-0 translate-y-0 md:top-[50%] md:left-[50%] md:translate-x-[-50%] md:translate-y-[-50%]">
        <DialogHeader>
          <DialogTitle>Información del Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-muted-foreground">
                CUIT
              </Label>
              <p className="mt-1 text-base">{client.cuit}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-muted-foreground">
                Nombre de la Empresa
              </Label>
              <p className="mt-1 text-base">{client.companyName}</p>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <Label className="text-base font-semibold">Contactos</Label>

            {client.contacts && client.contacts.length > 0 ? (
              <div className="space-y-4">
                {client.contacts.map((contact, index) => (
                  <div
                    key={contact.id || index}
                    className={`border-2 rounded-lg p-4 space-y-3 ${
                      contact.isPrimary
                        ? "bg-primary/20 border-primary/60 shadow-sm"
                        : "bg-muted/30 border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Label
                        className={`text-sm font-medium ${
                          contact.isPrimary ? "text-primary font-semibold" : ""
                        }`}
                      >
                        {contact.isPrimary
                          ? "Representante Principal"
                          : `Contacto ${index + 1}`}
                      </Label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label
                          className={`text-xs ${
                            contact.isPrimary
                              ? "text-foreground/80 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          Nombre
                        </Label>
                        <p
                          className={`mt-1 ${
                            contact.isPrimary
                              ? "text-foreground font-medium"
                              : ""
                          }`}
                        >
                          {contact.name}
                        </p>
                      </div>
                      <div>
                        <Label
                          className={`text-xs ${
                            contact.isPrimary
                              ? "text-foreground/80 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          Rol
                        </Label>
                        <p
                          className={`mt-1 ${
                            contact.isPrimary
                              ? "text-foreground font-medium"
                              : ""
                          }`}
                        >
                          {contact.role}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label
                          className={`text-xs ${
                            contact.isPrimary
                              ? "text-foreground/80 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          Email
                        </Label>
                        <p
                          className={`mt-1 ${
                            contact.isPrimary
                              ? "text-foreground font-medium"
                              : ""
                          }`}
                        >
                          {contact.email}
                        </p>
                      </div>
                      <div>
                        <Label
                          className={`text-xs ${
                            contact.isPrimary
                              ? "text-foreground/80 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          Teléfono
                        </Label>
                        <p
                          className={`mt-1 ${
                            contact.isPrimary
                              ? "text-foreground font-medium"
                              : ""
                          }`}
                        >
                          {contact.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center">
                <p>No hay contactos registrados</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <div>
              <Label className="text-sm font-semibold text-muted-foreground">
                Fecha de Creación
              </Label>
              <p className="mt-1 text-base">
                {new Date(client.createdAt).toLocaleDateString("es-AR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-muted-foreground">
                Última Actualización
              </Label>
              <p className="mt-1 text-base">
                {new Date(client.updatedAt).toLocaleDateString("es-AR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="cursor-pointer"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

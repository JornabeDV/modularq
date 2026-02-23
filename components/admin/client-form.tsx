"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";

interface ContactData {
  name: string;
  email: string;
  phone: string;
  role: string;
  isPrimary: boolean;
}

interface ClientFormData {
  cuit: string;
  company_name: string;
  representative: string;
  email: string;
  phone: string;
  contacts?: ContactData[];
}

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClientFormData) => void;
  isEditing: boolean;
  initialData?: any | null;
  isLoading?: boolean;
  error?: string | null;
}

export function ClientForm({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  initialData,
  isLoading = false,
  error,
}: ClientFormProps) {
  const [formData, setFormData] = useState({
    cuit: "",
    company_name: "",
    contacts: [] as ContactData[],
  });
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalError(error || null);
    }
  }, [isOpen, error]);

  const hasError = !!(localError || error);

  const dialogOpen = isOpen || hasError;

  useEffect(() => {
    if (isEditing && initialData) {
      let contacts =
        initialData.contacts?.map((c: any) => ({
          name: c.name || "",
          email: c.email || "",
          phone: c.phone || "",
          role: c.role || "",
          isPrimary: c.isPrimary || false,
        })) || [];

      if (
        contacts.length === 0 &&
        (initialData.representative || initialData.email || initialData.phone)
      ) {
        contacts = [
          {
            name: initialData.representative || "",
            email: initialData.email || "",
            phone: initialData.phone || "",
            role: "Representante Principal",
            isPrimary: true,
          },
        ];
      }

      const hasPrimary = contacts.some((c: ContactData) => c.isPrimary);
      if (contacts.length > 0 && !hasPrimary) {
        contacts[0].isPrimary = true;
      }

      setFormData({
        cuit: initialData.cuit || "",
        company_name: initialData.companyName || "",
        contacts: contacts,
      });
    } else {
      setFormData({
        cuit: "",
        company_name: "",
        contacts: [],
      });
    }
  }, [isEditing, initialData?.id]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContactChange = (
    index: number,
    field: keyof ContactData,
    value: string | boolean
  ) => {
    setFormData((prev) => {
      const newContacts = [...prev.contacts];
      newContacts[index] = { ...newContacts[index], [field]: value };

      if (field === "isPrimary" && value === true) {
        newContacts.forEach((contact, i) => {
          if (i !== index) {
            contact.isPrimary = false;
          }
        });
      }

      return { ...prev, contacts: newContacts };
    });
  };

  const addContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        { name: "", email: "", phone: "", role: "", isPrimary: false },
      ],
    }));
  };

  const removeContact = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): string | null => {
    if (formData.contacts.length === 0) {
      return "Por favor, agrega al menos un contacto";
    }

    const invalidContact = formData.contacts.find(
      (c) => !c.name || !c.email || !c.phone || !c.role
    );
    if (invalidContact) {
      return "Por favor, completa todos los campos de todos los contactos";
    }

    const hasPrimary = formData.contacts.some((c) => c.isPrimary);
    if (!hasPrimary) {
      return "Debe haber al menos un contacto marcado como representante principal";
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const validationError = validateForm();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    const primaryContact =
      formData.contacts.find((c) => c.isPrimary) || formData.contacts[0];
    const submitData = {
      ...formData,
      representative: primaryContact.name,
      email: primaryContact.email,
      phone: primaryContact.phone,
    };

    onSubmit(submitData);
  };

  const handleClose = () => {
    setLocalError(null);
    onClose();
  };

  const preventClose = (e: {
    preventDefault: () => void;
    stopPropagation: () => void;
  }) => {
    if (hasError || isLoading) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        if (!open && isLoading) return;
        if (!open) {
          setLocalError(null);
          onClose();
        }
      }}
    >
      <DialogContent
        className="w-full h-full max-w-full max-h-full md:w-[90vw] md:h-auto md:max-w-4xl md:max-h-[85vh] md:rounded-lg rounded-none m-0 md:m-4 overflow-y-auto top-0 left-0 translate-x-0 translate-y-0 md:top-[50%] md:left-[50%] md:translate-x-[-50%] md:translate-y-[-50%]"
        onInteractOutside={preventClose}
        onEscapeKeyDown={preventClose}
        onPointerDownOutside={preventClose}
        showCloseButton={!(hasError || isLoading)}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Cliente" : "Crear Nuevo Cliente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {(localError || error) && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
              <p className="text-sm font-medium">{localError || error}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cuit" className="mb-2">
                CUIT
              </Label>
              <Input
                id="cuit"
                value={formData.cuit}
                onChange={(e) => handleInputChange("cuit", e.target.value)}
                required
                placeholder="Ej: 20-12345678-9"
                pattern="[0-9]{2}-[0-9]{8}-[0-9]{1}"
                title="Formato: XX-XXXXXXXX-X"
                className="!text-sm"
              />
            </div>
            <div>
              <Label htmlFor="company_name" className="mb-2">
                Nombre de la Empresa
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) =>
                  handleInputChange("company_name", e.target.value)
                }
                required
                placeholder="Ej: Constructora ABC S.A."
                className="!text-sm"
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Contactos</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addContact}
                className="cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Contacto
              </Button>
            </div>

            {formData.contacts.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                <p className="mb-2">No hay contactos agregados.</p>
                <p className="text-xs">
                  El primer contacto será marcado como representante principal.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addContact}
                  className="cursor-pointer mt-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primer Contacto
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.contacts.map((contact, index) => (
                  <div
                    key={index}
                    className={`border-2 rounded-lg p-4 space-y-4 ${
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
                      {formData.contacts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContact(index)}
                          className="cursor-pointer text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <input
                        type="checkbox"
                        id={`contact-primary-${index}`}
                        checked={contact.isPrimary}
                        onChange={(e) =>
                          handleContactChange(
                            index,
                            "isPrimary",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label
                        htmlFor={`contact-primary-${index}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        Marcar como representante principal
                      </Label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor={`contact-name-${index}`}
                          className="mb-2"
                        >
                          Nombre
                        </Label>
                        <Input
                          id={`contact-name-${index}`}
                          value={contact.name}
                          onChange={(e) =>
                            handleContactChange(index, "name", e.target.value)
                          }
                          required
                          placeholder="Ej: María González"
                          className={
                            contact.isPrimary
                              ? "!text-sm bg-background border-foreground/20"
                              : "!text-sm"
                          }
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor={`contact-role-${index}`}
                          className="mb-2"
                        >
                          Rol
                        </Label>
                        <Input
                          id={`contact-role-${index}`}
                          value={contact.role}
                          onChange={(e) =>
                            handleContactChange(index, "role", e.target.value)
                          }
                          required
                          placeholder={
                            index === 0
                              ? "Ej: Administración"
                              : "Ej: Administración"
                          }
                          className={
                            contact.isPrimary
                              ? "!text-sm bg-background border-foreground/20"
                              : "!text-sm"
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor={`contact-email-${index}`}
                          className="mb-2"
                        >
                          Email
                        </Label>
                        <Input
                          id={`contact-email-${index}`}
                          type="email"
                          value={contact.email}
                          onChange={(e) =>
                            handleContactChange(index, "email", e.target.value)
                          }
                          required
                          placeholder="Ej: maria@empresa.com"
                          className={
                            contact.isPrimary
                              ? "!text-sm bg-background border-foreground/20"
                              : "!text-sm"
                          }
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor={`contact-phone-${index}`}
                          className="mb-2"
                        >
                          Teléfono
                        </Label>
                        <Input
                          id={`contact-phone-${index}`}
                          value={contact.phone}
                          onChange={(e) =>
                            handleContactChange(index, "phone", e.target.value)
                          }
                          required
                          placeholder="Ej: +54 9 11 1234-5678"
                          className={
                            contact.isPrimary
                              ? "!text-sm bg-background border-foreground/20"
                              : "!text-sm"
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer"
            >
              {isLoading
                ? "Guardando..."
                : isEditing
                ? "Actualizar Cliente"
                : "Crear Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

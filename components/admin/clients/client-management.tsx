"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type SortField = "cuit" | "companyName" | "representative" | "email" | "phone";
type SortOrder = "asc" | "desc";
import { ClientStats } from "./client-stats";
import { ClientTable } from "./client-table";
import { ClientForm } from "./client-form";
import { ClientViewDialog } from "./client-view-dialog";
import {
  useClientsPrisma,
  type CreateClientData,
} from "@/hooks/use-clients-prisma";
import { useProjectsPrisma } from "@/hooks/use-projects-prisma";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

export function ClientManagement() {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const isReadOnly = userProfile?.role === "supervisor";

  const { clients, loading, error, createClient, updateClient, deleteClient } =
    useClientsPrisma();
  const { projects } = useProjectsPrisma();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [viewingClient, setViewingClient] = useState<any>(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>("companyName");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateClient = async (clientData: CreateClientData) => {
    setCreateError(null);
    const result = await createClient(clientData);
    if (result.success) {
      toast({
        title: "Cliente creado",
        description: `El cliente ${clientData.company_name} se ha creado correctamente`,
      });
      setIsCreateDialogOpen(false);
      setCreateError(null);
    } else {
      toast({
        title: "Error al crear cliente",
        description: result.error || "No se pudo crear el cliente",
        variant: "destructive",
      });
      setCreateError(result.error || "Error al crear cliente");
    }
  };

  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleUpdateClient = async (clientId: string, clientData: any) => {
    if (isUpdating) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const updateData: any = {};
      if (clientData.cuit !== undefined) updateData.cuit = clientData.cuit;
      if (clientData.company_name !== undefined)
        updateData.company_name = clientData.company_name;
      if (clientData.representative !== undefined)
        updateData.representative = clientData.representative;
      if (clientData.email !== undefined) updateData.email = clientData.email;
      if (clientData.phone !== undefined) updateData.phone = clientData.phone;
      if (clientData.contacts !== undefined)
        updateData.contacts = clientData.contacts;

      const result = await updateClient(clientId, updateData);
      if (result.success) {
        toast({
          title: "Cliente actualizado",
          description: `El cliente se ha actualizado correctamente`,
        });
        setEditingClient(null);
        setUpdateError(null);
      } else {
        toast({
          title: "Error al actualizar cliente",
          description: result.error || "No se pudo actualizar el cliente",
          variant: "destructive",
        });
        setUpdateError(result.error || "Error al actualizar cliente");
      }
    } catch (error) {
      console.error("Error updating client:", error);
      setUpdateError("Error al actualizar cliente");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    const result = await deleteClient(clientId);
    if (result.success) {
      toast({
        title: "Cliente eliminado",
        description: "El cliente se ha eliminado exitosamente",
      });
    } else {
      toast({
        title: "Error al eliminar cliente",
        description: result.error || "No se pudo eliminar el cliente",
        variant: "destructive",
      });
    }
  };

  const handleEditClient = (client: any) => {
    setEditingClient(client);
  };

  const handleViewClient = (client: any) => {
    setViewingClient(client);
  };

  // Manejar ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredClients =
    clients?.filter((client) => {
      if (searchTerm === "") return true;

      const searchLower = searchTerm.toLowerCase();

      if (client.companyName.toLowerCase().includes(searchLower)) return true;

      if (client.cuit.includes(searchTerm)) return true;

      if (client.representative?.toLowerCase().includes(searchLower))
        return true;
      if (client.email?.toLowerCase().includes(searchLower)) return true;
      if (client.phone?.includes(searchTerm)) return true;

      if (client.contacts && client.contacts.length > 0) {
        const matchesInContacts = client.contacts.some(
          (contact) =>
            contact.name.toLowerCase().includes(searchLower) ||
            contact.email.toLowerCase().includes(searchLower) ||
            contact.phone.includes(searchTerm) ||
            contact.role.toLowerCase().includes(searchLower),
        );
        if (matchesInContacts) return true;
      }

      return false;
    }) || [];

  // Ordenar clientes
  const sortedClients = [...filteredClients].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "cuit":
        comparison = a.cuit.localeCompare(b.cuit);
        break;
      case "companyName":
        comparison = a.companyName.localeCompare(b.companyName);
        break;
      case "representative":
        comparison = (a.representative || "").localeCompare(
          b.representative || "",
        );
        break;
      case "email":
        comparison = (a.email || "").localeCompare(b.email || "");
        break;
      case "phone":
        comparison = (a.phone || "").localeCompare(b.phone || "");
        break;
      default:
        comparison = 0;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const totalItems = sortedClients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = sortedClients.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage, searchTerm]);

  // Resetear página cuando cambia el ordenamiento
  useEffect(() => {
    setCurrentPage(1);
  }, [sortField, sortOrder]);

  const totalClients = clients?.length || 0;
  const totalProjects = projects?.filter((p) => p.clientId).length || 0;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Error</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Gestión de Clientes</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Administra la información de tus clientes y empresas
          </p>
        </div>

        {!isReadOnly && (
          <Button
            type="button"
            className="w-full sm:w-auto cursor-pointer"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        )}
      </div>

      <ClientStats totalClients={totalClients} totalProjects={totalProjects} />

      <ClientTable
        clients={paginatedClients}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onEditClient={handleEditClient}
        onViewClient={handleViewClient}
        onDeleteClient={handleDeleteClient}
        isReadOnly={isReadOnly}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      <ClientForm
        isOpen={isCreateDialogOpen || !!createError}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setCreateError(null);
        }}
        onSubmit={handleCreateClient}
        isEditing={false}
        error={createError}
      />

      <ClientForm
        isOpen={!!editingClient || !!updateError}
        onClose={() => {
          if (!isUpdating) {
            setEditingClient(null);
            setUpdateError(null);
          }
        }}
        onSubmit={(data) =>
          editingClient && handleUpdateClient(editingClient.id, data)
        }
        isEditing={true}
        initialData={editingClient}
        isLoading={isUpdating}
        error={updateError}
      />

      <ClientViewDialog
        isOpen={!!viewingClient}
        onClose={() => setViewingClient(null)}
        client={viewingClient}
      />
    </div>
  );
}

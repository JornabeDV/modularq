"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useUsersPrisma } from "@/hooks/use-users-prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { loginWithName, isLoading, user } = useAuth();
  const { users, loading: usersLoading } = useUsersPrisma();
  const router = useRouter();

  // Si ya hay sesión, evitar mostrar el login y limpiar el back stack
  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedUserId) {
      setError("Por favor seleccione un usuario");
      return;
    }

    const selectedUser = users.find((user: any) => user.id === selectedUserId);
    if (!selectedUser) {
      setError("Usuario no encontrado");
      return;
    }

    const firstName = selectedUser.name.split(" ")[0] || selectedUser.name;
    const success = await loginWithName(firstName, password);
    if (success) {
      router.replace("/dashboard");
    } else {
      setError("Credenciales inválidas. Verifique la contraseña");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/assets/logo.png"
              alt="MODULARQ Logo"
              width={250}
              height={250}
              className="object-contain"
            />
          </div>
          <CardDescription>
            Ingrese sus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-select">Seleccionar Persona</Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={usersLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      usersLoading
                        ? "Cargando personal..."
                        : "Seleccione su nombre"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {users.map(
                    (user: any) =>
                      user.id && (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || usersLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : usersLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando usuarios...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

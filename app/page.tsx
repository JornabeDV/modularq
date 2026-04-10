"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user, userProfile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user && userProfile) {
        if (userProfile.role === "admin" || userProfile.role === "supervisor") {
          router.push("/dashboard");
        } else if (userProfile.role === "vendedor") {
          router.push("/quoter");
        } else {
          router.push("/projects");
        }
      } else {
        router.push("/login");
      }
    }
  }, [user, userProfile, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

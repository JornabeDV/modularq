"use client"

import type React from "react"
import { useState } from "react"

import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "./sidebar"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Toaster } from "@/components/ui/toaster"
import Image from "next/image"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4 h-20">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                className="p-4 min-w-[48px] min-h-[48px]"
                style={{ fontSize: '24px' }}
              >
                <Menu style={{ width: '28px', height: '28px' }} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <div className="flex items-center justify-center flex-1 py-2">
            <Image
              src="/assets/logo.png"
              alt="ModulArq Logo"
              width={120}
              height={40}
              className="object-contain"
            />
          </div>
          <div className="w-12" /> {/* Spacer */}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto lg:ml-0 pt-20 lg:pt-0">
        {children}
      </main>
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}

import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { Suspense } from "react"
import { OverdueTasksChecker } from "@/components/overdue-tasks-checker"
import "./globals.css"

export const metadata: Metadata = {
  title: "MODULARQ",
  description: "Sistema de gestión de proyectos y operarios para construcción modular",
  generator: "Next.js",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MODULARQ",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "MODULARQ",
    title: "MODULARQ",
    description: "Sistema de gestión de proyectos y operarios para construcción modular",
  },
  twitter: {
    card: "summary",
    title: "MODULARQ",
    description: "Sistema de gestión de proyectos y operarios para construcción modular",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <meta name="application-name" content="MODULARQ" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MODULARQ" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#0f172a" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#0f172a" />
        
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#0f172a" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://modularq.app" />
        <meta name="twitter:title" content="MODULARQ" />
        <meta name="twitter:description" content="Sistema de gestión de proyectos y operarios para construcción modular" />
        <meta name="twitter:image" content="/icons/icon-192x192.png" />
        <meta name="twitter:creator" content="@modularq" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="MODULARQ - Gestión de Operarios" />
        <meta property="og:description" content="Sistema de gestión de proyectos y operarios para construcción modular" />
        <meta property="og:site_name" content="MODULARQ" />
        <meta property="og:url" content="https://modularq.app" />
        <meta property="og:image" content="/icons/icon-192x192.png" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <AuthProvider>
            <OverdueTasksChecker />
            {children}
          </AuthProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}

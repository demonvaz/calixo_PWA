import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { SkipLink } from "@/components/a11y/SkipLink";
import { MainNavigation } from "@/components/layout/main-navigation";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog";

export const metadata: Metadata = {
  title: "Calixo - Desconexión Digital",
  description: "Una PWA social para desconexión digital. Acepta retos diarios, personaliza tu avatar CALI y comparte tu progreso.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Calixo",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#fe4b5b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="light" style={{ colorScheme: 'light' }}>
      <head>
        <link rel="icon" href="/icons/icon.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,600;0,700;1,400&family=Questrial&display=swap" rel="stylesheet" />
      </head>
      <body className="flex flex-col min-h-screen">
        <ToastProvider>
          <ConfirmDialogProvider>
            <SkipLink />
            <MainNavigation />
            <div id="main-content" className="flex-1 pb-[max(4rem,calc(4rem+env(safe-area-inset-bottom)))] md:pb-0">
              <ServiceWorkerRegister />
              {children}
            </div>
          </ConfirmDialogProvider>
        </ToastProvider>
      </body>
    </html>
  );
}


"use client";

import { SidebarProvider } from "@/contexts/SidebarContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            classNames: {
              toast: "group toast-custom",
              closeButton: "toast-close-button",
            },
          }}
        />
        <style jsx global>{`
          .toast-custom {
            padding-right: 2.5rem !important;
          }
          .toast-close-button {
            position: absolute !important;
            top: 0.5rem !important;
            right: 0.5rem !important;
            left: auto !important;
            transform: none !important;
            background: transparent !important;
            border: none !important;
            opacity: 0.5 !important;
            transition: opacity 0.2s !important;
            width: 24px !important;
            height: 24px !important;
          }
          .toast-close-button:hover {
            opacity: 1 !important;
            background: transparent !important;
            border: none !important;
          }
          .toast-close-button svg {
            width: 16px !important;
            height: 16px !important;
          }
        `}</style>
      </SidebarProvider>
    </AuthProvider>
  );
}

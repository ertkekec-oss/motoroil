"use client";

import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { AppProvider, useApp } from "../contexts/AppContext";
import Sidebar from "../components/Sidebar";
import { ThemeProvider } from "../contexts/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import { ModalProvider } from "../contexts/ModalContext";
import "./globals.css";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoading) {
    return (
      <div style={{ background: '#020205', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        Yükleniyor...
      </div>
    );
  }

  if (!isAuthenticated && !isLoginPage) {
    // Redirection is handled in AuthContext, but we should not render layout here
    return null;
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#020205' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '260px', padding: '20px' }}>
        {children}
        <ThemeToggle />
      </main>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <AuthProvider>
          <ThemeProvider>
            <ModalProvider>
              <AppProvider>
                <LayoutContent>{children}</LayoutContent>
              </AppProvider>
            </ModalProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

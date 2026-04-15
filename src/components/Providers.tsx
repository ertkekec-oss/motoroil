"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ModalProvider } from "@/contexts/ModalContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
// Global CSS is imported in layout, but sometimes context needs it? No.

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ThemeProvider>
                <ModalProvider>
                    <LanguageProvider>
                        <AppProvider>
                            {children}
                        </AppProvider>
                    </LanguageProvider>
                </ModalProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}

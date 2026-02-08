"use client";

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ModalProvider } from '@/contexts/ModalContext';

export function RootProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ThemeProvider>
                <ModalProvider>
                    {children}
                </ModalProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}

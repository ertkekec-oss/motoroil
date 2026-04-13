import React from 'react';
import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
    title: 'Periodya Waiter',
    description: 'Mobil Sipariş Terminali',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
};

export default function WaiterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="tr" className="dark">
             <body className="bg-[#0B1220] overflow-hidden overscroll-none touch-pan-y antialiased selection:bg-blue-500/30">
                <Providers>
                    <div className="flex flex-col h-[100dvh] w-full max-w-lg mx-auto bg-[#070b14] relative shadow-2xl shadow-black/50 overflow-hidden">
                        {children}
                    </div>
                </Providers>
            </body>
        </html>
    );
}

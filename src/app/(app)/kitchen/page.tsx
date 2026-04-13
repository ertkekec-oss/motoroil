import type { Metadata } from 'next';
import KitchenDisplayWorkspace from '@/components/terminal/KitchenDisplayWorkspace';

export const metadata: Metadata = {
    title: "Kitchen System (KDS) | Periodya Enterprise",
    description: "Enterprise Kitchen Display System",
};

export default function KitchenPage() {
    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-64px)] lg:h-screen w-full bg-[#0B1220] overflow-hidden m-0 p-0 absolute inset-0 z-50">
            <div className="flex-1 h-full w-full relative">
                 <KitchenDisplayWorkspace />
            </div>
        </div>
    );
}

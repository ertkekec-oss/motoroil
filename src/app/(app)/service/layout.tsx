import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Servis ve İş Emirleri | Periodya',
    description: 'Service and Work Order Engine',
};

export default function ServiceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Basic wrapper to ensure clean background based on Enterprise Identity
    return (
        <div className="flex-1 bg-[#F8FAFC] dark:bg-[#0B1220] min-h-screen">
            {children}
        </div>
    );
}

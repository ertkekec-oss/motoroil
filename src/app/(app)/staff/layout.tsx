"use client";

import ModuleGatekeeper from "@/components/ModuleGatekeeper";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
    return (
        <ModuleGatekeeper moduleId="HR">
            {children}
        </ModuleGatekeeper>
    );
}

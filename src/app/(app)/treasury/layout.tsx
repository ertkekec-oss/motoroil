"use client";

import ModuleGatekeeper from "@/components/ModuleGatekeeper";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <ModuleGatekeeper moduleId="TREASURY">
            {children}
        </ModuleGatekeeper>
    );
}
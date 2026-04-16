import ModuleGatekeeper from "@/components/ModuleGatekeeper";

export default function HubDashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <ModuleGatekeeper moduleId="B2B">
            {children}
        </ModuleGatekeeper>
    );
}

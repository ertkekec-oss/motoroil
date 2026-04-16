import ModuleGatekeeper from "@/components/ModuleGatekeeper";

export default function HubB2BLayout({ children }: { children: React.ReactNode }) {
    return (
        <ModuleGatekeeper moduleId="B2B">
            {children}
        </ModuleGatekeeper>
    );
}

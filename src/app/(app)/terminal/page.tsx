import TerminalClient from "./TerminalClient";
import ModuleGatekeeper from "@/components/ModuleGatekeeper";

export const metadata = {
    title: "POS Terminal | Periodya Enterprise",
    description: "Enterprise Offline-First POS Terminal",
};

export default function TerminalPage() {
    return (
        <ModuleGatekeeper moduleId="POS">
            <TerminalClient />
        </ModuleGatekeeper>
    );
}

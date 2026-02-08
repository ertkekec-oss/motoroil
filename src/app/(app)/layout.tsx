import "@/app/globals.css";
import ClientShell from "@/app/ClientShell";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ClientShell>{children}</ClientShell>;
}

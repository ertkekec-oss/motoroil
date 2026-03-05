import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ClientDashboard from "./ClientDashboard";

export const dynamic = "force-dynamic";

export default async function TestDesktopPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        redirect("/login");
    }

    // Checking multi-tenant isolation compliance, though mock data is shown.
    const companyId = user.companyId || session?.companyId || session?.settings?.companyId;
    if (!companyId && user.role !== "SUPER_ADMIN" && user.role !== "admin") {
        redirect("/403");
    }

    return <ClientDashboard />;
}

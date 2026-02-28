import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ClientDashboard from "./ClientDashboard";

export const dynamic = "force-dynamic";

export default async function TestDesktopPage({
    searchParams
}: {
    searchParams?: any;
}) {
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

    // Resolve searchParams potentially async (Next 15 safe)
    const resolvedParams = searchParams ? await Promise.resolve(searchParams) : {};
    const validDensities = ["compact", "standard", "comfort"];
    const densityParam = resolvedParams?.density;
    const density = typeof densityParam === "string" && validDensities.includes(densityParam) ? densityParam : "standard";

    return <ClientDashboard density={density} />;
}

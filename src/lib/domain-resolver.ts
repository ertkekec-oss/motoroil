import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function getTenantFromDomain() {
    const headersList = headers();
    const host = headersList.get("host") || "";
    const hostnameWithoutPort = host.split(':')[0];

    // If it's a known non-custom domain, just return null (generic Periodya B2B branding)
    if (
        hostnameWithoutPort === 'b2b.periodya.com' ||
        hostnameWithoutPort === 'periodya.com' ||
        hostnameWithoutPort === 'www.periodya.com' ||
        hostnameWithoutPort === 'localhost' ||
        hostnameWithoutPort === 'vercel.app' ||
        host.includes('vercel.app')
    ) {
        return null;
    }

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { b2bCustomDomain: hostnameWithoutPort }
        });
        
        return tenant;
    } catch (error) {
        console.error("Error looking up custom domain tenant:", error);
        return null;
    }
}

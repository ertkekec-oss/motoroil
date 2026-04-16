import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PlatformKycClient from "./PlatformKycClient";

export const metadata = {
    title: "Risk, KYC ve Belgeler | Periodya Admin",
    description: "Gatekeeper kuralları, sözleşmeler ve evrak havuzu.",
};

export default async function PlatformDocumentsPage() {
    const session = await getSession();
    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "OWNER")) {
        redirect("/login");
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <PlatformKycClient />
        </div>
    );
}

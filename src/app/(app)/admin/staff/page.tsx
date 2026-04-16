import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PlatformStaffClient from "./PlatformStaffClient";

export const metadata = {
    title: "Platform Yönetim Ekibi | Periodya Admin",
};

export default async function PlatformStaffPage() {
    const sessionResult: any = await getSession();
    const session = sessionResult?.user || sessionResult;

    // Sadece SUPER_ADMIN yetkisine sahip olanlar ekibe müdahale edebilir
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "OWNER")) {
        redirect("/admin/dashboard");
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <PlatformStaffClient currentUser={session} />
        </div>
    );
}

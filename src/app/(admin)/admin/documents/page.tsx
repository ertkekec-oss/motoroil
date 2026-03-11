import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import MainClient from "./MainClient";

export const metadata = {
    title: "Platform Dökümanları | Periodya Admin",
    description: "Sistem seviyesindeki tüm sözleşme, form ve politikaların yönetimi.",
};

export default async function PlatformDocumentsPage() {
    const session = await getSession();
    if (!session || session.user.role !== "SUPER_ADMIN") {
        redirect("/login");
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
                        Platform Dökümantasyon Modülü
                    </h1>
                    <p className="text-sm text-slate-400">
                        Periodya üzerinde aktif kullanılacak olan tüm sözleşme, yasal form ve politikaları sürümleriyle (versiyonlarıyla) yönetebilirsiniz.
                    </p>
                </div>
            </div>

            <MainClient />
        </div>
    );
}

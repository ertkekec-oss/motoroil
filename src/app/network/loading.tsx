import { Loader2 } from "lucide-react";

export default function NetworkLoading() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <div className="text-slate-500 font-medium text-sm animate-pulse">Sayfa Yükleniyor...</div>
        </div>
    )
}

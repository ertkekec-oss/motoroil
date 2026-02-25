import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminProvidersPage() {
    // In a real app these would be fetched from a dedicated Config model or environment
    // For MVP, we'll list the architectural placeholders and health status

    const paymentProviders = [
        { id: "MOCK", name: "Internal Mock Escrow", status: "HEALTHY", lastSync: "Now", errorCount: 0 },
        { id: "IYZICO", name: "Iyzico Integration", status: "HEALTHY", lastSync: "10m ago", errorCount: 0 },
    ];

    const carriers = [
        { id: "MANUAL", name: "Manual Pickup/Delivery", active: true, sync: "N/A" },
        { id: "MOCK", name: "Simulation Runner", active: true, sync: "Realtime" },
        { id: "YURTICI", name: "Yurtiçi Kargo Adaptor", active: false, sync: "Disabled" },
    ];

    return (
        <div className="p-6 bg-[#F6F7F9] min-h-screen text-slate-800 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#1F3A5F]">Infrastructure Control Panel</h1>
                    <p className="text-sm text-slate-500">Monitor and govern payment gateways and logistics adapters.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Payment Gateways */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b font-bold text-[#1F3A5F] flex justify-between">
                            <span>Payment Providers</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">All Systems Green</span>
                        </div>
                        <div className="divide-y">
                            {paymentProviders.map(p => (
                                <div key={p.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                                    <div>
                                        <div className="font-bold text-sm">{p.name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono italic">ID: {p.id}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-[10px] font-bold ${p.status === "HEALTHY" ? "text-emerald-600" : "text-amber-600"}`}>{p.status}</div>
                                        <div className="text-[10px] text-slate-400">Sync: {p.lastSync}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Logistics Carriers */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b font-bold text-[#1F3A5F] flex justify-between">
                            <span>Logistics Carriers</span>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">3 Adapters Loaded</span>
                        </div>
                        <div className="divide-y">
                            {carriers.map(c => (
                                <div key={c.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                                    <div>
                                        <div className="font-bold text-sm">{c.name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono italic">Adapter: {c.id}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-[10px] font-bold ${c.active ? "text-emerald-600" : "text-slate-400"}`}>
                                            {c.active ? "ENABLED" : "DISABLED"}
                                        </div>
                                        <div className="text-[10px] text-slate-400">State: {c.sync}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

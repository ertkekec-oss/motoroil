"use client";

import { useTransition, useRef } from "react";
import { setupRecurringOrderAction, activateContractAction } from "@/actions/contractActions";

export default function ContractDetailClient({ contract, items }: { contract: any, items: any[] }) {
    const [isPending, startTransition] = useTransition();
    const formRef = useRef<HTMLFormElement>(null);

    const handleRecurring = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formRef.current) return;
        const formData = new FormData(formRef.current);
        const freq = formData.get("frequency") as "WEEKLY" | "MONTHLY";
        const day = parseInt(formData.get("dayOfPeriod") as string, 10);

        if (!freq || !day) return;

        if (!confirm("Are you sure you want to setup an automatic recurring order via this contract? Orders will be placed automatically.")) return;

        startTransition(async () => {
            try {
                await setupRecurringOrderAction(contract.id, freq, day);
                alert("Recurring schedule configured successfully.");
            } catch (err: any) {
                alert(err.message || "Failed to setup schedule");
            }
        });
    };

    const handleActivate = () => {
        if (!confirm("Activate this contract? (Normally an admin/seller step)")) return;
        startTransition(async () => {
            try {
                await activateContractAction(contract.id);
                alert("Activated");
            } catch (err: any) {
                alert(err.message);
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Meta Panel */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">Agreement Summary</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center text-slate-600">
                                <span>Status</span>
                                <span className={`font-bold px-2 py-0.5 rounded text-xs ${contract.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                                    }`}>
                                    {contract.status}
                                </span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Currency</span>
                                <span className="font-mono font-bold text-slate-900">{contract.currency}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Payment Mode</span>
                                <span className="font-semibold">{contract.paymentMode}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Settlement</span>
                                <span className="font-semibold">{contract.settlementCycle}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Start Date</span>
                                <span>{contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>End Date</span>
                                <span>{contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>

                        {contract.status === 'DRAFT' && (
                            <button
                                onClick={handleActivate}
                                disabled={isPending}
                                className="w-full mt-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 active:scale-95 transition-transform"
                            >
                                Activate Agreement
                            </button>
                        )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">SLA & Enforcement</h2>
                        {contract.slas && contract.slas.length > 0 ? (
                            contract.slas.map((sla: any) => (
                                <div key={sla.id} className="text-sm space-y-2 mb-3 pb-3 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Max Delivery Days</span>
                                        <span className="font-mono font-bold">{sla.maxDeliveryDays}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600 text-xs">
                                        <span>Late Penalty Fee</span>
                                        <span className="font-mono font-bold text-red-600">-{sla.latePenaltyPercent}%</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-500 italic">No SLAs defined for this contract.</p>
                        )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">Recurring Schedule</h2>
                        {contract.recurringOrders && contract.recurringOrders.length > 0 ? (
                            contract.recurringOrders.map((ro: any) => (
                                <div key={ro.id} className="text-sm space-y-2 mb-3 pb-3 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Frequency</span>
                                        <span className="font-bold">{ro.frequency}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Day of Period</span>
                                        <span className="font-mono">{ro.dayOfPeriod}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Status</span>
                                        <span className={ro.active ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                                            {ro.active ? "Active" : "Paused"}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div>
                                <p className="text-xs text-slate-500 italic mb-4">No recurring standing orders setup. You can place manual orders anytime via Catalog {"->"} Checkout, contract prices will be automatically applied.</p>

                                {contract.status === 'ACTIVE' && (
                                    <form ref={formRef} onSubmit={handleRecurring} className="space-y-3 bg-[#F6F7F9] p-3 rounded border border-slate-200">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                                            <select name="frequency" className="w-full text-xs p-1.5 border rounded" required>
                                                <option value="WEEKLY">Weekly</option>
                                                <option value="MONTHLY">Monthly</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Day to Exec (1-30)</label>
                                            <input type="number" name="dayOfPeriod" min="1" max="31" className="w-full text-xs p-1.5 border rounded" required />
                                        </div>
                                        <button disabled={isPending} className="w-full py-2 bg-black text-white text-xs font-bold rounded hover:bg-slate-800 transition-colors">
                                            {isPending ? "Setting up..." : "Setup Auto Reorder"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Panel */}
                <div className="md:col-span-2">
                    <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-200 bg-[#F6F7F9]">
                            <h2 className="text-lg font-bold text-[#1F3A5F]">Contract Line Items</h2>
                            <p className="text-xs text-slate-500 mt-1">Guaranteed pricing per selected product.</p>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {items.length === 0 ? (
                                <div className="p-6 text-center text-sm text-slate-500">No line items in this contract.</div>
                            ) : (
                                items.map(item => (
                                    <div key={item.id} className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-slate-800">{item.productName}</h3>
                                                <p className="text-xs text-slate-500 font-mono mt-0.5">Product ID: {item.productId}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-semibold text-slate-700">Base Rate: <span className="font-mono text-[#1F3A5F]">{Number(item.baseUnitPrice).toFixed(2)} {contract.currency}</span></div>
                                                <div className="text-xs text-slate-500">Min Qty: {item.minOrderQty}</div>
                                            </div>
                                        </div>

                                        {item.tiers && item.tiers.length > 0 && (
                                            <div className="mt-4 bg-slate-50 border border-slate-200 rounded text-xs p-3">
                                                <h4 className="font-bold text-slate-700 mb-2">Volume Tier Pricing</h4>
                                                <div className="grid grid-cols-2 gap-2 max-w-sm">
                                                    {item.tiers.map((t: any) => (
                                                        <div key={t.id} className="flex justify-between bg-white p-2 border rounded">
                                                            <span className="text-slate-600">≥ {t.minQty} units</span>
                                                            <span className="font-bold text-[#1F3A5F]">{Number(t.unitPrice).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

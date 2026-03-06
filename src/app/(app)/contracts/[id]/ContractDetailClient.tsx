"use client";

import { useTransition, useRef, useState, useEffect } from "react";
import { setupRecurringOrderAction, activateContractAction } from "@/actions/contractActions";

export default function ContractDetailClient({ contract, items }: { contract: any, items: any[] }) {
    const [isPending, startTransition] = useTransition();
    const formRef = useRef<HTMLFormElement>(null);

    const [documents, setDocuments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const fetchDocuments = async () => {
        try {
            const res = await fetch(`/api/contracts/${contract.id}/documents`);
            if (res.ok) {
                const data = await res.json();
                setDocuments(data.documents || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [contract.id]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert("Dosya boyutu 10MB'dan küçük olmalıdır.");
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);

            const res = await fetch(`/api/contracts/${contract.id}/documents/upload`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                await fetchDocuments();
                alert("Belge başarıyla yüklendi.");
            } else {
                const err = await res.json();
                alert(err.error || "Dosya yüklenemedi.");
            }
        } catch (e) {
            console.error(e);
            alert("Dosya yüklenirken bir sorun oluştu.");
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleDownloadDocument = async (docId: string, fileName: string) => {
        try {
            const res = await fetch(`/api/contracts/documents/${docId}/download`);
            const data = await res.json();

            if (data.success && data.url) {
                const link = document.createElement('a');
                link.href = data.url;
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);
            } else {
                alert(data.error || "İndirme bağlantısı alınamadı");
            }
        } catch (e) {
            console.error(e);
            alert("İndirme sırasında bir hata oluştu");
        }
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!confirm("Belgeyi silmek istediğinize emin misiniz?")) return;
        try {
            const res = await fetch(`/api/contracts/documents/${docId}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchDocuments();
            } else {
                alert("Belge silinemedi.");
            }
        } catch (e) {
            console.error(e);
            alert("Silme sırasında bir hata oluştu.");
        }
    };

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

                    {/* Documents Panel */}
                    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                            <h2 className="text-sm font-bold text-slate-800">Documents</h2>
                            <label className={`text-[10px] uppercase font-bold px-2 py-1 rounded bg-indigo-50 text-indigo-600 cursor-pointer hover:bg-indigo-100 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                {isUploading ? 'Yükleniyor...' : '+ Yükle'}
                                <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" onChange={handleFileUpload} />
                            </label>
                        </div>

                        <div className="space-y-3">
                            {documents.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">No documents attached.</p>
                            ) : (
                                documents.map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between p-2 rounded border border-slate-100 bg-slate-50 group hover:border-slate-300 transition-colors">
                                        <div className="overflow-hidden mr-2">
                                            <p className="text-xs font-semibold text-slate-700 truncate" title={doc.fileName}>{doc.name || doc.fileName}</p>
                                            <p className="text-[10px] text-slate-500 uppercase mt-0.5">
                                                {new Date(doc.createdAt).toLocaleDateString()} • {(doc.size / 1024).toFixed(0)} KB
                                            </p>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <button onClick={() => handleDownloadDocument(doc.id, doc.fileName)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="İndir">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                            </button>
                                            <button onClick={() => handleDeleteDocument(doc.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Sil">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
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

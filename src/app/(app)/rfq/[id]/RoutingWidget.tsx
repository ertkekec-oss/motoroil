"use client";

import { useState, useEffect } from "react";

export default function RoutingWidget({ rfqId }: { rfqId: string }) {
    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState<any>(null);
    const [candidates, setCandidates] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, [rfqId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/network/rfq/${rfqId}/routing-candidates`);
            if (res.ok) {
                const data = await res.json();
                setSession(data.session);
                setCandidates(data.candidates || []);
            }
        } catch (e) {
            console.error("Failed to fetch routing data", e);
        } finally {
            setLoading(false);
        }
    };

    const handlePrepare = async () => {
        setLoading(true);
        try {
            await fetch(`/api/network/rfq/${rfqId}/prepare-routing`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categories: ["CAT-DEFAULT"] })
            });
            await fetchData();
        } catch (e) {
            alert("Error preparing routing");
        } finally {
            setLoading(false);
        }
    };

    const handleRouteWave = async (waveNumber: number) => {
        if (!session) return;
        setLoading(true);
        try {
            await fetch(`/api/network/rfq/${rfqId}/route-wave`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: session.id, waveNumber })
            });
            alert("Wave routed successfully!");
            await fetchData();
        } catch (e) {
            alert("Error routing wave");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !session) return <div className="text-sm text-slate-500">Gelişmiş AI Yönlendirme Analizi Yükleniyor...</div>;

    if (!session) {
        return (
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-slate-800 text-[15px]">AI Routing & Matching (Faz 4)</h3>
                    <p className="text-sm text-slate-500">Bu RFQ için akıllı tedarikçi eşleştirmesini ve otomatik rota planını başlatın.</p>
                </div>
                <button
                    onClick={handlePrepare}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 font-bold rounded-lg text-sm shadow-sm"
                >
                    Prepare Routing Session
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white border hover:border-indigo-300 border-slate-200 shadow-sm p-6 rounded-2xl space-y-6 transition-colors">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                    <h3 className="text-[17px] font-bold text-indigo-900 flex items-center gap-2">
                        <span className="text-xl">🗺️</span> Autonomous Trade Routing Session
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Status: <span className="font-mono font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{session.status}</span> Mode: <span className="font-mono">{session.routingMode}</span></p>
                </div>
            </div>

            {session.waves && session.waves.length > 0 && (
                <div>
                    <h4 className="font-bold text-slate-700 text-sm mb-3">Routing Waves</h4>
                    <div className="flex gap-4">
                        {session.waves.map((w: any) => (
                            <div key={w.id} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="font-bold text-slate-800 text-[13px]">Wave {w.waveNumber}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-200 text-slate-600">{w.status}</div>
                                </div>
                                <div className="text-xs text-slate-500 mb-3">
                                    Aday Sayısı: {w.plannedSuppliersCount}
                                </div>
                                {w.status === "PENDING" && (
                                    <button
                                        className="w-full bg-slate-800 text-white hover:bg-black font-bold text-[12px] py-1.5 rounded-lg transition-colors"
                                        onClick={() => handleRouteWave(w.waveNumber)}
                                        disabled={loading}
                                    >
                                        Execute Wave
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h4 className="font-bold text-slate-700 text-sm mb-3">AI Matched Supplier Candidates</h4>
                {candidates.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No valid candidates found matching routing policy limits.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {candidates.map((c: any, i: number) => (
                            <div key={i} className="border border-slate-200 bg-white p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="font-bold text-[14px] text-slate-900 truncate">Candidate Profile #{c.profileId.slice(-4)}</div>
                                    <div className="text-[12px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">{Math.round(c.totalScore)}% Score</div>
                                </div>
                                <p className="text-[12px] text-slate-600 mb-2 leading-relaxed h-10 overflow-hidden line-clamp-2" title={c.explanation}>{c.explanation}</p>
                                <div className="flex flex-wrap gap-1">
                                    {c.reasonTags.map((t: string, ti: number) => (
                                        <span key={ti} className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.5 rounded-md border border-indigo-100">{t}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

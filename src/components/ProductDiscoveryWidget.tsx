"use client";

import { useState, useEffect } from "react";
import { Check, ArrowRight, X, PlayCircle, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DiscoveryStep {
    id: string;
    title: string;
    desc: string;
    completed: boolean;
    href: string;
}

export default function ProductDiscoveryWidget() {
    const router = useRouter();
    const [progressData, setProgressData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Determine if user dismissed this widget completely
        const dismissed = localStorage.getItem("pdy_discovery_dismissed");
        if (dismissed === "true") {
            setIsDismissed(true);
        }

        async function fetchProgress() {
            try {
                const res = await fetch("/api/support/discovery");
                if (res.ok) {
                    const data = await res.json();
                    setProgressData(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchProgress();
    }, []);

    const dismissWidget = () => {
        setIsDismissed(true);
        localStorage.setItem("pdy_discovery_dismissed", "true");
    };

    if (loading || isDismissed || !progressData || progressData.completedPct === 100) {
        return null;
    }

    const steps: DiscoveryStep[] = progressData.steps || [];

    const { completedPct } = progressData;

    return (
        <div className="mb-8 bg-gradient-to-r from-[#0F172A] to-slate-800 dark:from-[#080911] dark:to-[#0B1120] rounded-2xl shadow-lg relative overflow-hidden border border-slate-700/50">
            {/* Background patterns */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-700/50">

                {/* Left Side: Info & Progress */}
                <div className="p-6 md:w-1/3 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <PlayCircle className="w-5 h-5 text-blue-400" />
                                Periodya'yı Keşfedin
                            </h3>
                            <p className="text-sm text-slate-400 mt-1">
                                Tüm özellikleri kullanarak işinizi büyütün.
                            </p>
                        </div>
                        <button
                            onClick={dismissWidget}
                            className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-700 transition-colors focus:outline-none"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mt-8">
                        <div className="flex justify-between text-xs font-semibold uppercase tracking-wider mb-2">
                            <span className="text-slate-400">Genel İlerleme</span>
                            <span className="text-blue-400">%{completedPct}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${completedPct}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Step Nodes */}
                <div className="p-6 md:w-2/3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                onClick={() => {
                                    if (!step.completed) {
                                        router.push(step.href);
                                    }
                                }}
                                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer 
                  ${step.completed
                                        ? 'bg-slate-800/20 border-emerald-500/20 opacity-60'
                                        : 'bg-slate-800/40 border-slate-600/50 hover:bg-slate-800 hover:border-blue-500/30'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${step.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                                    {step.completed ? <Check className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current"></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-bold truncate ${step.completed ? 'text-emerald-400' : 'text-slate-200'}`}>
                                        {step.title}
                                    </div>
                                    <div className="text-[11px] text-slate-400 truncate">
                                        {step.desc}
                                    </div>
                                </div>
                                {!step.completed && (
                                    <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

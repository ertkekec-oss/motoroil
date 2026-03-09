"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle, X, Search, BookOpen, ChevronRight, FileText, Send } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export default function ContextualHelpWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const pathname = usePathname();
    const router = useRouter();
    const widgetRef = useRef<HTMLDivElement>(null);

    // Close widget when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Contextual topics based on pathname (Mocked for now)
    const getContextualTopics = () => {
        if (pathname.includes("/inventory")) {
            return [
                { title: "Ürün nasıl eklenir?", url: "/help/inventory-add-product" },
                { title: "Stok güncellemeleri", url: "/help/inventory-stock" },
            ];
        }
        if (pathname.includes("/sales")) {
            return [
                { title: "Fatura nasıl kesilir?", url: "/help/sales-invoice" },
                { title: "E-Fatura gönderimi", url: "/help/sales-einvoice" },
            ];
        }
        if (pathname.includes("/customers")) {
            return [
                { title: "Müşteri bakiyesi ekleme", url: "/help/customers-balance" },
                { title: "Cari limit yönetimi", url: "/help/customers-limit" },
            ];
        }
        return [
            { title: "Periodya'ya Hızlı Başlangıç", url: "/help/quickstart" },
            { title: "Kullanıcı Yönetimi", url: "/help/users" },
            { title: "Şirket Ayarları", url: "/help/settings" },
        ];
    };

    const topics = getContextualTopics();

    return (
        <div className="fixed bottom-6 right-6 z-[9999]" ref={widgetRef}>
            {/* Help Popover */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transform transition-all animate-in fade-in slide-in-from-bottom-4 duration-200">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 shrink-0 flex justify-between items-center text-white">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                <span style={{ fontSize: '14px' }}>AI</span>
                            </span>
                            Periodya Asistan
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors focus:outline-none">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[400px] bg-slate-50 dark:bg-[#0B1120] p-4 custom-scrollbar">

                        {/* AI Assistant Chat Preview */}
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 mb-4 shadow-sm">
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Merhaba! Bu sayfa ({pathname}) hakkında veya genel konularda arama yapabilirsiniz.
                            </p>
                        </div>

                        {/* Contextual Topics */}
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">
                            Önerilen Makaleler
                        </h4>
                        <div className="space-y-2 mb-4">
                            {topics.map((topic, i) => (
                                <Link
                                    key={i}
                                    href={topic.url}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700/50 transition-colors group"
                                >
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                                        <span className="text-xs font-semibold">{topic.title}</span>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </Link>
                            ))}
                        </div>

                        {/* Smart Ticket Link */}
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">
                            Destek Ekibi
                        </h4>
                        <Link
                            href="/support/new"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-900/10 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-orange-200 dark:hover:border-orange-900/30 transition-all group"
                        >
                            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-700 dark:group-hover:text-orange-400">Destek Talebi Aç</div>
                                <div className="text-[10px] text-slate-500">Ekibimizle iletişime geçin</div>
                            </div>
                        </Link>
                    </div>

                    {/* Search Footer */}
                    <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Nasıl yaparız?..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && query.trim()) {
                                        router.push(`/help?q=${encodeURIComponent(query)}`);
                                        setIsOpen(false);
                                    }
                                }}
                                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg pl-3 pr-10 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700 p-1 rounded-md"
                                onClick={() => {
                                    if (query.trim()) {
                                        router.push(`/help?q=${encodeURIComponent(query)}`);
                                        setIsOpen(false);
                                    }
                                }}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all
          ${isOpen ? 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700' : 'bg-blue-600 hover:bg-blue-700'}
        `}
            >
                {isOpen ? <X className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
            </button>
        </div>
    );
}

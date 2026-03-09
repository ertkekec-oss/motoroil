"use client";

import { useState } from "react";
import { Search, Loader2, Sparkles, AlertCircle, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HelpSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!query.trim()) {
            setResults([]);
            setAiSuggestion(null);
            return;
        }

        setIsSearching(true);
        setAiSuggestion(null);
        try {
            const res = await fetch(`/api/support/ai/assistant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });
            const data = await res.json();
            if (res.ok) {
                setResults(data.articles || []);
                if (data.suggestion) {
                    setAiSuggestion(data.suggestion);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto -mt-6 mb-12 relative z-10">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="block w-full pl-12 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg text-lg transition-shadow"
                    placeholder="Size nasıl yardımcı olabiliriz? (örn. e-fatura gönderimi)"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50"
                    >
                        {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* AI Suggestion Area */}
            {aiSuggestion && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-2xl animate-in fade-in slide-in-from-top-2 flex gap-3">
                    <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-blue-800 dark:text-blue-400 mb-1">AI Asistan Yanıtı</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{aiSuggestion}</p>
                    </div>
                </div>
            )}

            {/* Search Results */}
            {results.length > 0 && (
                <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Bulunan Makaleler</h4>
                    </div>
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {results.map((article: any, i) => (
                            <li key={i}>
                                <Link href={`/help/${article.slug}`} className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {article.title}
                                                </p>
                                                {article.excerpt && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{article.excerpt}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* No Results state */}
            {!isSearching && query.trim() !== "" && results.length === 0 && !aiSuggestion && (
                <div className="mt-4 p-4 text-center text-slate-500 dark:text-slate-400 animate-in fade-in">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sonuç bulunamadı. Lütfen farklı kelimelerle tekrar deneyin.</p>
                </div>
            )}
        </div>
    );
}


import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages = [];
    // Simple logic for now: show all pages if small, or limited range
    // For simplicity given the request "2-3-4", let's try to show a reasonable window.
    // If totalPages is large, we might want to handle ellipsis, but let's start with a simple sliding window or just all if < 10.

    // Logic: Always show 1, Last, and surrounding of current.
    // To keep it robust but simple for this iteration:

    for (let i = 1; i <= totalPages; i++) {
        // Show current, first, last, and +2/-2 neighbors
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            pages.push(i);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            pages.push('...');
        }
    }

    // De-duplicate '...' if logic creates adjacent ones (simple approach above might suffice for basic usage)
    const uniquePages = pages.filter((p, i, a) => p !== a[i - 1] || p !== '...'); // simple dedup not strictly needed with correct logic but good safety

    return (
        <div className="flex justify-center items-center gap-2 mt-6 p-4 animate-in fade-in">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-[12px] bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 text-[13px] font-bold transition-all"
            >
                ← Önceki
            </button>

            <div className="flex items-center gap-1.5">
                {uniquePages?.map((p, idx) => (
                    <button
                        key={idx}
                        onClick={() => typeof p === 'number' ? onPageChange(p) : null}
                        disabled={typeof p !== 'number'}
                        className={`min-w-[40px] h-[40px] flex items-center justify-center rounded-[12px] text-[13px] font-bold transition-all border ${
                            p === currentPage
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/30 dark:shadow-indigo-500/20'
                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/10'
                        } ${typeof p !== 'number' ? 'cursor-default !bg-transparent !border-transparent !text-slate-400 dark:!text-slate-500 !shadow-none' : ''}`}
                    >
                        {p}
                    </button>
                ))}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-[12px] bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 text-[13px] font-bold transition-all"
            >
                Sonraki →
            </button>

            <span className="text-slate-400 dark:text-white/30 text-[12px] font-bold ml-4 border-l border-slate-200 dark:border-slate-800 pl-4 py-1">
                Toplam {totalPages} Sayfa
            </span>
        </div>
    );
}

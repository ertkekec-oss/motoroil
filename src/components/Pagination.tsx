
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
        <div className="flex justify-center items-center gap-2 mt-6 p-4 animate-fade-in">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-white/70 text-sm font-bold transition-all"
            >
                ← Önceki
            </button>

            {uniquePages.map((p, idx) => (
                <button
                    key={idx}
                    onClick={() => typeof p === 'number' ? onPageChange(p) : null}
                    disabled={typeof p !== 'number'}
                    className={`min-w-[40px] h-[40px] px-2 rounded-lg text-sm font-bold transition-all border ${p === currentPage
                            ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        } ${typeof p !== 'number' ? 'cursor-default !bg-transparent !border-transparent' : ''}`}
                >
                    {p}
                </button>
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-white/70 text-sm font-bold transition-all"
            >
                Sonraki →
            </button>

            <span className="text-white/30 text-xs font-medium ml-4">
                Toplam {totalPages} Sayfa
            </span>
        </div>
    );
}

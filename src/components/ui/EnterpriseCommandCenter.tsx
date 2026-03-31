import React from 'react';
import Link from 'next/link';

interface ActionItem {
    label: string;
    icon?: string;
    onClick?: () => void;
    href?: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    hidden?: {
        sm?: boolean;
        md?: boolean;
        lg?: boolean;
    };
}

interface EnterpriseCommandCenterProps {
    title: string;
    titleSuffix?: React.ReactNode;
    backLink: string;
    backLabel: string;
    avatarInitials: string;
    avatarGradient?: string;
    category?: string;
    contact?: {
        phone?: string | null;
        email?: string | null;
        address?: string | null;
    };
    balance: {
        value: number;
        positiveLabel: string;
        negativeLabel: string;
        neutralLabel: string;
        positiveColor?: string; // Tailwind class
        negativeColor?: string; // Tailwind class
    };
    metrics?: {
        label: string;
        value: string | number;
        icon?: string;
        colorClass?: string;
    }[];
    actions: React.ReactNode;
    tabs: {
        group: string;
        items: { id: string; label: string }[];
    }[];
    activeTab: string;
    onTabChange: (id: string) => void;
    tabRightElement?: React.ReactNode;
}

export default function EnterpriseCommandCenter({
    title,
    titleSuffix,
    backLink,
    backLabel,
    avatarInitials,
    avatarGradient = 'from-indigo-900 to-indigo-500',
    category,
    contact,
    balance,
    metrics = [],
    actions,
    tabs,
    activeTab,
    onTabChange,
    tabRightElement
}: EnterpriseCommandCenterProps) {
    return (
        <div className="sticky top-0 z-40 bg-slate-50/95 dark:bg-[#0f172a]/95 backdrop-blur-md pb-4 pt-4 mb-6 border-b border-slate-200 dark:border-white/5 space-y-4 w-full">
            {/* PROFILE & COMPACT METRICS & ACTIONS */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-start justify-between gap-6 w-full">
                
                {/* Left: Avatar & Info */}
                <div className="flex flex-col gap-4">
                    <Link href={backLink} className="text-slate-500 hover:text-blue-600 dark:text-slate-400 font-semibold text-[13px] flex items-center gap-2 transition-colors">
                        <span className="text-[16px]">←</span> {backLabel}
                    </Link>
                    <div className="flex gap-4 items-center">
                        <div className={`w-14 h-14 rounded-[14px] bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-[24px] font-black text-white shadow-sm border border-white/10 shrink-0`}>
                            {avatarInitials}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-[20px] font-black m-0 text-slate-900 dark:text-white leading-tight flex items-center gap-3">
                                    {title}
                                    {titleSuffix}
                                </h1>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                                {category && <span className="flex items-center gap-1.5"><span className="opacity-60">🏷️</span> {category}</span>}
                                {contact?.phone && <span className="flex items-center gap-1.5"><span className="opacity-60">📱</span> {contact.phone}</span>}
                                {contact?.email && <span className="flex items-center gap-1.5"><span className="opacity-60">📧</span> {contact.email}</span>}
                                {contact?.address && (
                                    <span className="flex items-center gap-1.5"><span className="opacity-60">📍</span>
                                        {contact.address}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Actions & Balance */}
                <div className="flex flex-wrap items-center justify-end gap-3 flex-1 w-full md:w-auto mt-4 xl:mt-0 xl:ml-auto">
                    {/* Quick Actions Injection */}
                    <div className="flex flex-wrap items-center gap-2">
                        {actions}
                    </div>

                    {/* Metrics */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Primary Balance Badge */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[14px] ${balance.value > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : balance.value < 0 ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-slate-50 dark:bg-slate-700 text-slate-500'}`}>💰</div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {`${balance.value > 0 ? balance.positiveLabel : balance.value < 0 ? balance.negativeLabel : balance.neutralLabel}`} Bakiyesi
                                </div>
                                <div className={`text-[16px] font-black leading-none mt-0.5 ${balance.value > 0 ? (balance.positiveColor || 'text-emerald-600 dark:text-emerald-400') : balance.value < 0 ? (balance.negativeColor || 'text-red-600 dark:text-red-400') : 'text-slate-900 dark:text-white'}`}>
                                    {Math.abs(balance.value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                </div>
                            </div>
                        </div>
                        
                        {/* Custom Metrics array */}
                        {metrics.map((metric, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-[10px] flex items-center gap-3 shadow-sm">
                                {metric.icon && <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[14px] ${metric.colorClass || 'bg-slate-50 dark:bg-slate-700 text-slate-500'}`}>{metric.icon}</div>}
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{metric.label}</div>
                                    <div className={`text-[16px] font-black leading-none mt-0.5 ${metric.colorClass || 'text-slate-900 dark:text-white'}`}>{metric.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* GROUPED NAVIGATION & FILTERS */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex w-full lg:w-max whitespace-nowrap overflow-x-auto items-center gap-6 px-1 custom-scroll select-none pb-1">
                    {tabs.map((grp, i) => (
                        <div key={grp.group} className="flex items-center gap-3">
                            {i !== 0 && <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 hidden sm:block"></div>}
                            <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/30 p-1 rounded-lg border border-slate-200/50 dark:border-white/5">
                                {grp.items.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => onTabChange(tab.id)}
                                        className={activeTab === tab.id
                                            ? "px-4 py-1.5 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-[#0f172a] shadow-sm border border-slate-200/50 dark:border-white/10 rounded-[6px]"
                                            : "px-4 py-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-[6px]"
                                        }
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {tabRightElement && (
                    <div className="flex items-center gap-2 w-full md:w-auto ml-auto justify-end mt-4 lg:mt-0">
                        {tabRightElement}
                    </div>
                )}
            </div>
        </div>
    );
}

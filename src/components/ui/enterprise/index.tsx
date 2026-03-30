import React from 'react';

// ─── EnterpriseCard ────────────────────────────────────────────────────────────
export const EnterpriseCard = ({
    children,
    className = '',
    noPadding = false,
    borderLeftColor = '',
    onClick
}: {
    children?: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    borderLeftColor?: string;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
}) => {
    return (
        <div
            onClick={onClick}
            className={`bg-white dark:bg-[#1e293b] !border-none rounded-[24px] shadow-sm md:shadow-md relative overflow-hidden group transition-all duration-300 ${noPadding ? '' : 'p-6 md:p-8'} ${className}`}
            style={borderLeftColor ? { borderLeft: `5px solid ${borderLeftColor}` } : {}}
        >
            {/* Ambient Background Glow Effect (Subtle) */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-teal-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3 pointer-events-none transition-all duration-500"></div>
            <div className="relative z-10 w-full">
                {children}
            </div>
        </div>
    );
};

// ─── EnterpriseSectionHeader ───────────────────────────────────────────────────
export const EnterpriseSectionHeader = ({
    title,
    subtitle,
    icon,
    rightElement
}: {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    rightElement?: React.ReactNode;
}) => {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-6 mb-8 relative z-10">
            <div className="flex items-start gap-4 flex-1">
                {icon && (
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-indigo-500 dark:text-indigo-400 border border-slate-100 dark:border-white/5 shrink-0 shadow-sm">
                        {icon}
                    </div>
                )}
                <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">{title}</h3>
                    {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{subtitle}</p>}
                </div>
            </div>
            {rightElement && (
                <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                    {rightElement}
                </div>
            )}
        </div>
    );
};

// ─── EnterpriseField ───────────────────────────────────────────────────────────
export const EnterpriseField = ({
    label,
    hint,
    error,
    children,
    className = ''
}: {
    label?: string;
    hint?: string;
    error?: string;
    children?: React.ReactNode;
    className?: string;
}) => {
    return (
        <div className={`space-y-2 relative z-10 ${className}`}>
            {label && (
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1 flex justify-between items-center">
                    {label}
                </label>
            )}
            {children}
            {hint && !error && <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium px-1">{hint}</p>}
            {error && <p className="text-[11px] font-bold text-rose-500 dark:text-rose-400 px-1">{error}</p>}
        </div>
    );
};

// ─── EnterpriseInput ───────────────────────────────────────────────────────────
export const EnterpriseInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string }>(
    ({ className = '', label, hint, error, ...props }, ref) => {
        const inputEl = (
            <input
                ref={ref}
                className={`w-full h-11 px-4 bg-white dark:bg-[#0f172a] border ${error ? 'border-rose-400 dark:border-rose-500/50 focus:ring-rose-500/30' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/50'} rounded-[16px] text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all shadow-sm read-only:bg-slate-50 dark:read-only:bg-slate-900/50 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
                {...props}
            />
        );
        if (label || hint || error) {
            return <EnterpriseField label={label} hint={hint} error={error}>{inputEl}</EnterpriseField>;
        }
        return inputEl;
    }
);
EnterpriseInput.displayName = 'EnterpriseInput';

// ─── EnterpriseSelect ──────────────────────────────────────────────────────────
export const EnterpriseSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; hint?: string; error?: string }>(
    ({ className = '', label, hint, error, children, ...props }, ref) => {
        const selectEl = (
            <div className="relative">
                <select
                    ref={ref}
                    className={`w-full h-11 pl-4 pr-10 bg-white dark:bg-[#0f172a] border ${error ? 'border-rose-400 dark:border-rose-500/50 focus:ring-rose-500/30' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/50'} rounded-[16px] text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all shadow-sm appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
                    {...props}
                >
                    {children}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>
        );
        if (label || hint || error) {
            return <EnterpriseField label={label} hint={hint} error={error}>{selectEl}</EnterpriseField>;
        }
        return selectEl;
    }
);
EnterpriseSelect.displayName = 'EnterpriseSelect';

// ─── EnterpriseTextarea ────────────────────────────────────────────────────────
export const EnterpriseTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string; error?: string }>(
    ({ className = '', label, hint, error, ...props }, ref) => {
        const textareaEl = (
            <textarea
                ref={ref}
                className={`w-full p-4 min-h-[120px] bg-white dark:bg-[#0f172a] border ${error ? 'border-rose-400 dark:border-rose-500/50 focus:ring-rose-500/30' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/50'} rounded-[16px] text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all shadow-sm resize-y disabled:opacity-60 placeholder:text-slate-400 dark:placeholder:text-slate-600 ${className}`}
                {...props}
            />
        );
        if (label || hint || error) {
            return <EnterpriseField label={label} hint={hint} error={error}>{textareaEl}</EnterpriseField>;
        }
        return textareaEl;
    }
);
EnterpriseTextarea.displayName = 'EnterpriseTextarea';

// ─── EnterpriseButton ──────────────────────────────────────────────────────────
export const EnterpriseButton = ({
    children,
    variant = 'primary',
    className = '',
    ...props
}: {
    children?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    const baseStyles = "h-11 px-6 rounded-full text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed outline-none whitespace-nowrap shadow-sm";

    const variants: Record<string, string> = {
        primary: "bg-slate-900 dark:bg-emerald-600 text-white hover:bg-slate-800 dark:hover:bg-emerald-500 border border-transparent shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(16,185,129,0.3)]",
        secondary: "bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
        danger: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

// ─── EnterpriseSwitch ──────────────────────────────────────────────────────────
export const EnterpriseSwitch = ({
    checked,
    onChange,
    label,
    description,
    className = ''
}: {
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label?: string;
    description?: string;
    className?: string;
}) => {
    return (
        <label className={`flex items-center gap-4 p-4 bg-white dark:bg-[#1e293b] hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-[24px] border border-slate-200 dark:border-white/5 cursor-pointer transition-all select-none shadow-sm relative z-10 ${className}`}>
            <div className={`w-12 rounded-full relative transition-all duration-300 shrink-0 border ${checked ? 'bg-indigo-500 dark:bg-emerald-500 border-indigo-600 dark:border-emerald-400' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}
                style={{ height: '26px' }}>
                <div className={`absolute top-[2px] w-[20px] h-[20px] rounded-full transition-all duration-300 shadow-sm ${checked ? 'left-[26px] bg-white' : 'left-[2px] bg-white dark:bg-slate-400'}`} />
            </div>
            <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
            <div className="flex-1">
                {label && <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">{label}</div>}
                {description && <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">{description}</div>}
            </div>
        </label>
    );
};

// ─── EnterpriseTable ───────────────────────────────────────────────────────────
export const EnterpriseTable = ({
    headers,
    children,
    className = ''
}: {
    headers: Array<string | { label: string; alignRight?: boolean }>;
    children?: React.ReactNode;
    className?: string;
}) => {
    return (
        <div className={`w-full overflow-x-auto rounded-[24px] border border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] shadow-sm relative z-10 ${className}`}>
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 dark:bg-slate-900/50 sticky top-0 z-10 border-b border-slate-200 dark:border-white/5">
                    <tr>
                        {headers?.map((h, i: number) => (
                            <th key={i} className={`h-11 px-6 text-[10px] font-bold text-slate-500 dark:text-slate-400/80 uppercase tracking-widest whitespace-nowrap ${typeof h === 'object' && h.alignRight ? 'text-right' : ''}`}>
                                {typeof h === 'object' ? h.label : h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {children}
                </tbody>
            </table>
        </div>
    );
};

// ─── EnterprisePageShell ───────────────────────────────────────────────────────
export const EnterprisePageShell = ({
    title,
    description,
    actions,
    children,
    className = ''
}: {
    title?: string;
    description?: string;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}) => {
    return (
        <div className={`bg-slate-50 dark:bg-[#0f172a] min-h-screen w-full font-sans pb-16 ${className}`}>
            <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 space-y-8">
                {(title || actions) && (
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border-b border-slate-200 dark:border-white/10 pb-6">
                        <div>
                            {title && (
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                    {title}
                                </h1>
                            )}
                            {description && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">{description}</p>
                            )}
                        </div>
                        {actions && <div className="shrink-0">{actions}</div>}
                    </div>
                )}
                <div className="space-y-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

// ─── EnterpriseTabs ────────────────────────────────────────────────────────────
export const EnterpriseTabs = ({
    tabs,
    activeTab,
    onTabChange,
    className = ''
}: {
    tabs: Array<{ id: string; label: string; icon?: React.ReactNode }>;
    activeTab: string;
    onTabChange: (id: string) => void;
    className?: string;
}) => {
    return (
        <div className={`flex flex-wrap gap-2 p-1.5 bg-white dark:bg-[#1e293b] rounded-[24px] border border-slate-200 dark:border-white/5 w-fit mb-8 shadow-sm relative z-10 ${className}`}>
            {tabs?.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`px-5 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === tab.id
                        ? 'bg-slate-900 dark:bg-slate-800 text-white dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                >
                    {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>
    );
};

// ─── EnterpriseEmptyState ──────────────────────────────────────────────────────
export const EnterpriseEmptyState = ({
    icon,
    title,
    description,
    action,
    className = ''
}: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}) => {
    return (
        <div className={`flex flex-col items-center justify-center p-16 text-center w-full rounded-[24px] border border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] shadow-sm relative z-10 ${className}`}>
            {icon && (
                <div className="text-slate-400 dark:text-slate-500 mb-6 opacity-50 relative">
                    {/* Ambient glow behind icon */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-indigo-500/10 dark:bg-emerald-500/10 rounded-full blur-[20px] pointer-events-none"></div>
                    <div className="relative z-10">{icon}</div>
                </div>
            )}
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-widest uppercase mb-2">{title}</h3>
            {description && (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">{description}</p>
            )}
            {action && <div className="mt-8">{action}</div>}
        </div>
    );
};

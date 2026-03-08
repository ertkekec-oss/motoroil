import React from 'react';

// ─── EnterpriseCard ────────────────────────────────────────────────────────────
// Token: border only, shadow-sm max, no glow, rounded-xl
export const EnterpriseCard = ({
    children,
    className = '',
    noPadding = false,
    borderLeftColor = ''
}: {
    children?: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    borderLeftColor?: string;
}) => {
    return (
        <div
            className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm ${noPadding ? '' : 'p-6'} ${className}`}
            style={borderLeftColor ? { borderLeft: `4px solid ${borderLeftColor}` } : {}}
        >
            {children}
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
            {icon && (
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg border border-slate-200 dark:border-slate-700 shrink-0">
                    {icon}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">{title}</h3>
                {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            {rightElement && (
                <div className="sm:ml-auto shrink-0">
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
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {label}
                </label>
            )}
            {children}
            {hint && !error && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
            {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>
    );
};

// ─── EnterpriseInput ───────────────────────────────────────────────────────────
export const EnterpriseInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string }>(
    ({ className = '', label, hint, error, ...props }, ref) => {
        const inputEl = (
            <input
                ref={ref}
                className={`w-full h-10 px-3.5 bg-white dark:bg-slate-950 border ${error ? 'border-rose-400 focus:ring-rose-400/30' : 'border-slate-200 dark:border-slate-800 focus:ring-slate-400/20'} rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:border-slate-400 dark:focus:border-slate-600 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-400 dark:placeholder:text-slate-600 read-only:bg-slate-50 dark:read-only:bg-slate-900 ${className}`}
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
            <select
                ref={ref}
                className={`w-full h-10 px-3.5 bg-white dark:bg-slate-950 border ${error ? 'border-rose-400 focus:ring-rose-400/30' : 'border-slate-200 dark:border-slate-800 focus:ring-slate-400/20'} rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:border-slate-400 dark:focus:border-slate-600 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50 ${className}`}
                {...props}
            >
                {children}
            </select>
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
                className={`w-full p-3.5 min-h-[100px] bg-white dark:bg-slate-950 border ${error ? 'border-rose-400 focus:ring-rose-400/30' : 'border-slate-200 dark:border-slate-800 focus:ring-slate-400/20'} rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:border-slate-400 dark:focus:border-slate-600 transition-all outline-none resize-y disabled:opacity-50 placeholder:text-slate-400 dark:placeholder:text-slate-600 ${className}`}
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
// rounded-lg (not full), slate-900 primary, no glow/gradient
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
    const baseStyles = "h-10 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer outline-none whitespace-nowrap";

    const variants: Record<string, string> = {
        primary: "bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white dark:bg-white dark:hover:bg-slate-100 dark:active:bg-slate-200 dark:text-slate-900",
        secondary: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600",
        danger: "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white border border-rose-700"
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
        <label className={`flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer transition-all select-none ${className}`}>
            <div className={`w-10 rounded-full relative transition-all duration-200 shrink-0 ${checked ? 'bg-slate-900 dark:bg-white' : 'bg-slate-200 dark:bg-slate-700'}`}
                style={{ height: '22px' }}>
                <div className={`absolute top-[3px] w-4 h-4 rounded-full transition-all duration-200 ${checked ? 'left-[22px] bg-white dark:bg-slate-900' : 'left-[3px] bg-white dark:bg-slate-400'}`} />
            </div>
            <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
            <div className="flex-1">
                {label && <div className="text-sm font-medium text-slate-900 dark:text-white leading-tight">{label}</div>}
                {description && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</div>}
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
        <div className={`w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${className}`}>
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                        {headers?.map((h, i: number) => (
                            <th key={i} className={`h-10 px-4 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap ${typeof h === 'object' && h.alignRight ? 'text-right' : ''}`}>
                                {typeof h === 'object' ? h.label : h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {children}
                </tbody>
            </table>
        </div>
    );
};

// ─── EnterprisePageShell ───────────────────────────────────────────────────────
// Root container — full width, no max-w lock (parent controls width)
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
        <div className={`w-full px-8 py-10 max-w-[1280px] mx-auto ${className}`}>
            {(title || actions) && (
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                    <div>
                        {title && (
                            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                                {title}
                            </h1>
                        )}
                        {description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
                        )}
                    </div>
                    {actions && <div className="shrink-0">{actions}</div>}
                </div>
            )}
            <div className="space-y-6">
                {children}
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
    tabs: Array<{ id: string; label: string; icon?: string }>;
    activeTab: string;
    onTabChange: (id: string) => void;
    className?: string;
}) => {
    return (
        <div className={`flex flex-wrap gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-fit mb-6 shadow-sm ${className}`}>
            {tabs?.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${activeTab === tab.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    {tab.icon && <span>{tab.icon}</span>}
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>
    );
};

// ─── EnterpriseEmptyState ──────────────────────────────────────────────────────
// Corporate: muted icon, no glow, no color
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
        <div className={`flex flex-col items-center justify-center py-16 px-6 text-center text-slate-500 ${className}`}>
            {icon && (
                <div className="text-3xl text-slate-300 dark:text-slate-600 mb-4">
                    {icon}
                </div>
            )}
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
            {description && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">{description}</p>
            )}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
};

import React from 'react';

export const EnterpriseCard = ({ children, className = '', noPadding = false, borderLeftColor = '' }) => {
    return (
        <div
            className={`bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm ${noPadding ? '' : 'p-8'} ${className}`}
            style={borderLeftColor ? { borderLeft: `4px solid ${borderLeftColor}` } : {}}
        >
            {children}
        </div>
    );
};

export const EnterpriseSectionHeader = ({ title, subtitle, icon, rightElement }) => {
    return (
        <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-slate-200 dark:border-slate-800 pb-8 mb-8">
            {icon && (
                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                    {icon}
                </div>
            )}
            <div className="text-center sm:text-left flex-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h3>
                {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{subtitle}</p>}
            </div>
            {rightElement && (
                <div className="sm:ml-auto">
                    {rightElement}
                </div>
            )}
        </div>
    );
};

export const EnterpriseField = ({ label, children, className = '' }) => {
    return (
        <div className={`space-y-2 ${className}`}>
            {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
            {children}
        </div>
    );
};

export const EnterpriseInput = React.forwardRef(({ className = '', label, ...props }, ref) => {
    const inputEl = (
        <input
            ref={ref}
            className={`w-full h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all outline-none disabled:opacity-50 ${className}`}
            {...props}
        />
    );
    if (label) {
        return <EnterpriseField label={label}>{inputEl}</EnterpriseField>;
    }
    return inputEl;
});
EnterpriseInput.displayName = 'EnterpriseInput';

export const EnterpriseSelect = React.forwardRef(({ className = '', label, children, ...props }, ref) => {
    const selectEl = (
        <select
            ref={ref}
            className={`w-full h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50 ${className}`}
            {...props}
        >
            {children}
        </select>
    );
    if (label) {
        return <EnterpriseField label={label}>{selectEl}</EnterpriseField>;
    }
    return selectEl;
});
EnterpriseSelect.displayName = 'EnterpriseSelect';

export const EnterpriseTextarea = React.forwardRef(({ className = '', label, ...props }, ref) => {
    const textareaEl = (
        <textarea
            ref={ref}
            className={`w-full p-4 min-h-[100px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 hover:border-slate-300 dark:hover:border-slate-600 transition-all outline-none resize-y disabled:opacity-50 ${className}`}
            {...props}
        />
    );
    if (label) {
        return <EnterpriseField label={label}>{textareaEl}</EnterpriseField>;
    }
    return textareaEl;
});
EnterpriseTextarea.displayName = 'EnterpriseTextarea';

export const EnterpriseButton = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyles = "h-11 px-5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer outline-none shadow-sm";

    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white",
        secondary: "bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300",
        danger: "bg-rose-600 hover:bg-rose-700 text-white"
    };

    return (
        <button className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`} {...props}>
            {children}
        </button>
    );
};

export const EnterpriseSwitch = ({ checked, onChange, label, description, className = '' }) => {
    return (
        <label className={`flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-all select-none group ${className}`}>
            <div className={`w-11 h-6 rounded-full relative transition-all duration-300 shrink-0 ${checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${checked ? 'left-6' : 'left-1'}`} />
            </div>
            <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
            <div className="flex-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{label}</div>
                {description && <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">{description}</div>}
            </div>
        </label>
    );
};

export const EnterpriseTable = ({ headers, children, className = '' }) => {
    return (
        <div className={`w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-sm ${className}`}>
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                        {headers.map((h, i: number) => (
                            <th key={i} className={`h-11 px-5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap ${h.alignRight ? 'text-right' : ''}`}>
                                {h.label || h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {children}
                </tbody>
            </table>
        </div>
    );
};

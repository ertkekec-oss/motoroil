import React from 'react';

export const EnterpriseCard = ({ children, className = '', noPadding = false, borderLeftColor = '' }: any) => {
    return (
        <div
            className={`bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ${noPadding ? '' : 'p-8'} ${className}`}
            style={borderLeftColor ? { borderLeft: `4px solid ${borderLeftColor}` } : {}}
        >
            {children}
        </div>
    );
};

export const EnterpriseSectionHeader = ({ title, subtitle, icon, rightElement }: any) => {
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

export const EnterpriseInput = React.forwardRef(({ className = '', label, ...props }: any, ref: any) => {
    return (
        <div className={`space-y-2 ${className}`}>
            {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
            <input
                ref={ref}
                className="w-full h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all outline-none disabled:opacity-50"
                {...props}
            />
        </div>
    );
});
EnterpriseInput.displayName = 'EnterpriseInput';

export const EnterpriseSelect = React.forwardRef(({ className = '', label, children, ...props }: any, ref: any) => {
    return (
        <div className={`space-y-2 ${className}`}>
            {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
            <select
                ref={ref}
                className="w-full h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50"
                {...props}
            >
                {children}
            </select>
        </div>
    );
});
EnterpriseSelect.displayName = 'EnterpriseSelect';

export const EnterpriseTextarea = React.forwardRef(({ className = '', label, ...props }: any, ref: any) => {
    return (
        <div className={`space-y-2 ${className}`}>
            {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
            <textarea
                ref={ref}
                className="w-full p-4 min-h-[100px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 hover:border-slate-300 dark:hover:border-slate-600 transition-all outline-none resize-y disabled:opacity-50"
                {...props}
            />
        </div>
    );
});
EnterpriseTextarea.displayName = 'EnterpriseTextarea';

export const EnterpriseButton = ({ children, variant = 'primary', className = '', ...props }: any) => {
    let baseStyles = "px-6 h-[44px] rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer outline-none shadow-sm";

    let variants: any = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white border border-transparent ",
        secondary: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400",
        danger: "bg-rose-600 hover:bg-rose-700 text-white border-0",
        warning: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl  border border-amber-200 dark:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300/10 dark: dark: hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300/30",
        outline: "bg-transparent border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
        ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-none border border-transparent"
    };

    return (
        <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

export const EnterpriseSwitch = ({ checked, onChange, label, description, className = '' }: any) => {
    return (
        <label className={`flex items-center gap-5 p-5 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-xl border border-slate-200 dark:border-white/5 cursor-pointer transition-all select-none group ${className}`}>
            <div className={`w-12 h-6 rounded-full relative transition-all duration-300 shrink-0 ${checked ? 'bg-blue-600 shadow-inner' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${checked ? 'left-7' : 'left-1'}`} />
            </div>
            <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
            <div>
                <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{label}</div>
                {description && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium leading-tight">{description}</div>}
            </div>
        </label>
    );
};

export const EnterpriseTable = ({ headers, children, className = '' }: any) => {
    return (
        <div className={`w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-sm ${className}`}>
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                        {headers.map((h: any, i: number) => (
                            <th key={i} className={`h-[52px] px-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap ${h.alignRight ? 'text-right' : ''}`}>
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

export const EnterpriseModal = ({ isOpen, onClose, title, children, footer, className = '' }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/60  animate-in fade-in duration-200">
            <div className={`bg-white dark:bg-[#0F172A] rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 ${className}`}>
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800/80">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                        ✕
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
                {footer && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/80 flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

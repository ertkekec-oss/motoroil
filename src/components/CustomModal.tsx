"use client";

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, HelpCircle, X } from 'lucide-react';

interface CustomModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message?: string;
    content?: React.ReactNode;
    type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    size?: 'small' | 'medium' | 'large' | 'wide';
}

export default function CustomModal({
    isOpen,
    onClose,
    title,
    message,
    content,
    type = 'info',
    onConfirm,
    confirmText = 'Tamam',
    cancelText = 'İptal',
    size = 'medium'
}: CustomModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        } else {
            setIsProcessing(false);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const config = {
        success: { icon: CheckCircle2, iconColor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' },
        error: { icon: AlertCircle, iconColor: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20' },
        warning: { icon: AlertTriangle, iconColor: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20' },
        info: { icon: Info, iconColor: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20' },
        confirm: { icon: HelpCircle, iconColor: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-500/10', border: 'border-slate-200 dark:border-slate-700' }
    };

    const current = config[type] || config.info;
    const IconComponent = current.icon;

    const sizeClasses = {
        small: 'max-w-[400px]',
        medium: 'max-w-[500px]',
        large: 'max-w-[800px]',
        wide: 'max-w-[1200px]'
    };

    const btnBaseStyles = "min-h-[52px] px-6 rounded-xl font-bold text-[15px] transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer outline-none whitespace-nowrap";
    const btnPrimary = type === 'error'
        ? "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white border border-rose-700"
        : "bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white dark:bg-white dark:hover:bg-slate-100 dark:active:bg-slate-200 dark:text-slate-900";
    const btnSecondary = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className={`w-full ${sizeClasses[size]} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-6 sm:p-10 animate-in relative flex flex-col items-center text-center`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Kapat"
                >
                    <X strokeWidth={2} className="w-5 h-5" />
                </button>

                {/* Icon Area */}
                <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-sm ${current.bg} ${current.border} border-2`}
                >
                    <IconComponent className={`w-7 h-7 ${current.iconColor}`} strokeWidth={2.5} />
                </div>

                {/* Text Content */}
                <h3 className="text-2xl font-black mb-3 text-slate-900 dark:text-white tracking-tight">
                    {title}
                </h3>

                {content ? (
                    <div className="text-left mb-10 w-full">
                        {content}
                    </div>
                ) : (
                    <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-10 max-w-[95%] mx-auto">
                        {message}
                    </p>
                )}

                {/* Actions */}
                <div className="flex gap-4 w-full">
                    {(String(type) === 'confirm' || (onConfirm && String(type) !== 'confirm')) && (
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className={`flex-1 ${btnBaseStyles} ${btnSecondary}`}
                        >
                            {String(type) === 'confirm' ? cancelText : 'Kapat'}
                        </button>
                    )}
                    <button
                        onClick={async () => {
                            if (onConfirm) {
                                setIsProcessing(true);
                                try {
                                    await onConfirm();
                                } catch (e) {
                                    console.error("Modal Action Failed:", e);
                                    setIsProcessing(false);
                                }
                            } else {
                                onClose();
                            }
                        }}
                        disabled={isProcessing}
                        className={`flex-1 ${btnBaseStyles} ${btnPrimary} shadow-sm`}
                    >
                        {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

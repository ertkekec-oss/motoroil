
"use client";

import { useEffect, useState } from 'react';

interface CustomModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export default function CustomModal({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    onConfirm,
    confirmText = 'Tamam',
    cancelText = 'İptal'
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
        success: { icon: '✅', color: '#10B981', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]' },
        error: { icon: '❌', color: '#FF3333', glow: 'shadow-[0_0_30px_rgba(255,51,51,0.3)]' },
        warning: { icon: '⚠️', color: '#F59E0B', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]' },
        info: { icon: 'ℹ️', color: '#3B82F6', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]' },
        confirm: { icon: '❓', color: '#8B5CF6', glow: 'shadow-[0_0_30px_rgba(139,92,246,0.3)]' }
    };

    const current = config[type];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/85 backdrop-blur-xl animate-fade-in" onClick={onClose}>
            <div
                className="w-full max-w-[500px] glass-plus rounded-[40px] p-12 border shadow-[0_50px_100px_rgba(0,0,0,0.9)] animate-in relative overflow-hidden text-center"
                style={{ borderColor: `${current.color}40` }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Visual Flair */}
                <div
                    className="absolute -top-24 -left-24 w-64 h-64 rounded-full blur-[100px] opacity-10"
                    style={{ background: current.color }}
                ></div>

                {/* Icon Sphere */}
                <div
                    className={`w-24 h-24 rounded-[32px] flex items-center justify-center text-4xl mb-10 mx-auto relative ${current.glow} border-2`}
                    style={{
                        background: `${current.color}15`,
                        borderColor: `${current.color}30`
                    }}
                >
                    <div className="absolute inset-2 bg-white/5 rounded-[24px] animate-pulse"></div>
                    <span className="relative z-10">{current.icon}</span>
                </div>

                {/* Text Content */}
                <h3 className="text-3xl font-black mb-4 tracking-tight" style={{ color: current.color }}>
                    {title}
                </h3>
                <p className="text-white/60 text-[15px] leading-relaxed mb-12 font-medium px-6">
                    {message}
                </p>

                {/* Dynamic Actions */}
                <div className="flex gap-4">
                    {(type === 'confirm' || (onConfirm && type !== 'confirm')) && (
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="flex-1 btn btn-secondary py-5 text-sm"
                        >
                            {type === 'confirm' ? cancelText : 'Kapat'}
                        </button>
                    )}
                    <button
                        onClick={async () => {
                            if (onConfirm) {
                                setIsProcessing(true);
                                try {
                                    await onConfirm();
                                    // Note: We don't call onClose() here because onConfirm 
                                    // usually triggers showSuccess/Error which replaces the modal state.
                                } catch (e) {
                                    console.error("Modal Action Failed:", e);
                                    setIsProcessing(false);
                                }
                            } else {
                                onClose();
                            }
                        }}
                        disabled={isProcessing}
                        className="flex-1 btn btn-primary py-5 text-sm"
                        style={{ background: current.color }}
                    >
                        {isProcessing ? 'İŞLENİYOR...' : confirmText}
                    </button>
                </div>

                {/* Close Button X */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors text-xl font-light"
                >
                    &times;
                </button>
            </div>
        </div>
    );
}

// Global Modal Context - Tüm sayfalarda kullanılabilir

"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import CustomModal from '@/components/CustomModal';

type ModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface ModalState {
    isOpen: boolean;
    title: string;
    message?: string;
    content?: ReactNode; // Added for custom components like diff view
    type?: ModalType;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    size?: 'small' | 'medium' | 'large' | 'wide'; // Added for layout control
}

interface ModalContextType {
    showModal: (config: Omit<ModalState, 'isOpen'>) => void;
    showSuccess: (title: string, message: string, onConfirm?: () => void, confirmText?: string) => void;
    showError: (title: string, message: string, onConfirm?: () => void, confirmText?: string) => void;
    showWarning: (title: string, message: string, onConfirm?: () => void, confirmText?: string) => void;
    showAlert: (title: string, message: string, onConfirm?: () => void, confirmText?: string) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string, onCancel?: () => void) => void;
    showPrompt: (title: string, message: string, onConfirm: (value: string) => void, defaultValue?: string, placeholder?: string) => void;
    showQuotaExceeded: () => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [modal, setModal] = useState<ModalState>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
    });

    const showModal = (config: Omit<ModalState, 'isOpen'>) => {
        setModal({ ...config, isOpen: true });
    };

    const showSuccess = (title: string, message: string, onConfirm?: () => void, confirmText?: string) => {
        showModal({ title, message, type: 'success', onConfirm, confirmText });
    };

    const showError = (title: string, message: string, onConfirm?: () => void, confirmText?: string) => {
        showModal({ title, message, type: 'error', onConfirm, confirmText });
    };

    const showWarning = (title: string, message: string, onConfirm?: () => void, confirmText?: string) => {
        showModal({ title, message, type: 'warning', onConfirm, confirmText });
    };

    const showAlert = (title: string, message: string, onConfirm?: () => void, confirmText?: string) => {
        showModal({ title, message, type: 'info', onConfirm, confirmText });
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string, onCancel?: () => void) => {
        showModal({ title, message, type: 'confirm', onConfirm, confirmText, cancelText, onCancel });
    };

    const showPrompt = (title: string, message: string, onConfirm: (value: string) => void, defaultValue: string = '', placeholder: string = 'Açıklama...') => {
        let val = defaultValue;
        showModal({
            title,
            message,
            type: 'confirm',
            content: (
                <div className="mt-4">
                    <textarea
                        autoFocus
                        defaultValue={defaultValue}
                        onChange={(e) => val = e.target.value}
                        placeholder={placeholder}
                        className="w-full p-3 text-sm border-2 border-slate-200 rounded-xl focus:border-slate-900 focus:outline-none transition-colors min-h-[100px] resize-none"
                    />
                </div>
            ),
            onConfirm: () => onConfirm(val),
            confirmText: 'Kaydet',
            cancelText: 'Vazgeç'
        });
    };

    const showQuotaExceeded = () => {
        showModal({
            title: 'Limit Doldu 🚀',
            message: 'Aylık fatura işlem limitiniz dolmuştur. İşlemlerinize kesintisiz devam etmek için paketinizi yükseltebilirsiniz.',
            type: 'warning',
            confirmText: 'Paketleri Gör',
            cancelText: 'Kapat',
            onConfirm: () => router.push('/billing')
        });
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleConfirm = async () => {
        if (modal.onConfirm) await modal.onConfirm();
        closeModal();
    };

    const handleCancel = () => {
        if (modal.onCancel) modal.onCancel();
        closeModal();
    };

    return (
        <ModalContext.Provider value={{ showModal, showSuccess, showError, showWarning, showAlert, showConfirm, showPrompt, showQuotaExceeded, closeModal }}>
            {children}
            <CustomModal
                isOpen={modal.isOpen}
                onClose={handleCancel}
                title={modal.title}
                message={modal.message}
                content={modal.content}
                size={modal.size}
                type={modal.type}
                onConfirm={handleConfirm}
                confirmText={modal.confirmText}
                cancelText={modal.cancelText}
            />
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within ModalProvider');
    }
    return context;
}

// Kullanım Örneği:
// const { showSuccess, showError, showConfirm } = useModal();
//
// showSuccess('Başarılı', 'Ürün kaydedildi');
// showError('Hata', 'Bir sorun oluştu');
// showConfirm('Emin misiniz?', 'Bu işlem geri alınamaz', () => {
//   // Onay işlemi
// });

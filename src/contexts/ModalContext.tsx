// Global Modal Context - Tüm sayfalarda kullanılabilir

"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import CustomModal from '@/components/CustomModal';

type ModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface ModalState {
    isOpen: boolean;
    title: string;
    message: string;
    type: ModalType;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

interface ModalContextType {
    showModal: (config: ModalState) => void;
    showSuccess: (title: string, message: string, onConfirm?: () => void, confirmText?: string) => void;
    showError: (title: string, message: string, onConfirm?: () => void, confirmText?: string) => void;
    showWarning: (title: string, message: string, onConfirm?: () => void, confirmText?: string) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string, onCancel?: () => void) => void;
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

    const showConfirm = (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string, onCancel?: () => void) => {
        showModal({ title, message, type: 'confirm', onConfirm, confirmText, cancelText, onCancel });
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

    const handleConfirm = () => {
        if (modal.onConfirm) modal.onConfirm();
        closeModal();
    };

    const handleCancel = () => {
        if (modal.onCancel) modal.onCancel();
        closeModal();
    };

    return (
        <ModalContext.Provider value={{ showModal, showSuccess, showError, showWarning, showConfirm, showQuotaExceeded, closeModal }}>
            {children}
            <CustomModal
                isOpen={modal.isOpen}
                onClose={handleCancel}
                title={modal.title}
                message={modal.message}
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

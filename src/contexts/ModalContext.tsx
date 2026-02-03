// Global Modal Context - Tüm sayfalarda kullanılabilir

"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import CustomModal from '@/components/CustomModal';

type ModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface ModalState {
    isOpen: boolean;
    title: string;
    message: string;
    type: ModalType;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

interface ModalContextType {
    showModal: (config: ModalState) => void;
    showSuccess: (title: string, message: string, onConfirm?: () => void, confirmText?: string) => void;
    showError: (title: string, message: string, onConfirm?: () => void, confirmText?: string) => void;
    showWarning: (title: string, message: string, onConfirm?: () => void, confirmText?: string) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
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

    const showConfirm = (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => {
        showModal({ title, message, type: 'confirm', onConfirm, confirmText, cancelText });
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <ModalContext.Provider value={{ showModal, showSuccess, showError, showWarning, showConfirm, closeModal }}>
            {children}
            <CustomModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
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

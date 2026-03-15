"use client";

import React, { useState } from "react";
import { Play, Pause, Trash2 } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";
import { handleQueueAction } from "./actions";

interface QueueActionsProps {
    qName: string;
    isPaused: boolean;
}

export function QueueActions({ qName, isPaused }: QueueActionsProps) {
    const { showConfirm, showSuccess, showError } = useModal();
    const [loading, setLoading] = useState(false);

    const onAction = async (action: 'pause' | 'resume' | 'drain') => {
        if (action === 'drain') {
            showConfirm(
                "Kuyruk Boşaltma (Drain)",
                "Tüm bekleyen işleri silmek istediğinize emin misiniz? (Geri alınamaz)",
                async () => {
                    await execute(action);
                }
            );
        } else {
            await execute(action);
        }
    };

    const execute = async (action: 'pause' | 'resume' | 'drain') => {
        setLoading(true);
        try {
            await handleQueueAction(qName, action);
            showSuccess("Başarılı", `Kuyruk aksiyonu (${action}) uygulandı.`);
        } catch (err: any) {
            showError("Hata", `Aksiyon sırasında hata oluştu: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2 justify-end isolate">
            {isPaused ? (
                <button
                    disabled={loading}
                    onClick={() => onAction('resume')}
                    className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded flex items-center hover:bg-green-200 disabled:opacity-50"
                >
                    <Play className="w-3 h-3 mr-1" /> Resume
                </button>
            ) : (
                <button
                    disabled={loading}
                    onClick={() => onAction('pause')}
                    className="text-[10px] bg-orange-100 text-orange-800 px-2 py-1 rounded flex items-center hover:bg-orange-200 disabled:opacity-50"
                >
                    <Pause className="w-3 h-3 mr-1" /> Pause
                </button>
            )}

            <button
                disabled={loading}
                onClick={() => onAction('drain')}
                className="text-[10px] bg-red-100 text-red-800 px-2 py-1 flex items-center rounded hover:bg-red-200 disabled:opacity-50"
            >
                <Trash2 className="w-3 h-3 mr-1" /> Drain All
            </button>
        </div>
    );
}

"use client";

import { useState } from 'react';
import { EnterpriseButton } from '@/components/ui/enterprise';
import { useRouter } from 'next/navigation';
import { useModal } from "@/contexts/ModalContext";

export default function RenderPdfButton({ documentId, initialPdfReady, documentVersionId }: { documentId: string, initialPdfReady: boolean, documentVersionId?: string }) {
    const { showSuccess, showError, showWarning } = useModal();
    const [status, setStatus] = useState<'idle' | 'queued' | 'ready'>(initialPdfReady ? 'ready' : 'idle');
    const router = useRouter();

    const handleRender = async () => {
        setStatus('queued');
        const res = await fetch(`/api/contracts/documents/${documentId}/render`, { method: 'POST' });
        if (res.ok) {
            // Polling simulation
            const interval = setInterval(async () => {
                // in a real app, query a specific document version status endpoint.
                // for MVP we can just refresh the page and let server check or assume ready after 5 sec
                router.refresh();
                setStatus('ready');
                clearInterval(interval);
            }, 6000);
        } else {
            console.error(await res.text());
            setStatus('idle');
            showError("Uyarı", "Render queue failed.");
        }
    };

    if (status === 'ready') {
        return (
            <a href={`/api/contracts/blobs/${documentVersionId}/download`} target="_blank" rel="noreferrer">
                <EnterpriseButton variant="secondary" className="text-xs py-1 h-auto">
                    Preview PDF
                </EnterpriseButton>
            </a>
        );
    }

    if (status === 'queued') {
        return (
            <EnterpriseButton variant="secondary" className="text-xs py-1 h-auto animate-pulse" disabled>
                Rendering...
            </EnterpriseButton>
        );
    }

    return (
        <EnterpriseButton variant="secondary" className="text-xs py-1 h-auto" onClick={handleRender}>
            Render PDF
        </EnterpriseButton>
    );
}

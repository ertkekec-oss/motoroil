'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EnterpriseCard, EnterpriseInput, EnterpriseSelect, EnterpriseButton, EnterpriseTextarea } from '@/components/ui/enterprise';

export function NewTicketForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        category: 'ERP',
        priority: 'NORMAL',
        description: ''
    });

    const categories = [
        'ERP', 'FINANCE', 'INVENTORY', 'SALESX', 'B2B_HUB',
        'INTEGRATION', 'EINVOICE', 'SHIPPING', 'BILLING', 'ACCOUNT', 'OTHER'
    ];

    const priorities = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // In motoroil backend we have POST /api/support/tickets 
            const res = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: formData.subject,
                    category: formData.category,
                    priority: formData.priority,
                    description: formData.description,
                    currentPage: window.location.pathname,
                    browserInfo: navigator.userAgent
                })
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/help/tickets/${data.ticket.id}`);
            } else {
                alert('Bir hata oluştu. Lütfen tekrar deneyin.');
            }
        } catch (error) {
            console.error('Submit ticket error:', error);
            alert('Ağ hatası oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <EnterpriseCard className="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <EnterpriseInput
                    label="Konu / Başlık"
                    hint="Sorununuzu kısaca özetleyin"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <EnterpriseSelect
                        label="Kategori"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </EnterpriseSelect>

                    <EnterpriseSelect
                        label="Öncelik Seviyesi"
                        hint="Ağır sistem kesintileri için CRITICAL seçin."
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    >
                        {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                    </EnterpriseSelect>
                </div>

                <EnterpriseTextarea
                    label="Mesajınız / Sorun Detayı"
                    required
                    rows={8}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                    <button type="button" onClick={() => router.back()} className="px-4 py-2 font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                        İptal
                    </button>
                    <EnterpriseButton type="submit" disabled={loading}>
                        {loading ? 'Oluşturuluyor...' : 'Talebi Oluştur'}
                    </EnterpriseButton>
                </div>
            </form>
        </EnterpriseCard>
    );
}

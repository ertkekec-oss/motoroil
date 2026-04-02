const fs = require('fs');

function applyServiceUpdate() {
    const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/service/[id]/ServiceDetailClient.tsx';
    let code = fs.readFileSync(file, 'utf8');

    // 1. Add state for technician notes
    if (!code.includes('const [technicianNotes, setTechnicianNotes] = useState')) {
        const stateHookStr = `    const [activeTab, setActiveTab] = useState<'details' | 'parts' | 'labor'>('details');`;
        const stateHookNew = `    const [activeTab, setActiveTab] = useState<'details' | 'parts' | 'labor'>('details');
    // Technician Notes
    const [technicianNotes, setTechnicianNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);`;
        code = code.replace(stateHookStr, stateHookNew);
    }

    // 2. Set technicianNotes on load
    if (!code.includes("setTechnicianNotes(data.technicianNotes || '');")) {
        const fetchOrderOld = `            setOrder(data);`;
        const fetchOrderNew = `            setOrder(data);\n            setTechnicianNotes(data.technicianNotes || '');`;
        code = code.replace(fetchOrderOld, fetchOrderNew);
    }

    // 3. Add handleSaveNotes & handleSendProposal
    if (!code.includes('const handleSaveNotes = async ()')) {
        const fetchOrderFuncEnd = `    };

    const handleAddItem = async (type: 'PART' | 'LABOR') => {`;
        const additions = `    };

    const handleSaveNotes = async () => {
        setSavingNotes(true);
        try {
            await fetch(\`/api/services/work-orders/\${id}\`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ technicianNotes })
            });
            showSuccess('Kaydedildi', 'Teknik servis notları kaydedildi.');
            fetchOrder();
        } catch (e) {
            showError('Hata', 'Notlar kaydedilemedi.');
        } finally {
            setSavingNotes(false);
        }
    };

    const handleSendProposal = () => {
        if (!order || !order.customer) return;
        const phone = order.customer.phone || '';
        let cleanPhone = phone.replace(/\\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '9' + cleanPhone;
        else if (!cleanPhone.startsWith('90')) cleanPhone = '90' + cleanPhone;

        const pList = parts.map((p:any) => \`- \${p.name} (\${Number(p.quantity)}x) - \${Number(p.totalPrice).toLocaleString('tr-TR')} TL\`).join('%0A');
        const lList = labor.map((l:any) => \`- \${l.name} (\${Number(l.quantity)}x) - \${Number(l.totalPrice).toLocaleString('tr-TR')} TL\`).join('%0A');
        
        let msg = \`Merhaba \${order.customer.name},%0A%0A\`;
        if (order.asset) {
            msg += \`*\${order.asset.primaryIdentifier}* plakalı/seri numaralı cihazınız/aracınız için servis teklifimiz aşağıdaki gibidir:%0A%0A\`;
        } else {
            msg += \`Servis işlemleriniz için hazırlanan teklif aşağıdaki gibidir:%0A%0A\`;
        }

        if (parts.length > 0) {
            msg += \`*Kullanılacak Yedek Parçalar:*%0A\${pList}%0A%0A\`;
        }
        if (labor.length > 0) {
            msg += \`*Uygulanacak İşçilikler:*%0A\${lList}%0A%0A\`;
        }
        const total = Number(order.totalAmount || 0).toLocaleString('tr-TR');
        msg += \`*TOPLAM TUTAR: \${total} TL*%0A%0AOnayınızın ardından işlemlere başlanacaktır.\`;

        window.open(\`https://wa.me/\${cleanPhone}?text=\${msg}\`, '_blank');
        
        // Opt: Auto move to WAITING_APPROVAL
        if (order.status === 'PENDING') {
            fetch(\`/api/services/work-orders/\${id}\`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'WAITING_APPROVAL' }) }).then(() => fetchOrder());
        }
    };

    const handleAddItem = async (type: 'PART' | 'LABOR') => {`;
        code = code.replace(fetchOrderFuncEnd, additions);
    }

    // 4. Add UI for Technician notes inside col-span-2
    if (!code.includes('Teknik Servis Notları')) {
        const layoutOld = `                                </div>
                            ) : (
                                <span className="text-sm font-medium text-slate-500">Cihaz belirtilmemiş.</span>
                            )}
                        </div>
                    </div>
                    
                    <div className="lg:col-span-1 space-y-6">`;
        const layoutNew = `                                </div>
                            ) : (
                                <span className="text-sm font-medium text-slate-500">Cihaz belirtilmemiş.</span>
                            )}
                        </div>

                        {/* TEKNİK SERVİS NOTLARI */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
                                <FileText className="w-4 h-4" /> Teknik Servis Notları (Uzman Yorumu)
                            </h3>
                            <textarea
                                value={technicianNotes}
                                onChange={e => setTechnicianNotes(e.target.value)}
                                placeholder="Teknisyenin müdahale detayları, teşhisi veya müşteriye uyarıları..."
                                className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                            />
                            <div className="flex justify-end mt-3">
                                <button onClick={handleSaveNotes} disabled={savingNotes} className="px-5 py-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors disabled:opacity-50">
                                    {savingNotes ? 'Kaydediliyor...' : 'Notları Kaydet'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-1 space-y-6">`;
        code = code.replace(layoutOld, layoutNew);
    }

    // 5. Add WhatsApp Proposal Button into col-span-1 Finansal Özet box
    if (!code.includes('handleSendProposal')) {
        const waOld = `                                <div className="flex justify-between items-center text-[18px] font-black text-slate-900 dark:text-white">
                                    <span>GENEL TOPLAM</span>
                                    <span className="text-blue-600 dark:text-blue-500">{Number(order.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
        const waNew = `                                <div className="flex justify-between items-center text-[18px] font-black text-slate-900 dark:text-white">
                                    <span>GENEL TOPLAM</span>
                                    <span className="text-blue-600 dark:text-blue-500">{Number(order.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                </div>

                                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-white/5">
                                    <button onClick={handleSendProposal} className="w-full py-3.5 bg-[#25D366] hover:bg-[#1ebd5a] active:scale-[0.98] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                                        Müşteriye Teklif Gönder
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
        code = code.replace(waOld, waNew);
    }

    fs.writeFileSync(file, code, 'utf8');
}

applyServiceUpdate();

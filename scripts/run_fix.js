const fs = require('fs');

const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/service/[id]/ServiceDetailClient.tsx';
let code = fs.readFileSync(file, 'utf8');

const anchor = `    if (loading) return <div className="p-10 flex items-center justify-center text-slate-500 font-bold">Yükleniyor...</div>;`;

const newCode = `    const handleSaveNotes = async () => {
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

    if (loading) return <div className="p-10 flex items-center justify-center text-slate-500 font-bold">Yükleniyor...</div>;`;

if (!code.includes('const handleSendProposal = ()')) {
    code = code.replace(anchor, newCode);
    fs.writeFileSync(file, code, 'utf8');
}

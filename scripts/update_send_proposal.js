const fs = require('fs');

const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/service/[id]/ServiceDetailClient.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Rewrite handleSendProposal function
const oldFuncRegex = /const handleSendProposal = \(\) => \{[\s\S]*?\};/m;
const newFunc = `const handleSendProposal = () => {
        if (!order || !order.customer) return;
        const phone = order.customer.phone || '';
        let cleanPhone = phone.replace(/\\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '9' + cleanPhone;
        else if (!cleanPhone.startsWith('90')) cleanPhone = '90' + cleanPhone;

        const approvalLink = \`https://\${window.location.host}/p/approval/\${id}\`;
        
        let msg = \`Merhaba \${order.customer.name},%0A%0A\`;
        if (order.asset) {
            msg += \`*\${order.asset.brand}* marka cihazınız/aracınız için servis onarım teklifimiz hazırlanmıştır.%0A%0A\`;
        } else {
            msg += \`Servis işlemleriniz için onarım teklifimiz hazırlanmıştır.%0A%0A\`;
        }
        
        msg += \`Detayları (Kullanılacak parçalar ve işçilikler) güvenki bir şekilde incelemek ve işlemlere \n*ONAY VERMEK* için lütfen aşağıdaki kişiye özel bağlantıya tıklayınız:%0A%0A\`;
        msg += \`🔗 \${approvalLink}%0A%0A\`;
        msg += \`Bizi tercih ettiğiniz için teşekkür ederiz.\`;

        window.open(\`https://wa.me/\${cleanPhone}?text=\${msg}\`, '_blank');
        
        if (order.status === 'PENDING') {
            fetch(\`/api/services/work-orders/\${id}\`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'WAITING_APPROVAL' }) }).then(() => fetchOrder());
        }
    };

    const handleVerbalApproval = async () => {
        try {
            await fetch(\`/api/services/work-orders/\${id}\`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'IN_PROGRESS' }) });
            fetchOrder();
            showSuccess('Onaylandı', 'Sözlü onay sisteme işlendi ve işlem başlatıldı.');
        } catch(e) {
            showError('Hata', 'Onay kaydedilemedi.');
        }
    };`;

code = code.replace(oldFuncRegex, newFunc);

// 2. Add the Verbal Approval Button below the Whatsapp Button
const waButtonMarkup = `                                    <button onClick={handleSendProposal} className="w-full py-3.5 bg-[#25D366] hover:bg-[#1ebd5a] active:scale-[0.98] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                                        Müşteriye Teklif Gönder
                                    </button>`;

const newWaButtonMarkup = \`\${waButtonMarkup}
                                    <button onClick={handleVerbalApproval} className="w-full mt-3 py-3 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all border border-slate-200">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        Müşteriden Sözlü Onay Alındı
                                    </button>\`;

code = code.replace(waButtonMarkup, newWaButtonMarkup);

fs.writeFileSync(file, code, 'utf8');

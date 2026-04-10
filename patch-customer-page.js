const fs = require('fs');

const pageFile = 'src/app/(app)/customers/[id]/page.tsx';
let content = fs.readFileSync(pageFile, 'utf8');

// Include serviceOrders in the database query
if (!content.includes('serviceOrders: {')) {
    content = content.replace(
        "offers: {\r\n                    orderBy: { createdAt: 'desc' },\r\n                    include: { lines: true, terms: true }\r\n                }",
        "offers: {\n                    orderBy: { createdAt: 'desc' },\n                    include: { lines: true, terms: true }\n                },\n                serviceOrders: {\n                    where: { deletedAt: null },\n                    orderBy: { createdAt: 'desc' }\n                }"
    );
     content = content.replace(
        "offers: {\n                    orderBy: { createdAt: 'desc' },\n                    include: { lines: true, terms: true }\n                }",
        "offers: {\n                    orderBy: { createdAt: 'desc' },\n                    include: { lines: true, terms: true }\n                },\n                serviceOrders: {\n                    where: { deletedAt: null },\n                    orderBy: { createdAt: 'desc' }\n                }"
    );
}


// Add serviceList map logic
if (!content.includes('const svcList =')) {
    const planListBlock = "const planList = (customer.paymentPlans || []).map((p: any) => {";
    
    // We insert svcList just before planList for neatness
    const svcListLogic = `const svcList = (customer.serviceOrders || []).map((s: any) => {
            const isCompleted = s.status === 'COMPLETED' || s.status === 'TAMAMLANDI' || s.status === 'READY'; 
            
            // Map english status to turkish
            let trStatus = s.status;
            if (s.status === 'PENDING') trStatus = 'BEKLEYEN İş';
            else if (s.status === 'IN_PROGRESS') trStatus = 'İŞLEMEDE';
            else if (s.status === 'WAITING_APPROVAL') trStatus = 'MÜŞTERİ ONAYI BEKLİYOR';
            else if (s.status === 'WAITING_PART') trStatus = 'PARÇA BEKLİYOR';
            else if (s.status === 'READY') trStatus = 'TESLİMAT BEKLİYOR';
            else if (s.status === 'COMPLETED') trStatus = 'TAMAMLANDI';
            else if (s.status === 'CANCELLED') trStatus = 'İPTAL EDİLDİ';

            return {
                id: s.id,
                date: new Date(s.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                rawDate: s.createdAt,
                type: 'Servis',
                desc: \`Servis Kaydı #\${s.id.slice(-6).toUpperCase()} (\${trStatus})\`,
                amount: Number(s.totalAmount || 0),
                color: isCompleted ? '#10b981' : (s.status === 'CANCELLED' ? '#ef4444' : '#3b82f6'),
                items: null,
                orderId: s.id,
                isService: true,
                status: s.status
            };
        });

        `;
        
    content = content.replace(planListBlock, svcListLogic + planListBlock);
}

// Add svcList to historyList
if (!content.includes('...svcList')) {
    content = content.replace(
        "const historyList = [...txs, ...invs, ...orderList, ...planList]",
        "const historyList = [...txs, ...invs, ...orderList, ...planList, ...svcList]"
    );
}

fs.writeFileSync(pageFile, content);
console.log("Patched page.tsx");

const fs = require('fs');
const file = 'src/app/(app)/sales/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchBlock = `                <button className="h-[40px] px-5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 rounded-[12px] font-semibold text-[13px] transition-all flex items-center gap-2">
                    Dışa Aktar
                </button>`;

const replaceBlock = `                <button 
                    onClick={() => {
                        let dataToExport = [];
                        if (activeTab === 'online') dataToExport = onlineOrders;
                        else if (activeTab === 'store') dataToExport = storeOrders;
                        else if (activeTab === 'invoices') {
                            if (invoiceSubTab === 'sales') dataToExport = realInvoices;
                            else if (invoiceSubTab === 'incoming') dataToExport = purchaseInvoices;
                            else if (invoiceSubTab === 'wayslips') dataToExport = wayslips;
                        }

                        if (!dataToExport || dataToExport.length === 0) return showWarning('Boş Liste', 'Dışa aktarılacak veri bulunamadı.');

                        const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
                            + "Tarih,Sipariş/Fatura No,Durum,Tutar\n" 
                            + dataToExport.map((t: any) => {
                                const date = t.createdAt ? new Date(t.createdAt).toLocaleDateString('tr-TR') : (t.date ? new Date(t.date).toLocaleDateString('tr-TR') : '');
                                const no = t.orderNumber || t.invoiceNo || t.id;
                                const status = t.status || t.cargoStatus || '';
                                const amount = t.totalAmount || t.grandTotal || 0;
                                return \`\${date},"\${no}",\${status},\${amount}\`;
                            }).join("\\n");
                            
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", \`satis_disa_aktar_\${new Date().toISOString().split('T')[0]}.csv\`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }}
                    className="h-[40px] px-5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 rounded-[12px] font-semibold text-[13px] transition-all flex items-center gap-2"
                >
                    Dışa Aktar
                </button>`;

if (content.includes(searchBlock)) {
    content = content.replace(searchBlock, replaceBlock);
    fs.writeFileSync(file, content);
    console.log('Fixed export button in sales page');
} else {
    console.error('searchBlock not found in sales page');
}

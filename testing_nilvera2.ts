import prisma from './src/lib/prisma';
import { NilveraInvoiceService } from './src/services/nilveraService';
import fs from 'fs';

async function test() {
    try {
        const sett = await prisma.appSettings.findFirst({where:{key:'eFaturaSettings'}});
        const s = new NilveraInvoiceService((sett as any).value);
        
        // get an invoice from the list
        const res = await s.getIncomingInvoices(1, 10);
        const firstInvoice = res.data.Content[0];
        
        // get its details
        const det = await s.getInvoiceDetails(firstInvoice.UUID);
        const invData = det.data.PurchaseInvoice || det.data.Model || det.data;
        
        const output = {
            keys: Object.keys(invData),
            lines: invData.InvoiceLines ? Object.keys(invData.InvoiceLines[0]) : "No lines",
            despatchRef: invData.DespatchDocumentReference,
            orderRef: invData.OrderReference,
            refs: Object.keys(invData).filter(k=>k.toLowerCase().includes('ref') || k.toLowerCase().includes('doc') || k.toLowerCase().includes('desp'))
        };
        fs.writeFileSync('nilvera_inv_test.json', JSON.stringify(output, null, 2));
        console.log("Done");
    } catch(e:any) {
        fs.writeFileSync('nilvera_inv_test.json', JSON.stringify({error: e.message}));
    }
}
test().catch(console.error).finally(() => process.exit(0));

const fs = require('fs');
const path = 'c:\\Users\\Life\\Desktop\\muhasebe app\\motoroil\\src\\app\\customers\\[id]\\CustomerDetailClient.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Fix the double OTV situation and messed up columns.
// Currently in view_file:
// The header has: NO, NAME, QTY, UNIT PRICE, KDV %, KDV TUTAR, TOPLAM
// But the body has:
// td (index)
// td (name input)
// td (qty input)
// td (price input)
// td (input value={it.otv || 0} ...) <--- THIS IS THE CULPRIT! It's still there but no header for it.
// td (input value={it.vat})        <--- This aligns with "KDV %" header.
// td (vatAmount)                   <--- This aligns with "KDV TUTAR" header.
// td (grossTotal)                  <--- This aligns with "TOPLAM" header.
// td (trash)                       <--- This aligns with nothing? Wait header has empty th at end.

// So:
// Header Index 4: KDV %
// Body Index 4: OTV Input (value=it.otv)
// Result: Under "KDV %" header, we see the OTV input (which is 0 usually).
// Header Index 5: KDV TUTAR
// Body Index 5: VAT Input (value=it.vat, usually 20).
// Result: Under "KDV TUTAR" header, we see the VAT Rate (20).

// The fix is to REMOVE the OTV input td completely from the body rendering in the invoices table.
// And we also want to remove the OTV tags and "Vergi Ekle" button if the user requested "remove OTV from invoice".
// The user said "ötv alanlarını fatura üstünden kaldır". This implies removing visible UI controls for it.

const otvInputTdRegex = /<td style={{ padding: '12px', textAlign: 'center' }}>\s*<input\s*type="number"\s*value=\{it\.otv \|\| 0\}\s*onChange=\{[^}]+\}\s*style=\{[^}]+\}\s*\/>\s*<\/td>/;

// We need to be careful with regex. Let's find the specific block.
const otvTdStart = `<td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <input
                                                                type="number"
                                                                value={it.otv || 0}`;
// This block should be removed.

// Let's implement a more robust search and replace.
const startSearch = 'value={it.otv || 0}';
const otvInputIndex = content.indexOf(startSearch);

if (otvInputIndex !== -1) {
    // Navigate back to the enclosing <td>
    const tdStart = content.lastIndexOf('<td', otvInputIndex);
    // Find the closing </td>
    const tdEnd = content.indexOf('</td>', otvInputIndex);

    if (tdStart !== -1 && tdEnd !== -1) {
        // Remove this TD block
        const toRemove = content.substring(tdStart, tdEnd + 5);
        content = content.replace(toRemove, '');
        console.log('Removed OTV Input TD');
    }
} else {
    console.log('OTV Input TD not found (might already be gone or different format)');
}

// 2. Fix Narrow Product Name (Malzeme / Hizmet)
// The header has `textAlign: 'left'`, but maybe we need `width: 'auto'` or minimum width.
// Currently header: <th style={{ padding: '12px', textAlign: 'left' }}>MALZEME / HİZMET</th>
// Let's change it to have min-width.
const nameHeaderOld = '<th style={{ padding: '12px', textAlign: 'left' }}>MALZEME / HİZMET</th>';
// This string might vary slightly due to whitespace in previous view_file.
// It was: <th style={{ padding: '12px', textAlign: 'left' }}>MALZEME / HİZMET</th>
// I'll replace it with a version with width.

// Actually I'll just use regex for the header row replacement to be safe.
// content = content.replace(nameHeaderOld, `<th style={{ padding: '12px', textAlign: 'left', minWidth: '250px' }}>MALZEME / HİZMET</th>`);

// 3. User wanted to remove "Vergi Ekle" button and tags also?
// "ötv alanlarını fatura üstünden kaldır" -> Remove OTV fields from on the invoice.
// The "Vergi Ekle" button is inside the Name TD.
// Let's revert the Name TD to a simple input without the extra div and button, OR just remove the button.

// I will look for the complex Name TD block.
// It starts with <td style={{ padding: '12px' }}> and contains `updateItem('name'`
// I'll replace the whole block with the simple version.

// Find the start of the map loop for invoice items again.
const invoiceMapStart = '{invoiceItems.map((it: any, i: number) => {';
const invoiceMapIndex = content.indexOf(invoiceMapStart);

if (invoiceMapIndex !== -1) {
    // Find the name TD inside this map
    const nameTdStartMarker = '<td style={{ padding: \'12px\' }}>';
    // We need to be careful not to mistake it for the date TD in services map.
    // The invoice map is usually the first one or we can search from invoiceMapIndex.

    const nameTdIndex = content.indexOf(nameTdStartMarker, invoiceMapIndex);

    // Check if this TD contains the "Vergi Ekle" stuff
    const vergiEkleIndex = content.indexOf('Vergi Ekle +', nameTdIndex);

    if (vergiEkleIndex !== -1 && vergiEkleIndex < content.indexOf('</tr>', nameTdIndex)) {
        // This is the complex TD. Let's find its end.
        const tdEndIndex = content.indexOf('</td>', nameTdIndex);

        // Construct the Simple TD
        const simpleTd = `<td style={{ padding: '12px' }}>
                                                            <input
                                                                value={it.name}
                                                                onChange={(e) => updateItem('name', e.target.value)}
                                                                style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: '600', padding: '4px' }}
                                                            />
                                                        </td>`;

        content = content.substring(0, nameTdIndex) + simpleTd + content.substring(tdEndIndex + 5);
        console.log('Reverted to simple Name TD (Removed Vergi Ekle button and tags)');
    }
}

// 4. Double check the headers to match the new body (No OTV column).
// Headers: NO, NAME, QTY, PRICE, KDV %, KDV TUTAR, TOPLAM, TRASH
// Body: Index, Name, Qty, Price, VAT (Input), VAT Amount (Text), Gross, Trash
// This matches perfectly now that we removed the OTV Input TD.

// 5. Fix "KDV % çalışmıyor" - The VAT input was showing, but under the wrong header (KDV TUTAR) previously.
// Now it will be under "KDV %".
// Also ensuring that the input is working. The input code:
/*
<input
    type="number"
    value={it.vat}
    onChange={(e) => updateItem('vat', Number(e.target.value))}
    style={{ ... }}
/>
*/
// This looks correct. It was just misaligned.

// 6. Fix "KDV TUTAR çalışmıyor".
// It was showing the value, but under "TOPLAM" header previously.
// Now it will be under "KDV TUTAR".
// The code: {vatAmount.toFixed(2)} ₺
// This is correct.

// 7. Styling for Name Column
// I simply reverted the TD. I should add minWidth to the header.
// content = content.replace(/<th style={{ padding: '12px', textAlign: 'left' }}>MALZEME / HİZMET<\/th>/, `<th style={{ padding: '12px', textAlign: 'left', minWidth: '200px' }}>MALZEME / HİZMET</th>`);
// Better to search for the specific header block.

const tableHeaderStart = '<th style={{ padding: \'12px\', textAlign: \'left\' }}>MALZEME / HİZMET</th>';
content = content.replace(tableHeaderStart, '<th style={{ padding: \'12px\', textAlign: \'left\', minWidth: \'220px\' }}>MALZEME / HİZMET</th>');

// 8. One more thing: The user mentioned "fatura alanları bozuldu".
// I should make sure the previous OTV Input TD removal didn't leave any artifacts.
// I used precise substring replacement so it should be fine.

// 9. Remove "ÖTV Toplam" from summary if it's 0 (User said remove OTV fields).
// Currently:
/*
<div className="flex-between" style={{ marginBottom: '10px' }}>
    <span style={{ fontSize: '13px', color: '#888' }}>ÖTV Toplam</span>
    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{totalOtv.toLocaleString(...)} ₺</span>
</div>
*/
// The user might want this gone if 0.
// I'll wrap it in {totalOtv > 0 && (...)}
// Find the block
const otvSummaryStart = '<div className="flex-between" style={{ marginBottom: \'10px\' }}>';
const otvSummaryLabel = '<span style={{ fontSize: \'13px\', color: \'#888\' }}>ÖTV Toplam</span>';

const otvSummaryIndex = content.indexOf(otvSummaryLabel);
if (otvSummaryIndex !== -1) {
    // Find the parent div start
    const divStart = content.lastIndexOf('<div', otvSummaryIndex);
    // Find the div end
    const divEnd = content.indexOf('</div>', otvSummaryIndex);

    if (divStart !== -1 && divEnd !== -1) {
        const fullBlock = content.substring(divStart, divEnd + 6);
        const newBlock = `{totalOtv > 0 && (
                                                    ${fullBlock}
                                                )}`;
        content = content.replace(fullBlock, newBlock);
        console.log('Made ÖTV Summary conditional');
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixes applied successfully');

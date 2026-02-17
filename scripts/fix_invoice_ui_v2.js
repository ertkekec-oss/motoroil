const fs = require('fs');
const path = 'c:\\Users\\Life\\Desktop\\muhasebe app\\motoroil\\src\\app\\customers\\[id]\\CustomerDetailClient.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Remove OTV Input TD
const startSearch = 'value={it.otv || 0}';
const otvInputIndex = content.indexOf(startSearch);

if (otvInputIndex !== -1) {
    const tdStart = content.lastIndexOf('<td', otvInputIndex);
    const tdEnd = content.indexOf('</td>', otvInputIndex);

    if (tdStart !== -1 && tdEnd !== -1) {
        const toRemove = content.substring(tdStart, tdEnd + 5);
        content = content.replace(toRemove, '');
        console.log('Removed OTV Input TD');
    }
} else {
    console.log('OTV Input TD not found');
}

// 2. Revert to Simple Name TD
const invoiceMapStart = '{invoiceItems.map((it: any, i: number) => {';
const invoiceMapIndex = content.indexOf(invoiceMapStart);

if (invoiceMapIndex !== -1) {
    const nameTdStartMarker = '<td style={{ padding: \'12px\' }}>';
    const nameTdIndex = content.indexOf(nameTdStartMarker, invoiceMapIndex);

    const vergiEkleIndex = content.indexOf('Vergi Ekle +', nameTdIndex);

    // Check if we are still within the same row (before the next </tr>)
    const trEndIndex = content.indexOf('</tr>', nameTdIndex);

    if (vergiEkleIndex !== -1 && vergiEkleIndex < trEndIndex) {
        const tdEndIndex = content.indexOf('</td>', nameTdIndex);

        const simpleTd = `<td style={{ padding: '12px' }}>
                                                            <input
                                                                value={it.name}
                                                                onChange={(e) => updateItem('name', e.target.value)}
                                                                style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: '600', padding: '4px' }}
                                                            />
                                                        </td>`;

        content = content.substring(0, nameTdIndex) + simpleTd + content.substring(tdEndIndex + 5);
        console.log('Reverted to simple Name TD');
    } else {
        console.log('Vergi Ekle button not found in the expected place');
    }
} else {
    console.log('Invoice map not found');
}

// 3. Fix Product Name Header Width
const tableHeaderStart = '<th style={{ padding: \'12px\', textAlign: \'left\' }}>MALZEME / HİZMET</th>';
content = content.replace(tableHeaderStart, '<th style={{ padding: \'12px\', textAlign: \'left\', minWidth: \'220px\' }}>MALZEME / HİZMET</th>');

// 4. Make OTV Summary Conditional
const otvSummaryLabel = '<span style={{ fontSize: \'13px\', color: \'#888\' }}>ÖTV Toplam</span>';
const otvSummaryIndex = content.indexOf(otvSummaryLabel);

if (otvSummaryIndex !== -1) {
    const divStart = content.lastIndexOf('<div', otvSummaryIndex);
    const divEnd = content.indexOf('</div>', otvSummaryIndex);

    // Check if already conditional (sanity check)
    const precedingText = content.substring(divStart - 20, divStart);
    if (!precedingText.includes('totalOtv > 0')) {
        if (divStart !== -1 && divEnd !== -1) {
            const fullBlock = content.substring(divStart, divEnd + 6);
            const newBlock = `{totalOtv > 0 && (
                                                        ${fullBlock}
                                                    )}`;
            content = content.replace(fullBlock, newBlock);
            console.log('Made ÖTV Summary conditional');
        }
    } else {
        console.log('OTV Summary is already conditional');
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixes applied successfully');

const fs = require('fs');
const path = 'c:\\Users\\Life\\Desktop\\muhasebe app\\motoroil\\src\\app\\customers\\[id]\\CustomerDetailClient.tsx';

let content = fs.readFileSync(path, 'utf8');
const lines = content.split(/\r?\n/);

const newLines = lines.filter(line => {
    // Remove the OTV % header line
    if (line.includes('ÖTV %') && line.includes('<th')) return false;
    // Remove the individual OTV input cell
    if (line.includes('value={it.otv || 0}') && line.includes('input')) {
        // We also need to remove the parent td. 
        // This is tricky with simple filtering. 
        return true;
    }
    return true;
});

// Let's do a more robust string replacement for the big blocks.
let newContent = content;

// Remove the OTV header line specifically
const otvHeaderPattern = /<th style={{ padding: '12px', textAlign: 'center', width: '70px' }}>ÖTV %<\/th>/;
newContent = newContent.replace(otvHeaderPattern, '');

// Adjust calculations in the summary
const summaryOld = `const totalOtv = invoiceItems.reduce((acc, it) => acc + (Number(it.qty) * Number(it.price) * (Number(it.otv || 0) / 100)), 0);

                                        // VAT is calculated on (Net + OTV)
                                        const totalVat = invoiceItems.reduce((acc, it) => {
                                            const lineNet = Number(it.qty) * Number(it.price);
                                            const lineOtv = lineNet * (Number(it.otv || 0) / 100);
                                            return acc + (lineNet + lineOtv) * (Number(it.vat || 20) / 100);
                                        }, 0);`;

// Since there are multiple occurrences of summary-like code, I'll be careful.
// Actually, I'll just write the final table part I wanted.

fs.writeFileSync(path, newContent, 'utf8');
console.log('Fixed header');

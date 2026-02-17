const fs = require('fs');
const path = 'c:\\Users\\Life\\Desktop\\muhasebe app\\motoroil\\src\\app\\customers\\[id]\\CustomerDetailClient.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Replace the Table Header
const oldHeader = `<th style={{ padding: '12px', textAlign: 'center', width: '40px' }}>NO</th>
                                                <th style={{ padding: '12px', textAlign: 'left' }}>MALZEME / HİZMET</th>
                                                <th style={{ padding: '12px', textAlign: 'center', width: '80px' }}>MİKTAR</th>
                                                <th style={{ padding: '12px', textAlign: 'right', width: '130px' }}>BİRİM FİYAT</th>
                                                <th style={{ padding: '12px', textAlign: 'center', width: '70px' }}>ÖTV %</th>
                                                <th style={{ padding: '12px', textAlign: 'center', width: '70px' }}>KDV %</th>
                                                <th style={{ padding: '12px', textAlign: 'right', width: '100px' }}>KDV TUTAR</th>
                                                <th style={{ padding: '12px', textAlign: 'right', width: '120px' }}>TOPLAM</th>
                                                <th style={{ width: '40px' }}></th>`;

const newHeader = `<th style={{ padding: '12px', textAlign: 'center', width: '40px' }}>NO</th>
                                                <th style={{ padding: '12px', textAlign: 'left' }}>MALZEME / HİZMET</th>
                                                <th style={{ padding: '12px', textAlign: 'center', width: '80px' }}>MİKTAR</th>
                                                <th style={{ padding: '12px', textAlign: 'right', width: '130px' }}>BİRİM FİYAT</th>
                                                <th style={{ padding: '12px', textAlign: 'center', width: '70px' }}>KDV %</th>
                                                <th style={{ padding: '12px', textAlign: 'right', width: '100px' }}>KDV TUTAR</th>
                                                <th style={{ padding: '12px', textAlign: 'right', width: '120px' }}>TOPLAM</th>
                                                <th style={{ width: '40px' }}></th>`;

content = content.replace(oldHeader, newHeader);

// 2. Replace the Table Row rendering (the map function)
// I'll look for the unique start of the map
const mapStart = '{invoiceItems.map((it: any, i: number) => {';
const mapEnd = '                                             })}';

// This is a bit too much for a simple replace. I'll use a regex for the whole block if I can find it.
// Actually, I'll just replace the inner part of the map.

console.log("Applying detailed changes...");

// I'll use a more surgical approach for the table row content to avoid matching errors.
// But since the previous attempts failed, I'll just write the entire file if needed.
// NO - I'll stick to a script that finds the start and end of the relevant sections.

const tbodyStart = '<tbody>';
const tbodyEnd = '</tbody>';
const tbodyIndex = content.indexOf(tbodyStart);
const tbodyEndIndex = content.indexOf(tbodyEnd, tbodyIndex);

if (tbodyIndex !== -1 && tbodyEndIndex !== -1) {
    const newTbody = `<tbody>
                                             {invoiceItems.map((it: any, i: number) => {
                                                 const qty = Number(it.qty || 1);
                                                 const netPrice = Number(it.price || 0);
                                                 const vatRate = Number(it.vat || 20);
                                                 const otvRate = Number(it.otv || 0);
                                                 const otvType = it.otvType || 'Ö.T.V yok';
                                                 const oivRate = Number(it.oiv || 0);

                                                 const lineNetTotal = qty * netPrice;
                                                 let lineOtv = 0;
                                                 if (otvType === 'yüzdesel Ö.T.V') {
                                                     lineOtv = lineNetTotal * (otvRate / 100);
                                                 } else if (otvType === 'maktu Ö.T.V') {
                                                     lineOtv = otvRate * qty;
                                                 }

                                                 const vatMatrah = lineNetTotal + lineOtv;
                                                 const vatAmount = vatMatrah * (vatRate / 100);
                                                 const oivAmount = vatMatrah * (oivRate / 100);
                                                 const lineGrossTotal = vatMatrah + vatAmount + oivAmount;

                                                 const updateItem = (field: string, val: any) => {
                                                     const newItems = [...invoiceItems];
                                                     newItems[i][field] = val;
                                                     setInvoiceItems(newItems);
                                                 };

                                                 const handleGrossChange = (newGross: number) => {
                                                     if (qty === 0) return;
                                                     let calculatedNet = 0;
                                                     const taxMultiplier = (1 + (vatRate + oivRate) / 100);
                                                     if (otvType === 'yüzdesel Ö.T.V') {
                                                        calculatedNet = newGross / (qty * (1 + otvRate / 100) * taxMultiplier);
                                                     } else if (otvType === 'maktu Ö.T.V') {
                                                        calculatedNet = (newGross / taxMultiplier / qty) - otvRate;
                                                     } else {
                                                        calculatedNet = newGross / (qty * taxMultiplier);
                                                     }
                                                     updateItem('price', calculatedNet);
                                                 };

                                                 return (
                                                     <tr key={it.id || i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                                                         <td style={{ padding: '12px', textAlign: 'center', color: '#888' }}>{i + 1}</td>
                                                         <td style={{ padding: '12px' }}>
                                                            <div className="flex-col">
                                                                <input
                                                                    value={it.name}
                                                                    onChange={(e) => updateItem('name', e.target.value)}
                                                                    style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: '600', padding: '4px' }}
                                                                />
                                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px', paddingLeft: '4px', flexWrap: 'wrap' }}>
                                                                    {otvType !== 'Ö.T.V yok' && (
                                                                        <span style={{ fontSize: '9px', background: 'rgba(255,100,0,0.1)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,100,0,0.2)' }}>
                                                                            ÖTV: {otvType === 'yüzdesel Ö.T.V' ? \`%\${otvRate}\` : \`\${otvRate}₺ (Maktu)\`}
                                                                        </span>
                                                                    )}
                                                                    {oivRate > 0 && (
                                                                        <span style={{ fontSize: '9px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(59,130,246,0.2)' }}>
                                                                            ÖİV: %\${oivRate}
                                                                        </span>
                                                                    )}
                                                                    <button 
                                                                        onClick={() => setTaxEditIndex(i)}
                                                                        style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', color: 'var(--primary)', border: '1px dashed rgba(255,100,0,0.3)', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}
                                                                    >
                                                                        Vergi Ekle +
                                                                    </button>
                                                                </div>
                                                            </div>
                                                         </td>
                                                         <td style={{ padding: '12px', textAlign: 'center' }}>
                                                             <input
                                                                 type="number"
                                                                 value={it.qty}
                                                                 onChange={(e) => updateItem('qty', Number(e.target.value))}
                                                                 style={{ width: '60px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textAlign: 'center', borderRadius: '4px' }}
                                                             />
                                                         </td>
                                                         <td style={{ padding: '12px', textAlign: 'right' }}>
                                                             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                                                 <input
                                                                     type="number"
                                                                     step="0.0001"
                                                                     value={netPrice > 0 ? Number(netPrice.toFixed(4)) : ''}
                                                                     placeholder="0.00"
                                                                     onChange={(e) => updateItem('price', Number(e.target.value))}
                                                                     style={{ width: '100px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textAlign: 'right', borderRadius: '4px' }}
                                                                 />
                                                                 <span style={{ color: '#888', fontSize: '10px' }}>₺+KDV</span>
                                                             </div>
                                                         </td>
                                                         <td style={{ padding: '12px', textAlign: 'center' }}>
                                                             <input
                                                                 type="number"
                                                                 value={it.vat}
                                                                 onChange={(e) => updateItem('vat', Number(e.target.value))}
                                                                 style={{ width: '50px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textAlign: 'center', borderRadius: '4px' }}
                                                             />
                                                         </td>
                                                         <td style={{ padding: '12px', textAlign: 'right', color: '#888', fontFamily: 'monospace' }}>
                                                             {vatAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                                                         </td>
                                                         <td style={{ padding: '12px', textAlign: 'right' }}>
                                                             <input
                                                                 type="number"
                                                                 value={lineGrossTotal.toFixed(2)}
                                                                 onChange={(e) => handleGrossChange(Number(e.target.value))}
                                                                 style={{ width: '110px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6', textAlign: 'right', borderRadius: '4px', fontWeight: '800', fontFamily: 'monospace' }}
                                                             />
                                                         </td>
                                                         <td style={{ padding: '12px', textAlign: 'center' }}>
                                                             <button onClick={() => setInvoiceItems(invoiceItems.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                                                         </td>
                                                     </tr>
                                                 );
                                             })}`;
    content = content.substring(0, tbodyIndex + 7) + newTbody + content.substring(tbodyEndIndex);
}

// 3. Replace summary calculations
const summarySectionStart = 'const subtotal = invoiceItems.reduce((acc, it) => acc + (Number(it.qty) * Number(it.price)), 0);';
const summarySectionEnd = 'const finalTotal = subtotal + totalOtv + totalVat - discAmount;';
const sStartIdx = content.indexOf(summarySectionStart);
const sEndIdx = content.indexOf(summarySectionEnd, sStartIdx);

if (sStartIdx !== -1 && sEndIdx !== -1) {
    const newSummary = `const subtotal = invoiceItems.reduce((acc, it) => acc + (Number(it.qty) * Number(it.price)), 0);
                                         
                                         let totalOtv = 0;
                                         let totalOiv = 0;
                                         let totalVat = 0;

                                         invoiceItems.forEach(it => {
                                             const lineQty = Number(it.qty || 1);
                                             const lineNet = lineQty * Number(it.price || 0);
                                             let lineOtv = 0;
                                             if (it.otvType === 'yüzdesel Ö.T.V') {
                                                 lineOtv = lineNet * (Number(it.otv || 0) / 100);
                                             } else if (it.otvType === 'maktu Ö.T.V') {
                                                 lineOtv = Number(it.otv || 0) * lineQty;
                                             }
                                             const matrah = lineNet + lineOtv;
                                             totalOtv += lineOtv;
                                             totalOiv += matrah * (Number(it.oiv || 0) / 100);
                                             totalVat += matrah * (Number(it.vat || 20) / 100);
                                         });

                                         let discAmount = 0;
                                         if (discountType === 'percent') {
                                             discAmount = subtotal * (discountValue / 100);
                                         } else {
                                             discAmount = discountValue;
                                         }

                                         const finalTotal = subtotal + totalOtv + totalOiv + totalVat - discAmount;`;
    content = content.substring(0, sStartIdx) + newSummary + content.substring(sEndIdx + summarySectionEnd.length);
}

// 4. Add OIV row to summary display if not already there
const kdvTotalRow = '<span>KDV Toplam</span>';
if (!content.includes('ÖİV Toplam')) {
    const kdvIndex = content.indexOf(kdvTotalRow);
    const parentDivStart = content.lastIndexOf('<div', kdvIndex);
    if (parentDivStart !== -1) {
        const oivRow = `{totalOiv > 0 && (
                                                     <div className="flex-between" style={{ marginBottom: '10px' }}>
                                                         <span style={{ fontSize: '13px', color: '#888' }}>ÖİV Toplam</span>
                                                         <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>{totalOiv.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                                     </div>
                                                 )}
                                                 
                                                 `;
        content = content.substring(0, parentDivStart) + oivRow + content.substring(parentDivStart);
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully applied all changes via script');

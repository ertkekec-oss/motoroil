const fs = require('fs');
const path = 'c:\\Users\\Life\\Desktop\\muhasebe app\\motoroil\\src\\app\\customers\\[id]\\CustomerDetailClient.tsx';

let content = fs.readFileSync(path, 'utf8');

// Find the start of the broken block
// It starts with <tbody><tbody>
const brokenStartStr = '<tbody><tbody>';
const brokenStartIdx = content.indexOf(brokenStartStr);

if (brokenStartIdx === -1) {
    console.log('Could not find the double tbody error pattern. Checking for other patterns.');
    // Fallback? Maybe I just search for the start of the invoiceItems.map inside the services tab
} else {
    // Find the end of this table. It should be the first </table> after the broken start.
    const tableEndIdx = content.indexOf('</table>', brokenStartIdx);

    // The content to replace is from brokenStartIdx to right before tableEndIdx
    // We want to replace it with a single <tbody> and the services map.

    const correctServicesBody = `<tbody>
                                    {services.map((svc: any, i: number) => {
                                        let itemsStr = '';
                                        try {
                                             const parsed = typeof svc.items === 'string' ? JSON.parse(svc.items) : svc.items;
                                             itemsStr = Array.isArray(parsed) ? parsed.map((p:any) => p.name).join(', ') : '';
                                        } catch(e) {}

                                        return (
                                            <tr key={svc.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', cursor: 'pointer' }} onClick={() => router.push(\`/service/\${svc.id}\`)}>
                                                <td style={{ padding: '16px' }}>{new Date(svc.date).toLocaleDateString('tr-TR')}</td>
                                                <td><span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', fontWeight: 'bold' }}>{svc.plate}</span></td>
                                                <td>{svc.km ? svc.km.toLocaleString() : '-'} km</td>
                                                <td style={{ color: '#aaa' }}>{itemsStr || svc.description}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#fff' }}>
                                                    {Number(svc.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>`;

    // We need to match exactly what we are replacing.
    // The broken text ends with </tbody> just before </table>
    // So if we take substring(brokenStartIdx, tableEndIdx), we get the whole broken body.

    // BUT, we have a syntax error around 589: )}
    // This is because the injected code had `return ( ... )` which might have messed up braces if not careful.
    // The injected code was:
    // {invoiceItems.map... return ( ... ); })}

    // The original code likely ended with:
    // {services.map...} </tbody>

    // So simply replacing the block up to </table> should work provided I construct the replacement correctly.

    const before = content.substring(0, brokenStartIdx);
    const after = content.substring(tableEndIdx);

    // wait, tableEndIdx is index of </table>. So after includes </table>.

    content = before + correctServicesBody + after;

    console.log('Fixed services table body');
    fs.writeFileSync(path, content, 'utf8');
}

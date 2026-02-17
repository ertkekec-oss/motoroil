const fs = require('fs');
const path = 'c:\\Users\\Life\\Desktop\\muhasebe app\\motoroil\\src\\app\\customers\\[id]\\CustomerDetailClient.tsx';

let content = fs.readFileSync(path, 'utf8');

// Manual replacement using specific identifying string
const targetString = `<input
                                                                value={it.name}
                                                                onChange={(e) => updateItem('name', e.target.value)}
                                                                style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: '600', padding: '4px' }}
                                                            />`;

// Since formatting might differ slightly (indentation), I will construct the regex carefully derived from the view_file output.
// Lines 711-715:
/*
<input
    value={it.name}
    onChange={(e) => updateItem('name', e.target.value)}
    style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: '600', padding: '4px' }}
/>
*/

// I'll define matching parts.
const part1 = 'value={it.name}';
const part2 = "onChange={(e) => updateItem('name', e.target.value)}";
const part3 = "style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: '600', padding: '4px' }}";

const startIndex = content.indexOf(part1);
if (startIndex !== -1) {
    // Find the enclosing <input ... />
    const inputStart = content.lastIndexOf('<input', startIndex);
    const inputEnd = content.indexOf('/>', startIndex) + 2;

    if (inputStart !== -1 && inputEnd !== -1) {
        const originalInput = content.substring(inputStart, inputEnd);

        // Construct replacement
        const newContent = `<div className="flex-col">
                                                                ${originalInput}
                                                                <div style={{ paddingLeft: '4px', marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                    {(it.otvType && it.otvType !== 'Ö.T.V yok') && (
                                                                        <span style={{ fontSize: '9px', background: 'rgba(255,100,0,0.15)', color: '#fdba74', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(255,100,0,0.2)' }}>
                                                                            {it.otvType === 'yüzdesel Ö.T.V' ? \`ÖTV %\${it.otv}\` : \`ÖTV \${it.otv}₺\`}
                                                                        </span>
                                                                    )}
                                                                    {(Number(it.oiv || 0) > 0) && (
                                                                        <span style={{ fontSize: '9px', background: 'rgba(59,130,246,0.15)', color: '#93c5fd', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(59,130,246,0.2)' }}>
                                                                            ÖİV %\${it.oiv}
                                                                        </span>
                                                                    )}
                                                                    <button
                                                                        onClick={() => setTaxEditIndex(i)}
                                                                        style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', color: '#aaa', border: '1px dashed rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: '0.2s' }}
                                                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                                                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#aaa'; }}
                                                                    >
                                                                        ⚙️ Diğer Vergiler
                                                                    </button>
                                                                </div>
                                                            </div>`;
        content = content.replace(originalInput, newContent);
        fs.writeFileSync(path, content, 'utf8');
        console.log('Successfully replaced input with regex-free string manipulation.');
    } else {
        console.log('Could not find start/end of input tag');
    }
} else {
    console.log('Could not find distinctive part of input tag');
}

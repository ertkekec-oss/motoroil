const fs = require('fs');
const path = 'c:\\Users\\Life\\Desktop\\muhasebe app\\motoroil\\src\\app\\customers\\[id]\\CustomerDetailClient.tsx';

let content = fs.readFileSync(path, 'utf8');

// I'll be more resilient with whitespaces.
// I'll search for the input with value={it.name} and replace the whole input line.

const inputPattern = /<input\s+value=\{it\.name\}\s+onChange=\{\(e\) => updateItem\('name', e\.target\.value\)\}\s+style=\{[^}]+\}\s*\/>/;

const match = content.match(inputPattern);

if (match) {
    const originalInput = match[0];
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
    console.log('Successfully added Diğer Vergiler button using regex match.');
} else {
    console.log('Could not find item name input via regex.');
    // Check manual index again
    const idx = content.indexOf('value={it.name}');
    if (idx !== -1) {
        console.log('Found manual snippet:', content.substring(idx - 50, idx + 100));
    }
}

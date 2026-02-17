const fs = require('fs');
const path = 'c:\\Users\\Life\\Desktop\\muhasebe app\\motoroil\\src\\app\\customers\\[id]\\CustomerDetailClient.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Add "Diğer Vergiler" button to the Name TD.
// The Name TD is currently:
/*
<td style={{ padding: '12px' }}>
    <input
        value={it.name}
        onChange={(e) => updateItem('name', e.target.value)}
        style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: '600', padding: '4px' }}
    />
</td>
*/

// I need to change it to:
/*
<td style={{ padding: '12px' }}>
    <div className="flex-col">
        <input
            value={it.name}
            onChange={(e) => updateItem('name', e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: '600', padding: '4px' }}
        />
        <div style={{ paddingLeft: '4px', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            {/* Show active tax tags */}
{
    it.otvType && it.otvType !== 'Ö.T.V yok' && (
        <span style={{ fontSize: '9px', background: 'rgba(255,100,0,0.15)', color: '#fdba74', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(255,100,0,0.2)' }}>
            {it.otvType === 'yüzdesel Ö.T.V' ? `ÖTV %${it.otv}` : `ÖTV ${it.otv}₺`}
        </span>
    )
}
{
    it.oiv > 0 && (
        <span style={{ fontSize: '9px', background: 'rgba(59,130,246,0.15)', color: '#93c5fd', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(59,130,246,0.2)' }}>
            ÖİV %{it.oiv}
        </span>
    )
}

<button
    onClick={() => setTaxEditIndex(i)}
    style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', color: '#888', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
    className="hover:border-primary hover:text-primary"
>
    ⚙️ Diğer Vergiler
</button>
        </div >
    </div >
</td >
*/

// Let's implement this replacement.
const nameTdStart = `<input
                                                                value={it.name}
                                                                onChange={(e) => updateItem('name', e.target.value)}
                                                                style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: '600', padding: '4px' }}
                                                            />`;

const newNameTdContent = `<div className="flex-col">
                                                                <input
                                                                    value={it.name}
                                                                    onChange={(e) => updateItem('name', e.target.value)}
                                                                    style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: '600', padding: '4px' }}
                                                                />
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

// I need to be careful about finding the exact spot. 
// I'll search for the input line.
const replacementApplied = content.replace(nameTdStart, newNameTdContent);

if (replacementApplied !== content) {
    fs.writeFileSync(path, replacementApplied, 'utf8');
    console.log('Successfully added Diğer Vergiler button.');
} else {
    console.log('Could not find the target input to replace.');
    // Debug: Print a snippet of what we found around "it.name"
    const idx = content.indexOf('value={it.name}');
    if (idx !== -1) {
        console.log('Found snippet:', content.substring(idx - 50, idx + 100));
    }
}

const fs = require('fs');

const path = 'src/app/(app)/payment/page.tsx';
let txt = fs.readFileSync(path, 'utf8');

// Container
txt = txt.replace(/<div className="card glass" style=\{\{\n\s*maxWidth: '1200px',/g, '<div className="card glass animate-fade-in" style={{\n                maxWidth: \'1200px\',');
txt = txt.replace(/\s*padding: '40px'\n\s*\}\}>/g, '\n                padding: \'40px\',\n                border: \'1px solid rgba(255,255,255,0.05)\',\n                borderRadius: \'24px\'\n            }}>');

// Card blocks (3-column grid)
txt = txt.replace(/borderRadius: '12px',\n\s*border: '1px solid var\(--border-light\)'/g, 'borderRadius: \'20px\',\n                        border: \'1px solid rgba(255,255,255,0.05)\'');

// Payment method active state
txt = txt.replace(/border: paymentMethod === method\.id\n\s*\? `2px solid \$\{method\.color\}`\n\s*: '1px solid rgba\(255,255,255,0\.1\)',/g, 'border: paymentMethod === method.id\n                                            ? \`2px solid #3b82f6\`\n                                            : \'1px solid rgba(255,255,255,0.05)\',');

txt = txt.replace(/background: paymentMethod === method\.id\n\s*\? 'rgba\(255,255,255,0\.1\)'/g, 'background: paymentMethod === method.id\n                                            ? \'rgba(59,130,246,0.05)\'');

// Check icon
txt = txt.replace(/\{paymentMethod === method\.id && \(\n\s*<span style=\{\{\n\s*fontSize: '16px',\n\s*color: method\.color\n\s*\}\}>\n\s*✓\n\s*<\/span>\n\s*\)\}/, `{paymentMethod === method.id && (
                                        <span style={{ fontSize: '14px', color: '#3b82f6', background: 'rgba(59,130,246,0.1)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            ✓
                                        </span>
                                    )}`);

// Action buttons
txt = txt.replace(/✓ ONAYLA VE FİŞ KES/g, '✓ ONAYLA VE İŞLEMİ TAMAMLA');

// Primary blue button format
txt = txt.replace(/className="btn btn-primary"\n\s*style=\{\{/g, 'className="btn"\n                        style={{\n                            background: \'#3b82f6\',\n                            color: \'white\',\n                            border: \'1px solid rgba(59,130,246,0.4)\',\n                            boxShadow: \'0 8px 16px rgba(59,130,246,0.2)\',\n                            transition: \'all 0.2s\',');

fs.writeFileSync(path, txt);
console.log('payment page fixed.');

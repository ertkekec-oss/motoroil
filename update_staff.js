const fs = require('fs');

const path = 'src/components/StaffManagementContent.tsx';
let txt = fs.readFileSync(path, 'utf8');

// 1. Executive Header Değişimi
const oldHeaderRegex = /<div className="flex justify-between items-end mb-8">[\s\S]*?<div className="flex gap-3">[\s\S]*?<\/div>(\s*)<\/div>/;
const newHeader = `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                <div>
                    <h1 style={{ fontSize: '30px', fontWeight: '700', color: 'var(--text-main, #fff)', margin: 0, letterSpacing: '-0.5px' }}>Ekip & Yetki Yönetimi</h1>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted, #888)', marginTop: '6px', fontWeight: '500' }}>
                        Organizasyon yapısı ve personel operasyon kontrolü
                    </div>
                </div>

                <div className="flex gap-3">
                    {hasPermission('create_staff') && (
                        <button onClick={() => setShowAddStaffModal(true)} style={{ height: '44px', padding: '0 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)', transition: 'all 0.2s' }} className="hover:-translate-y-0.5 hover:shadow-xl">
                            <span style={{ fontSize: '18px' }}>+</span> Yeni Personel
                        </button>
                    )}
                </div>$1</div>`;

txt = txt.replace(oldHeaderRegex, newHeader);

// 2. Turuncu, Mor, Pembe Tonlarının Maviye Çekilmesi
txt = txt.replace(/bg-orange/g, 'bg-blue');
txt = txt.replace(/text-orange/g, 'text-blue');
txt = txt.replace(/border-orange/g, 'border-blue');
txt = txt.replace(/shadow-orange/g, 'shadow-blue');

txt = txt.replace(/bg-amber/g, 'bg-blue');
txt = txt.replace(/text-amber/g, 'text-blue');
txt = txt.replace(/border-amber/g, 'border-blue');
txt = txt.replace(/shadow-amber/g, 'shadow-blue');

txt = txt.replace(/bg-pink/g, 'bg-indigo');
txt = txt.replace(/text-pink/g, 'text-indigo');
txt = txt.replace(/border-pink/g, 'border-indigo');
txt = txt.replace(/shadow-pink/g, 'shadow-indigo');

txt = txt.replace(/bg-purple/g, 'bg-slate');
txt = txt.replace(/text-purple/g, 'text-slate');
txt = txt.replace(/border-purple/g, 'border-slate');
txt = txt.replace(/shadow-purple/g, 'shadow-slate');

txt = txt.replace(/bg-fuchsia/g, 'bg-indigo');
txt = txt.replace(/text-fuchsia/g, 'text-indigo');
txt = txt.replace(/border-fuchsia/g, 'border-indigo');
txt = txt.replace(/shadow-fuchsia/g, 'shadow-indigo');

txt = txt.replace(/bg-rose/g, 'bg-blue');
txt = txt.replace(/text-rose/g, 'text-blue');
txt = txt.replace(/border-rose/g, 'border-blue');
txt = txt.replace(/shadow-rose/g, 'shadow-blue');

// bg-primary, vb
txt = txt.replace(/bg-primary\/20/g, 'bg-blue-500/20');
txt = txt.replace(/bg-primary\/10/g, 'bg-blue-500/10');
txt = txt.replace(/bg-primary/g, 'bg-blue-600');
txt = txt.replace(/text-primary/g, 'text-blue-500');
txt = txt.replace(/border-primary/g, 'border-blue-500/30');
txt = txt.replace(/focus:border-primary/g, 'focus:border-blue-500');
txt = txt.replace(/shadow-primary/g, 'shadow-blue');

// Premiumlaştır (glass ekledik tablolara)
txt = txt.replace(/className="glass/g, 'className="glass border border-white/5');

fs.writeFileSync(path, txt);
console.log('Update script completed successfully.');

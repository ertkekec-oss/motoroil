const fs = require('fs');
const path = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let txt = fs.readFileSync(path, 'utf8');

const oldTrRegex = /\{expandedRowId === item\.id && item\.items && \(\s*<tr style=\{\{ background: 'var\(--bg-card, rgba\(0,0,0,0\.2\)\)', boxShadow: 'inset 0 0 20px rgba\(0,0,0,0\.3\)' \}\}>[\s\S]*?<\/td>\s*<\/tr>\s*\)\}/;

const newTr = `{expandedRowId === item.id && item.items && (
                                                <tr style={{ background: '#080a0f', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.03))' }}>
                                                    <td colSpan={6} style={{ padding: '24px 32px' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                                                            {/* Sol Taraf: Kalemler (Order Summary) */}
                                                            <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '24px', border: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))', paddingBottom: '16px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                                                            📦
                                                                        </div>
                                                                        <div>
                                                                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-main, #fff)', letterSpacing: '0.5px' }}>SATIŞ ÖZETİ</h4>
                                                                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>{item.items.length} Kalem Listeleniyor</div>
                                                                        </div>
                                                                    </div>
                                                                    <span style={{ fontSize: '11px', fontWeight: '800', padding: '6px 12px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>{item.isFormal ? 'Faturalandı' : 'Sipariş'}</span>
                                                                </div>

                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    {item.items.map((sub: any, sIdx: number) => (
                                                                        <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-panel, rgba(0,0,0,0.2))', borderRadius: '12px', border: '1px solid var(--border-color, rgba(255,255,255,0.02))' }}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-card, rgba(255,255,255,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--text-muted, #888)', fontWeight: '800' }}>
                                                                                    {sIdx + 1}
                                                                                </div>
                                                                                <div>
                                                                                    <div style={{ color: 'var(--text-main, #e2e8f0)', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>{sub.name || sub.productName}</div>
                                                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                                        <span style={{ fontSize: '11px', color: 'var(--text-muted, #888)', background: 'var(--bg-card, rgba(255,255,255,0.05))', padding: '2px 6px', borderRadius: '4px' }}>x{sub.qty || sub.quantity}</span>
                                                                                        {sub.price && <span style={{ fontSize: '11px', color: 'var(--text-muted, #666)' }}>Birim: {Number(sub.price).toLocaleString('tr-TR')} ₺</span>}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div style={{ fontWeight: '800', color: 'var(--text-main, #fff)', fontFamily: 'monospace', fontSize: '15px' }}>
                                                                                {((sub.price || 0) * (sub.qty || sub.quantity || 1)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Sağ Taraf: Payment Breakdown & Timeline */}
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                                                
                                                                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '24px', border: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                                                                    <h4 style={{ margin: '0 0 20px 0', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '1px' }}>FİNANSAL ÖZET</h4>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted, #aaa)' }}>
                                                                            <span>Ara Toplam</span>
                                                                            <span>{Math.abs(item.amount * 0.8).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                                                        </div>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted, #aaa)' }}>
                                                                            <span>KDV (%20)</span>
                                                                            <span>{Math.abs(item.amount * 0.2).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                                                        </div>
                                                                        <div style={{ height: '1px', background: 'var(--border-color, rgba(255,255,255,0.1))', margin: '8px 0' }}></div>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main, #fff)' }}>GENEL TOPLAM</span>
                                                                            <span style={{ fontSize: '20px', fontWeight: '900', color: '#3b82f6', fontFamily: 'monospace' }}>
                                                                                {Math.abs(item.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '24px', border: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                                                                     <h4 style={{ margin: '0 0 20px 0', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '1px' }}>ZAMAN ÇİZELGESİ</h4>
                                                                     <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                                                                        <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border-color, rgba(255,255,255,0.05))' }}></div>
                                                                        
                                                                        <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                                                                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#3b82f6', border: '4px solid #080a0f', flexShrink: 0, marginTop: '2px' }}></div>
                                                                            <div>
                                                                                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main, #fff)' }}>Satış Oluşturuldu</div>
                                                                                <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>{item.date} • İşlem No: #{item.id?.substring(0,8)}</div>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {item.isFormal && (
                                                                            <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                                                                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#10b981', border: '4px solid #080a0f', flexShrink: 0, marginTop: '2px' }}></div>
                                                                                <div>
                                                                                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main, #fff)' }}>Resmileştirildi (Faturalandı)</div>
                                                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>Sistem tarafından E-Arşive eklendi</div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                     </div>
                                                                </div>

                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}`;

txt = txt.replace(oldTrRegex, newTr);

fs.writeFileSync(path, txt);
console.log('CustomerDetailClient.tsx expanded row fixed.');

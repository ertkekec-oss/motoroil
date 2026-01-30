
"use client";

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';

export default function ServiceDashboard() {
    const { currentUser, hasPermission } = useApp();
    const isSystemAdmin = currentUser === null;

    const activeJobs: any[] = [];
    const appointments: any[] = [];

    const filteredJobs = !hasPermission('branch_isolation') || isSystemAdmin
        ? activeJobs
        : activeJobs.filter(j => j.branch === currentUser?.branch);

    const filteredAppointments = !hasPermission('branch_isolation') || isSystemAdmin
        ? appointments
        : appointments.filter(a => a.branch === currentUser?.branch);

    const [selectedService, setSelectedService] = useState<any>(null);
    const [activeServiceTab, setActiveServiceTab] = useState<'jobs' | 'calendar'>('jobs');

    const serviceHistoryDetails = {
        'SRV-892': {
            parts: [
                { name: 'Motul 7100 10W40', qty: 3, price: 450 },
                { name: 'Yağ Filtresi', qty: 1, price: 180 }
            ],
            labor: 'Periyodik Bakım + Zincir Ayarı',
            laborPrice: 750,
            notes: 'Müşteri rölanti düşüklüğünden şikayetçi. Gaz kelebeği temizlenecek.',
            nextMaintenance: '34,500 KM / 24.07.2026'
        }
    };

    return (
        <div className="container" style={{ padding: '40px 20px' }}>
            <header className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="text-gradient">Servis Merkezi</h1>
                    <p className="text-muted">Atölye Durumu ve Randevu Planlama</p>
                </div>
                <div className="flex-center gap-4">
                    <div className="text-muted" style={{ fontSize: '14px' }}>Doluluk: <span style={{ color: 'var(--warning)' }}>%65</span></div>
                    <a href="/service/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>+ Yeni Kabul</a>
                </div>
            </header>

            {/* TABS */}
            <div className="flex-center mb-8" style={{ justifyContent: 'flex-start', borderBottom: '1px solid var(--border-light)', gap: '24px' }}>
                <button
                    onClick={() => setActiveServiceTab('jobs')}
                    className={`btn ${activeServiceTab === 'jobs' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ borderBottom: activeServiceTab === 'jobs' ? '2px solid var(--primary)' : 'none', borderRadius: '0', padding: '12px 24px' }}
                >
                    🏢 Atölye (Aktif İşler)
                </button>
                <button
                    onClick={() => setActiveServiceTab('calendar')}
                    className={`btn ${activeServiceTab === 'calendar' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ borderBottom: activeServiceTab === 'calendar' ? '2px solid var(--primary)' : 'none', borderRadius: '0', padding: '12px 24px' }}
                >
                    📅 Randevu Takvimi
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid-cols-3" style={{ marginBottom: '32px' }}>
                <div className="card glass">
                    <div className="text-muted" style={{ fontSize: '12px' }}>AÇIK İŞ EMRİ</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{filteredJobs.length} Araç</div>
                </div>
                <div className="card glass">
                    <div className="text-muted" style={{ fontSize: '12px' }}>BUGÜN TAMAMLANAN</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>0 Araç</div>
                </div>
                <div className="card glass">
                    <div className="text-muted" style={{ fontSize: '12px' }}>ORTALAMA SÜRE</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>-</div>
                </div>
            </div>

            {activeServiceTab === 'jobs' ? (
                <div className="card glass">
                    <h3>Atölye Listesi</h3>
                    <table style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead className="text-muted" style={{ fontSize: '12px', borderBottom: '1px solid var(--border-light)' }}>
                            <tr>
                                <th style={{ padding: '12px' }}>Fiş No</th>
                                <th>Araç Bilgisi</th>
                                <th>Giriş Saati</th>
                                <th>Durum</th>
                                <th>Teknisyen</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredJobs.map(job => (
                                <tr key={job.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '16px 0', fontFamily: 'monospace' }}>{job.id}</td>
                                    <td>
                                        <div style={{ fontWeight: '500' }}>{job.vehicle}</div>
                                        <div className="text-muted" style={{ fontSize: '12px' }}>{job.plate}</div>
                                    </td>
                                    <td className="text-muted">{job.entry}</td>
                                    <td>
                                        <span style={{
                                            fontSize: '12px', padding: '4px 8px', borderRadius: '4px',
                                            background: job.status === 'İşlemde' ? 'rgba(59, 130, 246, 0.2)' : job.status === 'Tamamlandı' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                            color: job.status === 'İşlemde' ? '#60A5FA' : job.status === 'Tamamlandı' ? '#34D399' : 'var(--text-muted)'
                                        }}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td>{job.technician}</td>
                                    <td>
                                        <button onClick={() => setSelectedService(job)} className="btn btn-outline" style={{ fontSize: '12px' }}>Detay / Düzenle</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card glass">
                    <div className="flex-between mb-4">
                        <h3>Gelecek Randevular</h3>
                        <button className="btn btn-outline">+ Randevu Oluştur</button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead className="text-muted" style={{ fontSize: '12px', borderBottom: '1px solid var(--border-light)' }}>
                            <tr>
                                <th style={{ padding: '12px' }}>Tarih / Saat</th>
                                <th>Müşteri</th>
                                <th>Araç</th>
                                <th>İşlem Türü</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.map(app => (
                                <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '16px 0' }}>
                                        <div style={{ fontWeight: 'bold' }}>{app.time}</div>
                                        <div className="text-muted" style={{ fontSize: '12px' }}>{app.date}</div>
                                    </td>
                                    <td>{app.customer}</td>
                                    <td>
                                        <div>{app.vehicle}</div>
                                        <div className="text-muted" style={{ fontSize: '12px' }}>{app.plate}</div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>{app.type}</span>
                                    </td>
                                    <td>
                                        <div className="flex-center gap-2">
                                            <button className="btn btn-outline" style={{ fontSize: '11px' }}>Kabul Et</button>
                                            <button className="btn btn-outline" style={{ fontSize: '11px', color: 'var(--danger)' }}>İptal</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* SERVICE DETAIL MODAL */}
            {selectedService && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card glass" style={{ width: '700px', background: 'var(--bg-card)' }}>
                        <div className="flex-between mb-6">
                            <h2 className="text-gradient">🛠️ Servis Detayı: {selectedService.id}</h2>
                            <button onClick={() => setSelectedService(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px' }}>×</button>
                        </div>

                        <div className="grid-cols-2 gap-6 mb-6">
                            <div className="flex-col gap-2">
                                <label className="text-muted" style={{ fontSize: '12px' }}>ARAÇ / MÜŞTERİ</label>
                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                    {selectedService.vehicleSerial ? (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>{selectedService.vehicleBrand || selectedService.vehicle}</span>
                                            <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 'normal' }}>Seri No: {selectedService.vehicleSerial}</span>
                                        </div>
                                    ) : (
                                        `${selectedService.plate} - ${selectedService.vehicle}`
                                    )}
                                </div>
                                <div className="text-muted">{selectedService.customer}</div>
                            </div>
                            <div className="flex-col gap-2" style={{ textAlign: 'right' }}>
                                <label className="text-muted" style={{ fontSize: '12px' }}>MEVCUT KM</label>
                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectedService.km} KM</div>
                                <div style={{ color: 'var(--primary)', fontSize: '13px' }}>Bakım Girişi: {selectedService.entry}</div>
                            </div>
                        </div>

                        <div className="card" style={{ background: 'rgba(255,255,255,0.02)', marginBottom: '24px' }}>
                            <h4 className="mb-4">📋 Yapılan İşlemler & Parçalar</h4>
                            {(serviceHistoryDetails as any)[selectedService.id] ? (
                                <>
                                    <table style={{ width: '100%', marginBottom: '16px' }}>
                                        <thead>
                                            <tr className="text-muted" style={{ fontSize: '11px', textAlign: 'left' }}>
                                                <th>PARÇA / HİZMET</th>
                                                <th>ADET</th>
                                                <th style={{ textAlign: 'right' }}>TUTAR</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(serviceHistoryDetails as any)[selectedService.id].parts.map((p: any, i: number) => (
                                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '8px 0' }}>{p.name}</td>
                                                    <td>{p.qty}</td>
                                                    <td style={{ textAlign: 'right' }}>₺ {p.price * p.qty}</td>
                                                </tr>
                                            ))}
                                            <tr>
                                                <td style={{ padding: '8px 0', color: 'var(--secondary)' }}>{(serviceHistoryDetails as any)[selectedService.id].labor}</td>
                                                <td>1</td>
                                                <td style={{ textAlign: 'right' }}>₺ {(serviceHistoryDetails as any)[selectedService.id].laborPrice}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid var(--primary)' }}>
                                        <div className="text-muted" style={{ fontSize: '11px' }}>🔔 GELECEK BAKIM HATIRLATMASI</div>
                                        <div style={{ fontWeight: 'bold', color: 'white' }}>{(serviceHistoryDetails as any)[selectedService.id].nextMaintenance}</div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-muted">Bu servis kaydı için detaylı döküm bulunamadı.</p>
                            )}
                        </div>

                        <div className="flex-between">
                            <button className="btn btn-outline">🖨️ Formu Yazdır</button>
                            <div className="flex-center gap-3">
                                <button onClick={() => setSelectedService(null)} className="btn btn-outline" style={{ border: 'none' }}>Kapat</button>
                                <button className="btn btn-primary">Değişiklikleri Kaydet</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

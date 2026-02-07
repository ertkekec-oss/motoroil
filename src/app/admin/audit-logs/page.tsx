
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface AuditLog {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    before: any;
    after: any;
    userName: string;
    details: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
    tenantId: string;
}

export default function AuditLogsPage() {
    const { user } = useAuth();
    const { showModal } = useModal();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        entity: '',
        action: '',
        userId: '',
        tenantId: '',
        startDate: '',
        endDate: ''
    });

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(filters);
            const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setLogs(data.logs);
            }
        } catch (error) {
            console.error('Fetch logs error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const showDiff = (log: AuditLog) => {
        showModal({
            title: `Denetim Detayı - ${log.action}`,
            type: 'info',
            size: 'wide',
            content: (
                <div className="diff-modal" style={{ color: 'white', padding: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <h4 style={{ color: '#ff4444', marginBottom: '10px' }}>Önceki Hali (Before)</h4>
                            <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px', fontSize: '12px', overflow: 'auto', maxHeight: '400px' }}>
                                {JSON.stringify(log.before || {}, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <h4 style={{ color: '#00c851', marginBottom: '10px' }}>Sonraki Hali (After)</h4>
                            <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px', fontSize: '12px', overflow: 'auto', maxHeight: '400px' }}>
                                {JSON.stringify(log.after || {}, null, 2)}
                            </pre>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            <strong>Cihaz Bilgisi:</strong> {log.userAgent}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>
                            <strong>IP Adresi:</strong> {log.ipAddress}
                        </div>
                    </div>
                </div>
            )
        });
    };

    const exportCSV = () => {
        const headers = ["Zaman", "Kullanici", "Islem", "Varlik", "Detay", "IP Adresi"];
        const rows = logs.map(log => [
            format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm:ss'),
            log.userName,
            log.action,
            log.entity,
            log.details?.replace(/,/g, ';'),
            log.ipAddress
        ]);

        const csvContent = headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `denetim_kayitlari_${format(new Date(), 'yyyyMMdd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="page-container" style={{ padding: '40px', background: 'radial-gradient(circle at top right, #1e2235, #0f111a)', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '950', color: 'white', letterSpacing: '-1px', textShadow: '0 0 20px rgba(68,110,231,0.3)' }}>
                        🔍 Audit Console v2.0
                    </h1>
                    <p style={{ color: '#94a3b8', marginTop: '8px', fontSize: '14px', fontWeight: '500' }}>
                        ISO-27001 Uyumlu Değiştirilemez Denetim İzleri
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={exportCSV}
                        className="btn-secondary"
                        style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }}
                    >
                        📥 CSV Dışa Aktar
                    </button>
                    <button
                        onClick={fetchLogs}
                        className="btn-primary"
                        style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: '750', cursor: 'pointer', boxShadow: '0 8px 16px rgba(68,110,231,0.25)', transition: '0.2s' }}
                    >
                        🔄 Kayıtları Tazele
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <input
                    type="text"
                    placeholder="Entity (Customer, Order...)"
                    value={filters.entity}
                    onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', color: 'white' }}
                />
                <input
                    type="text"
                    placeholder="Action"
                    value={filters.action}
                    onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', color: 'white' }}
                />
                <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', color: 'white' }}
                />
                <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', color: 'white' }}
                />
                <button
                    onClick={fetchLogs}
                    style={{ background: '#446ee7', border: 'none', borderRadius: '10px', padding: '10px', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                >
                    Filtrele
                </button>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)' }}>
                        <tr>
                            <th style={{ padding: '18px 24px', color: '#94a3b8', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Zaman</th>
                            <th style={{ padding: '18px 24px', color: '#94a3b8', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Kullanıcı</th>
                            <th style={{ padding: '18px 24px', color: '#94a3b8', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>İşlem</th>
                            <th style={{ padding: '18px 24px', color: '#94a3b8', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Varlık</th>
                            <th style={{ padding: '18px 24px', color: '#94a3b8', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Detay</th>
                            <th style={{ padding: '18px 24px', color: '#94a3b8', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}></th>
                        </tr>
                    </thead>
                    <tbody style={{ color: 'white' }}>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Yükleniyor...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Kayıt bulunamadı.</td></tr>
                        ) : logs.map((log) => (
                            <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: '0.2s' }} className="table-row-hover">
                                <td style={{ padding: '18px 24px', whiteSpace: 'nowrap' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{format(new Date(log.createdAt), 'dd MMM yyyy', { locale: tr })}</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{format(new Date(log.createdAt), 'HH:mm:ss')}</div>
                                </td>
                                <td style={{ padding: '18px 24px' }}>
                                    <div style={{ fontWeight: '700' }}>{log.userName}</div>
                                    <div style={{ fontSize: '10px', color: '#446ee7' }}>ID: {log.tenantId}</div>
                                </td>
                                <td style={{ padding: '18px 24px' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '900',
                                        background: log.action.includes('CREATE') ? 'rgba(0, 200, 81, 0.1)' :
                                            log.action.includes('UPDATE') ? 'rgba(68, 110, 231, 0.1)' :
                                                log.action.includes('DELETE') ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
                                        color: log.action.includes('CREATE') ? '#00c851' :
                                            log.action.includes('UPDATE') ? '#446ee7' :
                                                log.action.includes('DELETE') ? '#ff4444' : '#white'
                                    }}>
                                        {log.action}
                                    </span>
                                </td>
                                <td style={{ padding: '18px 24px', color: '#cbd5e1', fontWeight: '600' }}>{log.entity}</td>
                                <td style={{ padding: '18px 24px', fontSize: '13px' }}>{log.details}</td>
                                <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                                    {(log.before || log.after) && (
                                        <button
                                            onClick={() => showDiff(log)}
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}
                                        >
                                            👁️ Detay
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .table-row-hover:hover { background: rgba(255,255,255,0.02); }
                .btn-primary:active { transform: scale(0.98); }
            `}</style>
        </div>
    );
}

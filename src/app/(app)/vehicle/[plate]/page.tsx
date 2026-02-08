
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function VehicleHistoryPage({ params }: { params: Promise<{ plate: string }> }) {
    const { plate: rawPlate } = await params;
    // Decode safely just in case, though params usually decoded. 
    // Usually browser sends encoded, Next decodes. But let's ensure we match DB.
    // Uppercase and trim standard for plates.
    const plate = decodeURIComponent(rawPlate).toUpperCase().replace(/\s/g, '');

    // Normalize DB search: simple contains or exact match. 
    // Since we store plates loosely, we might want to try exact match first.
    // We'll search where plate contains or equals, stripped of spaces.
    // Prisma doesn't support complex regex easily in SQLite/MySQL without raw, 
    // so we'll fetch matches close to it or just rely on exact match if we enforce format.
    // For now, let's assume exact match on what was stored (usually spaced).
    // Better: Fetch services where plate contains the sequence (but this is hard).
    // Let's stick to exact match or simple case insensitive.

    // We will search for services with this plate.
    const services = await prisma.serviceRecord.findMany({
        where: {
            plate: {
                contains: rawPlate // loose matching
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            customer: {
                select: { name: true } // Just name for confirmation, maybe hide for privacy?
            }
        }
    });

    if (!services || services.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-900 text-white">
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
                <h1 className="text-2xl font-bold mb-2">Kayıt Bulunamadı</h1>
                <p className="text-gray-400">"{decodeURIComponent(rawPlate)}" plakalı araca ait servis geçmişi görüntülenemedi.</p>
                <Link href="/" className="mt-8 text-blue-400">Ana Sayfa</Link>
            </div>
        );
    }

    // Privacy: Don't show full Customer Name publicly, maybe masked.
    // e.g. Ahm** Yıl***
    const maskName = (name: string) => {
        if (!name) return '***';
        return name.split(' ').map(n => n[0] + '*'.repeat(Math.max(0, n.length - 1))).join(' ');
    };

    const latestService = services[0];
    const customerName = maskName(latestService.customer?.name || '');

    return (
        <div style={{ background: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)', padding: '30px 20px', textAlign: 'center', boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)' }}>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Periodya</h1>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Dijital Servis Karnesi</div>
            </div>

            {/* Vehicle Card */}
            <div style={{ margin: '-20px 20px 20px 20px', background: '#1e293b', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>ARAÇ PLAKASI</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', margin: '5px 0' }}>{latestService.plate?.toUpperCase()}</div>
                <div style={{ display: 'flex', gap: '20px', marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                    <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>SON BAKIM</div>
                        <div style={{ fontWeight: 'bold', color: '#e2e8f0' }}>{new Date(latestService.createdAt).toLocaleDateString('tr-TR')}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>SON KM</div>
                        <div style={{ fontWeight: 'bold', color: '#e2e8f0' }}>{latestService.km?.toLocaleString()}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>SAHİBİ</div>
                        <div style={{ fontWeight: 'bold', color: '#e2e8f0' }}>{customerName}</div>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
                <h3 style={{ borderLeft: '4px solid #f59e0b', paddingLeft: '10px', marginBottom: '20px', fontSize: '18px' }}>Servis Geçmişi</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {services.map((service, index) => (
                        <div key={service.id} style={{ position: 'relative', paddingLeft: '20px' }}>
                            {/* Vertical Line */}
                            {index !== services.length - 1 && (
                                <div style={{ position: 'absolute', left: '0', top: '10px', bottom: '-30px', width: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
                            )}
                            {/* Dot */}
                            <div style={{ position: 'absolute', left: '-4px', top: '8px', width: '10px', height: '10px', borderRadius: '50%', background: index === 0 ? '#f59e0b' : '#64748b' }}></div>

                            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 'bold', color: '#f8fafc' }}>
                                        {new Date(service.createdAt).toLocaleDateString('tr-TR')}
                                    </span>
                                    <span style={{ fontSize: '13px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                                        {service.km?.toLocaleString()} KM
                                    </span>
                                </div>

                                <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}>
                                    {(Array.isArray(service.items) ? service.items : []).map((item: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ color: '#f59e0b', fontSize: '10px' }}>●</span>
                                            {item.name || item.description}
                                        </div>
                                    ))}
                                </div>

                                {service.notes && (
                                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b', fontStyle: 'italic', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                                        Not: {service.notes}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569', fontSize: '12px' }}>
                <p>Bu kayıtlar Periodya Servis Sistemi tarafından oluşturulmuştur.</p>
                <Link href="https://www.periodya.com.tr" style={{ color: '#f59e0b', textDecoration: 'none' }}>www.periodya.com.tr</Link>
            </div>
        </div>
    );
}

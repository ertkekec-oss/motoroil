import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ConfirmDeliveryAction from "./ConfirmDeliveryAction";

function formatDateTR(d: Date | null | undefined) {
    if (!d) return "-";
    try {
        return new Intl.DateTimeFormat("tr-TR", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Europe/Istanbul",
        }).format(d);
    } catch {
        return d.toISOString() ?? "-";
    }
}

function formatMoney(amount: any, currency: string) {
    const n = typeof amount === "number" ? amount : Number(amount?.toString?.() ?? 0);
    try {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: currency || "TRY",
            maximumFractionDigits: 2,
        }).format(n);
    } catch {
        return `${n.toFixed(2)} ${currency || "TRY"}`;
    }
}

export default async function BuyerOrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");

    // Buyer yetki kontrolü
    const perms: string[] = user.permissions || [];
    if (!perms.includes("network_buy") && user.role !== "SUPER_ADMIN" && user.role !== "admin") {
        redirect("/403");
    }

    const order = await prisma.networkOrder.findUnique({
        where: { id },
        include: {
            sellerCompany: { select: { id: true, name: true, taxNumber: true } },
            shipments: {
                orderBy: { sequence: 'asc' }
            },
            payments: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
    });

    if (!order) redirect("/network/buyer/orders");

    const latestPayment = order.payments[0];

    const pendingShipments = order.shipments.filter(s => s.status !== 'DELIVERED').length;
    const allDelivered = order.shipments.length > 0 && pendingShipments === 0;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <Link href="/network/buyer/orders" className="text-sm text-gray-500 hover:text-gray-900">&larr; Siparişlerime Dön</Link>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 mt-2">Sipariş Detayı</h1>
                    <p className="text-sm font-mono text-gray-500 mt-1">#{order.id}</p>
                </div>
                <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {order.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sol Kolon: Detaylar */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Özet Bilgiler</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Satıcı Firma</p>
                                <p className="text-sm text-gray-900 font-semibold">{order.sellerCompany.name}</p>
                                <p className="text-xs text-gray-500 font-mono">VKN: {order.sellerCompany.taxNumber || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Toplam Tutar</p>
                                <p className="text-sm text-gray-900 font-semibold">{formatMoney(order.totalAmount, order.currency)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Sipariş Tarihi</p>
                                <p className="text-sm text-gray-900">{formatDateTR(order.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Ödeme Model</p>
                                <p className="text-sm text-gray-900">{latestPayment ? `${latestPayment.provider} (${latestPayment.mode})` : 'Bekleniyor'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Kargo Listesi */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Kargo ve Teslimat Timeline</h3>

                        {order.shipments.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4 italic text-center text-amber-600 bg-amber-50 rounded-lg">Satıcı henüz kargo gönderimi başlatmadı.</p>
                        ) : (
                            <div className="space-y-4 lg:space-y-6">
                                {order.shipments.map((shp) => (
                                    <div key={shp.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex gap-3">
                                                <span className="bg-gray-800 text-white rounded px-2 py-0.5 text-xs font-bold leading-none flex items-center">PAKET #{shp.sequence}</span>
                                                <span className="font-mono text-xs text-gray-600 font-semibold">{shp.carrierCode} - {shp.trackingNumber || 'Takip No Bekleniyor'}</span>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded border ${shp.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-indigo-100 text-indigo-800 border-indigo-300'}`}>
                                                {shp.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 flex gap-4">
                                            <p>Oluşturulma: <span className="text-gray-900 font-medium">{formatDateTR(shp.createdAt)}</span></p>
                                            {shp.deliveryNoteUuid && (
                                                <p className="flex items-center gap-1 text-blue-600 font-medium">e-İrsaliye Kaydı Mevcut</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sağ Kolon: Action Sidebar */}
                <div className="md:col-span-1 space-y-6">
                    <ConfirmDeliveryAction
                        orderId={order.id}
                        allShipmentsDelivered={allDelivered}
                        alreadyConfirmed={order.status === 'COMPLETED' || !!order.confirmedAt}
                    />

                    {/* Escrow Payout Durumu Opsiyonel Görüntü */}
                    {latestPayment && latestPayment.mode === 'ESCROW' && (
                        <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl">
                            <h4 className="text-sm font-semibold text-blue-900 mb-2">Güvenli Ödeme Koruması</h4>
                            <p className="text-xs text-blue-800 leading-relaxed">
                                Ödemeniz havuz hesabımızda (Escrow) güvence altında tutulmaktadır.
                                Ürünleri eksiksiz teslim aldığınızı onayladığınızda satıcıya aktarılır.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import PartialShipmentManager from "./PartialShipmentManager";

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

export default async function SellerOrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");

    // Seller yetki kontrolü
    const perms: string[] = user.permissions || [];
    if (!perms.includes("network_sell") && user.role !== "SUPER_ADMIN" && user.role !== "admin") {
        redirect("/403");
    }

    const order = await prisma.networkOrder.findUnique({
        where: { id },
        include: {
            buyerCompany: { select: { id: true, name: true, taxNumber: true } },
            shipments: {
                orderBy: { sequence: 'asc' }
            },
            payments: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
    });

    if (!order) redirect("/network/seller/orders");

    // Prevent seeing orders that do not belong to seller
    if (order.sellerCompanyId !== session.settings.companyId) {
        redirect("/403");
    }

    const items = Array.isArray(order.items) ? order.items : [];
    const activeShipments = order.shipments;

    // Logic flag: Only allow shipping if order is PAID
    const canShip = order.status === 'PAID';

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <Link href="/network/seller/orders" className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 bg-white rounded-md px-2 py-1">&larr; Satışlara Dön</Link>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 mt-2">Sipariş Yönetimi</h1>
                    <p className="text-sm font-mono text-gray-500 mt-1">#{order.id}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border 
                ${order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            order.status === 'PAID' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                order.status === 'DELIVERED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                    'bg-gray-100 text-gray-600 border-gray-300'}`}>
                        {order.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium tracking-wider uppercase mb-1">Müşteri (Alıcı)</p>
                            <p className="text-base text-gray-900 font-semibold">{order.buyerCompany.name}</p>
                            <p className="text-xs text-gray-500 font-mono mt-1">VKN: {order.buyerCompany.taxNumber || 'Belirtilmedi'}</p>
                        </div>
                        <div className="w-px bg-gray-100 hidden md:block"></div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium tracking-wider uppercase mb-1">Finans</p>
                            <p className="text-xl text-emerald-600 font-bold">{formatMoney(order.subtotalAmount, order.currency)}</p>
                            <p className="text-xs text-gray-500 mt-1 flex justify-between">
                                <span>Komisyon (Platform):</span>
                                <span className="font-mono text-rose-500">-{formatMoney(order.commissionAmount, order.currency)}</span>
                            </p>
                        </div>
                    </div>

                    {/* Shipment Labels and Tracking */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Kargo ve Barkod Çıktıları</h3>

                        {activeShipments.length === 0 ? (
                            <p className="text-sm text-gray-500 py-6 text-center italic">Henüz gönderim başlatılmadı.</p>
                        ) : (
                            <div className="space-y-4">
                                {activeShipments.map((shp) => (
                                    <div key={shp.id} className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <div className="flex gap-3 mb-2">
                                                <span className="bg-indigo-600 text-white rounded px-2 py-0.5 text-xs font-bold leading-none flex items-center shadow-sm">PAKET #{shp.sequence}</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded border border-gray-200 bg-white shadow-sm flex items-center`}>
                                                    {shp.status}
                                                </span>
                                            </div>
                                            <p className="font-mono text-sm text-gray-900 font-semibold mb-1">Takip No: {shp.trackingNumber || 'Hazırlanıyor...'}</p>
                                            <p className="text-xs text-gray-500">Firma: {shp.carrierCode} | İrsaliye UUID: {shp.deliveryNoteUuid || 'Nilvera Bekleniyor'}</p>
                                        </div>
                                        <div className="flex gap-2 w-full md:w-auto">
                                            {shp.labelUrl && (
                                                <a href={shp.labelUrl} target="_blank" className="flex-1 md:flex-none text-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium text-xs px-4 py-2 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black">
                                                    Barkod PDF
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Sidebar Column */}
                <div className="lg:col-span-1 border-gray-200 space-y-6">
                    {/* If not PAID, seller cannot ship (e.g. pending payment, or completed) */}
                    {!canShip && order.status !== 'COMPLETED' && order.status !== 'DELIVERED' && order.status !== 'SHIPPED' ? (
                        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                            <span className="text-2xl mb-2">⏳</span>
                            <h4 className="text-sm font-semibold text-amber-900">Ödeme Bekleniyor</h4>
                            <p className="text-xs text-amber-700 mt-2 leading-relaxed">
                                Alıcı henüz ödemeyi tamamlamadı. Ödeme tamamlandığında kargo gönderim ekranı açılacaktır.
                            </p>
                        </div>
                    ) : (
                        canShip ? (
                            <PartialShipmentManager orderId={order.id} originalItems={items} />
                        ) : (
                            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                                <span className="text-2xl mb-2">✅</span>
                                <h4 className="text-sm font-semibold text-emerald-900">Ürünler Yolda veya Teslim Silsilesinde</h4>
                                <p className="text-xs text-emerald-700 mt-2 leading-relaxed overflow-hidden text-ellipsis line-clamp-3">
                                    Tüm aksiyonlar tamamlandı. Paranız havuzda, alıcının onayını bekliyor.
                                </p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

import { EnterprisePageShell, EnterpriseCard, EnterpriseTable, EnterpriseButton } from "@/components/ui/enterprise";
import { prisma } from "@/lib/prisma";
import { getStrictTenantId } from "@/services/contracts/tenantContext";
import { FileText, Link as LinkIcon, AlertCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SupplierAgreementsPage() {
    const tenantId = await getStrictTenantId();

    // In a real app we'd fetch connections from `DealerMembership` -> `NetworkAgreement`
    // For this prototype MVP, we extract active agreements where supplierTenantId matches strictly.
    const agreements = await prisma.networkAgreement.findMany({
        where: { supplierTenantId: tenantId },
        include: { policySnapshot: true },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    const pendingCount = agreements.filter(a => a.status === 'SENT').length;
    const activeCount = agreements.filter(a => a.status === 'ACTIVE').length;
    const missingCount = 12; // Static stub for dealers without agreements for MVP presentation

    return (
        <EnterprisePageShell
            title="Bayi Ağı Sözleşme Yönetimi"
            description="Tüm B2B ağınızdaki katılımcıların sözleşme durumlarını ve risk politikalarını yönetin."
            actions={
                <div className="flex gap-2">
                    <Link href="/contracts/builder">
                        <EnterpriseButton variant="primary">
                            <FileText className="w-4 h-4 mr-2" />
                            Yeni Sözleşme Gönder
                        </EnterpriseButton>
                    </Link>
                </div>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <EnterpriseCard className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100  flex items-center justify-center text-green-600 ">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Aktif Sözleşme</p>
                        <h3 className="text-2xl font-bold">{activeCount}</h3>
                    </div>
                </EnterpriseCard>
                <EnterpriseCard className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100  flex items-center justify-center text-orange-600 ">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Bekleyen (İmza/OTP)</p>
                        <h3 className="text-2xl font-bold">{pendingCount}</h3>
                    </div>
                </EnterpriseCard>
                <EnterpriseCard className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100  flex items-center justify-center text-red-600 ">
                        <LinkIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Onboardsız (Sözleşme Yok)</p>
                        <h3 className="text-2xl font-bold">{missingCount}</h3>
                    </div>
                </EnterpriseCard>
            </div>

            <EnterpriseCard noPadding>
                <div className="p-4 border-b border-slate-200  flex justify-between items-center bg-slate-50  rounded-t-xl">
                    <h3 className="font-medium text-slate-800 ">Sözleşme Ağı (Network Map)</h3>
                </div>
                <div className="overflow-x-auto">
                    <EnterpriseTable headers={['Bayi Kodu', 'Sözleşme No', 'Durum', 'Güncel Kural Modeli', 'Vade/Limit', 'Oluşturulma']}>
                        {agreements.length === 0 ? (
                            <tr><td colSpan={6} className="text-center p-8 text-slate-500">Hiç sözleşme kaydı bulunamadı.</td></tr>
                        ) : agreements.map(agr => {
                            const terms = agr.policySnapshot?.termsJson as any;
                            return (
                                <tr key={agr.id} className="hover:bg-slate-50 :bg-slate-800">
                                    <td className="p-4 font-medium text-sm text-slate-900 ">{agr.membershipId}</td>
                                    <td className="p-4 text-sm text-slate-500">{agr.contractId || '-'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${agr.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : agr.status === 'SENT' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800'}`}>
                                            {agr.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs font-mono text-slate-500 break-all max-w-[200px]">
                                        {terms ? `v${agr.policySnapshot?.version}` : '-'}
                                        {terms?.escrow?.mode && ` (${terms.escrow.mode} Escrow)`}
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">
                                        {terms?.paymentTermDays ? `${terms.paymentTermDays} Gün` : '-'} / {terms?.creditLimit ? `${terms.creditLimit.toLocaleString('tr-TR')} ₺` : '-'}
                                    </td>
                                    <td className="p-4 text-sm whitespace-nowrap">{new Date(agr.createdAt).toLocaleDateString('tr-TR')}</td>
                                </tr>
                            );
                        })}
                    </EnterpriseTable>
                </div>
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}

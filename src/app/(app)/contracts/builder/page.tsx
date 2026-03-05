"use client";

import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseInput, EnterpriseButton, EnterpriseEmptyState } from "@/components/ui/enterprise";
import { useState } from "react";
import { FileText, Link, GitMerge } from "lucide-react";

export default function ContractBuilderPage() {
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Mock data for UI layout
    const templates = [
        { id: "tpl_bayi", name: "Bayilik Sözleşmesi v2", source: "ACCOUNT" },
        { id: "tpl_mutabakat", name: "Dönemsel Mutabakat İhbarnamesi", source: "TENANT" }
    ];

    const schemas = {
        tpl_bayi: [
            { key: "company_name", label: "Tedarikçi Firma Adı (Sabit)" },
            { key: "dealer_company", label: "Bayi/Müşteri Unvanı", placeholder: "Örn: Yıldırım Ltd. Şti." },
            { key: "payment_term", label: "Vade (Gün)", placeholder: "90" },
        ],
        tpl_mutabakat: [
            { key: "company_name", label: "Tedarikçi Firma" },
            { key: "balance", label: "Bakiye Tutarı", placeholder: "100.000 TL" }
        ]
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            // Note: In reality, we'd fetch actual values from context or form states.
            const response = await fetch('/api/contracts/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: 'SYSTEM', // Will use active tenant in actual middleware
                    templateVersionId: selectedTemplate,
                    sourceSystemContext: variables
                })
            });
            const data = await response.json();
            setResult(data);
        } catch (e) {
            console.error(e);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <EnterprisePageShell
            title="Contract Automation Builder"
            description="ERP verilerini harmanlayarak şablon tabanlı akıllı sözleşmeler ve mutabakatlar üretin."
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sol Panel: Konfigürasyon */}
                <div className="lg:col-span-1 space-y-6">
                    <EnterpriseCard>
                        <EnterpriseSectionHeader title="1. Şablon Seçimi" subtitle="Kullanılacak otomasyon taslağını belirleyin." />
                        <div className="mt-4 space-y-3">
                            <select
                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                            >
                                <option value="">Şablon Seçiniz...</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} (Source: {t.source})</option>
                                ))}
                            </select>
                        </div>
                    </EnterpriseCard>

                    {selectedTemplate && schemas[selectedTemplate as keyof typeof schemas] && (
                        <EnterpriseCard>
                            <EnterpriseSectionHeader title="2. Degişken Eşleme (Mapping)" subtitle="Taslaktaki alanları doldurun." />
                            <div className="mt-4 space-y-4">
                                {schemas[selectedTemplate as keyof typeof schemas].map(schema => (
                                    <div key={schema.key}>
                                        <EnterpriseInput
                                            label={schema.label}
                                            placeholder={schema.placeholder}
                                            value={variables[schema.key] || ''}
                                            onChange={(e) => setVariables({ ...variables, [schema.key]: e.target.value })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </EnterpriseCard>
                    )}

                    <EnterpriseCard>
                        <EnterpriseSectionHeader title="3. Uçtan Uca Aksiyonlar" subtitle="Üretim sonrası süreçler" />
                        <div className="mt-4 flex flex-col gap-3">
                            <EnterpriseButton
                                variant="primary"
                                className="w-full"
                                disabled={!selectedTemplate || generating}
                                onClick={handleGenerate}
                            >
                                {generating ? "Sözleşme Derleniyor..." : "Sözleşmeyi Derle & Oluştur"}
                            </EnterpriseButton>
                        </div>
                    </EnterpriseCard>
                </div>

                {/* Sağ Panel: Önizleme / Clause Library / Dashboard */}
                <div className="lg:col-span-2">
                    <EnterpriseCard noPadding className="h-full flex flex-col min-h-[500px]">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 rounded-t-xl z-10">
                            <h3 className="font-medium text-slate-800 dark:text-slate-200">Bileşik Önizleme (Preview)</h3>
                            <div className="flex gap-2">
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                                    <Link className="h-3 w-3" />
                                    Live ERP Sync
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 p-6 flex flex-col relative overflow-hidden bg-white dark:bg-[#0B1120]">
                            {!selectedTemplate ? (
                                <EnterpriseEmptyState
                                    icon={<FileText className="h-8 w-8" />}
                                    title="Hazır Şablon Bekleniyor"
                                    description="Sol menüden bir sözleşme veya mutabakat şablonu seçtiğinizde yapılandırılabilir maddeler burada görüntülenecektir."
                                />
                            ) : result ? (
                                <div className="space-y-4">
                                    <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-4 rounded-lg flex items-center gap-3">
                                        <GitMerge className="h-5 w-5" />
                                        <div>
                                            <p className="font-semibold text-sm">Derleme Başarılı: Document #{result.documentId}</p>
                                            <p className="text-xs opacity-80">Rendered PDF işlemi arka plan BullMQ kuyruğunda başladı.</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="prose dark:prose-invert max-w-none text-sm opacity-60">
                                    <p>Canlı önizleme aktifleştiğinde ERP'den çekilen <code>{JSON.stringify(variables)}</code> verileri doğrudan sözleşme içerisine map edilecektir.</p>
                                    <br />
                                    <h1>Örnek Sözleşme Modeli</h1>
                                    <p>İşbu sözleşme <strong>{variables['company_name'] || '___'}</strong> ile <strong>{variables['dealer_company'] || '___'}</strong> arasında akdedilmiştir. Onaylanan vade: <strong>{variables['payment_term'] || '___'}</strong> gündür.</p>
                                    <hr />
                                    <em>(Maddeler Clause Library üzerinden dinamik çekilmektedir: clause.payment_terms)</em>
                                </div>
                            )}
                        </div>
                    </EnterpriseCard>
                </div>
            </div>
        </EnterprisePageShell>
    );
}

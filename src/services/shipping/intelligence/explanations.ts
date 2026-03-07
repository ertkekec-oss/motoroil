export class ExplanationBuilder {
    /**
     * Helper functions to build explainable metrics for tenant-facing UI dashboards.
     */
    static buildTenantScoreExplanation(score: number, disputes: number, successRate: number) {
        let summaryText = "Güvenilir, sorunsuz teslimat rutini.";
        if (score < 80) summaryText = "Dikkat gerektiren veya risk barındıran operasyonel tarihçe.";
        if (score < 50) summaryText = "Yüksek gecikme ve iade oranlı, ciddi kalite problemleri var.";

        return {
            title: "Operasyonel Güvenilirlik Özeti",
            score,
            summaryText,
            keyMetrics: [
                { label: "Teslimat Başarısı", value: `${successRate.toFixed(1)}%` },
                { label: "Aktif/Geçmiş İhtilaf Sayısı", value: disputes }
            ],
            recommendation: score < 80
                ? "Taşıyıcı (kargo) operasyonlarınızı ve kargoya teslim sürelerinizi kısaltarak algoritma skorunuzu iyileştirebilirsiniz."
                : "Bu istikrar sayesinde Periodya RFQ aramalarında önceliklendirileceksiniz."
        };
    }

    static buildCarrierPerformanceExplanation(carrierCode: string, failureRate: number, avgDelay: number | null) {
        const condition = failureRate > 5 ? 'Zayıf' : failureRate < 1 ? 'Çok Güçlü' : 'Ortalama';
        return {
            header: `Taşıyıcı Analizi: ${carrierCode}`,
            performanceCategorization: condition,
            delayMetric: avgDelay ? `Ortalama Gecikme: ${avgDelay} Saat` : 'Veri Yok',
            note: "Bu taşıyıcı, bağlı bulunduğu bölgede veya ağda otomatik olarak rotalama ağırlığına etki eder."
        };
    }
}

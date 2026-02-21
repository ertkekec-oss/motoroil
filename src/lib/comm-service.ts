
import { sendMail } from './mail';
import { sendWhatsApp } from './whatsapp';

export type CommChannel = 'EMAIL' | 'WHATSAPP' | 'BOTH';

export interface CommPayload {
    tenantId: string;
    email: string;
    phone?: string;
    customerName: string;
}

export const CommTemplates = {
    ONBOARDING_WELCOME: (name: string) => ({
        subject: "Periodya'ya Hoş Geldiniz! 🎉",
        emailHtml: `<h1>Merhaba ${name},</h1><p>Periodya ile işlerinizi kolaylaştırmaya hazır mısınız? 3 adımda ilk e-faturanızı kesin:</p><ol><li>Şirket ayarlarınızı tamamlayın</li><li>İlk müşterinizi ekleyin</li><li>Faturanızı oluşturun ve gönderin!</li></ol><p><a href="https://periodya.com">Hemen Başlayın</a></p>`,
        whatsapp: `Merhaba ${name}, Periodya'ya hoş geldiniz! 🚀 İlk e-faturanızı saniyeler içinde kesmek için panelinize göz atabilirsiniz. Yardıma ihtiyacınız olursa buradayız!`
    }),
    TRIAL_ENDING: (name: string, daysLeft: number) => ({
        subject: "Deneme Süreniz Doluyor ⏳",
        emailHtml: `<h1>Merhaba ${name},</h1><p>Periodya deneme sürenizin bitmesine sadece ${daysLeft} gün kaldı. Kesintisiz fatura kesmeye devam etmek için planınızı şimdi güncelleyin.</p><p><a href="https://periodya.com/billing">Planları Gör</a></p>`,
        whatsapp: `Merhaba ${name}, Periodya deneme süreniz ${daysLeft} gün içinde sona eriyor. ⏳ İşlemlerinizin aksamaması için paketinizi saniyeler içinde güncelleyebilirsiniz.`
    }),
    CHURN_WE_MISS_YOU: (name: string) => ({
        subject: "Sizi Özledik! 🌸",
        emailHtml: `<h1>Merhaba ${name},</h1><p>Sizi bir süredir Periodya'da göremiyoruz. İşlerinizi kolaylaştıracak yeni özellikler ekledik! Herhangi bir sorun varsa yardımcı olmaktan mutluluk duyarız.</p>`,
        whatsapp: `Merhaba ${name}, sizi bir süredir göremiyoruz. 🌸 Periodya'da yeni güncellemeler var! Yardıma ihtiyacınız olan bir konu varsa bize doğrudan buradan yazabilirsiniz.`
    }),
    GROWTH_SIGNAL: (name: string, growthRate: number) => ({
        subject: "İşletmenizi Büyütüyorsunuz! 🚀",
        emailHtml: `<h1>Harika Haber ${name}!</h1><p>Bu ay işlem hacminiz %${growthRate} oranında arttı. Bu başarınızı desteklemek için daha yüksek limitli Business planına geçmeye ne dersiniz?</p>`,
        whatsapp: `Harika haber ${name}! 🚀 Bu ay işletmeniz %${growthRate} büyüdü! Bu hıza ayak uydurmak için kapasitenizi artırmayı düşünebilirsiniz.`
    })
};

export async function sendAutomationMessage(
    templateKey: keyof typeof CommTemplates,
    payload: CommPayload,
    args: any[],
    channel: CommChannel = 'BOTH'
) {
    const template = (CommTemplates[templateKey] as any)(payload.customerName, ...args);

    if (channel === 'EMAIL' || channel === 'BOTH') {
        await sendMail({
            to: payload.email,
            subject: template.subject,
            html: template.emailHtml
        });
    }

    if ((channel === 'WHATSAPP' || channel === 'BOTH') && payload.phone) {
        await sendWhatsApp({
            to: payload.phone,
            message: template.whatsapp
        });
    }

    return { success: true };
}

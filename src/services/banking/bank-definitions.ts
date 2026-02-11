// src/services/banking/bank-definitions.ts

export type BankFormat = "XML" | "MT940" | "CSV" | "PDF";
export type IntegrationMethod = "MANUAL_UPLOAD" | "PULL_HTTP" | "SFTP_PULL" | "EMAIL_IMPORT";
export type RequiredNetwork = "STATIC_IP" | "NONE";

/**
 * Bankalar arası "teknik gerçeği" uydurmadan yönetmek için kategorik tanımlar kullanılır.
 * "Bank provided" yaklaşımı ile teknik sorumluluk bankaya bırakılır.
 */
export type AuthenticationCategory =
    | "SERVICE_USER"         // Banka tarafından verilen servis kullanıcı/şifre
    | "CORP_IB_USER"         // Kurumsal internet bankacılığı kullanıcı/şifre (entegrasyon kullanıcı)
    | "FILE_EXPORT"          // Banka panelinden dışa aktarım dosyası (manuel)
    | "SFTP_CREDENTIALS"     // SFTP kullanıcı/şifre veya key (bank provided)
    | "EMAIL_STATEMENT";     // Ekstre mail ile (import)

export type BankField = {
    key: string;
    label: string;
    type: "text" | "password" | "select" | "number";
    required: boolean;
    placeholder?: string;
    options?: string[];
    helperText?: string;
    default?: any;
};

export type BankDocRequirement =
    | "APPLICATION_FORM"
    | "TECHNICAL_APPENDIX"
    | "SIGNATURE_CIRCULAR"
    | "TAX_CERTIFICATE"
    | "AUTHORIZED_ID_COPY";

export type BankDefinition = {
    id: string;
    displayName: string;
    formats: BankFormat[];
    integrationMethod: IntegrationMethod;
    supportsAutoPull: boolean;
    requiredNetwork: RequiredNetwork;
    requiresBranch: boolean;
    supportsVadeli: boolean;
    requiredDocs: BankDocRequirement[];
    onboardingFields: BankField[];
    technicalAppendix: {
        accessType: "READ_ONLY";
        dataScope: ("BALANCE" | "TRANSACTIONS")[];
        protocolNotes: string[];
        ipWhitelist: string[];
        authenticationCategory: AuthenticationCategory;
        securityNotes: string[];
    };
    bankOperationalNotes: string[];
};

export const BANK_FORM_DEFINITIONS: Record<string, BankDefinition> = {
    AKBANK: {
        id: "AKBANK",
        displayName: "Akbank",
        formats: ["XML", "MT940", "CSV"],
        integrationMethod: "PULL_HTTP",
        supportsAutoPull: true,
        requiredNetwork: "STATIC_IP",
        requiresBranch: true,
        supportsVadeli: true,
        requiredDocs: ["APPLICATION_FORM", "TECHNICAL_APPENDIX", "SIGNATURE_CIRCULAR"],
        onboardingFields: [
            { key: "customerNo", label: "Müşteri Numarası", type: "text", required: true },
            { key: "branchCode", label: "Şube Kodu", type: "text", required: true },
            { key: "iban", label: "IBAN", type: "text", required: true, helperText: "Hareketleri aktarılacak hesap IBAN’ı" },
            { key: "serviceUsername", label: "Servis Kullanıcı Adı", type: "text", required: true },
            { key: "servicePassword", label: "Servis Şifresi", type: "password", required: true, helperText: "Şifre Periodya’da şifrelenmiş saklanır, görüntülenmez." },
            { key: "statementFormat", label: "Ekstre Formatı", type: "select", required: true, options: ["XML", "MT940", "CSV"], default: "XML" },
            { key: "syncFrequency", label: "Senkron Sıklığı", type: "select", required: true, options: ["15dk", "Saatlik", "Günlük"], default: "Saatlik" },
            { key: "historyDays", label: "İlk Senkron İçin Geçmiş Gün", type: "number", required: true, default: 30 }
        ],
        technicalAppendix: {
            accessType: "READ_ONLY",
            dataScope: ["BALANCE", "TRANSACTIONS"],
            protocolNotes: [
                "Hesap hareketleri aktarımı bankanın kurumsal kanalından sağlanır (bank provided).",
                "Bankanın sağladığı servis kullanıcı/şifre ile erişim, Periodya sabit IP’leri üzerinden kısıtlanır.",
                "Format seçimi bankanın desteklediği seçeneklere göre yapılır (XML/MT940/CSV)."
            ],
            ipWhitelist: ["[IP_1]", "[IP_2]"],
            authenticationCategory: "SERVICE_USER",
            securityNotes: [
                "Erişim salt okuma (read-only). Para transferi / talimat yok.",
                "Kimlik bilgileri şifrelenmiş şekilde saklanır, UI’da gösterilmez.",
                "Tüm çekimler audit log’lanır."
            ]
        },
        bankOperationalNotes: [
            "Şube üzerinden “Online Hesap Ekstresi / Dış sistem entegrasyonu” talep edilir.",
            "IT ekibine Teknik Ek sayfası iletilir; IP whitelist tanımlanır.",
            "Servis kullanıcı bilgileri bankadan geldikten sonra Periodya’ya girilir."
        ]
    },
    GARANTI: {
        id: "GARANTI",
        displayName: "Garanti BBVA",
        formats: ["MT940", "CSV", "XML"],
        integrationMethod: "SFTP_PULL",
        supportsAutoPull: true,
        requiredNetwork: "STATIC_IP",
        requiresBranch: false,
        supportsVadeli: false,
        requiredDocs: ["APPLICATION_FORM", "TECHNICAL_APPENDIX", "SIGNATURE_CIRCULAR"],
        onboardingFields: [
            { key: "customerNo", label: "Müşteri Numarası", type: "text", required: true },
            { key: "iban", label: "IBAN", type: "text", required: true },
            { key: "sftpHost", label: "SFTP Host (Banka sağlar)", type: "text", required: true },
            { key: "sftpUsername", label: "SFTP Kullanıcı", type: "text", required: true },
            { key: "sftpPassword", label: "SFTP Şifre", type: "password", required: true },
            { key: "statementFormat", label: "Ekstre Formatı", type: "select", required: true, options: ["MT940", "CSV", "XML"], default: "MT940" }
        ],
        technicalAppendix: {
            accessType: "READ_ONLY",
            dataScope: ["TRANSACTIONS"],
            protocolNotes: [
                "Hesap ekstreleri banka tarafından tanımlanan kurumsal kanal üzerinden dosya bazlı sağlanır (bank provided).",
                "Erişim için banka SFTP veya eşdeğer kanal bilgilerini sağlar."
            ],
            ipWhitelist: ["[IP_1]", "[IP_2]"],
            authenticationCategory: "SFTP_CREDENTIALS",
            securityNotes: [
                "Salt okuma; dosya çekimi/okuma dışında işlem yapılmaz.",
                "Kimlik bilgileri şifreli saklanır."
            ]
        },
        bankOperationalNotes: [
            "Banka entegrasyon kanalı aktif edilir.",
            "IP whitelist banka tarafında tanımlanır.",
            "Format tercihi banka operasyonu ile netleştirilir."
        ]
    },
    QNB_FINANSBANK: {
        id: "QNB_FINANSBANK",
        displayName: "QNB Finansbank",
        formats: ["CSV", "XML", "MT940"],
        integrationMethod: "PULL_HTTP",
        supportsAutoPull: true,
        requiredNetwork: "STATIC_IP",
        requiresBranch: false,
        supportsVadeli: false,
        requiredDocs: ["APPLICATION_FORM", "TECHNICAL_APPENDIX"],
        onboardingFields: [
            { key: "customerNo", label: "Müşteri Numarası", type: "text", required: true },
            { key: "iban", label: "IBAN", type: "text", required: true },
            { key: "serviceUsername", label: "Servis Kullanıcı", type: "text", required: true },
            { key: "servicePassword", label: "Servis Şifre", type: "password", required: true }
        ],
        technicalAppendix: {
            accessType: "READ_ONLY",
            dataScope: ["BALANCE", "TRANSACTIONS"],
            protocolNotes: [
                "Entegrasyon kanalı ve format bankanın sağladığı kurumsal servise göre belirlenir.",
                "Enpara hesapları QNB altyapısı üzerinden yönetilebilir."
            ],
            ipWhitelist: ["[IP_1]", "[IP_2]"],
            authenticationCategory: "SERVICE_USER",
            securityNotes: [
                "Salt okuma; transfer/talimat yok.",
                "Credential şifreli saklanır."
            ]
        },
        bankOperationalNotes: [
            "Kurumsal kanal üzerinden hesap hareketleri paylaşımı talep edilir.",
            "Enpara kullanılıyorsa QNB operasyon birimiyle ilişki teyit edilir."
        ]
    }
};

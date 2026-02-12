// src/services/banking/bank-definitions.ts

export type BankFormat = "XML" | "MT940" | "CSV" | "PDF";
export type IntegrationMethod = "WEB_SERVICE" | "MT940_SFTP_FTP" | "MT940_EMAIL" | "MANUAL_UPLOAD";
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
    integrationMethods: IntegrationMethod[];
    integrationMethod: IntegrationMethod; // Default method
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
    // Dynamic Credential Policy
    requiredCredentials: string[];
    optionalCredentials: string[];
    ipWhitelistRequired: boolean;
    supportsAccountSelection: boolean;
};

export const BANK_FORM_DEFINITIONS: Record<string, BankDefinition> = {
    AKBANK: {
        id: "AKBANK",
        displayName: "Akbank",
        formats: ["XML", "MT940", "CSV"],
        integrationMethods: ["WEB_SERVICE", "MT940_SFTP_FTP", "MANUAL_UPLOAD"],
        integrationMethod: "WEB_SERVICE",
        supportsAutoPull: true,
        requiredNetwork: "STATIC_IP",
        requiresBranch: true,
        supportsVadeli: true,
        requiredDocs: ["APPLICATION_FORM", "TECHNICAL_APPENDIX", "SIGNATURE_CIRCULAR"],
        requiredCredentials: ["customerNo", "branchCode", "iban", "serviceUsername", "servicePassword"],
        optionalCredentials: [],
        ipWhitelistRequired: true,
        supportsAccountSelection: true,
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
        integrationMethods: ["MT940_SFTP_FTP", "MANUAL_UPLOAD"],
        integrationMethod: "MT940_SFTP_FTP",
        supportsAutoPull: true,
        requiredNetwork: "STATIC_IP",
        requiresBranch: false,
        supportsVadeli: false,
        requiredDocs: ["APPLICATION_FORM", "TECHNICAL_APPENDIX", "SIGNATURE_CIRCULAR"],
        requiredCredentials: ["customerNo", "iban", "sftpHost", "sftpUsername", "sftpPassword"],
        optionalCredentials: [],
        ipWhitelistRequired: true,
        supportsAccountSelection: false,
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
        integrationMethods: ["WEB_SERVICE", "MANUAL_UPLOAD"],
        integrationMethod: "WEB_SERVICE",
        supportsAutoPull: true,
        requiredNetwork: "STATIC_IP",
        requiresBranch: false,
        supportsVadeli: false,
        requiredDocs: ["APPLICATION_FORM", "TECHNICAL_APPENDIX"],
        requiredCredentials: ["customerNo", "iban", "serviceUsername", "servicePassword"],
        optionalCredentials: [],
        ipWhitelistRequired: true,
        supportsAccountSelection: true,
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
    },
    IS_BANKASI: {
        id: "IS_BANKASI",
        displayName: "İş Bankası",
        formats: ["MT940", "XML"],
        integrationMethods: ["MT940_SFTP_FTP"],
        integrationMethod: "MT940_SFTP_FTP",
        supportsAutoPull: true,
        requiredNetwork: "STATIC_IP",
        requiresBranch: true,
        supportsVadeli: true,
        requiredDocs: ["APPLICATION_FORM", "TECHNICAL_APPENDIX", "SIGNATURE_CIRCULAR"],
        requiredCredentials: ["customerNo", "branchCode", "iban", "sftpUsername", "sftpPassword"],
        optionalCredentials: [],
        ipWhitelistRequired: true,
        supportsAccountSelection: true,
        onboardingFields: [
            { key: "customerNo", label: "Müşteri Numarası", type: "text", required: true },
            { key: "branchCode", label: "Şube Kodu", type: "text", required: true },
            { key: "iban", label: "IBAN", type: "text", required: true },
            { key: "sftpUsername", label: "SFTP Kullanıcı (Banka sağlar)", type: "text", required: true },
            { key: "sftpPassword", label: "SFTP Şifre", type: "password", required: true }
        ],
        technicalAppendix: {
            accessType: "READ_ONLY",
            dataScope: ["TRANSACTIONS"],
            protocolNotes: ["İş Bankası kurumsal dosya transfer (SFTP) kanalı kullanılır.", "Dosya formatı standart MT940 veya XML (İşbank) olmalıdır."],
            ipWhitelist: ["[IP_1]", "[IP_2]"],
            authenticationCategory: "SFTP_CREDENTIALS",
            securityNotes: ["Erişim kısıtlıdır.", "Kullanıcı bilgileri Vault/KMS üzerinde saklanır."]
        },
        bankOperationalNotes: ["Şube ile ticari internet bankacılığı SFTP yetkisi görüşülmelidir."]
    },
    YAPI_KREDI: {
        id: "YAPI_KREDI",
        displayName: "Yapı Kredi",
        formats: ["XML", "MT940"],
        integrationMethods: ["WEB_SERVICE"],
        integrationMethod: "WEB_SERVICE",
        supportsAutoPull: true,
        requiredNetwork: "STATIC_IP",
        requiresBranch: true,
        supportsVadeli: true,
        requiredDocs: ["APPLICATION_FORM", "TECHNICAL_APPENDIX"],
        requiredCredentials: ["customerNo", "iban", "serviceUsername", "servicePassword"],
        optionalCredentials: [],
        ipWhitelistRequired: true,
        supportsAccountSelection: true,
        onboardingFields: [
            { key: "customerNo", label: "Üye İşyeri / Müşteri No", type: "text", required: true },
            { key: "serviceUsername", label: "Web Servis Kullanıcı", type: "text", required: true },
            { key: "servicePassword", label: "Web Servis Şifre", type: "password", required: true },
            { key: "iban", label: "IBAN", type: "text", required: true }
        ],
        technicalAppendix: {
            accessType: "READ_ONLY",
            dataScope: ["BALANCE", "TRANSACTIONS"],
            protocolNotes: ["Yapı Kredi Kurumsal Web Servisleri (SOAP/REST) protokolü kullanılır."],
            ipWhitelist: ["[IP_1]", "[IP_2]"],
            authenticationCategory: "SERVICE_USER",
            securityNotes: ["IP whitelist tanımlanması zorunludur."]
        },
        bankOperationalNotes: ["Şube üzerinden 'Kurumsal Web Servis Entegrasyonu' onayı alınmalıdır."]
    },
    VAKIFBANK: {
        id: "VAKIFBANK",
        displayName: "Vakıfbank",
        formats: ["MT940", "XML"],
        integrationMethods: ["WEB_SERVICE"],
        integrationMethod: "WEB_SERVICE",
        supportsAutoPull: true,
        requiredNetwork: "STATIC_IP",
        requiresBranch: false,
        supportsVadeli: true,
        requiredDocs: ["APPLICATION_FORM", "TECHNICAL_APPENDIX", "SIGNATURE_CIRCULAR"],
        requiredCredentials: ["customerNo", "iban", "serviceUsername", "servicePassword"],
        optionalCredentials: [],
        ipWhitelistRequired: true,
        supportsAccountSelection: true,
        onboardingFields: [
            { key: "customerNo", label: "Vergi No / TCKN", type: "text", required: true },
            { key: "serviceUsername", label: "Servis Kullanıcı Adı", type: "text", required: true },
            { key: "servicePassword", label: "Servis Şifresi", type: "password", required: true },
            { key: "iban", label: "IBAN", type: "text", required: true }
        ],
        technicalAppendix: {
            accessType: "READ_ONLY",
            dataScope: ["TRANSACTIONS"],
            protocolNotes: ["Vakıfbank 'Vakıf Katılım' veya 'Vakıfbank' kurumsal servisleri."],
            ipWhitelist: ["[IP_1]", "[IP_3]"],
            authenticationCategory: "SERVICE_USER",
            securityNotes: ["Credential şifreli saklanır."]
        },
        bankOperationalNotes: ["Kamu bankası prosedürleri gereği yazılı talimat gerekebilir."]
    },
    HALKBANK: {
        id: "HALKBANK",
        displayName: "Halkbank",
        formats: ["MT940", "CSV"],
        integrationMethods: ["WEB_SERVICE"],
        integrationMethod: "WEB_SERVICE",
        supportsAutoPull: true,
        requiredNetwork: "STATIC_IP",
        requiresBranch: true,
        supportsVadeli: false,
        requiredDocs: ["APPLICATION_FORM", "SIGNATURE_CIRCULAR"],
        requiredCredentials: ["customerNo", "iban", "serviceUsername", "servicePassword"],
        optionalCredentials: [],
        ipWhitelistRequired: true,
        supportsAccountSelection: false,
        onboardingFields: [
            { key: "customerNo", label: "Müşteri No", type: "text", required: true },
            { key: "serviceUsername", label: "Entegrasyon Kullanıcı", type: "text", required: true },
            { key: "servicePassword", label: "Entegrasyon Şifre", type: "password", required: true },
            { key: "iban", label: "IBAN", type: "text", required: true }
        ],
        technicalAppendix: {
            accessType: "READ_ONLY",
            dataScope: ["TRANSACTIONS"],
            protocolNotes: ["Standart HTTP PULL protokolü."],
            ipWhitelist: ["[IP_1]"],
            authenticationCategory: "SERVICE_USER",
            securityNotes: ["Read-only erişim."]
        },
        bankOperationalNotes: ["Halkbank Dialog üzerinden yetkilendirme gerekebilir."]
    },
    ZIRAAT: {
        id: "ZIRAAT",
        displayName: "Ziraat Bankası",
        formats: ["XML", "MT940"],
        integrationMethods: ["WEB_SERVICE"],
        integrationMethod: "WEB_SERVICE",
        supportsAutoPull: true,
        requiredNetwork: "STATIC_IP",
        requiresBranch: true,
        supportsVadeli: true,
        requiredDocs: ["APPLICATION_FORM", "TECHNICAL_APPENDIX", "SIGNATURE_CIRCULAR"],
        requiredCredentials: ["customerNo", "iban", "serviceUsername", "servicePassword"],
        optionalCredentials: [],
        ipWhitelistRequired: true,
        supportsAccountSelection: true,
        onboardingFields: [
            { key: "customerNo", label: "Müşteri Numarası", type: "text", required: true },
            { key: "serviceUsername", label: "Kullanıcı Adı", type: "text", required: true },
            { key: "servicePassword", label: "Şifre", type: "password", required: true },
            { key: "iban", label: "IBAN", type: "text", required: true }
        ],
        technicalAppendix: {
            accessType: "READ_ONLY",
            dataScope: ["BALANCE", "TRANSACTIONS"],
            protocolNotes: ["Ziraat Kurumsal Entegrasyon kanalı."],
            ipWhitelist: ["[IP_1]", "[IP_2]"],
            authenticationCategory: "SERVICE_USER",
            securityNotes: ["IP whitelist kısıtı vardır."]
        },
        bankOperationalNotes: ["Ziraat Bankası ticari şube onayı şarttır."]
    },
    KUVEYT_TURK: {
        id: "KUVEYT_TURK",
        displayName: "Kuveyt Türk",
        formats: ["XML", "MT940"],
        integrationMethods: ["WEB_SERVICE", "MANUAL_UPLOAD"],
        integrationMethod: "WEB_SERVICE",
        supportsAutoPull: true,
        requiredNetwork: "STATIC_IP",
        requiresBranch: true,
        supportsVadeli: true,
        requiredDocs: ["APPLICATION_FORM", "TECHNICAL_APPENDIX"],
        requiredCredentials: ["customerNo"],
        optionalCredentials: ["iban", "serviceUsername", "servicePassword"],
        ipWhitelistRequired: true,
        supportsAccountSelection: true,
        onboardingFields: [
            { key: "customerNo", label: "Müşteri Numarası", type: "text", required: true },
            { key: "serviceUsername", label: "Api Kullanıcı Adı", type: "text", required: false },
            { key: "servicePassword", label: "Api Şifresi", type: "password", required: false },
            { key: "iban", label: "IBAN", type: "text", required: false, helperText: "Opsiyonel: Belirli bir hesap seçmek için." }
        ],
        technicalAppendix: {
            accessType: "READ_ONLY",
            dataScope: ["BALANCE", "TRANSACTIONS"],
            protocolNotes: ["Kuveyt Türk 'BOA' API altyapısı üzerinden JSON/XML entegrasyonu kullanılır."],
            ipWhitelist: ["[IP_1]", "[IP_2]"],
            authenticationCategory: "SERVICE_USER",
            securityNotes: ["IP whitelist tanımlanması kesinlikle zorunludur."]
        },
        bankOperationalNotes: ["Şube ile 'Kurumsal API Entegrasyonu' hakkında protokol imzalanmalıdır."]
    },
};


import axios from 'axios';
import * as https from 'https';
import { v4 as uuidv4 } from 'uuid';

const ELOGO_URL_TEST = "https://pb-test.elogo.com.tr/PostBoxService.svc";
const ELOGO_URL_PROD = "https://pb.elogo.com.tr/PostBoxService.svc";

interface ELogoConfig {
    username: string;
    pass: string;
    firmCode?: string;
    isTest: boolean;
}

export class ELogoService {
    private config: ELogoConfig;
    private baseUrl: string;

    constructor(config: ELogoConfig) {
        this.config = config;
        this.baseUrl = config.isTest ? ELOGO_URL_TEST : ELOGO_URL_PROD;
    }

    private escapeXml(unsafe: string): string {
        if (!unsafe) return '';
        return unsafe.replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
            return c;
        });
    }

    // ATTEMPT: Capitalized Inner Wrapper <tem:Login> to match Method name (PascalCase)
    // Parameter names kept as camelCase (userName, passWord) and Unqualified
    private getLoginXML() {
        const cleanUser = this.config.username.trim();
        const cleanPass = this.config.pass.trim();

        return `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
           <soapenv:Header/>
           <soapenv:Body>
              <tem:Login>
                 <tem:Login>
                    <userName>${this.escapeXml(cleanUser)}</userName>
                    <passWord>${this.escapeXml(cleanPass)}</passWord>
                 </tem:Login>
              </tem:Login>
           </soapenv:Body>
        </soapenv:Envelope>`;
    }

    private getCheckUserXML(sessionId: string, vkn: string) {
        return `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
           <soapenv:Header/>
           <soapenv:Body>
              <tem:CheckUser>
                 <tem:sessionID>${sessionId}</tem:sessionID>
                 <tem:vknTcknList>
                    <string>${vkn}</string>
                 </tem:vknTcknList>
              </tem:CheckUser>
           </soapenv:Body>
        </soapenv:Envelope>`;
    }

    private extractTagValue(xml: string, tagName: string): string | null {
        const simpleRegex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`, 's');
        const simpleMatch = xml.match(simpleRegex);
        if (simpleMatch) return simpleMatch[1];

        const nsRegex = new RegExp(`<[a-zA-Z0-9_]+:${tagName}.*?>(.*?)<\/[a-zA-Z0-9_]+:${tagName}>`, 's');
        const nsMatch = xml.match(nsRegex);
        if (nsMatch) return nsMatch[1];

        return null;
    }

    async login(): Promise<{ success: boolean; sessionId?: string; error?: string, rawData?: string, endpoint?: string }> {
        try {
            const xml = this.getLoginXML();
            // SECURITY FIX: SSL certificate validation enabled
            // If eLogo test environment has certificate issues, add their CA cert to environment
            const agent = new https.Agent({
                rejectUnauthorized: true,
                // For test environments with self-signed certs, use custom CA if needed:
                // ca: process.env.ELOGO_CA_CERT ? Buffer.from(process.env.ELOGO_CA_CERT, 'base64') : undefined
            });

            const response = await axios.post(this.baseUrl, xml, {
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': '"http://tempuri.org/IPostBoxService/Login"',
                    'User-Agent': 'Mozilla/5.0 (compatible; Periodya/1.0)'
                },
                httpsAgent: agent,
                responseType: 'text',
                timeout: 30000
            });

            const data = response.data;
            if (typeof data !== 'string') {
                return { success: false, error: 'Sunucudan geçersiz veri formatı alındı.', rawData: JSON.stringify(data), endpoint: this.baseUrl };
            }

            if (data.includes('Fault>') || data.includes('faultstring')) {
                const fault = this.extractTagValue(data, 'faultstring');
                const detail = this.extractTagValue(data, 'detail');
                return { success: false, error: `Logo Hatası: ${fault || 'Bilinmeyen'} (${detail || ''})`, rawData: data, endpoint: this.baseUrl };
            }

            const sessionID = this.extractTagValue(data, 'sessionID');
            const resultMsg = this.extractTagValue(data, 'resultMsg');
            const resultCode = this.extractTagValue(data, 'resultCode');

            if (sessionID && (resultCode === '1' || resultCode === 'true' || !resultCode)) {
                return { success: true, sessionId: sessionID, rawData: data, endpoint: this.baseUrl };
            } else {
                return { success: false, error: resultMsg || 'Giriş yapılamadı.', rawData: data, endpoint: this.baseUrl };
            }
        } catch (error: any) {
            console.error('eLogo Login Error:', error.message);
            const faultData = error.response?.data ? String(error.response.data) : undefined;

            if (faultData) {
                const fault = this.extractTagValue(faultData, 'faultstring');
                if (fault) return { success: false, error: `Logo Yanıt Hatası: ${fault}`, rawData: faultData, endpoint: this.baseUrl };
            }
            return { success: false, error: `Bağlantı Hatası: ${error.message}`, rawData: faultData, endpoint: this.baseUrl };
        }
    }

    private getSendDocumentXML(sessionId: string, binaryData: string, docType: string) {
        return `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
           <soapenv:Header/>
           <soapenv:Body>
              <tem:SendDocument>
                 <tem:sessionID>${sessionId}</tem:sessionID>
                 <tem:paramList>
                    <tem:Document>
                       <tem:binaryData>${binaryData}</tem:binaryData>
                       <tem:docType>${docType}</tem:docType>
                    </tem:Document>
                 </tem:paramList>
              </tem:SendDocument>
           </soapenv:Body>
        </soapenv:Envelope>`;
    }

    private getSendDespatchXML(sessionId: string, binaryData: string) {
        return `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
           <soapenv:Header/>
           <soapenv:Body>
              <tem:SendDespatch>
                 <tem:sessionID>${sessionId}</tem:sessionID>
                 <tem:paramList>
                    <tem:Despatch>
                       <tem:binaryData>${binaryData}</tem:binaryData>
                    </tem:Despatch>
                 </tem:paramList>
              </tem:SendDespatch>
           </soapenv:Body>
        </soapenv:Envelope>`;
    }

    async checkEInvoiceUser(vkn: string): Promise<{ isEInvoice: boolean; alias?: string }> {
        const loginRes = await this.login();
        if (!loginRes.success || !loginRes.sessionId) {
            return { isEInvoice: false };
        }

        try {
            const xml = this.getCheckUserXML(loginRes.sessionId, vkn);
            // SECURITY FIX: SSL certificate validation enabled
            const agent = new https.Agent({ rejectUnauthorized: true });

            const response = await axios.post(this.baseUrl, xml, {
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': '"http://tempuri.org/IPostBoxService/CheckUser"',
                    'User-Agent': 'Mozilla/5.0 (compatible; Periodya/1.0)'
                },
                httpsAgent: agent,
                responseType: 'text'
            });

            const data = response.data;
            const isUser = typeof data === 'string' && data.includes(vkn) && data.includes('alias');
            let alias = undefined;
            if (isUser) { alias = this.extractTagValue(data, 'alias') || undefined; }
            return { isEInvoice: isUser, alias };
        } catch (error: any) { return { isEInvoice: false }; }
    }

    async sendDocument(binaryData: string, docType: 'EFATURA' | 'EARSIV'): Promise<{ success: boolean; resultMsg?: string; formalId?: string; error?: string }> {
        const loginRes = await this.login();
        if (!loginRes.success || !loginRes.sessionId) return { success: false, error: loginRes.error };

        try {
            const docTypeCode = docType === 'EFATURA' ? '1' : '2';
            const xml = this.getSendDocumentXML(loginRes.sessionId, binaryData, docTypeCode);
            // SECURITY FIX: SSL certificate validation enabled
            const agent = new https.Agent({ rejectUnauthorized: true });

            const response = await axios.post(this.baseUrl, xml, {
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': '"http://tempuri.org/IPostBoxService/SendDocument"',
                    'User-Agent': 'Mozilla/5.0 (compatible; Periodya/1.0)'
                },
                httpsAgent: agent,
                responseType: 'text'
            });

            const data = response.data;
            const resultMsg = this.extractTagValue(data, 'resultMsg');
            const resultCode = this.extractTagValue(data, 'resultCode');

            if (resultCode === '1' || resultCode === 'true' || data.includes('<resultCode>1</resultCode>')) {
                return { success: true, resultMsg, formalId: this.extractTagValue(data, 'documentID') || undefined };
            } else {
                return { success: false, error: resultMsg || 'Gönderim başarısız.' };
            }
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async sendDespatch(binaryData: string): Promise<{ success: boolean; resultMsg?: string; formalId?: string; error?: string }> {
        const loginRes = await this.login();
        if (!loginRes.success || !loginRes.sessionId) return { success: false, error: loginRes.error };

        try {
            const xml = this.getSendDespatchXML(loginRes.sessionId, binaryData);
            // SECURITY FIX: SSL certificate validation enabled
            const agent = new https.Agent({ rejectUnauthorized: true });

            const response = await axios.post(this.baseUrl, xml, {
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': '"http://tempuri.org/IPostBoxService/SendDespatch"',
                    'User-Agent': 'Mozilla/5.0 (compatible; Periodya/1.0)'
                },
                httpsAgent: agent,
                responseType: 'text'
            });

            const data = response.data;
            const resultMsg = this.extractTagValue(data, 'resultMsg');
            const resultCode = this.extractTagValue(data, 'resultCode');

            if (resultCode === '1' || resultCode === 'true' || data.includes('<resultCode>1</resultCode>')) {
                return { success: true, resultMsg, formalId: this.extractTagValue(data, 'despatchID') || undefined };
            } else {
                return { success: false, error: resultMsg || 'Gönderim başarısız.' };
            }
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}

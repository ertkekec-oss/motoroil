
import { v4 as uuidv4 } from 'uuid';

interface UBLItem {
    name: string;
    qty: number;
    price: number;
    vatRate: number;
}

interface UBLConfig {
    uuid?: string;
    id?: string;
    date: string;
    time: string;
    typeCode: string; // 380 for Invoice
    note?: string;
    currency: string;
    customer: {
        name: string;
        taxNumber: string;
        taxOffice?: string;
        address: string;
        city?: string;
        email?: string;
        phone?: string;
    };
    supplier: {
        name: string;
        taxNumber: string;
        taxOffice?: string;
        address: string;
        city?: string;
    };
    items: UBLItem[];
}

export function generateUBL(config: UBLConfig): string {
    const uuid = config.uuid || uuidv4();
    const id = config.id || `PRD${Date.now()}`;

    // Calculate totals
    const lineTotals = config.items.map(item => {
        const lineExtensionAmount = item.qty * item.price;
        const taxAmount = lineExtensionAmount * (item.vatRate / 100);
        return { lineExtensionAmount, taxAmount };
    });

    const totalLineExtensionAmount = lineTotals.reduce((acc, curr) => acc + curr.lineExtensionAmount, 0);
    const totalTaxAmount = lineTotals.reduce((acc, curr) => acc + curr.taxAmount, 0);
    const grandTotal = totalLineExtensionAmount + totalTaxAmount;

    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
    <cbc:ProfileID>TICARIFATURA</cbc:ProfileID>
    <cbc:ID>${id}</cbc:ID>
    <cbc:UUID>${uuid}</cbc:UUID>
    <cbc:IssueDate>${config.date}</cbc:IssueDate>
    <cbc:IssueTime>${config.time}</cbc:IssueTime>
    <cbc:InvoiceTypeCode>${config.typeCode}</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>${config.currency}</cbc:DocumentCurrencyCode>
    <cbc:LineCountNumeric>${config.items.length}</cbc:LineCountNumeric>
    
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="VKN">${config.supplier.taxNumber}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>${config.supplier.name}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>${config.supplier.address}</cbc:StreetName>
                <cbc:CityName>${config.supplier.city || 'Istanbul'}</cbc:CityName>
                <cac:Country>
                    <cbc:Name>Türkiye</cbc:Name>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cac:TaxScheme>
                    <cbc:Name>${config.supplier.taxOffice || 'Vergi Dairesi'}</cbc:Name>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingSupplierParty>

    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="${config.customer.taxNumber.length === 11 ? 'TCKN' : 'VKN'}">${config.customer.taxNumber}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>${config.customer.name}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>${config.customer.address}</cbc:StreetName>
                <cbc:CityName>${config.customer.city || ''}</cbc:CityName>
                <cac:Country>
                    <cbc:Name>Türkiye</cbc:Name>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cac:TaxScheme>
                    <cbc:Name>${config.customer.taxOffice || ''}</cbc:Name>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingCustomerParty>

    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${config.currency}">${totalTaxAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="${config.currency}">${totalLineExtensionAmount.toFixed(2)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="${config.currency}">${totalTaxAmount.toFixed(2)}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:Name>KDV</cbc:Name>
                    <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>

    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="${config.currency}">${totalLineExtensionAmount.toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="${config.currency}">${totalLineExtensionAmount.toFixed(2)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="${config.currency}">${grandTotal.toFixed(2)}</cbc:TaxInclusiveAmount>
        <cbc:AllowanceTotalAmount currencyID="${config.currency}">0.00</cbc:AllowanceTotalAmount>
        <cbc:PayableAmount currencyID="${config.currency}">${grandTotal.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>

    ${config.items.map((item, index) => `
    <cac:InvoiceLine>
        <cbc:ID>${index + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="NIU">${item.qty}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="${config.currency}">${(item.qty * item.price).toFixed(2)}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="${config.currency}">${(item.qty * item.price * item.vatRate / 100).toFixed(2)}</cbc:TaxAmount>
            <cac:TaxSubtotal>
                <cbc:TaxableAmount currencyID="${config.currency}">${(item.qty * item.price).toFixed(2)}</cbc:TaxableAmount>
                <cbc:TaxAmount currencyID="${config.currency}">${(item.qty * item.price * item.vatRate / 100).toFixed(2)}</cbc:TaxAmount>
                <cac:TaxCategory>
                    <cbc:Percent>${item.vatRate}</cbc:Percent>
                    <cac:TaxScheme>
                        <cbc:Name>KDV</cbc:Name>
                        <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
                    </cac:TaxScheme>
                </cac:TaxCategory>
            </cac:TaxSubtotal>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>${item.name}</cbc:Name>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="${config.currency}">${item.price.toFixed(2)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>`).join('')}
</Invoice>`;
}

export function generateUBLDespatch(config: any): string {
    const uuid = config.uuid || uuidv4();
    const id = config.id || `IRS${Date.now()}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<DespatchAdvice xmlns="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2"
                xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
                xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
    <cbc:ProfileID>TEMELIRSALIYE</cbc:ProfileID>
    <cbc:ID>${id}</cbc:ID>
    <cbc:UUID>${uuid}</cbc:UUID>
    <cbc:IssueDate>${config.date}</cbc:IssueDate>
    <cbc:IssueTime>${config.time}</cbc:IssueTime>
    <cbc:DespatchAdviceTypeCode>SEVK</cbc:DespatchAdviceTypeCode>

    <cac:DespatchSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="VKN">${config.supplier.taxNumber}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>${config.supplier.name}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>${config.supplier.address}</cbc:StreetName>
                <cbc:CityName>${config.supplier.city || 'Istanbul'}</cbc:CityName>
                <cac:Country>
                    <cbc:Name>Türkiye</cbc:Name>
                </cac:Country>
            </cac:PostalAddress>
        </cac:Party>
    </cac:DespatchSupplierParty>

    <cac:DeliveryCustomerParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="${config.customer.taxNumber.length === 11 ? 'TCKN' : 'VKN'}">${config.customer.taxNumber}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>${config.customer.name}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>${config.customer.address}</cbc:StreetName>
                <cbc:CityName>${config.customer.city || ''}</cbc:CityName>
                <cac:Country>
                    <cbc:Name>Türkiye</cbc:Name>
                </cac:Country>
            </cac:PostalAddress>
        </cac:Party>
    </cac:DeliveryCustomerParty>

    <cac:Shipment>
        <cbc:ID>1</cbc:ID>
        <cac:ShipmentStage>
            <cac:TransportMeans>
                <cac:RoadTransportMeans>
                    <cbc:LicensePlateID>${config.plate || ''}</cbc:LicensePlateID>
                </cac:RoadTransportMeans>
            </cac:TransportMeans>
        </cac:ShipmentStage>
    </cac:Shipment>

    ${config.items.map((item: any, index: number) => `
    <cac:DespatchLine>
        <cbc:ID>${index + 1}</cbc:ID>
        <cbc:DeliveredQuantity unitCode="NIU">${item.qty}</cbc:DeliveredQuantity>
        <cac:Item>
            <cbc:Name>${item.name}</cbc:Name>
        </cac:Item>
    </cac:DespatchLine>`).join('')}
</DespatchAdvice>`;
}

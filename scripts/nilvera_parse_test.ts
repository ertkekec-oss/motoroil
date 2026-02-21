
import { XMLParser } from 'fast-xml-parser';
import prisma from '../src/lib/prisma';
import axios from 'axios';

async function main() {
    const s = (await prisma.appSettings.findMany({ where: { key: 'eFaturaSettings' } }))[0];
    const raw = s.value as any;
    const c = raw.apiKey ? raw : raw.nilvera;
    const apiKey = c.apiKey.trim();
    const uuid = 'd1230639-c887-48d9-8c55-576ad87971f0';
    const baseUrl = 'https://apitest.nilvera.com';

    try {
        const url = `${baseUrl}/einvoice/Purchase/${uuid}/Xml`;
        const r = await axios.get(url, { headers: { 'Authorization': 'Bearer ' + apiKey } });
        const xml = r.data;

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        });
        const jObj = parser.parse(xml);
        const invoice = jObj.Invoice;

        const supplier = invoice["cac:AccountingSupplierParty"]?.["cac:Party"];
        const vkn = supplier["cac:PartyIdentification"]?.["cbc:ID"]?.["#text"] || supplier["cac:PartyIdentification"]?.["cbc:ID"];
        const name = supplier["cac:PartyName"]?.["cbc:Name"] || supplier["cac:PartyLegalEntity"]?.["cbc:RegistrationName"] || supplier["cac:PartyName"];

        console.log("SUCCESS!");
        console.log("VKN:", JSON.stringify(vkn));
        console.log("Name:", JSON.stringify(name));

        const lines = Array.isArray(invoice["cac:InvoiceLine"]) ? invoice["cac:InvoiceLine"] : [invoice["cac:InvoiceLine"]];
        console.log("Lines:", lines.length);
    } catch (e: any) {
        console.log("ERROR:", e.message);
    }
}
main();

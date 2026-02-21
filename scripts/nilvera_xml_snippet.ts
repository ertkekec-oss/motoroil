
import prisma from '../src/lib/prisma';
import axios from 'axios';
import fs from 'fs';

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
        const content = typeof r.data === 'string' ? r.data : JSON.stringify(r.data);
        fs.writeFileSync('nilvera_xml_snippet.txt', content.substring(0, 5000));
    } catch (e: any) {
        fs.writeFileSync('nilvera_xml_snippet.txt', `Error: ${e.response?.status}`);
    }
}
main();

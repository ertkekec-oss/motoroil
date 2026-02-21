
import prisma from '../src/lib/prisma';
import axios from 'axios';

async function main() {
    const s = (await prisma.appSettings.findMany({ where: { key: 'eFaturaSettings' } }))[0];
    const raw = s.value as any;
    const c = raw.apiKey ? raw : raw.nilvera;
    const apiKey = c.apiKey.trim();
    const uuid = 'd1230639-c887-48d9-8c55-576ad87971f0';

    const bases = ['https://apitest.nilvera.com', 'https://api.nilvera.com'];
    const paths = [`/einvoice/Purchase/${uuid}/Model`, `/einvoice/Purchase/${uuid}/model`, `/einvoice/Purchase/${uuid}/View`];

    for (const b of bases) {
        for (const p of paths) {
            try {
                console.log(`Trying ${b}${p}...`);
                const res = await axios.get(`${b}${p}`, {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });
                console.log(`SUCCESS! ${b}${p}`);
                console.log("Keys:", Object.keys(res.data));
                process.exit(0);
            } catch (e: any) {
                console.log(`Failed ${b}${p}: ${e.response?.status}`);
            }
        }
    }
}
main();

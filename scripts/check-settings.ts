import { PrismaClient } from '@prisma/client';
import { decrypt } from '../src/lib/encryption';

const prisma = new PrismaClient();

async function main() {
    console.log("Integrator Settings:");
    const integrators = await prisma.integratorSettings.findMany();
    for (const s of integrators) {
        console.log(`Company: ${s.companyId}, Active: ${s.isActive}, Env: ${s.environment}`);
        try {
            const creds = JSON.parse(decrypt(s.credentials));
            console.log(`  -> API Key exists: ${!!creds.apiKey}`);
            console.log(`  -> Username: ${creds.username}`);
        } catch(e) { console.log(`  -> Error decrypting`); }
    }

    console.log("\nApp Settings (eFaturaSettings):");
    const appSettings = await prisma.appSettings.findMany({ where: { key: 'eFaturaSettings'} });
    for (const s of appSettings) {
        console.log(`Company: ${s.companyId}, Value:`, JSON.stringify(s.value));
    }
}
main();

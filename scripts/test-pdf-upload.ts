import { SignJWT } from 'jose';
import fs from 'fs';

async function test() {
    console.log("Generating token");
    const secret = new TextEncoder().encode("aJ8I7w0m9VfDErdobyilutAYQK62CCcFSWvTRekUx");
    const token = await new SignJWT({
        id: "cm1a2b3c",
        username: "testuser",
        role: "SUPER_ADMIN",
        tenantId: "TENANT_1",
        companyId: "COMPANY_1"
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);

    fs.writeFileSync("dummy.pdf", "%PDF-1.4 dummy pdf content");

    console.log("Sending request");
    const formData = new FormData();
    const bloby = new Blob([fs.readFileSync("dummy.pdf")]);
    formData.append("file", bloby, "dummy.pdf");

    const res = await fetch("http://localhost:3000/api/suppliers/cmms9qn3c00012esy1xt4jtxt/invoice/parse", {
        method: "POST",
        headers: {
            Cookie: `session=${token}`
        },
        body: formData
    });

    console.log("Status:", res.status);
    console.log("Response:", await res.text());
}

test().catch(console.error);

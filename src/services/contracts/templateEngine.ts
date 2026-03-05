import { prisma } from '@/lib/prisma';

interface TemplateVariables {
    [key: string]: any;
}

/**
 * Parses a Handlebars-like template resolving both simple variables {{var_name}}
 * and clauses {{clause.category_slug}}.
 */
export async function renderTemplateHtml(tenantId: string, rawHtml: string, variables: TemplateVariables): Promise<string> {
    let renderedHtml = rawHtml;

    // 1. Resolve standard variables
    // e.g., {{company_name}}
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        renderedHtml = renderedHtml.replace(regex, value !== undefined && value !== null ? String(value) : '');
    }

    // 2. Resolve clauses dynamically based on categorization logic
    // e.g., {{clause.payment_terms}}
    // Example: Find all {{clause.XYZ}} matches
    const clauseRegex = /{{\\s*clause\\.(.*?)\\s*}}/g;
    let match;
    const clauseRequests: string[] = [];

    while ((match = clauseRegex.exec(renderedHtml)) !== null) {
        clauseRequests.push(match[1]);
    }

    if (clauseRequests.length > 0) {
        const uniqueClauses = Array.from(new Set(clauseRequests));

        // Fetch clauses from library
        const activeClauses = await prisma.clause.findMany({
            where: {
                tenantId,
                isActive: true,
                // Assuming mapping string to ENUM somehow, or just title matching.
                // For MVP, we map slug to Category ENUM, e.g., payment_terms -> PAYMENT_TERMS
            }
        });

        // Loop over the clauses and replace
        for (const reqClause of uniqueClauses) {
            const mappedCategoryStr = reqClause.toUpperCase().replace('_', ''); // Basic matching
            const matchedClauseDoc = activeClauses.find(c =>
                c.category.toString().includes(mappedCategoryStr) ||
                c.category.toString() === reqClause.toUpperCase()
            );

            const replacementValue = matchedClauseDoc ? matchedClauseDoc.bodyHtml : `<!-- Missing Clause: ${reqClause} -->`;
            const replaceRegex = new RegExp(`{{\\s*clause\\.${reqClause}\\s*}}`, 'g');
            renderedHtml = renderedHtml.replace(replaceRegex, replacementValue);
        }
    }

    return renderedHtml;
}

export async function generateContractFromTemplate(tenantId: string, templateVersionId: string, sourceSystemContext: any) {
    // 1. Fetch Template
    const templateVer = await prisma.templateVersion.findUnique({
        where: { id: templateVersionId },
        include: { template: { include: { mappings: true } } }
    });

    if (!templateVer) throw new Error("Template not found");
    const template = templateVer.template;

    // 2. Perform mappings resolution
    // Normally we'd dynamically fetch ERP objects (e.g. Account, Order) based on sourceSystemContext.
    // For MVP, assume sourceSystemContext directly contains fully hydrated variables mapped in JSON.
    const resolvedVariables: Record<string, string> = { ...sourceSystemContext };

    // 3. Render HTML
    const finalHtml = await renderTemplateHtml(tenantId, templateVer.bodyContent, resolvedVariables);

    // 4. Create Document Object
    const document = await prisma.document.create({
        data: {
            tenantId,
            subject: `${template.name} - Generated Contract`,
            templateVersionId: templateVer.id,
            status: 'GENERATED',
            source: 'TEMPLATE',
            linkedAccountId: resolvedVariables['accountId'] || null,
            linkedOrderId: resolvedVariables['orderId'] || null,
        }
    });

    const docVersion = await prisma.documentVersion.create({
        data: {
            tenantId,
            documentId: document.id,
            version: 1,
            bodySnapshot: finalHtml,
            renderStatus: 'PENDING'
        }
    });

    // 5. Trigger Queue PDF Render via Background jobs
    // await enqueueRenderPdf(docVersion.id); // Typically this is done immediately or async queue

    return { document, docVersion };
}

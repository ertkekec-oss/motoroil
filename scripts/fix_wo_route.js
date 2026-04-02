const fs = require('fs');
const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/api/services/work-orders/route.ts';
let code = fs.readFileSync(file, 'utf8');

const targetOld = `        const { customerId, assetId, complaint, branch, status, currentKm, chassisNo, productionYear } = body;`;
const targetNew = `        const { customerId, assetId, complaint, branch, status, currentKm, chassisNo, productionYear, dynamicMetadata } = body;`;
code = code.replace(targetOld, targetNew);

const metaLogicOld = `                        metadata: {
                            ...meta,
                            currentKm: currentKm || meta.currentKm
                        }`;
const metaLogicNew = `                        metadata: {
                            ...meta,
                            currentKm: currentKm || meta.currentKm,
                            ...(dynamicMetadata || {})
                        }`;
code = code.replace(metaLogicOld, metaLogicNew);

fs.writeFileSync(file, code, 'utf8');

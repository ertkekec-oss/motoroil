const fs = require('fs');

const workerPath = 'src/services/marketplaces/actions/worker.ts';
let code = fs.readFileSync(workerPath, 'utf8');

const injection = `
            } else if (actionKey === 'SYNC_SETTLEMENT') {
                const { ActionProviderRegistry } = await import('./registry');
                const provider = ActionProviderRegistry.getProvider(marketplace);
                
                logger.info(\`[SYNC_SETTLEMENT] Worker delegating to ActionProviderRegistry for \${marketplace} - \${orderId}\`, logCtx);
                
                const execResult = await provider.executeAction({
                    companyId,
                    marketplace,
                    orderId,
                    actionKey,
                    idempotencyKey: \`WORKER_DEL_\${idempotencyKey}\`,
                    payload
                });
                
                if (execResult.status === 'FAILED') throw new Error(execResult.errorMessage || 'Settlement sync failed');
                result = execResult.result;
`;

code = code.replace("} else if (actionKey === 'PRINT_LABEL_A4') {", "} else if (actionKey === 'PRINT_LABEL_A4') {").replace("} else if (actionKey === 'CHANGE_CARGO') {", injection.trim() + "\n            } else if (actionKey === 'CHANGE_CARGO') {");

fs.writeFileSync(workerPath, code);

const fs = require('fs');

function patchFile(path) {
    let content = fs.readFileSync(path, 'utf8');
    
    // Replace lock acquisition
    content = content.replace(
        /const acquired = await redisConnection\.set\(lockKey, 'BUSY', 'EX', 60, 'NX'\);/g,
        "const acquired = redisConnection ? await redisConnection.set(lockKey, 'BUSY', 'EX', 60, 'NX') : true;"
    );

    // Replace lock release
    content = content.replace(
        /await redisConnection\.del\(lockKey\);/g,
        "if (redisConnection) await redisConnection.del(lockKey);"
    );

    fs.writeFileSync(path, content, 'utf8');
    console.log('Patched', path);
}

patchFile('src/services/marketplaces/actions/providers/trendyol-actions.ts');
patchFile('src/services/marketplaces/actions/providers/hepsiburada-actions.ts');
patchFile('src/services/marketplaces/actions/providers/n11-actions.ts');

const cp = require('child_process');
try {
    cp.execSync('git add src', { stdio: 'inherit' });
    cp.execSync('git commit -m "fix(ui): apply complete enterprise UI for payment and customer details_v2"', { stdio: 'inherit' });
    cp.execSync('git push', { stdio: 'inherit' });
    console.log('Push complete!');
} catch (e) {
    console.error(e.toString());
}

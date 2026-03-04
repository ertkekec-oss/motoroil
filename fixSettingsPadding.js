const fs = require('fs');
const path = require('path');

const targetDir = 'src/app/(app)/settings/_components/forms';

function processFile(filePath) {
    if (!filePath.endsWith('.tsx')) return;

    let original = fs.readFileSync(filePath, 'utf8');
    let content = original;

    // We look for max-w-5xl mx-auto w-full and add p-8 if it's missing
    content = content.replace(/className="([^"]*max-w-5xl mx-auto w-full[^"]*)"/g, (match, classes) => {
        if (!classes.includes('p-6') && !classes.includes('p-8') && !classes.includes('p-10')) {
            return `className="${classes.replace('max-w-5xl mx-auto w-full', 'max-w-5xl mx-auto w-full p-8 pt-10')}"`;
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Added padding to', filePath);
    }
}

function walk(dir, done) {
    let results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        let pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function (file) {
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    results.push(file);
                    if (!--pending) done(null, results);
                }
            });
        });
    });
}

walk(targetDir, (err, res) => {
    if (!err && res) {
        res.forEach(processFile);
        console.log("Done adding padding");
    }
});

const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', 'src', 'assets', 'images', 'XCEED.png');
const destDir = path.resolve(__dirname, '..', 'public', 'assets', 'images');
const dest = path.join(destDir, 'XCEED.png');

if (!fs.existsSync(src)) {
    console.error('Source file not found:', src);
    process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('Copied', src, '->', dest);

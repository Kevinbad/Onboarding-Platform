const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const keys = [];
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=/);
        if (match) keys.push(match[1]);
    });
    console.log('Keys in .env.local:', keys);
} catch (e) {
    console.log('Error reading .env.local', e.message);
}

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log('Listing ALL invites...');
    const { data: invites, error } = await supabase.from('user_invites').select('*');

    if (error) console.error(error);
    else {
        console.log('--- ACTIVE INVITES ---');
        invites.forEach(i => console.log(JSON.stringify(i))); // Print full object
        console.log('----------------------');
    }
}

main();

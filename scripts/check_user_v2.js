const { createClient } = require('@supabase/supabase-js');
// Load env manually
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
    const email = 'lauespinosa99@gmail.com'; // Corrected email
    console.log(`CHECKING USER: ${email}`);

    // Check Invites
    const { data: invites } = await supabase.from('user_invites').select('*').eq('email', email);
    console.log('Invites:', invites);

    // Check Profiles
    const { data: profiles } = await supabase.from('profiles').select('*').eq('email', email);
    console.log('Profiles:', profiles);

    // Check Auth
    if (env.SUPABASE_SERVICE_ROLE_KEY) {
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const user = users.find(u => u.email === email);
        console.log('Auth User:', user ? { id: user.id, email: user.email } : 'Not Found');

        if (user && (!profiles || profiles.length === 0)) {
            console.log('!!! User exists in Auth but NOT in Profiles. This is the "Limbo" state. !!!');
            console.log('Should delete Auth user to reset?');
            // await supabase.auth.admin.deleteUser(user.id);
        }
    }
}

main();

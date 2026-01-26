const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manual env loading
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isServiceKey = !!env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    const email = 'lauesinsoa99@gmail.com';
    console.log(`CHECKING USER: ${email}`);
    console.log(`Using Service Key: ${isServiceKey}`);

    const { data: invites, error: inviteError } = await supabase
        .from('user_invites')
        .select('*')
        .eq('email', email);

    if (inviteError) console.log('Invite Error:', inviteError.message);
    else console.log('INVITES FOUND:', invites.length);
    if (invites && invites.length > 0) console.log(JSON.stringify(invites, null, 2));

    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email);

    if (profileError) console.log('Profile Error:', profileError.message);
    else console.log('PROFILES FOUND:', profiles.length);
    if (profiles && profiles.length > 0) console.log(JSON.stringify(profiles, null, 2));

    if (isServiceKey) {
        const { data, error } = await supabase.auth.admin.listUsers();
        if (error) console.log('Auth Error:', error.message);
        else {
            const user = data.users.find(u => u.email === email);
            console.log('AUTH USER FOUND:', !!user);
            if (user) console.log('User ID:', user.id);
        }
    }
}

main();

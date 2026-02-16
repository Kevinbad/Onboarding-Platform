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
// Use service role key if available, otherwise anon key (but service key needed for auth.admin)
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
    const email = 'lauespinosa99@gmail.com';
    console.log(`CHECKING USER: ${email}`);
    console.log(`Using Service Key: ${isServiceKey}`);

    // 1. Check Invites (Admin table, needs RLS bypass or Service Key)
    const { data: allInvites, error: inviteError } = await supabase.from('user_invites').select('*');
    if (inviteError) {
        console.error('Error fetching invites:', inviteError.message);
    } else {
        console.log(`TOTAL INVITES: ${allInvites.length}`);
        const exactMatch = allInvites.find(i => i.email.toLowerCase() === email.toLowerCase());
        if (exactMatch) {
            console.log('EXACT INVITE FOUND:', exactMatch);
        } else {
            console.log('NO EXACT INVITE FOUND.');
            // Check for potential typos/partial matches
            const partial = allInvites.find(i => i.email.toLowerCase().includes('lau'));
            if (partial) console.log('Partial Match Found:', partial);
        }
    }

    // 2. Check Auth User and Profile (Needs Service Key for Auth)
    if (isServiceKey) {
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
            console.error('Auth Error:', authError.message);
        } else {
            // Filter locally because listUsers doesn't support filtering by email in all versions/wrappers cleanly here
            const user = authData.users.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (user) {
                console.log('AUTH USER FOUND. ID:', user.id);

                // 3. Fetch Profile by ID
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    console.error('Profile Fetch Error:', profileError.message);
                } else {
                    console.log('PROFILE FOUND:');
                    console.log(JSON.stringify(profile, null, 2));
                    console.log('SALARY FIELD CHECK:');
                    console.log(`Value: "${profile.salary}"`);
                    console.log(`Type: ${typeof profile.salary}`);
                    console.log(`Length: ${profile.salary ? profile.salary.length : 'N/A'}`);
                }
            } else {
                console.log('AUTH USER NOT FOUND for this email.');
            }
        }
    } else {
        console.log('Skipping Auth/Profile check - requires SUPABASE_SERVICE_ROLE_KEY in .env.local');
    }
}

main();

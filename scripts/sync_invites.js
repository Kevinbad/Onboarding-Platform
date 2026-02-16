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
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY; // MUST use service key

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log('Starting Invite Sync...');

    // 1. Get all invites
    const { data: invites, error: inviteError } = await supabase.from('user_invites').select('*');
    if (inviteError) {
        console.error('Error fetching invites:', inviteError);
        return;
    }
    console.log(`Found ${invites.length} pending invites.`);

    // 2. Get all users (batching might be needed for huge apps, but listUsers defaults to 50. We might need Loop)
    // We'll just fetch a reasonable number or loop till done.
    let allUsers = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers({ page: page, perPage: 1000 });
        if (userError) {
            console.error('Error fetching users:', userError);
            break;
        }
        allUsers = allUsers.concat(users);
        if (users.length < 1000) hasMore = false;
        else page++;
    }
    console.log(`Found ${allUsers.length} total users in Auth.`);

    // 3. Match and Sync
    let fixedCount = 0;
    for (const invite of invites) {
        const user = allUsers.find(u => u.email && u.email.toLowerCase() === invite.email.toLowerCase());

        if (user) {
            console.log(`Checking match: ${invite.email}...`);

            // Check current profile
            const { data: profile } = await supabase.from('profiles').select('salary, role').eq('id', user.id).single();

            // If profile has no salary or different salary, update it
            if (!profile || !profile.salary || profile.salary !== invite.salary) {
                console.log(`   -> Updating profile for ${invite.email} (Salary: ${invite.salary})`);

                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        salary: invite.salary,
                        role: invite.role || 'user',
                        // onboarding_status: 'started' // Optional, maybe don't force it if they are completed
                    })
                    .eq('id', user.id);

                if (updateError) {
                    console.error(`   -> Failed to update: ${updateError.message}`);
                } else {
                    console.log(`   -> Success!`);
                    fixedCount++;
                    // Optional: Delete invite?
                    // await supabase.from('user_invites').delete().eq('email', invite.email);
                }
            } else {
                console.log(`   -> Profile already synced.`);
            }
        }
    }

    console.log(`Sync Complete. Fixed ${fixedCount} users.`);
}

main();

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
    console.log('Finding corrupted profiles...');
    const { data: profiles, error } = await supabase.from('profiles').select('*');

    if (error) {
        console.error(error);
        return;
    }

    // Find profiles with NULL full_name or empty string
    const brokenProfiles = profiles.filter(p => !p.full_name || p.full_name.trim() === '');

    if (brokenProfiles.length === 0) {
        console.log('No broken profiles found.');
    } else {
        console.log(`Found ${brokenProfiles.length} broken profiles.`);
        for (const p of brokenProfiles) {
            console.log(`Deleting Profile ID: ${p.id}, Email: ${p.email || 'NULL'}`);

            const { error: deleteError } = await supabase.from('profiles').delete().eq('id', p.id);
            if (deleteError) console.error(`Failed to delete ${p.id}:`, deleteError.message);
            else console.log(`SUCCESS: Deleted ${p.id}`);

            // Also try to delete from Auth if service key is available
            if (env.SUPABASE_SERVICE_ROLE_KEY) {
                const { error: authError } = await supabase.auth.admin.deleteUser(p.id);
                if (authError) console.error(`Auth Delete Error for ${p.id}:`, authError.message);
                else console.log(`SUCCESS: Deleted Auth User ${p.id}`);
            }
        }
    }
}

main();

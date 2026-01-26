import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates an admin Supabase client that bypasses RLS.
 * ONLY USE THIS FOR ADMIN-ONLY SERVER ACTIONS.
 * Never expose the service role key to the client.
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }

    return createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

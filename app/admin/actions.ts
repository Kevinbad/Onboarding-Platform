'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createInvite(formData: FormData) {
    const supabase = await createClient()

    // Check if current user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Unauthorized: Admin access required' }
    }

    const email = formData.get('email') as string
    const salary = formData.get('salary') as string
    const role = formData.get('role') as string || 'user'

    if (!email || !salary) {
        return { error: 'Email and Salary are required' }
    }

    try {
        // 1. Create/Update the invite record (Standard flow)
        const { error } = await supabase
            .from('user_invites')
            .upsert({
                email,
                salary,
                role
            })

        if (error) throw error

        // 2. IMMEDIATE FIX: Check if user already exists in Auth
        // If they do, we shouldn't wait for them to log in or 'claim' it.
        // We updates their profile immediately.
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const adminSupabase = createAdminClient()

        // We can't select by email easily from 'profiles' as it doesn't have email.
        // But we can check auth.users via listUsers (filtering might be limited)
        // or just rely on the 'claim_invite' logic but triggered FROM HERE.
        // Actually, we can just trigger claim_invite? No, claim_invite works for the CURRENT user.
        // We need to find the TARGET user.

        // Helper: Try to find user by email in Auth
        // Note: listUsers is paginated, but for this scale likely fine. 
        // Ideally use searching if available.
        const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers()

        if (!listError && users) {
            const targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

            if (targetUser) {
                console.log(`[createInvite] Found existing user for ${email} (ID: ${targetUser.id}). Auto-applying invite...`)

                // Update Profile directly
                const { error: updateError } = await adminSupabase
                    .from('profiles')
                    .update({
                        salary: salary,
                        role: role,
                        // Ensure we don't overwrite other fields, but we COULD set onboarding_status if needed
                        // For now just salary/role is critical for the contract
                    })
                    .eq('id', targetUser.id)

                if (updateError) {
                    console.error('[createInvite] Error auto-updating profile:', updateError)
                } else {
                    console.log('[createInvite] Profile updated successfully.')
                    // Optional: Consume the invite now? 
                    // If we consume it, the 'claim_invite' won't run later, which is fine.
                    // But let's leave it for redundancy or delete it to be clean.
                    // Let's delete it to match 'claim_invite' behavior.
                    await adminSupabase.from('user_invites').delete().eq('email', email)
                }
            }
        }

        revalidatePath('/admin')
        return { success: true }
    } catch (error: unknown) {
        console.error('[createInvite] Error:', error)
        return { error: 'Error creating invite: ' + (error as Error).message }
    }
}

export async function deleteInvite(email: string) {
    const supabase = await createClient()

    // Check admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    try {
        const { error } = await supabase
            .from('user_invites')
            .delete()
            .eq('email', email)

        if (error) throw error

        revalidatePath('/admin')
        return { success: true }
    } catch (error: unknown) {
        return { error: 'Error deleting invite: ' + (error as Error).message }
    }
}

export async function deleteUser(userId: string) {
    console.log('[deleteUser] Starting delete for userId:', userId)

    const supabase = await createClient()

    // Check admin using regular client
    const { data: { user } } = await supabase.auth.getUser()
    console.log('[deleteUser] Current user:', user?.id)

    if (!user) {
        console.log('[deleteUser] No user found - Unauthorized')
        return { error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    console.log('[deleteUser] Current user role:', profile?.role)

    if (profile?.role !== 'admin') {
        console.log('[deleteUser] Not admin - Unauthorized')
        return { error: 'Unauthorized' }
    }

    // Use admin client to bypass RLS for deletion
    console.log('[deleteUser] Creating admin client...')
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminSupabase = createAdminClient()
    console.log('[deleteUser] Admin client created')

    try {
        console.log('[deleteUser] Executing delete...')
        const { error, count } = await adminSupabase
            .from('profiles')
            .delete()
            .eq('id', userId)

        console.log('[deleteUser] Delete result - error:', error, 'count:', count)

        if (error) throw error

        revalidatePath('/admin')
        console.log('[deleteUser] Success!')
        return { success: true }
    } catch (error: unknown) {
        console.error('[deleteUser] Error:', error)
        return { error: 'Error deleting user: ' + (error as Error).message }
    }
}

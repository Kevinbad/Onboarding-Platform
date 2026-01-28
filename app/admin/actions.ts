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
        const { error } = await supabase
            .from('user_invites')
            .upsert({
                email,
                salary,
                role
            })

        if (error) throw error

        revalidatePath('/admin')
        return { success: true }
    } catch (error: unknown) {
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

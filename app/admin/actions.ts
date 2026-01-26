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
    const supabase = await createClient()

    // Check admin using regular client
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    // Use admin client to bypass RLS for deletion
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminSupabase = createAdminClient()

    try {
        const { error } = await adminSupabase
            .from('profiles')
            .delete()
            .eq('id', userId)

        if (error) throw error

        revalidatePath('/admin')
        return { success: true }
    } catch (error: unknown) {
        return { error: 'Error deleting user: ' + (error as Error).message }
    }
}

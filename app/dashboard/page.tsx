import { createClient } from '@/lib/supabase/server'
import OnboardingWizard from './onboarding-wizard'

import { AccessDenied } from '@/components/access-denied'

export default async function Dashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    // ACCESS CONTROL CHECK
    // If user is NOT admin AND has NO salary assigned -> Block
    const hasAccess = profile?.role === 'admin' || (profile?.salary && profile.salary.length > 0)

    if (!hasAccess) {
        // AUTO-HEALING: Check if there is a pending invite for this email
        // This handles cases where the user registered before the invite existed, 
        // or if the initial trigger failed/was bypassed.
        if (user?.email) {
            // Attempt to claim invite via RPC (Security Definer)
            // This bypasses RLS to check for invites and update profile
            const { data: claimed, error } = await supabase.rpc('claim_invite')

            if (claimed) {
                // Re-fetch profile to get updated data
                const { data: updatedProfile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (updatedProfile?.salary) {
                    return (
                        <div>
                            <div className="md:flex md:items-center md:justify-between mb-8">
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-2xl font-bold leading-7 text-white sm:truncate sm:text-3xl sm:tracking-tight">
                                        Welcome, {updatedProfile?.full_name || user?.email}
                                    </h2>
                                    <p className="mt-1 text-slate-400">
                                        Complete your profile to activate your Solvenza account.
                                    </p>
                                    {/* Admin Link */}
                                    {updatedProfile?.role === 'admin' && (
                                        <div className="mt-4">
                                            <a href="/admin" className="text-sm bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full hover:bg-blue-600/30 transition-colors border border-blue-600/50">
                                                Go to Admin Panel &rarr;
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <OnboardingWizard profile={updatedProfile} />
                        </div>
                    )
                }
            }
        }

        return <AccessDenied email={user?.email} />
    }

    return (
        <div>
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-white sm:truncate sm:text-3xl sm:tracking-tight">
                        Welcome, {profile?.full_name || user?.email}
                    </h2>
                    <p className="mt-1 text-slate-400">
                        Complete your profile to activate your Solvenza account.
                    </p>

                    {/* Admin Link */}
                    {profile?.role === 'admin' && (
                        <div className="mt-4">
                            <a href="/admin" className="text-sm bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full hover:bg-blue-600/30 transition-colors border border-blue-600/50">
                                Go to Admin Panel &rarr;
                            </a>
                        </div>
                    )}

                    {/* Debugging Info Removed */}
                </div>
            </div>

            <OnboardingWizard profile={profile} />
        </div>
    )
}

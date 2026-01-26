import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AccessDenied({ email }: { email?: string, profile?: any }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="bg-red-500/10 p-4 rounded-full mb-6">
                <ShieldAlert className="h-16 w-16 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Access Restricted</h1>
            <p className="text-slate-400 max-w-lg mb-8 text-lg">
                The account <strong>{email}</strong> does not have a valid invitation or assigned salary configuration.
            </p>
            <div className="bg-[#1a1f36] border border-slate-800 p-6 rounded-lg max-w-md w-full mb-8">
                <p className="text-sm text-slate-300 mb-2">
                    Startups and companies use Solvenza by invitation only.
                </p>
                <p className="text-xs text-slate-500">
                    If you believe this is an error, please contact your administrator to verify that your invitation was sent to this exact email address.
                </p>
            </div>
            <Link href="/login">
                <Button variant="outline">Sign in with a different account</Button>
            </Link>
        </div>
    )
}

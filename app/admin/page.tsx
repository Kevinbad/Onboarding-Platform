import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createInvite, deleteInvite, deleteUser } from './actions'
import { CreateInviteForm } from './create-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, UserPlus, DollarSign, Mail, FileText } from 'lucide-react'
import { toast } from 'sonner'

export default async function AdminPage() {
    // Auth checks handled by layout
    const supabase = await createClient()

    const { data: invites } = await supabase
        .from('user_invites')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-[#0a0d1e] text-foreground p-8">
            <div className="max-w-5xl mx-auto space-y-8">

                <header>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
                        Admin Dashboard
                    </h1>
                    <p className="text-slate-400 mt-2">Manage user invitations and salary assignments.</p>
                </header>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Create Invite Form */}
                    <Card className="bg-[#1a1f36] border-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-blue-400" />
                                Create Invite
                            </CardTitle>
                            <CardDescription>
                                Pre-approve a user and assign their salary.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CreateInviteForm />
                        </CardContent>
                    </Card>

                    {/* Invite List */}
                    <Card className="bg-[#1a1f36] border-slate-800 h-fit">
                        <CardHeader>
                            <CardTitle>Active Invites</CardTitle>
                            <CardDescription>
                                Users waiting to register ({invites?.length || 0})
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {invites?.length === 0 && (
                                    <p className="text-center text-slate-500 py-8">No active invitations found.</p>
                                )}
                                {invites?.map((invite: { email: string; salary: string; role: string }) => (
                                    <div key={invite.email} className="flex items-center justify-between p-3 rounded-lg bg-[#0f1225] border border-slate-800">
                                        <div>
                                            <p className="font-medium text-white">{invite.email}</p>
                                            <p className="text-sm text-green-400 font-mono">${invite.salary} USD</p>
                                        </div>
                                        <form action={async () => {
                                            'use server'
                                            await deleteInvite(invite.email)
                                        }}>
                                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-400">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Registered Employees List */}
                <div className="grid gap-8">
                    <Card className="bg-[#1a1f36] border-slate-800">
                        <CardHeader>
                            <CardTitle>Registered Team</CardTitle>
                            <CardDescription>
                                Employees who have completed onboarding and signed contracts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-slate-800 bg-[#0f1225]">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-slate-900/50 text-slate-400">
                                        <tr>
                                            <th className="px-6 py-3">Employee</th>
                                            <th className="px-6 py-3">Role</th>
                                            <th className="px-6 py-3">Salary</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Contract</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {/* Get profiles for table */}
                                        {(await supabase.from('profiles').select('*').neq('role', 'admin').order('created_at', { ascending: false })).data?.map((employee: any) => (
                                            <tr key={employee.id} className="hover:bg-slate-800/10">
                                                <td className="px-6 py-4 font-medium text-white">
                                                    <div>{employee.full_name || 'No Name'}</div>
                                                    <div className="text-xs text-slate-500">{employee.email || 'No Email'}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-300 capitalize">{employee.role}</td>
                                                <td className="px-6 py-4 text-green-400 font-mono">${employee.salary}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${employee.onboarding_status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                                        {employee.onboarding_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {employee.contract_url ? (
                                                        <a
                                                            href={employee.contract_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline"
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                            View PDF
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-600 italic">Not signed</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <form action={async () => {
                                                        'use server'
                                                        await deleteUser(employee.id)
                                                    }}>
                                                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-400">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </form>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!((await supabase.from('profiles').select('id').neq('role', 'admin')).data?.length)) && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                                    No registered employees yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    )
}

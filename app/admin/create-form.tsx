'use client'

import { createInvite } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserPlus, DollarSign, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useRef } from 'react'

export function CreateInviteForm() {
    const formRef = useRef<HTMLFormElement>(null)

    async function handleSubmit(formData: FormData) {
        const result = await createInvite(formData)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Invitation created successfully')
            formRef.current?.reset()
        }
    }

    return (
        <form
            ref={formRef}
            action={handleSubmit}
            className="space-y-4"
        >
            <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                        name="email"
                        type="email"
                        placeholder="new.hire@company.com"
                        required
                        className="pl-9 bg-[#0f1225] border-slate-700"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Monthly Salary (USD)</label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                        name="salary"
                        placeholder="2000"
                        required
                        className="pl-9 bg-[#0f1225] border-slate-700"
                    />
                </div>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                Send Invite
            </Button>
        </form>
    )
}

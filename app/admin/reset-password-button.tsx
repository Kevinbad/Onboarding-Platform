'use client'

import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'
import { updateUserPassword } from '@/app/admin/actions'

export function ResetPasswordButton({ userId, userEmail }: { userId: string, userEmail?: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [password, setPassword] = useState('')

    async function handleReset() {
        if (!password || password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        try {
            const result = await updateUserPassword(userId, password)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Password updated successfully')
                setOpen(false)
                setPassword('')
            }
        } catch (error) {
            toast.error('Failed to update password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-400 hover:bg-blue-900/10">
                    <KeyRound className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#1a1f36] border-slate-800 text-white">
                <AlertDialogHeader>
                    <AlertDialogTitle>Reset Password</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                        Set a new password for <strong>{userEmail}</strong>.<br />
                        The user can use this password to log in immediately.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4">
                    <Input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="bg-[#0f1225] border-slate-700 text-white"
                    />
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        onClick={handleReset}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {loading ? 'Updating...' : 'Set Password'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

'use client'

import { useFormStatus } from 'react-dom'
import { resetPassword } from './actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import NextImage from 'next/image'

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            disabled={pending}
            isLoading={pending}
            className="w-full h-12 text-md rounded-2xl"
        >
            <span className="flex items-center">
                Send Reset Link <ArrowRight className="ml-2 h-4 w-4" />
            </span>
        </Button>
    )
}

export default function ForgotPasswordPage() {
    async function handleSubmit(formData: FormData) {
        const result = await resetPassword(null, formData)

        if (result?.error) {
            toast.error(result.error)
        } else if (result?.success) {
            toast.success(result.success)
        }
    }

    return (
        <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
            {/* Background Glow Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md space-y-8 z-10">
                <Card className="glass-card border-none bg-[#1e233b]/90 backdrop-blur-xl p-8 rounded-3xl">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-48 h-24 mb-6 relative">
                            <NextImage
                                src="/logo.png"
                                alt="Solvenza Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>

                        <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
                            Reset Password
                        </h2>
                        <p className="text-slate-400 text-sm font-medium text-center">
                            Enter your email to receive a password reset link
                        </p>
                    </div>

                    <form action={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 ml-1">
                                Email Address
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="Enter your email"
                                startIcon={<Mail className="h-5 w-5" />}
                                className="bg-[#131625] border-slate-700/50 text-white placeholder:text-slate-600 h-14 rounded-2xl focus-visible:ring-blue-500/50"
                            />
                        </div>

                        <div className="pt-4">
                            <SubmitButton />
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <Link
                            href="/login"
                            className="text-sm text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to Login
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    )
}

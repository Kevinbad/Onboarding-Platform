'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { login, signup } from './actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { User, Lock, ArrowRight } from 'lucide-react'
import NextImage from 'next/image'
import Link from 'next/link'

function SubmitButton({ isLogin }: { isLogin: boolean }) {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            disabled={pending}
            isLoading={pending}
            className="w-full h-12 text-md rounded-2xl"
        >
            {isLogin ? (
                <span className="flex items-center">Ingresar <ArrowRight className="ml-2 h-4 w-4" /></span>
            ) : (
                'Crear cuenta'
            )}
        </Button>
    )
}

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true)

    async function handleSubmit(formData: FormData) {
        const action = isLogin ? login : signup
        const result = await action(null, formData)

        if (result?.error) {
            toast.error(result.error)
        }
    }

    return (
        <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
            {/* Background Glow Effects to match image */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md space-y-8 z-10">
                <Card className="glass-card border-none bg-[#1e233b]/90 backdrop-blur-xl p-8 rounded-3xl">
                    <div className="flex flex-col items-center mb-10">
                        {/* Logo Placeholder - The image has a specific logo, we'll try to use text or a similar icon for now */}
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
                            Solvenza Onboarding
                        </h2>
                        <p className="text-slate-400 text-sm font-medium">
                            Portal de Incorporación
                        </p>
                    </div>

                    <form action={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 ml-1">
                                Usuario
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="Ingresa tu usuario"
                                startIcon={<User className="h-5 w-5" />}
                                className="bg-[#131625] border-slate-700/50 text-white placeholder:text-slate-600 h-14 rounded-2xl focus-visible:ring-blue-500/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 ml-1">
                                Contraseña
                            </label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                placeholder="••••••••"
                                startIcon={<Lock className="h-5 w-5" />}
                                className="bg-[#131625] border-slate-700/50 text-white placeholder:text-slate-600 h-14 rounded-2xl focus-visible:ring-blue-500/50"
                            />
                        </div>

                        <div className="flex justify-center">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        <div className="pt-4">
                            <SubmitButton isLogin={isLogin} />
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm text-slate-500 hover:text-white transition-colors"
                        >
                            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Ingresar'}
                        </button>
                    </div>
                </Card>
            </div>
        </div >
    )
}

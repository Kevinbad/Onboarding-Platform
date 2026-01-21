'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Validation: Must start with $ or be alphanumeric. DolarApp usually uses $tag.
// Requirement: "Starts with $ or letters".
const financialSchema = z.object({
    dolar_tag: z.string().min(2, "Tag is required").regex(/^[\$a-zA-Z0-9_]+$/, "Invalid format. Use $tag or username"),
})

type FinancialFormValues = z.infer<typeof financialSchema>

interface FinancialStepProps {
    initialData?: Record<string, string>
    onComplete: () => void
    onBack: () => void
}

export function FinancialStep({ initialData, onComplete, onBack }: FinancialStepProps) {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const defaultValues: Partial<FinancialFormValues> = {
        dolar_tag: initialData?.dolar_tag || '',
    }

    const form = useForm<FinancialFormValues>({
        resolver: zodResolver(financialSchema),
        defaultValues,
    })

    async function onSubmit(data: FinancialFormValues) {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user found')

            // Ensure tag starts with $ if user didn't add it (optional UX improvement)
            let tag = data.dolar_tag
            if (!tag.startsWith('$')) {
                tag = '$' + tag
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    dolar_tag: tag,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id)

            if (error) throw error

            toast.success('Financial info saved')
            onComplete()
        } catch (error: unknown) {
            toast.error('Error saving info: ' + (error as Error).message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Financial Information</CardTitle>
                <CardDescription>
                    We use DolarApp for payments. Please watch the video below to understand how to set up your account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-6 w-full aspect-video bg-muted rounded-lg overflow-hidden border border-border">
                    <iframe
                        width="100%"
                        height="100%"
                        src="https://www.youtube.com/embed/Y66gZK0Ac6Q"
                        title="DolarApp Tutorial"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label htmlFor="dolar_tag" className="block text-sm font-medium text-foreground mb-1">DolarApp Tag</label>
                        <Input
                            {...form.register('dolar_tag')}
                            type="text"
                            placeholder="$username"
                            error={form.formState.errors.dolar_tag?.message}
                        />
                        <p className="mt-2 text-sm text-muted-foreground">
                            Enter your unique DolarApp $tag so we can process your payments.
                        </p>
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onBack}
                        >
                            Back
                        </Button>
                        <Button
                            type="submit"
                            isLoading={loading}
                        >
                            Save & Continue
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

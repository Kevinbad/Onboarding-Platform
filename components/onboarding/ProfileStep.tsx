'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select-native'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase } from 'lucide-react'

const profileSchema = z.object({
    full_name: z.string().min(2, "Full name is required"),
    government_id: z.string().min(4, "ID is required"),
    country: z.string().min(2, "Country is required"),
    phone: z.string().min(6, "Phone number is required"),
    company: z.string().min(1, "Company is required"),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileStepProps {
    initialData?: Record<string, string>
    onComplete: () => void
}

interface Company {
    id: string
    name: string
}

export function ProfileStep({ initialData, onComplete }: ProfileStepProps) {
    const [loading, setLoading] = useState(false)
    const [companies, setCompanies] = useState<Company[]>([])
    const [loadingCompanies, setLoadingCompanies] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const { data, error } = await supabase
                    .from('companies')
                    .select('id, name')
                    .order('name')

                if (error) throw error
                setCompanies(data || [])
            } catch (error) {
                console.error('Error fetching companies:', error)
                toast.error('Failed to load companies')
            } finally {
                setLoadingCompanies(false)
            }
        }

        fetchCompanies()
    }, [supabase])

    const defaultValues: Partial<ProfileFormValues> = {
        full_name: initialData?.full_name || '',
        government_id: initialData?.government_id || '',
        country: initialData?.country || '',
        phone: initialData?.phone || '',
        company: initialData?.company || '',
    }

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues,
    })

    async function onSubmit(data: ProfileFormValues) {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user found')

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    ...data,
                    updated_at: new Date().toISOString(),
                })

            if (error) throw error

            toast.success('Profile saved')
            onComplete()
        } catch (error: unknown) {
            toast.error('Error saving profile: ' + (error as Error).message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                    Please enter your personal details as they appear on your government ID.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-4">
                            <label htmlFor="full_name" className="block text-sm font-medium text-foreground mb-1">Full Name</label>
                            <Input
                                {...form.register('full_name')}
                                type="text"
                                error={form.formState.errors.full_name?.message}
                            />
                        </div>

                        <div className="sm:col-span-6">
                            <label htmlFor="company" className="block text-sm font-medium text-foreground mb-1">Company</label>
                            <Select
                                {...form.register('company')}
                                placeholder="Select the company you work with"
                                options={companies.map(company => ({
                                    value: company.name,
                                    label: company.name
                                }))}
                                disabled={loadingCompanies}
                                startIcon={<Briefcase className="h-4 w-4" />}
                                error={form.formState.errors.company?.message}
                            />
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="government_id" className="block text-sm font-medium text-foreground mb-1">Government ID (DNI/Cédula)</label>
                            <Input
                                {...form.register('government_id')}
                                type="text"
                                error={form.formState.errors.government_id?.message}
                            />
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="country" className="block text-sm font-medium text-foreground mb-1">Country of Residence</label>
                            <Input
                                {...form.register('country')}
                                type="text"
                                error={form.formState.errors.country?.message}
                            />
                        </div>

                        <div className="sm:col-span-4">
                            <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
                            <Input
                                {...form.register('phone')}
                                type="tel"
                                error={form.formState.errors.phone?.message}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
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

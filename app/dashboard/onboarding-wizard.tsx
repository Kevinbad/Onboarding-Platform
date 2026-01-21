'use client'

import { useState } from 'react'
import { StepIndicator } from '@/components/onboarding/StepIndicator'
import { ProfileStep } from '@/components/onboarding/ProfileStep'
import { FinancialStep } from '@/components/onboarding/FinancialStep'
import { LegalStep } from '@/components/onboarding/LegalStep'
import { CompletionStep } from '@/components/onboarding/CompletionStep'

interface OnboardingWizardProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profile: any
}

const STEPS = ['Personal Details', 'Payment Info', 'Legal Agreement', 'Activation']

export default function OnboardingWizard({ profile }: OnboardingWizardProps) {
    // Determine initial step based on profile data
    const getInitialStep = () => {
        if (profile?.onboarding_status === 'completed') return 3
        if (profile?.contract_signed) return 3
        if (profile?.dolar_tag) return 2
        if (profile?.full_name && profile?.government_id) return 1
        return 0
    }

    const [currentStep, setCurrentStep] = useState(getInitialStep())

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        }
    }

    return (
        <div className="space-y-8">
            <StepIndicator currentStep={currentStep} steps={STEPS} />

            <div className="mt-8 transition-all duration-500 ease-in-out">
                {currentStep === 0 && (
                    <ProfileStep
                        initialData={profile}
                        onComplete={handleNext}
                    />
                )}

                {currentStep === 1 && (
                    <FinancialStep
                        initialData={profile}
                        onComplete={handleNext}
                        onBack={handleBack}
                    />
                )}

                {currentStep === 2 && (
                    <LegalStep
                        initialData={profile}
                        onComplete={handleNext}
                        onBack={handleBack}
                    />
                )}

                {currentStep === 3 && (
                    <CompletionStep />
                )}
            </div>
        </div>
    )
}

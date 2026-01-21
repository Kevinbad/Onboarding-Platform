'use client'

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Check } from 'lucide-react'

interface StepIndicatorProps {
    currentStep: number
    steps: string[]
}

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs))
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
    return (
        <nav aria-label="Progress">
            <ol role="list" className="overflow-hidden rounded-md lg:flex lg:border-l lg:border-r lg:border-border lg:rounded-none">
                {steps.map((step, stepIdx) => {
                    const isCompleted = currentStep > stepIdx
                    const isCurrent = currentStep === stepIdx

                    return (
                        <li key={step} className={cn("relative overflow-hidden lg:flex-1", stepIdx === 0 ? "rounded-t-md lg:rounded-none" : "", stepIdx === steps.length - 1 ? "rounded-b-md lg:rounded-none" : "")}>
                            <div
                                className={cn(
                                    "border border-border overflow-hidden lg:border-0",
                                    stepIdx === 0 ? "rounded-t-md border-b-0 lg:border-b-0 lg:rounded-none" : "",
                                    stepIdx === steps.length - 1 ? "rounded-b-md border-t-0 lg:border-t-0 lg:rounded-none" : "",
                                    "lg:border-b-0"
                                )}
                            >
                                {/* Desktop/Tablet View */}
                                <div className="group">
                                    <span
                                        className={cn(
                                            "absolute top-0 left-0 h-full w-1 bg-transparent group-hover:bg-muted lg:bottom-0 lg:top-auto lg:h-1 lg:w-full",
                                            isCurrent && "bg-primary",
                                            isCompleted && "bg-primary"
                                        )}
                                        aria-hidden="true"
                                    />
                                    <span className="flex items-start px-6 py-5 text-sm font-medium lg:pl-9">
                                        <span className="flex-shrink-0">
                                            {isCompleted ? (
                                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                                                    <Check className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
                                                </span>
                                            ) : isCurrent ? (
                                                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary">
                                                    <span className="text-primary">{stepIdx + 1}</span>
                                                </span>
                                            ) : (
                                                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border">
                                                    <span className="text-muted-foreground">{stepIdx + 1}</span>
                                                </span>
                                            )}
                                        </span>
                                        <span className="ml-4 mt-0.5 flex min-w-0 flex-col">
                                            <span
                                                className={cn(
                                                    "text-sm font-medium uppercase tracking-wide",
                                                    isCurrent ? "text-primary" : isCompleted ? "text-primary" : "text-muted-foreground"
                                                )}
                                            >
                                                {step}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {stepIdx === 0 && "Personal Details"}
                                                {stepIdx === 1 && "Payment info"}
                                                {stepIdx === 2 && "Legal Agreement"}
                                                {stepIdx === 3 && "Activation"}
                                            </span>
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}

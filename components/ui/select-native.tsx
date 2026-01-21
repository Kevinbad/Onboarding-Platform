import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ChevronDown } from 'lucide-react'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    error?: string
    startIcon?: ReactNode
    options: { value: string; label: string }[]
    placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, error, startIcon, options, placeholder, ...props }, ref) => {
        return (
            <div className="w-full">
                <div className="relative">
                    {startIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none">
                            {startIcon}
                        </div>
                    )}
                    <div className="relative">
                        <select
                            className={cn(
                                'flex h-12 w-full appearance-none rounded-xl border border-input bg-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
                                startIcon && 'pl-10',
                                error && 'border-red-500 focus-visible:ring-red-500',
                                'pr-10', // Space for chevron
                                className
                            )}
                            ref={ref}
                            {...props}
                        >
                            {placeholder && (
                                <option value="" disabled>
                                    {placeholder}
                                </option>
                            )}
                            {options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    </div>
                </div>
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            </div>
        )
    }
)
Select.displayName = 'Select'

export { Select }

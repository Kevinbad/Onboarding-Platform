import { InputHTMLAttributes, forwardRef, ReactNode } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: string
    startIcon?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, startIcon, ...props }, ref) => {
        return (
            <div className="w-full">
                <div className="relative">
                    {startIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {startIcon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            'flex h-12 w-full rounded-xl border border-input bg-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
                            startIcon && 'pl-10',
                            error && 'border-red-500 focus-visible:ring-red-500',
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            </div>
        )
    }
)
Input.displayName = 'Input'

export { Input }

import * as React from "react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        const variants = {
            default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
            destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
            outline: "border border-gray-200 bg-white hover:bg-gray-100 text-gray-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800 dark:text-zinc-50",
            secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200/80 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80",
            ghost: "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
            link: "text-indigo-600 underline-offset-4 hover:underline",
        }
        const sizes = {
            default: "h-9 px-4 py-2",
            sm: "h-8 rounded-md px-3 text-xs",
            lg: "h-10 rounded-md px-8",
            icon: "h-9 w-9",
        }

        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600 disabled:pointer-events-none disabled:opacity-50",
                    variants[variant],
                    sizes[size],
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }

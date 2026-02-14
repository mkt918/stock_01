import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function Card({ className, children }: { className?: string, children: React.ReactNode }) {
    return (
        <div className={cn("bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm", className)}>
            {children}
        </div>
    )
}

export function CardHeader({ className, children }: { className?: string, children: React.ReactNode }) {
    return <div className={cn("p-6 pb-2", className)}>{children}</div>
}

export function CardTitle({ className, children }: { className?: string, children: React.ReactNode }) {
    return <h3 className={cn("text-lg font-semibold text-slate-900 dark:text-white", className)}>{children}</h3>
}

export function CardContent({ className, children }: { className?: string, children: React.ReactNode }) {
    return <div className={cn("p-6 pt-2", className)}>{children}</div>
}

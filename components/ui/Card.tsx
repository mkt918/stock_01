import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function Card({ className, children }: { className?: string, children: React.ReactNode }) {
    return (
        <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm", className)}>
            {children}
        </div>
    )
}

export function CardHeader({ className, children }: { className?: string, children: React.ReactNode }) {
    return <div className={cn("p-6 pb-2", className)}>{children}</div>
}

export function CardTitle({ className, children }: { className?: string, children: React.ReactNode }) {
    return <h3 className={cn("text-lg font-bold text-slate-900", className)}>{children}</h3>
}

export function CardContent({ className, children }: { className?: string, children: React.ReactNode }) {
    return <div className={cn("p-6 pt-2", className)}>{children}</div>
}

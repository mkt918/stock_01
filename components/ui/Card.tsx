import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
    return (
        <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm", className)} {...props}>
            {children}
        </div>
    )
}

export function CardHeader({ className, children, ...props }: CardProps) {
    return <div className={cn("p-6 pb-2", className)} {...props}>{children}</div>
}

export function CardTitle({ className, children, ...props }: CardProps) {
    return <h3 className={cn("text-lg font-bold text-slate-900", className)} {...props}>{children}</h3>
}

export function CardContent({ className, children, ...props }: CardProps) {
    return <div className={cn("p-6 pt-2", className)} {...props}>{children}</div>
}

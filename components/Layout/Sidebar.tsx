'use client';

import Link from 'next/link';
import { LayoutDashboard, TrendingUp, PieChart, BookOpen } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { twMerge } from 'tailwind-merge';

const navItems = [
    { name: 'ダッシュボード', href: '/', icon: LayoutDashboard },
    { name: 'マーケット', href: '/market', icon: TrendingUp },
    { name: 'ポートフォリオ', href: '/portfolio', icon: PieChart },
    { name: '学習 (EDINET)', href: '/learn', icon: BookOpen },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white text-slate-700 h-screen fixed left-0 top-0 flex flex-col border-r border-slate-200 shadow-sm z-50">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    株式学習ゲーム
                </h1>
                <p className="text-xs text-slate-400 mt-1">中高生向け金融リテラシー</p>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={twMerge(
                                "flex items-center px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-blue-50 text-blue-600 font-bold shadow-sm"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <Icon size={20} className={twMerge("mr-3", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                            <span className={twMerge(isActive ? "font-bold" : "font-medium")}>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-100">
                <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">総資産 (概算)</p>
                    {/* Client-side visual placeholder */}
                    <div className="h-2 w-20 bg-slate-200 rounded animate-pulse"></div>
                </div>
            </div>
        </aside>
    );
}

import Link from 'next/link';
import { LayoutDashboard, TrendingUp, PieChart, Settings, BookOpen } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
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
        <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col border-r border-slate-800 shadow-xl z-50">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    StockLearner
                </h1>
                <p className="text-xs text-slate-400 mt-1">中高生向け株式学習</p>
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
                                    ? "bg-blue-600 shadow-lg shadow-blue-900/50 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <Icon size={20} className={twMerge("mr-3", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Total Assets</p>
                    {/* We will connect this to store later, for now static or client side only */}
                    <div className="h-2 w-20 bg-slate-700 rounded animate-pulse"></div>
                </div>
            </div>
        </aside>
    );
}

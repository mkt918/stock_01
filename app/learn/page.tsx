'use client';

import { BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function LearnPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    学習 (EDINET)
                </h1>
                <p className="text-slate-500 mt-1">企業の有価証券報告書を読んで投資を学ぼう</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        準備中
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-500">
                        EDINET を活用した学習機能は現在開発中です。
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

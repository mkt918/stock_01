'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useGameStore } from '@/lib/store';
import { FileText, ExternalLink } from 'lucide-react';

interface Disclosure {
    docID: string;
    filerName: string;
    docDescription: string;
    submitDateTime: string;
    secCode?: string;
}

export function LatestDisclosures() {
    const { holdings } = useGameStore();
    const [disclosures, setDisclosures] = useState<Disclosure[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDisclosures();
    }, [holdings.length]);

    const fetchDisclosures = async () => {
        setLoading(true);
        try {
            const res = await fetch('/stock_01/data/edinet.json');
            if (res.ok) {
                const data = await res.json();

                if (holdings.length === 0) {
                    setDisclosures(data.slice(0, 5)); // Show some default recent docs if none held
                } else {
                    const codes = holdings.map(h => h.code);
                    const filtered = data.filter((doc: any) =>
                        doc.secCode && codes.some(c => doc.secCode.startsWith(c))
                    );
                    setDisclosures(filtered.length > 0 ? filtered : data.slice(0, 5));
                }
            }
        } catch (error) {
            console.error("Failed to fetch disclosures", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-white border-slate-100 shadow-sm mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-slate-500" />
                    市場の最新開示情報 (EDINET API連携)
                </CardTitle>
                <button
                    onClick={fetchDisclosures}
                    className="text-xs text-blue-500 hover:underline"
                    disabled={loading}
                >
                    {loading ? '更新中...' : '更新'}
                </button>
            </CardHeader>
            <CardContent>
                {disclosures.length > 0 ? (
                    <div className="space-y-3">
                        {disclosures.map((doc) => (
                            <div key={doc.docID} className="flex justify-between items-start border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                                <div>
                                    <h4 className="font-semibold text-sm text-slate-800">{doc.filerName}</h4>
                                    <p className="text-xs text-slate-500 mt-1">{doc.docDescription}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{new Date(doc.submitDateTime).toLocaleString()}</p>
                                </div>
                                <a
                                    href={`https://disclosure.edinet-fsa.go.jp/E01EW/BLMainController.jsp?uji.verb=W00Z1010initialize&uji.bean=ek.bean.EKW00Z1010Bean&TID=W00Z1010&PID=W1E63011&SESSIONKEY=99999999999999&lgKbn=2&dflg=0&iflg=0&dispKbn=1&docId=${doc.docID}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                                    title="EDINETで見る"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 text-center py-4">
                        開示情報はありません
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

import { NextResponse } from 'next/server';
import { POPULAR_STOCKS } from '@/lib/constants';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const code = searchParams.get('code');

    // API Key for EDINET (User provided: 43f1d406817e4f3285ad3c3b9202c70b)
    const API_KEY = '43f1d406817e4f3285ad3c3b9202c70b';

    if (type === 'list') {
        // Return curated list for the game
        return NextResponse.json(POPULAR_STOCKS);
    }

    if (type === 'documents' && code) {
        try {
            // Fetch recent documents for the specific code from EDINET
            // Note: EDINET documents.json returns ALL documents for a date.
            // Filtering by code efficiently requires more complex logic or multiple requests.
            // For this prototype, we'll fetch the last 30 days logic or just the latest list
            // But EDINET API doesn't support filtering by code in documents.json directly.
            // We would have to filter the result.

            const date = new Date();
            // Simple fetch for today's documents to show "Market Activity"
            const dateStr = date.toISOString().split('T')[0];

            const url = `https://disclosure.edinet-fsa.go.jp/api/v2/documents.json?date=${dateStr}&type=2&Subscription-Key=${API_KEY}`;

            const res = await fetch(url);
            const data = await res.json();

            return NextResponse.json(data);
        } catch (error) {
            console.error("EDINET Fetch Error:", error);
            return NextResponse.json({ error: 'Failed to fetch from EDINET' }, { status: 500 });
        }
    }

    return NextResponse.json(POPULAR_STOCKS);
}

import { NextRequest, NextResponse } from 'next/server';
import { getDocumentsForDate, EdinetDocument } from '@/lib/api/edinet';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const codesParam = searchParams.get('codes');

    try {
        // Try today first
        let date = new Date();
        // If it's weekend, maybe go back to Friday? 
        // For simplicity, let's just try today. 
        // In production, we'd check previous business day if today is empty/weekend.

        // Actually, let's fetch last 3 days to be sure we have something to show
        // Parallel fetch? 
        // Limit to 2 days to avoid rate limits or latency.

        const datesToFetch = [0, 1, 2].map(daysAgo => {
            const d = new Date();
            d.setDate(d.getDate() - daysAgo);
            return d;
        });

        const results = await Promise.all(datesToFetch.map(d => getDocumentsForDate(d)));
        const allDocs = results.flat();

        if (!codesParam) {
            // Return top 20 recent docs if no codes specified
            return NextResponse.json(allDocs.slice(0, 20));
        }

        const codes = codesParam.split(',').map(c => c.trim());

        // Filter docs where secCode matches one of our codes (loose match because EDINET secCode might be 5 digit (4+check) or just 4)
        // Yahoo uses 4 digit. EDINET API 'secCode' field usually format is "12340" (5 digits)
        // So we check if doc.secCode startsFor with our code.

        const filtered = allDocs.filter(doc => {
            if (!doc.secCode) return false;
            return codes.some(c => doc.secCode!.startsWith(c));
        });

        return NextResponse.json(filtered);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

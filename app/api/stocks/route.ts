import { NextRequest, NextResponse } from 'next/server';
import { getStockPrice } from '@/lib/api/stock-price';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Stock code is required' }, { status: 400 });
    }

    try {
        const priceData = await getStockPrice(code);

        // In a real scenario, we might also fetch EDINET data here if relevant,
        // but for "Real-time Stock Price", Yahoo is the primary source.
        // We can add a "latestDisclosure" field if we want to combine them later.

        if (!priceData) {
            return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
        }

        return NextResponse.json(priceData);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

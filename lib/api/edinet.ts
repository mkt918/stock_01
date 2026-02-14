import axios from 'axios';

const EDINET_API_KEY = process.env.EDINET_API_KEY || '43f1d406817e4f3285ad3c3b9202c70b';
const EDINET_API_BASE_URL = 'https://api.edinet-fsa.go.jp/api/v2';

export interface EdinetDocument {
    docID: string;
    filerName: string;
    docDescription: string;
    submitDateTime: string;
    secCode?: string;
}

export async function getDocumentsForDate(date: Date): Promise<EdinetDocument[]> {
    try {
        const dateString = date.toISOString().split('T')[0];

        const response = await axios.get(`${EDINET_API_BASE_URL}/documents.json`, {
            params: {
                date: dateString,
                type: 2,
                Subscription: 1
            },
            headers: {
                'Ocp-Apim-Subscription-Key': EDINET_API_KEY
            }
        });

        if (response.data && response.data.results) {
            return response.data.results.map((doc: any) => ({
                docID: doc.docID,
                filerName: doc.filerName,
                docDescription: doc.docDescription,
                submitDateTime: doc.submitDateTime,
                secCode: doc.secCode
            }));
        }
        return [];
    } catch (error) {
        console.error('EDINET API Error:', error);
        return [];
    }
}

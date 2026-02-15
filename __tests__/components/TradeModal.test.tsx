import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { TradeModal } from '../../components/Market/TradeModal';
import { Stock } from '../../lib/types';

// Zustand store をモック
vi.mock('../../lib/store', () => ({
    useGameStore: vi.fn(() => ({
        cash: 10000000,
        holdings: [],
        buyStock: vi.fn(),
        sellStock: vi.fn(),
    })),
}));

// simulation をモック（一定価格を返す）
vi.mock('../../lib/simulation', () => ({
    simulatePrice: vi.fn(() => ({
        price: 3770,
        change: 0,
        changePercent: 0,
    })),
}));

// toast をモック
vi.mock('../../hooks/useToast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn(),
    },
}));

const mockStock: Stock = {
    code: '7203',
    name: 'トヨタ自動車',
    price: 3770,
    basePrice: 3770,
};

describe('TradeModal', () => {
    const onClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('isOpen=false のとき何もレンダリングしない', () => {
        const { container } = render(
            <TradeModal stock={mockStock} isOpen={false} onClose={onClose} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('isOpen=true のとき銘柄名が表示される', () => {
        render(<TradeModal stock={mockStock} isOpen={true} onClose={onClose} />);
        expect(screen.getByText('トヨタ自動車')).toBeInTheDocument();
    });

    it('理由が 5 文字未満のとき送信ボタンが disabled', () => {
        render(<TradeModal stock={mockStock} isOpen={true} onClose={onClose} />);
        const button = screen.getByRole('button', { name: /理由を入力してください/ });
        expect(button).toBeDisabled();
    });

    it('理由が 5 文字以上になると送信ボタンが有効になる', async () => {
        render(<TradeModal stock={mockStock} isOpen={true} onClose={onClose} />);

        // fetchPrice の非同期処理（300ms の遅延）が完了するまで待機
        await waitFor(() => {
            expect(screen.queryByText('...')).not.toBeInTheDocument();
        }, { timeout: 1000 });

        const textarea = screen.getByPlaceholderText(/長期的な上昇トレンドと判断/);
        await act(async () => {
            fireEvent.change(textarea, { target: { value: '長期保有のため購入' } });
        });

        const button = screen.getByRole('button', { name: /注文を確定する/ });
        expect(button).not.toBeDisabled();
    });

    it('X ボタンクリックで onClose が呼ばれる', () => {
        render(<TradeModal stock={mockStock} isOpen={true} onClose={onClose} />);
        const closeButton = screen.getAllByRole('button').find(
            btn => btn.querySelector('svg') && !btn.textContent?.includes('BUY')
        );
        if (closeButton) fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalled();
    });

    it('購入/売却モード切り替えボタンが表示される', () => {
        render(<TradeModal stock={mockStock} isOpen={true} onClose={onClose} />);
        expect(screen.getByText('購入 (BUY)')).toBeInTheDocument();
        expect(screen.getByText('売却 (SELL)')).toBeInTheDocument();
    });

    it('現金残高が表示される', () => {
        render(<TradeModal stock={mockStock} isOpen={true} onClose={onClose} />);
        expect(screen.getByText('¥10,000,000')).toBeInTheDocument();
    });
});

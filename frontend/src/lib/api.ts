const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function fetchInsuranceFundBalance(): Promise<number> {
    try {
        const response = await fetch(`${API_BASE_URL}/insurance/balance`);
        const data = await response.json();
        return data.balance || 0;
    } catch (error) {
        console.error('Failed to fetch insurance fund balance:', error);
        return 0;
    }
}

export async function fetchPendingLiquidations(): Promise<any[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/liquidations/pending`);
        const data = await response.json();
        return data.positions || [];
    } catch (error) {
        console.error('Failed to fetch pending liquidations:', error);
        return [];
    }
}

export async function fetchSystemStats(): Promise<any> {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch system stats:', error);
        return {
            total_liquidations: 0,
            total_volume: 0,
            active_positions: 0,
            insurance_fund_balance: 0
        };
    }
}

export async function fetchRecentLiquidations(limit: number = 10): Promise<any[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/liquidations/recent?limit=${limit}`);
        const data = await response.json();
        return data.liquidations || [];
    } catch (error) {
        console.error('Failed to fetch recent liquidations:', error);
        return [];
    }
}

// WebSocket connection for real-time updates
export function connectWebSocket(onMessage: (data: any) => void): WebSocket | null {
    try {
        const ws = new WebSocket('ws://localhost:8080/ws');

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
        };

        return ws;
    } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        return null;
    }
}

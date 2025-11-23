"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { TrendingMarkets } from "@/components/TrendingMarkets";
import { TrendingUp } from "lucide-react";

export default function MarketsPage() {
    const allMarkets = [
        { symbol: "SOL/USD", name: "Solana", price: "$9.23", change: 12.5, volume: "$2.1M" },
        { symbol: "BTC/USD", name: "Bitcoin", price: "$43,210", change: -2.3, volume: "$8.4M" },
        { symbol: "ETH/USD", name: "Ethereum", price: "$2,456", change: 5.7, volume: "$5.2M" },
        { symbol: "AVAX/USD", name: "Avalanche", price: "$28.90", change: 8.2, volume: "$1.8M" },
        { symbol: "MATIC/USD", name: "Polygon", price: "$0.82", change: -1.4, volume: "$980K" },
        { symbol: "ARB/USD", name: "Arbitrum", price: "$1.23", change: 3.6, volume: "$1.2M" },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Markets</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Available trading pairs and market data
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TrendingMarkets tokens={allMarkets} />

                    <div className="glass-card p-6">
                        <h3 className="text-sm font-bold mb-4">Market Stats</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-zinc-500">24h Volume</span>
                                <span className="font-semibold">$19.68M</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-zinc-500">Active Markets</span>
                                <span className="font-semibold">{allMarkets.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-zinc-500">Avg Spread</span>
                                <span className="font-semibold">0.05%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

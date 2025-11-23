"use client";

import { Trophy, Medal } from "lucide-react";

const liquidators = [
    { rank: 1, address: "7xK9...mP2a", profit: "₹45.2L", count: 142 },
    { rank: 2, address: "9jL2...kL9x", profit: "₹28.5L", count: 89 },
    { rank: 3, address: "3mN5...pQ1z", profit: "₹12.1L", count: 45 },
];

export const Leaderboard = () => {
    return (
        <div className="glass-card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-zinc-300 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    Top Liquidators
                </h3>
            </div>
            <div className="space-y-3">
                {liquidators.map((l) => (
                    <div key={l.rank} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`
                                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                ${l.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                                    l.rank === 2 ? 'bg-zinc-400/20 text-zinc-300' :
                                        'bg-orange-700/20 text-orange-400'}
                            `}>
                                {l.rank}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">{l.address}</p>
                                <p className="text-xs text-zinc-500">{l.count} liquidations</p>
                            </div>
                        </div>
                        <span className="text-sm font-bold text-emerald-400">{l.profit}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

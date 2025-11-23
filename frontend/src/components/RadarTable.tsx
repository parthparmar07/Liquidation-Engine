"use client";

import { motion } from "framer-motion";

interface Position {
    market: string;
    userId: string;
    healthFactor: number;
    collateral: string;
    liquidationPrice: string;
    icon?: string;
}

interface RadarTableProps {
    positions: Position[];
}

export const RadarTable = ({ positions }: RadarTableProps) => {
    const getHealthColor = (health: number) => {
        if (health < 1.1) return "text-red-400";
        if (health < 1.3) return "text-orange-400";
        return "text-emerald-400";
    };

    const getHealthBarColor = (health: number) => {
        if (health < 1.1) return "bg-red-500";
        if (health < 1.3) return "bg-orange-500";
        return "bg-emerald-500";
    };

    const getTokenColor = (market: string) => {
        const token = market.split('/')[0];
        const colors: Record<string, string> = {
            'SOL': 'from-purple-500 to-purple-600',
            'BTC': 'from-orange-500 to-orange-600',
            'ETH': 'from-blue-500 to-blue-600',
            'AVAX': 'from-red-500 to-red-600',
        };
        return colors[token] || 'from-gray-500 to-gray-600';
    };

    return (
        <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/[0.04]">
                            <th className="px-5 py-3 text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                                Market
                            </th>
                            <th className="px-5 py-3 text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-5 py-3 text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                                Health Factor
                            </th>
                            <th className="px-5 py-3 text-right text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                                Collateral
                            </th>
                            <th className="px-5 py-3 text-right text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                                Liq. Price
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                        {positions.map((position, index) => (
                            <motion.tr
                                key={index}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.03 }}
                                className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                            >
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${getTokenColor(position.market)} flex items-center justify-center text-[10px] font-bold text-white shadow-lg`}>
                                            {position.market.split('/')[0].slice(0, 3)}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm">{position.market}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5">
                                    <span className="text-xs text-zinc-400 font-mono">{position.userId}</span>
                                </td>
                                <td className="px-5 py-3.5">
                                    <div className="space-y-1.5">
                                        <span className={`text-sm font-bold ${getHealthColor(position.healthFactor)}`}>
                                            {position.healthFactor.toFixed(2)}
                                        </span>
                                        <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(position.healthFactor * 50, 100)}%` }}
                                                transition={{ duration: 0.6, delay: index * 0.03 }}
                                                className={`h-full ${getHealthBarColor(position.healthFactor)}`}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                    <span className="font-semibold text-sm">{position.collateral}</span>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                    <span className="text-xs text-zinc-500">{position.liquidationPrice}</span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

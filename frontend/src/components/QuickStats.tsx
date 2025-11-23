"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface QuickStat {
    label: string;
    value: string;
    change: number;
    period: string;
}

interface QuickStatsProps {
    stats: QuickStat[];
}

export const QuickStats = ({ stats }: QuickStatsProps) => {
    return (
        <div className="glass-card p-5">
            <h3 className="text-sm font-bold mb-4">24h Activity</h3>

            <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
                        <div className="text-[10px] text-zinc-500 mb-1">{stat.label}</div>
                        <div className="text-lg font-bold mb-0.5">{stat.value}</div>
                        <div className={`text-[10px] font-medium flex items-center gap-0.5 ${stat.change >= 0 ? "text-emerald-400" : "text-red-400"
                            }`}>
                            {stat.change >= 0 ? (
                                <ArrowUpRight className="h-2.5 w-2.5" />
                            ) : (
                                <ArrowDownRight className="h-2.5 w-2.5" />
                            )}
                            {Math.abs(stat.change)}% {stat.period}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

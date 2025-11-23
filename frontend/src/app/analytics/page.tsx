"use client";

import { useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { BarChart3, TrendingUp, Activity, DollarSign } from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { VolumeChart } from "@/components/Charts/VolumeChart";
import { HealthDistributionChart } from "@/components/Charts/HealthDistributionChart";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function AnalyticsPage() {
    const analyticsData = {
        liquidations24h: 47,
        volume24h: 1042000000, // ₹104.2 Cr
        avgHealthFactor: 1.24,
        totalFees: 2620000, // ₹26.2 Lakhs
    };

    const recentLiquidations = [
        { time: "14:23", market: "SOL/USD", amount: "₹7,07,280", health: "0.98" },
        { time: "13:45", market: "BTC/USD", amount: "₹43,76,400", health: "0.95" },
        { time: "12:18", market: "ETH/USD", amount: "₹16,29,600", health: "0.92" },
        { time: "11:52", market: "SOL/USD", amount: "₹18,56,400", health: "0.89" },
        { time: "10:34", market: "AVAX/USD", amount: "₹13,10,400", health: "0.94" },
    ];

    useEffect(() => {
        // Demo notification
        toast.success("Analytics data updated", {
            description: "Real-time market data synchronized.",
            duration: 3000,
        });
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <DashboardLayout>
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-6"
            >
                <motion.div variants={item}>
                    <h1 className="text-3xl font-bold">Analytics</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Performance metrics and historical data
                    </p>
                </motion.div>

                {/* KPIs */}
                <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KpiCard
                        title="24h Liquidations"
                        value={analyticsData.liquidations24h.toString()}
                        subtitle="+12.5% from yesterday"
                        icon={Activity}
                        iconColor="bg-purple-500/10 text-purple-400"
                        trend="up"
                    />
                    <KpiCard
                        title="24h Volume"
                        value={`₹${(analyticsData.volume24h / 10000000).toFixed(1)}Cr`}
                        subtitle="+8.3% from yesterday"
                        icon={DollarSign}
                        iconColor="bg-emerald-500/10 text-emerald-400"
                        trend="up"
                    />
                    <KpiCard
                        title="Avg Health Factor"
                        value={analyticsData.avgHealthFactor.toFixed(2)}
                        subtitle="-3.2% from yesterday"
                        icon={TrendingUp}
                        iconColor="bg-orange-500/10 text-orange-400"
                        trend="down"
                    />
                    <KpiCard
                        title="Total Fees"
                        value={`₹${(analyticsData.totalFees / 100000).toFixed(1)}L`}
                        subtitle="+15.7% from yesterday"
                        icon={BarChart3}
                        iconColor="bg-cyan-500/10 text-cyan-400"
                        trend="up"
                    />
                </motion.div>

                {/* Charts */}
                <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-card p-6">
                        <h3 className="text-sm font-bold mb-4">Liquidation Volume (7 Days)</h3>
                        <VolumeChart />
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-sm font-bold mb-4">Health Factor Distribution</h3>
                        <HealthDistributionChart />
                    </div>
                </motion.div>

                {/* Recent Liquidations */}
                <motion.div variants={item} className="glass-card p-6">
                    <h3 className="text-lg font-bold mb-4">Recent Liquidations</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/[0.06]">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Time</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Market</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase">Amount</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase">Health</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {recentLiquidations.map((liq, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3 text-sm text-zinc-400">{liq.time}</td>
                                        <td className="px-4 py-3 text-sm font-medium">{liq.market}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-right">{liq.amount}</td>
                                        <td className="px-4 py-3 text-sm text-red-400 text-right">{liq.health}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </motion.div>
        </DashboardLayout>
    );
}

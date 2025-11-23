"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { mockInsuranceFund } from "@/lib/mockData";
import { Shield, TrendingUp, DollarSign, Activity } from "lucide-react";
import { KpiCard } from "@/components/KpiCard";

export default function InsurancePage() {
    const { balance, totalCovered, utilizationRatio } = mockInsuranceFund;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Insurance Fund</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Protects the protocol from bad debt and ensures solvency
                    </p>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KpiCard
                        title="Current Balance"
                        value={`$${(balance / 1000000).toFixed(2)}M`}
                        subtitle={balance > 0 ? "Solvent" : "Empty"}
                        icon={Shield}
                        iconColor="bg-emerald-500/10 text-emerald-400"
                        trend="up"
                    />
                    <KpiCard
                        title="Total Covered"
                        value={`$${(totalCovered / 1000).toFixed(0)}K`}
                        subtitle="Bad debt paid"
                        icon={DollarSign}
                        iconColor="bg-blue-500/10 text-blue-400"
                        trend="neutral"
                    />
                    <KpiCard
                        title="Utilization"
                        value={`${utilizationRatio}%`}
                        subtitle="Of total fund"
                        icon={TrendingUp}
                        iconColor="bg-purple-500/10 text-purple-400"
                        trend="up"
                    />
                </div>

                {/* Details */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold mb-4">Fund Details</h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                            <span className="text-sm text-zinc-400">Fund Address</span>
                            <code className="text-xs font-mono bg-white/5 px-2 py-1 rounded">
                                9K3sRRPZRxfP8ECxkW7mPZ3GiMLbW1PWU2HuBn8seCHS
                            </code>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                            <span className="text-sm text-zinc-400">Status</span>
                            <span className="flex items-center gap-2 text-emerald-400">
                                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                Active
                            </span>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                            <span className="text-sm text-zinc-400">Total Bad Debt Covered</span>
                            <span className="font-semibold">${(totalCovered / 1000).toFixed(0)}K</span>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                            <span className="text-sm text-zinc-400">Liquidations Processed</span>
                            <span className="font-semibold">47</span>
                        </div>

                        <div className="flex items-center justify-between py-3">
                            <span className="text-sm text-zinc-400">Coverage Ratio</span>
                            <span className="font-semibold text-emerald-400">368%</span>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="glass-card p-6 border-l-4 border-purple-500">
                    <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-purple-400 mt-0.5" />
                        <div>
                            <h4 className="font-semibold mb-1">How the Insurance Fund Works</h4>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                The insurance fund acts as a safety net for the protocol. When a position is liquidated
                                and results in bad debt (negative equity), the insurance fund covers the shortfall to
                                ensure the protocol remains solvent and other users are protected.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

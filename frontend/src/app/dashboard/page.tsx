"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { KpiCard } from "@/components/KpiCard";
import { RadarTable } from "@/components/RadarTable";
import { EventFeed } from "@/components/EventFeed";
import { TrendingMarkets } from "@/components/TrendingMarkets";
import { QuickStats } from "@/components/QuickStats";
import { Shield, Activity, AlertTriangle, DollarSign, ArrowUpRight } from "lucide-react";
import { mockPositions, mockEvents, mockTrendingTokens, mockInsuranceFund, mockSystemStatus } from "@/lib/mockData";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { TVLChart } from "@/components/Charts/TVLChart";
import { SystemLog } from "@/components/SystemLog";
import { Leaderboard } from "@/components/Leaderboard";

export default function Dashboard() {
  // Using mock data for demonstration
  const positions = mockPositions;
  const positionsLoading = false;
  const insuranceFundBalance = mockInsuranceFund.balance;
  const systemStatus = mockSystemStatus;

  // Calculate KPIs from real data
  const kpis = useMemo(() => {
    const atRiskPositions = positions.filter(p => p.healthFactor < 1.3).length;
    const totalCollateral = positions.reduce((sum, p) => {
      const value = parseFloat(p.collateral.replace(/[₹,]/g, ''));
      return sum + value;
    }, 0);

    return [
      {
        title: "Insurance Fund",
        value: `₹${(insuranceFundBalance / 10000000).toFixed(2)}Cr`,
        subtitle: insuranceFundBalance > 0 ? "Solvent" : "Empty",
        icon: Shield,
        iconColor: "bg-emerald-500/10 text-emerald-400",
        trend: "up" as const,
      },
      {
        title: "Active Positions",
        value: positionsLoading ? "..." : positions.length.toString(),
        subtitle: "Live on-chain",
        icon: Activity,
        iconColor: "bg-purple-500/10 text-purple-400",
        trend: "neutral" as const,
      },
      {
        title: "At Risk",
        value: positionsLoading ? "..." : atRiskPositions.toString(),
        subtitle: "Health < 1.3",
        icon: AlertTriangle,
        iconColor: "bg-red-500/10 text-red-400",
        trend: "down" as const,
      },
      {
        title: "Total Collateral",
        value: positionsLoading ? "..." : `₹${(totalCollateral / 10000000).toFixed(2)}Cr`,
        subtitle: "Locked value",
        icon: DollarSign,
        iconColor: "bg-cyan-500/10 text-cyan-400",
        trend: "up" as const,
      },
    ];
  }, [positions, insuranceFundBalance]);

  // Use imported mock data
  const events = mockEvents;
  const trendingTokens = mockTrendingTokens;

  const quickStats = useMemo(() => {
    const avgHealth = positions.length > 0
      ? positions.reduce((sum, p) => sum + p.healthFactor, 0) / positions.length
      : 0;

    return [
      { label: "Liquidations", value: "0", change: 0, period: "24h" },
      { label: "Total Positions", value: positions.length.toString(), change: 5.1, period: "24h" },
      { label: "Avg Health", value: avgHealth.toFixed(2), change: -3.2, period: "24h" },
      { label: "At Risk", value: positions.filter(p => p.healthFactor < 1.3).length.toString(), change: 12.5, period: "24h" },
    ];
  }, [positions]);

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
        {/* Welcome Banner */}
        <motion.div variants={item} className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-white/10 p-8">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Trader</span>
              </h1>
              <p className="text-zinc-400 max-w-xl">
                Monitor your liquidation risks and manage positions in real-time with our advanced engine.
              </p>
            </div>
            <div className="hidden md:block">
              <button className="px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2">
                View Analytics <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* KPIs Grid */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, index) => (
            <KpiCard key={index} {...kpi} />
          ))}
        </motion.div>

        {/* Secondary widgets */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <QuickStats stats={quickStats} />
          </div>
          <div className="lg:col-span-1">
            <div className="glass-card p-5 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-sm font-bold text-zinc-400">System TVL</h3>
                  <p className="text-2xl font-bold text-white">₹45.3Cr</p>
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                  +2.4%
                </span>
              </div>
              <TVLChart />
              <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-xs text-zinc-500">
                <span>System Status</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Operational
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Liquidation Radar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-400" />
                  Liquidation Radar
                  {positionsLoading && <span className="text-sm text-zinc-500 ml-2">(Loading...)</span>}
                </h2>
                <button className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors flex items-center gap-1 bg-purple-500/10 px-3 py-1.5 rounded-lg hover:bg-purple-500/20">
                  Refresh Data
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              {positionsLoading ? (
                <div className="glass-card p-12 text-center text-zinc-500">
                  Loading positions from blockchain...
                </div>
              ) : positions.length === 0 ? (
                <div className="glass-card p-12 text-center text-zinc-500">
                  No active positions found. Create a position using the test script.
                </div>
              ) : (
                <RadarTable positions={positions} />
              )}
            </div>

            {/* Bottom Widgets Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SystemLog />
              <Leaderboard />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <TrendingMarkets tokens={trendingTokens} />
            <EventFeed events={events} />
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}

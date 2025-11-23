"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { RadarTable } from "@/components/RadarTable";
import { mockPositions } from "@/lib/mockData";
import { Filter, Download } from "lucide-react";

export default function PositionsPage() {
    const positions = mockPositions;
    const loading = false;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">All Positions</h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            {loading ? "Loading..." : `${positions.length} active positions`}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="glass-card glass-card-hover px-4 py-2 text-sm font-medium flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filter
                        </button>
                        <button className="glass-card glass-card-hover px-4 py-2 text-sm font-medium flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass-card p-4">
                        <div className="text-xs text-zinc-500 mb-1">Total Positions</div>
                        <div className="text-2xl font-bold">{positions.length}</div>
                    </div>
                    <div className="glass-card p-4">
                        <div className="text-xs text-zinc-500 mb-1">At Risk</div>
                        <div className="text-2xl font-bold text-red-400">
                            {positions.filter(p => p.healthFactor < 1.3).length}
                        </div>
                    </div>
                    <div className="glass-card p-4">
                        <div className="text-xs text-zinc-500 mb-1">Healthy</div>
                        <div className="text-2xl font-bold text-emerald-400">
                            {positions.filter(p => p.healthFactor >= 1.5).length}
                        </div>
                    </div>
                    <div className="glass-card p-4">
                        <div className="text-xs text-zinc-500 mb-1">Avg Health</div>
                        <div className="text-2xl font-bold">
                            {positions.length > 0
                                ? (positions.reduce((sum, p) => sum + p.healthFactor, 0) / positions.length).toFixed(2)
                                : "0.00"}
                        </div>
                    </div>
                </div>

                {/* Positions Table */}
                <RadarTable positions={positions} />
            </div>
        </DashboardLayout>
    );
}

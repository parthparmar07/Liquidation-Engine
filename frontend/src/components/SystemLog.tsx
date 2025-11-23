"use client";

import { ScrollText, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

const logs = [
    { id: 1, type: "success", message: "Oracle price update: SOL/USD ₹1,845", time: "2s ago" },
    { id: 2, type: "info", message: "Scanning 8 active positions...", time: "5s ago" },
    { id: 3, type: "success", message: "Insurance Fund check passed", time: "12s ago" },
    { id: 4, type: "warning", message: "High volatility detected in BTC market", time: "45s ago" },
    { id: 5, type: "success", message: "Block 245,123 processed", time: "1m ago" },
];

export const SystemLog = () => {
    return (
        <div className="glass-card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-zinc-300 flex items-center gap-2">
                    <ScrollText className="h-4 w-4 text-cyan-400" />
                    System Activity
                </h3>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="space-y-4">
                {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm">
                        <div className="mt-0.5">
                            {log.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                            {log.type === "warning" && <AlertCircle className="h-4 w-4 text-orange-400" />}
                            {log.type === "info" && <RefreshCw className="h-4 w-4 text-blue-400" />}
                        </div>
                        <div className="flex-1">
                            <p className="text-zinc-300">{log.message}</p>
                            <p className="text-xs text-zinc-600 font-mono mt-0.5">{log.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

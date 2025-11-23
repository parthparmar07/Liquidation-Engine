"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, TrendingDown } from "lucide-react";

interface Event {
    type: "liquidation" | "warning" | "risk_change";
    timestamp: string;
    market: string;
    amount: string;
    liquidator?: string;
}

interface EventFeedProps {
    events: Event[];
}

export const EventFeed = ({ events }: EventFeedProps) => {
    const getEventIcon = (type: string) => {
        switch (type) {
            case "liquidation":
                return <CheckCircle2 className="h-3.5 w-3.5" />;
            case "warning":
                return <AlertTriangle className="h-3.5 w-3.5" />;
            case "risk_change":
                return <TrendingDown className="h-3.5 w-3.5" />;
            default:
                return null;
        }
    };

    const getEventLabel = (type: string) => {
        switch (type) {
            case "liquidation":
                return "Liquidation";
            case "warning":
                return "Warning";
            case "risk_change":
                return "Risk Level Changed";
            default:
                return type;
        }
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case "liquidation":
                return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "warning":
                return "bg-orange-500/10 text-orange-400 border-orange-500/20";
            case "risk_change":
                return "bg-red-500/10 text-red-400 border-red-500/20";
            default:
                return "bg-white/5 text-white border-white/10";
        }
    };

    return (
        <div className="glass-card p-5 h-[600px] overflow-y-auto custom-scrollbar">
            <h3 className="text-base font-bold mb-5">Recent Events</h3>
            <div className="space-y-3">
                {events.map((event, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="group hover:bg-white/[0.02] -mx-2 px-2 py-2 rounded-lg transition-colors"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 ${getEventColor(event.type)}`}>
                                    {getEventIcon(event.type)}
                                    {getEventLabel(event.type)}
                                </span>
                                <span className="text-[10px] text-zinc-600">{event.timestamp}</span>
                            </div>

                            <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-2.5 space-y-1">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-zinc-500">Market</span>
                                    <span className="font-semibold">{event.market}</span>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-zinc-500">Amount</span>
                                    <span className="font-semibold">{event.amount}</span>
                                </div>
                                {event.liquidator && (
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-zinc-500">Liquidator</span>
                                        <span className="font-mono text-purple-400 text-[10px]">{event.liquidator}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

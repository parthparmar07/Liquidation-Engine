"use client";

import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface KpiCardProps {
    title: string;
    value: string;
    subtitle: string;
    icon: LucideIcon;
    iconColor: string;
    trend?: "up" | "down" | "neutral";
}

export const KpiCard = ({ title, value, subtitle, icon: Icon, iconColor, trend = "neutral" }: KpiCardProps) => {
    const trendColors = {
        up: "text-emerald-400",
        down: "text-red-400",
        neutral: "text-zinc-500"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-card glass-card-hover p-5"
        >
            <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{title}</p>
                <div className={`rounded-lg p-1.5 ${iconColor}`}>
                    <Icon className="h-3.5 w-3.5" />
                </div>
            </div>

            <div className="space-y-0.5">
                <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                <p className={`text-xs font-medium ${trendColors[trend]}`}>
                    {subtitle}
                </p>
            </div>
        </motion.div>
    );
};

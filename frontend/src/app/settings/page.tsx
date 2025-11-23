"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { Save, Bell, Shield, Globe, Terminal, Moon, Volume2 } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
    const [notifications, setNotifications] = useState(true);
    const [sound, setSound] = useState(true);
    const [rpcEndpoint, setRpcEndpoint] = useState("https://api.devnet.solana.com");

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
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
                className="max-w-4xl mx-auto space-y-8"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                    <p className="text-zinc-400">Manage your preferences and system configuration.</p>
                </div>

                {/* General Settings */}
                <motion.div variants={item} className="glass-card p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                        <Globe className="h-5 w-5 text-purple-400" />
                        <h2 className="text-lg font-semibold">General</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Display Currency</label>
                            <select className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-purple-500/50 focus:outline-none transition-colors">
                                <option value="INR">INR (₹)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Theme</label>
                            <div className="flex items-center justify-between bg-black/20 border border-white/10 rounded-xl px-4 py-2.5">
                                <span className="flex items-center gap-2 text-sm">
                                    <Moon className="h-4 w-4" /> Dark Mode
                                </span>
                                <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Notifications */}
                <motion.div variants={item} className="glass-card p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                        <Bell className="h-5 w-5 text-cyan-400" />
                        <h2 className="text-lg font-semibold">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${notifications ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                    <Bell className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-white">Push Notifications</h3>
                                    <p className="text-xs text-zinc-500">Get alerts for liquidation risks</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setNotifications(!notifications)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-purple-600' : 'bg-zinc-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${sound ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                    <Volume2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-white">Sound Effects</h3>
                                    <p className="text-xs text-zinc-500">Play sounds on execution</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSound(!sound)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${sound ? 'bg-cyan-600' : 'bg-zinc-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${sound ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Developer Settings */}
                <motion.div variants={item} className="glass-card p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                        <Terminal className="h-5 w-5 text-emerald-400" />
                        <h2 className="text-lg font-semibold">Developer</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">RPC Endpoint</label>
                            <input
                                type="text"
                                value={rpcEndpoint}
                                onChange={(e) => setRpcEndpoint(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-emerald-500/50 focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-400">Version</span>
                            <span className="text-sm font-mono text-zinc-500">v1.0.2-beta</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={item} className="flex justify-end gap-4">
                    <button className="px-6 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                        Reset Defaults
                    </button>
                    <button className="btn-primary flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Changes
                    </button>
                </motion.div>
            </motion.div>
        </DashboardLayout>
    );
}

"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Activity, ShieldCheck, BarChart3 } from "lucide-react";

export const Header = () => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0b1e]/80 backdrop-blur-md">
            <div className="container mx-auto flex h-20 items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-blue-500">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white">
                            Liquidation<span className="text-blue-500">Engine</span>
                        </h1>
                        <p className="text-xs text-gray-400">Enterprise Risk Management</p>
                    </div>
                </div>

                <nav className="hidden md:flex items-center gap-8">
                    <a href="#" className="flex items-center gap-2 text-sm font-medium text-white hover:text-blue-400 transition-colors">
                        <BarChart3 size={18} />
                        Dashboard
                    </a>
                    <a href="#" className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        <Activity size={18} />
                        Live Feed
                    </a>
                </nav>

                <div className="flex items-center gap-4">
                    {/* Wallet Button Styled to match theme */}
                    <div className="glass-panel rounded-lg overflow-hidden">
                        <WalletMultiButton style={{ background: 'transparent', height: '40px', fontSize: '14px' }} />
                    </div>
                </div>
            </div>
        </header>
    );
};

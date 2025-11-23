"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Shield, Menu } from "lucide-react";

interface NavbarProps {
    onMenuToggle: () => void;
}

export const Navbar = ({ onMenuToggle }: NavbarProps) => {
    return (
        <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0d0d0f]/95 backdrop-blur-xl">
            <div className="mx-auto max-w-[1400px] px-6">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-xl">
                            <img
                                src="/logo.png"
                                alt="Liquidation Engine"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <span className="text-xl font-bold tracking-tight">
                            Liquidation<span className="text-purple-400">Engine</span>
                        </span>
                    </div>

                    {/* Search Bar - Zapper style */}
                    <div className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search positions, markets..."
                                className="w-full h-10 px-4 pr-10 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                            />
                            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-zinc-500 bg-white/[0.05] rounded border border-white/[0.06]">
                                F
                            </kbd>
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onMenuToggle}
                            className="md:hidden p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="glass-card overflow-hidden px-1 py-1">
                            <WalletMultiButton
                                style={{
                                    background: 'transparent',
                                    height: '36px',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

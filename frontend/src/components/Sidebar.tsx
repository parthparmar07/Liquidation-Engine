"use client";

import { Home, Activity, Shield, BarChart3, Settings, TrendingUp, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const pathname = usePathname();

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
        { id: "positions", label: "Positions", icon: Activity, href: "/positions" },
        { id: "insurance", label: "Insurance", icon: Shield, href: "/insurance" },
        { id: "analytics", label: "Analytics", icon: BarChart3, href: "/analytics" },
        { id: "markets", label: "Markets", icon: TrendingUp, href: "/markets" },
    ];

    const NavContent = () => (
        <>
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            onClick={onClose}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                            {isActive && (
                                <motion.div
                                    layoutId="active-nav"
                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-3 border-t border-white/[0.06]">
                <Link
                    href="/settings"
                    onClick={onClose}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-all"
                >
                    <Settings className="h-4 w-4" />
                    Settings
                </Link>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 border-r border-white/[0.06] bg-[#0d0d0f] h-[calc(100vh-64px)] sticky top-16">
                <NavContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-72 bg-[#0d0d0f] border-r border-white/[0.06] z-50 lg:hidden flex flex-col"
                        >
                            <div className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06]">
                                <span className="text-xl font-bold tracking-tight">
                                    Liquidation<span className="text-purple-400">Engine</span>
                                </span>
                                <button onClick={onClose} className="p-2 hover:bg-white/[0.05] rounded-lg">
                                    <X className="h-5 w-5 text-zinc-400" />
                                </button>
                            </div>
                            <NavContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

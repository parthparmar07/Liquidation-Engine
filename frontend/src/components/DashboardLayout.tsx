"use client";

import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

import { useState } from "react";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#0d0d0f]">
            <Navbar onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
            <div className="flex">
                <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
                <main className="flex-1 px-4 md:px-6 py-6 max-w-[1400px] w-full overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
};

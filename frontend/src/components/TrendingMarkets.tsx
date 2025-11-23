"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface TrendingToken {
    symbol: string;
    name: string;
    price: string;
    change: number;
    volume: string;
}

interface TrendingMarketsProps {
    tokens: TrendingToken[];
}

export const TrendingMarkets = ({ tokens }: TrendingMarketsProps) => {
    return (
        <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Trending Markets</h3>
                <button className="text-xs text-purple-400 hover:text-purple-300 font-semibold">
                    View More
                </button>
            </div>

            <div className="space-y-2">
                {tokens.map((token, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                                {token.symbol.slice(0, 2)}
                            </div>
                            <div>
                                <div className="text-xs font-semibold">{token.symbol}</div>
                                <div className="text-[10px] text-zinc-500">{token.name}</div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-xs font-semibold">{token.price}</div>
                            <div className={`text-[10px] font-medium flex items-center gap-0.5 justify-end ${token.change >= 0 ? "text-emerald-400" : "text-red-400"
                                }`}>
                                {token.change >= 0 ? (
                                    <TrendingUp className="h-2.5 w-2.5" />
                                ) : (
                                    <TrendingDown className="h-2.5 w-2.5" />
                                )}
                                {Math.abs(token.change)}%
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

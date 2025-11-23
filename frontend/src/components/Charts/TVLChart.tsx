"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { time: '00:00', value: 35.2 },
    { time: '04:00', value: 37.8 },
    { time: '08:00', value: 40.3 },
    { time: '12:00', value: 42.8 },
    { time: '16:00', value: 41.1 },
    { time: '20:00', value: 43.6 },
    { time: '23:59', value: 45.3 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0d0d0f] border border-white/10 p-3 rounded-lg shadow-xl">
                <p className="text-zinc-400 text-xs mb-1">{label}</p>
                <p className="text-emerald-400 font-bold text-sm">
                    ₹{payload[0].value}Cr TVL
                </p>
            </div>
        );
    }
    return null;
};

export const TVLChart = () => {
    return (
        <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorTVL" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis
                        dataKey="time"
                        hide
                    />
                    <YAxis
                        hide
                        domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorTVL)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

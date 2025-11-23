"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
    { range: '< 1.1', count: 3, color: '#ef4444' }, // Red
    { range: '1.1-1.3', count: 2, color: '#f97316' }, // Orange
    { range: '1.3-1.5', count: 1, color: '#eab308' }, // Yellow
    { range: '> 1.5', count: 2, color: '#10b981' }, // Emerald
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0d0d0f] border border-white/10 p-3 rounded-lg shadow-xl">
                <p className="text-zinc-400 text-xs mb-1">Health Factor: {label}</p>
                <p className="text-white font-bold text-sm">
                    {payload[0].value} Positions
                </p>
            </div>
        );
    }
    return null;
};

export const HealthDistributionChart = () => {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    layout="vertical"
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="range"
                        type="category"
                        stroke="#71717a"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={60}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

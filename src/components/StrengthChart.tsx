'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface StrengthChartProps {
    data: { date: string; score: number }[];
}

export default function StrengthChart({ data }: StrengthChartProps) {
    if (data.length === 0) {
        return (
            <div className="glass-card p-6 flex items-center justify-center h-64">
                <p className="text-text-muted text-sm">No strength data yet. Log some workouts!</p>
            </div>
        );
    }

    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-4">Strength Progress</h3>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                        dataKey="date"
                        stroke="#71717a"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#71717a"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            background: '#1a1a2e',
                            border: '1px solid #27272a',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '13px',
                        }}
                        labelStyle={{ color: '#a1a1aa' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="score"
                        stroke="var(--color-accent)"
                        strokeWidth={3}
                        dot={{ fill: 'var(--color-accent)', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: '#fff', stroke: 'var(--color-accent)', strokeWidth: 2 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

'use client';

interface ProgressBarProps {
    value: number;
    max?: number;
    label?: string;
    color?: string;
}

export default function ProgressBar({
    value,
    max = 100,
    label,
    color = 'bg-accent',
}: ProgressBarProps) {
    const percentage = Math.min(100, Math.round((value / max) * 100));

    return (
        <div>
            {label && (
                <div className="flex justify-between text-xs text-text-secondary mb-1">
                    <span>{label}</span>
                    <span>{percentage}%</span>
                </div>
            )}
            <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${color} transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

'use client';

import { TierInfo, PathType } from '@/types';

const pathConfig: Record<PathType, { gradient: string; border: string; glow: string; label: string; icon: string }> = {
    shred: {
        gradient: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-violet) 100%)',
        border: 'var(--color-accent-soft)',
        glow: 'var(--color-accent-glow)',
        label: 'SHRED PATH',
        icon: '⚛️',
    },
    strength: {
        gradient: 'linear-gradient(135deg, #4f8ef7 0%, #7c3aed 100%)',
        border: 'rgba(79,142,247,0.3)',
        glow: 'rgba(79,142,247,0.2)',
        label: 'STRENGTH PATH',
        icon: '💪',
    },
    hybrid: {
        gradient: 'linear-gradient(135deg, var(--color-lime) 0%, #10b981 100%)',
        border: 'var(--color-lime-soft)',
        glow: 'rgba(16, 185, 129, 0.2)',
        label: 'HYBRID PATH',
        icon: '⚡',
    },
};

interface TierCardProps {
    tierInfo: TierInfo;
    path: PathType;
    strengthScore: number;
}

export default function TierCard({ tierInfo, path, strengthScore }: TierCardProps) {
    const cfg = pathConfig[path];

    return (
        <div style={{ position: 'relative', borderRadius: '20px', padding: '1px', background: cfg.gradient }}>
            {/* Glow aura */}
            <div style={{
                position: 'absolute', inset: '-8px', borderRadius: '28px',
                background: cfg.gradient, opacity: 0.1, filter: 'blur(16px)',
                pointerEvents: 'none',
            }} />

            <div style={{
                position: 'relative', borderRadius: '19px', padding: '28px',
                background: 'linear-gradient(135deg, var(--color-bg-card) 0%, var(--color-bg-secondary) 100%)',
                overflow: 'hidden',
            }}>
                {/* Background decoration */}
                <div style={{
                    position: 'absolute', top: '-30px', right: '-30px',
                    width: '160px', height: '160px', borderRadius: '50%',
                    background: cfg.gradient, opacity: 0.07, filter: 'blur(40px)',
                    pointerEvents: 'none',
                }} />

                {/* Stripe pattern top-right corner */}
                <div className="stripe-bg" style={{
                    position: 'absolute', top: 0, right: 0,
                    width: '120px', height: '120px', opacity: 0.4,
                    borderRadius: '0 19px 0 0',
                }} />

                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', position: 'relative' }}>
                    <div>
                        <p className="label-caps" style={{ color: '#44445a', marginBottom: '6px' }}>{cfg.label}</p>
                        <h3 style={{
                            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.8rem',
                            letterSpacing: '-0.03em', color: '#f0f0f8',
                            display: 'flex', alignItems: 'center', gap: '10px',
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>{cfg.icon}</span>
                            {tierInfo.name}
                        </h3>
                    </div>

                    {/* Score badge */}
                    <div style={{
                        textAlign: 'right',
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${cfg.border}`,
                        borderRadius: '14px', padding: '10px 16px',
                    }}>
                        <p className="label-caps" style={{ marginBottom: '4px' }}>Strength Score</p>
                        <p style={{
                            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2rem',
                            letterSpacing: '-0.03em',
                            background: cfg.gradient,
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>
                            {strengthScore.toFixed(1)}
                        </p>
                    </div>
                </div>

                {/* Progress section */}
                <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.82rem', fontWeight: 600, color: '#8888a8' }}>
                            {tierInfo.name}
                        </span>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.82rem', fontWeight: 600, color: '#8888a8' }}>
                            {tierInfo.nextTier ? `→ ${tierInfo.nextTier}` : '⭐ MAX TIER'}
                        </span>
                    </div>

                    {/* Progress track */}
                    <div style={{
                        height: '8px', background: '#1e1e30', borderRadius: '99px', overflow: 'hidden',
                        position: 'relative',
                    }}>
                        <div style={{
                            height: '100%', borderRadius: '99px',
                            background: cfg.gradient,
                            width: `${tierInfo.progress}%`,
                            transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)',
                            boxShadow: `0 0 12px ${cfg.glow}`,
                            position: 'relative',
                        }}>
                            {/* Shimmer on bar */}
                            <div style={{
                                position: 'absolute', top: 0, right: 0, bottom: 0, width: '30px',
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3))',
                                borderRadius: '99px',
                            }} />
                        </div>
                    </div>

                    <p style={{
                        fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.78rem', fontWeight: 700,
                        color: '#44445a', marginTop: '6px', textAlign: 'right',
                    }}>
                        {tierInfo.progress}% to next tier
                    </p>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Profile, Workout, StrengthScore, PathType } from '@/types';
import { getBestLifts, calculateTSS, calculateBMI } from '@/lib/strength';
import { getTierInfo, getTierNames } from '@/lib/tiers';
import Navbar from '@/components/Navbar';
import TierCard from '@/components/TierCard';
import StrengthChart from '@/components/StrengthChart';

export default function StatsPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [strengthScore, setStrengthScore] = useState<StrengthScore | null>(null);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<{ date: string; score: number }[]>([]);

    const fetchData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        const userId = user.id;

        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (!profileData) { router.push('/onboarding'); return; }
        setProfile(profileData as Profile);

        const { data: workoutData } = await supabase
            .from('workouts').select('*').eq('user_id', userId)
            .order('date', { ascending: false });

        const workoutList = (workoutData || []) as Workout[];
        setWorkouts(workoutList);

        const { squat1RM, bench1RM, deadlift1RM } = getBestLifts(workoutList);
        const tss = calculateTSS(squat1RM, bench1RM, deadlift1RM, profileData.weight);
        const bmi = calculateBMI(profileData.height, profileData.weight);
        const tierInfo = getTierInfo(profileData.selected_path as PathType, tss, bmi);

        setStrengthScore({
            id: '', user_id: userId,
            total_strength_score: tss, tier_name: tierInfo.name,
            squat_1rm: squat1RM, bench_1rm: bench1RM, deadlift_1rm: deadlift1RM,
            updated_at: new Date().toISOString(),
        });

        const scoresByDate = new Map<string, { squat: number; bench: number; deadlift: number }>();
        const sortedWorkouts = [...workoutList].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        for (const w of sortedWorkouts) {
            const bests = getBestLifts(sortedWorkouts.filter(wk => wk.date <= w.date));
            scoresByDate.set(w.date, { squat: bests.squat1RM, bench: bests.bench1RM, deadlift: bests.deadlift1RM });
        }
        setChartData(Array.from(scoresByDate.entries()).map(([date, bests]) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            score: calculateTSS(bests.squat, bests.bench, bests.deadlift, profileData.weight),
        })));

        setLoading(false);
    }, [router]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
                <Navbar />
                <div className="page-max-wide" style={{ paddingTop: '32px' }}>
                    <div className="shimmer" style={{ height: '240px', borderRadius: '24px', marginBottom: '24px' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[1, 2, 3, 4].map(i => <div key={i} className="shimmer" style={{ height: '110px', borderRadius: '20px' }} />)}
                    </div>
                </div>
            </div>
        );
    }

    if (!profile || !strengthScore) return null;

    const bmi = calculateBMI(profile.height, profile.weight);
    const tierInfo = getTierInfo(profile.selected_path as PathType, strengthScore.total_strength_score, bmi);
    const allTiers = getTierNames(profile.selected_path as PathType);

    const stats = [
        { label: 'BMI', value: bmi, icon: '◎', sub: bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy' : bmi < 30 ? 'Overweight' : 'Obese' },
        { label: 'Squat 1RM', value: strengthScore.squat_1rm, icon: '↑', unit: 'kg' },
        { label: 'Bench 1RM', value: strengthScore.bench_1rm, icon: '↑', unit: 'kg' },
        { label: 'Deadlift 1RM', value: strengthScore.deadlift_1rm, icon: '↑', unit: 'kg' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
            <Navbar />

            <main className="page-max-wide animate-slide-up" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Header */}
                    <div>
                        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2.5rem', letterSpacing: '-0.04em', color: 'var(--color-text-primary)' }}>
                            Your Stats
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
                            Tracking your progression through the <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{profile.selected_path}</span> path.
                        </p>
                    </div>

                    {/* Tier Progress */}
                    <TierCard tierInfo={tierInfo} strengthScore={strengthScore.total_strength_score} path={profile.selected_path as PathType} />

                    {/* Metrics Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        {stats.map((s, i) => (
                            <div key={i} className="glass-card" style={{
                                padding: '24px', display: 'flex', flexDirection: 'column', gap: '6px',
                                position: 'relative', overflow: 'hidden'
                            }}>
                                <span style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '1.4rem', opacity: 0.1, color: 'var(--color-accent)' }}>{s.icon}</span>
                                <p className="label-caps" style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem', letterSpacing: '0.15em' }}>{s.label}</p>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2rem', color: 'var(--color-accent)' }}>{s.value}</span>
                                    {s.unit && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>{s.unit}</span>}
                                </div>
                                {s.sub && (
                                    <p style={{
                                        color: 'var(--color-text-secondary)',
                                        fontSize: '0.8rem',
                                        marginTop: '4px',
                                        padding: '4px 10px',
                                        background: 'var(--color-bg-secondary)',
                                        borderRadius: '8px',
                                        width: 'fit-content',
                                        fontWeight: 600
                                    }}>{s.sub}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Strength Chart */}
                    <div className="glass-card" style={{ padding: '28px' }}>
                        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-primary)', marginBottom: '20px', letterSpacing: '0.02em' }}>
                            Strength Progression Curve
                        </h3>
                        <StrengthChart data={chartData} />
                    </div>

                    {/* All Tiers List */}
                    <div className="glass-card" style={{ padding: '28px' }}>
                        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-primary)', marginBottom: '24px', letterSpacing: '0.02em' }}>
                            Path Milestones
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {allTiers.map((tierName, i) => {
                                const isReached = i <= tierInfo.index;
                                const isCurrent = i === tierInfo.index;
                                return (
                                    <div key={tierName} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '20px',
                                        opacity: isReached ? 1 : 0.4,
                                        transition: 'opacity 0.3s ease'
                                    }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '12px',
                                            background: isReached ? 'var(--color-accent-soft)' : 'var(--color-bg-secondary)',
                                            border: isReached ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: isReached ? 'var(--color-accent)' : 'var(--color-text-muted)',
                                            fontSize: '1rem', fontWeight: 800, flexShrink: 0,
                                            boxShadow: isCurrent ? '0 0 16px var(--color-accent-glow)' : 'none'
                                        }}>
                                            {isReached ? '✓' : i + 1}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{
                                                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.05rem',
                                                color: isReached ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                                letterSpacing: '0.01em'
                                            }}>{tierName}</p>
                                            {isCurrent && (
                                                <p style={{ color: 'var(--color-accent)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>
                                                    Current Rank
                                                </p>
                                            )}
                                        </div>
                                        {!isReached && (
                                            <div style={{ fontSize: '1.25rem', filter: 'grayscale(1)', opacity: 0.5 }}>🔒</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

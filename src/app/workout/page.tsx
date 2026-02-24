'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Workout } from '@/types';
import Navbar from '@/components/Navbar';
import WorkoutForm from '@/components/WorkoutForm';

export default function WorkoutPage() {
    const router = useRouter();
    const [userId, setUserId] = useState('');
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWorkouts = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        setUserId(user.id);

        const { data } = await supabase
            .from('workouts').select('*').eq('user_id', user.id)
            .order('date', { ascending: false }).limit(30);

        setWorkouts((data || []) as Workout[]);
        setLoading(false);
    }, [router]);

    useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
                <Navbar />
                <div className="page-max-wide" style={{ paddingTop: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[200, 120].map((h, i) => (
                            <div key={i} className="shimmer" style={{ height: `${h}px`, borderRadius: '20px' }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
            <Navbar />

            <main className="page-max-wide animate-slide-up" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Header */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                            <div style={{
                                width: '4px', height: '32px', borderRadius: '99px',
                                background: 'linear-gradient(180deg, var(--color-accent), var(--color-violet))',
                            }} />
                            <h1 style={{
                                fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2.5rem',
                                letterSpacing: '-0.04em', color: 'var(--color-text-primary)',
                            }}>
                                Log Workout
                            </h1>
                        </div>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginLeft: '20px' }}>
                            Track your manual entries and watch your strength curve climb. ⚡
                        </p>
                    </div>

                    {/* Log Form Area */}
                    <WorkoutForm userId={userId} onWorkoutLogged={fetchWorkouts} />

                    {/* History Section */}
                    <div>
                        <h3 className="label-caps" style={{
                            color: 'var(--color-text-muted)', marginBottom: '20px', letterSpacing: '0.2em',
                            display: 'flex', alignItems: 'center', gap: '12px',
                        }}>
                            <span style={{ color: 'var(--color-accent)' }}>⚛</span> RECENT ENTRIES
                        </h3>

                        {workouts.length === 0 ? (
                            <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>🏋️‍♂️</div>
                                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '1.1rem' }}>
                                    Your strength vault is empty
                                </p>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
                                    Log your first set above to start building your legacy.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {workouts.map((w, idx) => (
                                    <div key={w.id} className="glass-card" style={{
                                        padding: '18px 24px', display: 'flex', alignItems: 'center',
                                        justifyContent: 'space-between', gap: '20px',
                                        animation: 'slide-up 0.4s ease both',
                                        animationDelay: `${idx * 40}ms`,
                                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                    }}
                                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent-soft)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flex: 1 }}>
                                            {/* Muscle group indicator */}
                                            <div style={{
                                                width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                                                background: 'var(--color-accent-soft)', border: '1px solid var(--color-border)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.7rem', fontFamily: "'Space Grotesk', sans-serif",
                                                fontWeight: 800, color: 'var(--color-accent)', textAlign: 'center',
                                            }}>
                                                {w.muscle_group.slice(0, 3).toUpperCase()}
                                            </div>
                                            <div>
                                                <p style={{
                                                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
                                                    fontSize: '1.05rem', color: 'var(--color-text-primary)',
                                                }}>
                                                    {w.exercise_name}
                                                </p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                                    {w.sets} SETS • {w.reps} REPS @ {w.weight}KG
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <p style={{
                                                fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.15rem',
                                                background: 'linear-gradient(135deg, var(--color-accent), var(--color-violet))',
                                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                                            }}>
                                                {w.estimated_1rm}kg
                                            </p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
                                                {new Date(w.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

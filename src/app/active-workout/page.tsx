'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { getRestTime, getProgressionSuggestion, REP_RANGE_MIDPOINT, NEXT_REP_RANGE } from '@/lib/progression';
import { calculate1RM } from '@/lib/strength';

// ── types ─────────────────────────────────────────────────────────────
interface PlannedWorkout {
    id: string;
    day_of_week: string;
    exercise_name: string;
    muscle_group: string;
    target_sets: number;
    target_rep_range: string;
    target_weight: number;
    progression_state: 'base' | 'next';
}

interface SetLog {
    exerciseId: string;
    setIndex: number;
    reps: number;
    weight: number;
}

// ── rest timer component ───────────────────────────────────────────────
function RestTimer({ seconds, onSkip }: { seconds: number; onSkip: () => void }) {
    const [remaining, setRemaining] = useState(seconds);

    useEffect(() => {
        if (remaining <= 0) { onSkip(); return; }
        const id = setTimeout(() => setRemaining(r => r - 1), 1000);
        return () => clearTimeout(id);
    }, [remaining, onSkip]);

    const pct = (remaining / seconds) * 100;
    const r = 54;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;

    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(2, 2, 5, 0.95)', backdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px',
        }}>
            <p className="label-caps" style={{ letterSpacing: '0.2em', color: 'var(--color-text-muted)' }}>Resting Phase</p>

            <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="80" cy="80" r={r} fill="none" stroke="var(--color-bg-secondary)" strokeWidth="8" />
                    <circle cx="80" cy="80" r={r} fill="none" stroke="var(--color-accent)" strokeWidth="8"
                        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 1s linear', filter: 'drop-shadow(0 0 8px var(--color-accent-glow))' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2.5rem', color: 'var(--color-text-primary)' }}>
                        {mins}:{String(secs).padStart(2, '0')}
                    </span>
                </div>
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
                {remaining <= 30 ? '⚡ Powering up...' : remaining <= 60 ? 'Stay focused.' : 'Recovering...'}
            </p>

            <button onClick={onSkip} style={{
                background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '14px',
                color: 'var(--color-accent)', padding: '12px 32px', cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.9rem',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}>Skip Timer</button>
        </div>
    );
}

// ── main page ─────────────────────────────────────────────────────────
export default function ActiveWorkoutPage() {
    const router = useRouter();
    const [userId, setUserId] = useState('');
    const [todayDay, setTodayDay] = useState('');
    const [workoutType, setWorkoutType] = useState('');
    const [exercises, setExercises] = useState<PlannedWorkout[]>([]);
    const [loading, setLoading] = useState(true);
    const [dbError, setDbError] = useState('');

    const [completedSets, setCompletedSets] = useState<Record<string, number>>({});
    const [setLogs, setSetLogs] = useState<SetLog[]>([]);

    const [restFor, setRestFor] = useState<number | null>(null);
    const [restExerciseName, setRestExerciseName] = useState('');

    const [weightOverride, setWeightOverride] = useState<Record<string, number>>({});
    const [progressionHints, setProgressionHints] = useState<Record<string, string>>({});
    const [editMode, setEditMode] = useState(false);

    const REP_RANGES = ['2-4', '4-6', '6-8', '8-10', '10-12', '12-15', '15+'];
    const sessionDone = exercises.length > 0 && exercises.every(ex => (completedSets[ex.id] ?? 0) >= ex.target_sets);

    const removeExercise = async (id: string) => {
        await supabase.from('planned_workouts').delete().eq('id', id);
        setExercises(prev => prev.filter(e => e.id !== id));
    };

    const updateExerciseField = async (id: string, field: string, value: string | number) => {
        await supabase.from('planned_workouts').update({ [field]: value }).eq('id', id);
        setExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
    };

    const load = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        setUserId(user.id);

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = dayNames[new Date().getDay()];
        setTodayDay(today);

        const { data: profile } = await supabase.from('profiles').select('schedule').eq('id', user.id).single();
        if (profile?.schedule) {
            const raw = (profile.schedule as Record<string, any>)[today];
            const typeStr = raw && typeof raw === 'object' ? String(raw.type || raw.label || 'Workout') : String(raw ?? 'Workout');
            setWorkoutType(typeStr);
        }

        const { data: planned, error: pwErr } = await supabase
            .from('planned_workouts')
            .select('*')
            .eq('user_id', user.id)
            .eq('day_of_week', today)
            .order('created_at');

        if (pwErr) {
            setDbError(`DB error: ${pwErr.message}`);
            setLoading(false);
            return;
        }

        if (!planned || planned.length === 0) {
            setExercises([]);
            setLoading(false);
            return;
        }

        setExercises(planned as PlannedWorkout[]);
        const wOverride: Record<string, number> = {};
        planned.forEach(ex => { wOverride[ex.id] = ex.target_weight; });
        setWeightOverride(wOverride);

        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastWeekStr = lastWeek.toISOString().split('T')[0];

        const hints: Record<string, string> = {};
        for (const ex of planned as PlannedWorkout[]) {
            const { data: logs } = await supabase
                .from('workouts')
                .select('reps, sets, weight')
                .eq('user_id', user.id)
                .eq('exercise_name', ex.exercise_name)
                .gte('date', lastWeekStr)
                .order('date', { ascending: false })
                .limit(ex.target_sets);

            if (logs && logs.length > 0) {
                const totalSets = logs.length;
                const avgReps = Math.round(logs.reduce((s, l) => s + l.reps, 0) / logs.length);
                const suggestion = getProgressionSuggestion(
                    ex.target_rep_range, ex.progression_state, ex.target_weight,
                    avgReps, totalSets, ex.target_sets
                );
                if (suggestion.suggestedWeight !== ex.target_weight || suggestion.suggestedRepRange !== ex.target_rep_range) {
                    hints[ex.id] = suggestion.message;
                    if (suggestion.suggestedWeight !== ex.target_weight) {
                        wOverride[ex.id] = suggestion.suggestedWeight;
                    }
                }
            }
        }
        setProgressionHints(hints);
        setWeightOverride(wOverride);
        setLoading(false);
    }, [router]);

    useEffect(() => { load(); }, [load]);

    const completeSet = async (ex: PlannedWorkout) => {
        const done = completedSets[ex.id] ?? 0;
        if (done >= ex.target_sets) return;

        const newDone = done + 1;
        setCompletedSets(prev => ({ ...prev, [ex.id]: newDone }));

        const mid = REP_RANGE_MIDPOINT[ex.target_rep_range] ?? 8;
        const w = weightOverride[ex.id] ?? ex.target_weight;
        const est1rm = calculate1RM(w, mid);

        await supabase.from('workouts').insert({
            user_id: userId,
            muscle_group: ex.muscle_group,
            exercise_name: ex.exercise_name,
            weight: w,
            reps: mid,
            sets: 1,
            estimated_1rm: est1rm,
            date: new Date().toISOString().split('T')[0],
        });

        setSetLogs(prev => [...prev, { exerciseId: ex.id, setIndex: newDone, reps: mid, weight: w }]);
        setRestExerciseName(ex.exercise_name);
        setRestFor(getRestTime(ex.exercise_name));

        if (newDone >= ex.target_sets) {
            const suggestion = getProgressionSuggestion(ex.target_rep_range, ex.progression_state, w, mid, newDone, ex.target_sets);
            await supabase.from('planned_workouts').update({
                progression_state: suggestion.nextProgressionState,
                target_rep_range: suggestion.suggestedRepRange,
                target_weight: suggestion.suggestedWeight,
            }).eq('id', ex.id);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
                <Navbar />
                <div className="page-max-wide" style={{ paddingTop: '32px' }}>
                    {[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: '110px', borderRadius: '20px', marginBottom: '16px' }} />)}
                </div>
            </div>
        );
    }

    if (sessionDone) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', display: 'flex', flexDirection: 'column' }}>
                <Navbar />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', textAlign: 'center', gap: '32px' }}>
                    <div className="animate-float" style={{ fontSize: '5rem', filter: 'drop-shadow(0 0 20px var(--color-accent-glow))' }}>🏆</div>
                    <div>
                        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2.5rem', letterSpacing: '-0.04em', color: 'var(--color-text-primary)', marginBottom: '12px' }}>Session Complete</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', maxWidth: '340px', margin: '0 auto', lineHeight: 1.6 }}> Excellent work. {setLogs.length} sets completed. Your progression data has been synchronized. </p>
                    </div>
                    <Link href="/dashboard" className="btn-primary" style={{ padding: '16px 40px', textDecoration: 'none', fontSize: '1rem' }}> GO TO DASHBOARD </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
            <Navbar />

            {restFor !== null && (
                <RestTimer seconds={restFor} onSkip={() => setRestFor(null)} />
            )}

            <div className="page-max-wide animate-slide-up" style={{ paddingTop: '32px', paddingBottom: '60px' }}>

                {/* Header */}
                <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                        <div style={{ width: '4px', height: '32px', borderRadius: '99px', background: 'linear-gradient(180deg, var(--color-accent), var(--color-violet))' }} />
                        <div style={{ flex: 1 }}>
                            <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.04em', color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
                                {workoutType || 'Active Session'}
                            </h1>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px', letterSpacing: '0.05em', fontFamily: "'Space Grotesk', sans-serif" }}>
                                {todayDay} • {exercises.length} Exercise{exercises.length !== 1 ? 's' : ''} Scheduled
                            </p>
                        </div>
                        {exercises.length > 0 && (
                            <button
                                onClick={() => setEditMode(e => !e)}
                                style={{
                                    padding: '10px 18px', borderRadius: '14px', cursor: 'pointer',
                                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.75rem',
                                    letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                                    background: editMode ? 'var(--color-success-soft)' : 'var(--color-bg-secondary)',
                                    border: '1px solid',
                                    borderColor: editMode ? 'var(--color-success)' : 'var(--color-border)',
                                    color: editMode ? 'var(--color-success)' : 'var(--color-text-secondary)',
                                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                }}
                            >
                                {editMode ? '✓ Done' : '✎ Edit'}
                            </button>
                        )}
                    </div>
                </div>

                {exercises.length === 0 ? (
                    <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
                        <p style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</p>
                        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '12px', fontSize: '1.5rem' }}>No Exercises Found</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
                            We couldn't find any exercises planned for <span style={{ color: 'var(--color-accent)' }}>{todayDay}</span>. Update your split in Onboarding or retry.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <Link href="/onboarding" className="btn-primary" style={{ textDecoration: 'none', padding: '14px 28px' }}>SETUP SPLIT</Link>
                            <button onClick={load} style={{
                                padding: '14px 28px', borderRadius: '14px', background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)', color: 'var(--color-text-primary)',
                                cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700
                            }}>RETRY</button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {exercises.map((ex, exIdx) => {
                            const done = completedSets[ex.id] ?? 0;
                            const allDone = done >= ex.target_sets;
                            const currentWeight = weightOverride[ex.id] ?? ex.target_weight;
                            const hint = progressionHints[ex.id];

                            return (
                                <div key={ex.id} style={{
                                    background: 'var(--color-bg-card)',
                                    border: '1px solid',
                                    borderColor: editMode ? 'var(--color-accent)' : allDone ? 'var(--color-success-soft)' : 'var(--color-border)',
                                    borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'hidden',
                                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                    boxShadow: allDone ? 'none' : '0 4px 20px rgba(0,0,0,0.2)'
                                }}>
                                    {allDone && !editMode && (
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--color-success)' }} />
                                    )}
                                    {!allDone && done > 0 && !editMode && (
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--color-accent)', width: `${(done / ex.target_sets) * 100}%`, transition: 'width 0.5s ease' }} />
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{
                                                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.05rem',
                                                color: allDone && !editMode ? 'var(--color-success)' : 'var(--color-text-primary)',
                                                display: 'flex', alignItems: 'center', gap: '8px'
                                            }}>
                                                {allDone && !editMode && '✓ '}{ex.exercise_name}
                                            </h3>
                                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '2px', letterSpacing: '0.1em', fontFamily: "'Space Grotesk', sans-serif" }}>{ex.muscle_group.toUpperCase()}</p>
                                        </div>
                                        {!editMode ? (
                                            <span style={{
                                                background: 'var(--color-bg-secondary)', padding: '6px 12px', borderRadius: '10px',
                                                fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-secondary)',
                                                border: '1px solid var(--color-border)', fontFamily: "'Space Grotesk', sans-serif"
                                            }}>
                                                {ex.target_sets} × {ex.target_rep_range} REPS
                                            </span>
                                        ) : (
                                            <button onClick={() => removeExercise(ex.id)} style={{
                                                padding: '8px 14px', borderRadius: '10px', cursor: 'pointer',
                                                background: 'var(--color-error-soft)', border: '1px solid var(--color-error)',
                                                color: 'var(--color-error)', fontFamily: "'Space Grotesk', sans-serif",
                                                fontWeight: 700, fontSize: '0.8rem'
                                            }}> REMOVE </button>
                                        )}
                                    </div>

                                    {editMode && (
                                        <div style={{ background: 'var(--color-bg-secondary)', borderRadius: '16px', padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                                <span className="label-caps" style={{ width: '100px', fontSize: '0.7rem' }}>Rep Range</span>
                                                <select
                                                    value={ex.target_rep_range}
                                                    onChange={e => updateExerciseField(ex.id, 'target_rep_range', e.target.value)}
                                                    style={{
                                                        background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '10px',
                                                        color: 'var(--color-text-primary)', padding: '8px 12px', fontFamily: "'Space Grotesk', sans-serif",
                                                        fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', flex: 1
                                                    }}
                                                >
                                                    {REP_RANGES.map(r => <option key={r} value={r}>{r} reps</option>)}
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span className="label-caps" style={{ width: '100px', fontSize: '0.7rem' }}>Sets</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <button onClick={() => updateExerciseField(ex.id, 'target_sets', Math.max(1, ex.target_sets - 1))} className="set-control-btn">−</button>
                                                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: 'var(--color-text-primary)', minWidth: '24px', textAlign: 'center' }}>{ex.target_sets}</span>
                                                    <button onClick={() => updateExerciseField(ex.id, 'target_sets', ex.target_sets + 1)} className="set-control-btn">+</button>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span className="label-caps" style={{ width: '100px', fontSize: '0.7rem' }}>Target Weight</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <button onClick={() => { const nw = Math.max(0, currentWeight - 2.5); setWeightOverride(p => ({ ...p, [ex.id]: nw })); updateExerciseField(ex.id, 'target_weight', nw); }} className="set-control-btn">−</button>
                                                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: 'var(--color-text-primary)', minWidth: '70px', textAlign: 'center' }}>{currentWeight} kg</span>
                                                    <button onClick={() => { const nw = currentWeight + 2.5; setWeightOverride(p => ({ ...p, [ex.id]: nw })); updateExerciseField(ex.id, 'target_weight', nw); }} className="set-control-btn">+</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!allDone && !editMode && (
                                        <>
                                            {hint && (
                                                <div style={{ background: 'var(--color-accent-soft)', border: '1px solid var(--color-accent-soft)', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ fontSize: '1rem' }}>📈</span>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 600 }}>{hint}</p>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', flexShrink: 0, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>Weight</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <button onClick={() => setWeightOverride(p => ({ ...p, [ex.id]: Math.max(0, (p[ex.id] ?? ex.target_weight) - 2.5) }))} className="set-control-btn">−</button>
                                                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-text-primary)', minWidth: '65px', textAlign: 'center' }}>{currentWeight} kg</span>
                                                    <button onClick={() => setWeightOverride(p => ({ ...p, [ex.id]: (p[ex.id] ?? ex.target_weight) + 2.5 }))} className="set-control-btn">+</button>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                {Array.from({ length: ex.target_sets }, (_, i) => {
                                                    const setDone = i < done;
                                                    const isNext = i === done;
                                                    return (
                                                        <button key={i} onClick={() => isNext ? completeSet(ex) : undefined}
                                                            disabled={setDone || allDone}
                                                            style={{
                                                                height: '44px', minWidth: '80px', borderRadius: '12px', cursor: isNext ? 'pointer' : 'default',
                                                                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.8rem',
                                                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                                                border: setDone ? 'none' : isNext ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                                                                background: setDone ? 'var(--color-success-soft)' : isNext ? 'var(--color-accent-soft)' : 'var(--color-bg-secondary)',
                                                                color: setDone ? 'var(--color-success)' : isNext ? 'var(--color-accent)' : 'var(--color-text-muted)',
                                                                transform: isNext ? 'scale(1.02)' : 'scale(1)',
                                                                boxShadow: isNext ? '0 0 16px var(--color-accent-glow)' : 'none',
                                                            }}>
                                                            {setDone ? '✓' : isNext ? `SET ${i + 1} ▶` : `SET ${i + 1}`}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style jsx>{`
                .set-control-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 12px;
                    background: var(--color-bg-secondary);
                    border: 1px solid var(--color-border);
                    color: var(--color-text-primary);
                    cursor: pointer;
                    font-weight: 800;
                    font-size: 1.2rem;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .set-control-btn:hover {
                    border-color: var(--color-accent);
                    color: var(--color-accent);
                    background: var(--color-accent-soft);
                }
            `}</style>
        </div>
    );
}

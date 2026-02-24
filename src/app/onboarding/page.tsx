'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PathType, WorkoutSplit } from '@/types';
import { DAYS, WORKOUT_TYPES, defaultSchedules, DayOfWeek, WorkoutType, workoutMuscleGroups, parseSchedule, getWorkoutDays } from '@/lib/schedule';
import { exerciseDatabase } from '@/lib/exercises';
import { REP_RANGES, NEXT_REP_RANGE } from '@/lib/progression';

// ── types ──────────────────────────────────────────────────────────────
type MuscleGroup = keyof typeof exerciseDatabase;

interface PlannedExercise {
    exercise_name: string;
    muscle_group: string;
    target_sets: number;
    target_rep_range: string;
    target_weight: number;
}

// ── static data ───────────────────────────────────────────────────────
const paths: { value: PathType; label: string; desc: string; icon: string; color: string }[] = [
    { value: 'shred', label: 'Shred Path', desc: 'Get lean and defined — cut fat, keep muscle', icon: '🔥', color: '#ff6b2b' },
    { value: 'strength', label: 'Strength Path', desc: 'Maximize raw power — squat, bench, deadlift', icon: '💪', color: '#a78bfa' },
    { value: 'hybrid', label: 'Hybrid Path', desc: 'Best of both worlds — strength meets aesthetics', icon: '⚡', color: '#b5f23d' },
];

const splits: { value: WorkoutSplit; label: string; desc: string; tag: string }[] = [
    { value: 'ppl', label: 'Push / Pull / Legs', desc: 'Chest·Shoulders·Tri  /  Back·Bi  /  Legs', tag: '6 days' },
    { value: 'upper_lower', label: 'Upper / Lower', desc: 'Upper body and lower body alternating', tag: '4 days' },
    { value: 'bro_split', label: 'Classic Bro Split', desc: 'One muscle group per day', tag: '5 days' },
    { value: 'full_body', label: 'Full Body', desc: 'Hit everything each session', tag: '3 days' },
    { value: 'custom', label: 'Custom Split', desc: 'Define your own workout days manually', tag: 'Custom' },
];

const MUSCLE_GROUPS_ALL = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Calves'];

const DAY_SHORT: Record<DayOfWeek, string> = {
    Monday: 'MON', Tuesday: 'TUE', Wednesday: 'WED',
    Thursday: 'THU', Friday: 'FRI', Saturday: 'SAT', Sunday: 'SUN',
};

const STEP_LABELS = ['Stats', 'Path', 'Split', 'Schedule', 'Exercises'];

const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0e0e16', border: '1px solid #1e1e30',
    borderRadius: '12px', padding: '12px 16px', fontSize: '0.95rem',
    color: '#f0f0f8', outline: 'none', fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
};


// ──────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);

    // Step 1
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [experience, setExperience] = useState<'beginner' | 'experienced' | ''>('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    // Step 2
    const [selectedPath, setSelectedPath] = useState<PathType | ''>('');
    // Step 3
    const [workoutSplit, setWorkoutSplit] = useState<WorkoutSplit | ''>('');
    // Step 4
    const [skippedGroups, setSkippedGroups] = useState<string[]>([]);
    const [schedule, setSchedule] = useState<Record<DayOfWeek, { type: WorkoutType; label: string }> | null>(null);
    // Step 5 — planned exercises per workout day
    // Map: dayOfWeek → array of planned exercises
    const [plannedByDay, setPlannedByDay] = useState<Record<string, PlannedExercise[]>>({});
    const [activePlanDay, setActivePlanDay] = useState<string>('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const totalSteps = 5;

    // ── step 3 helpers ──────────────────────────────────────────────
    const handleSplitSelect = (split: WorkoutSplit) => {
        setWorkoutSplit(split);
        const base = defaultSchedules[split] || defaultSchedules.custom;
        const converted: Record<DayOfWeek, { type: WorkoutType; label: string }> = {} as any;
        Object.entries(base).forEach(([d, t]) => {
            // t is a WorkoutType string — store it as-is, never as object
            const typeStr = (typeof t === 'object' ? (t as any).type : t) as WorkoutType;
            converted[d as DayOfWeek] = { type: typeStr, label: typeStr + ' Day' };
        });
        setSchedule(converted);
    };

    // ── step 4 helper ───────────────────────────────────────────────
    const toggleMuscleGroup = (group: string) => {
        setSkippedGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
    };

    // ── step 5 helpers ──────────────────────────────────────────────
    const workoutDays = getWorkoutDays(schedule);

    const addExercise = (day: string) => {
        setPlannedByDay(prev => ({
            ...prev,
            [day]: [...(prev[day] ?? []), {
                exercise_name: '',
                muscle_group: '',
                target_sets: 3,
                target_rep_range: '8-10',
                target_weight: 0,
            }],
        }));
    };

    const removeExercise = (day: string, idx: number) => {
        setPlannedByDay(prev => ({
            ...prev,
            [day]: (prev[day] ?? []).filter((_, i) => i !== idx),
        }));
    };

    const updateExercise = (day: string, idx: number, field: keyof PlannedExercise, value: string | number) => {
        setPlannedByDay(prev => {
            const list = [...(prev[day] ?? [])];
            list[idx] = { ...list[idx], [field]: value };
            // If muscle group changes, reset exercise name
            if (field === 'muscle_group') list[idx].exercise_name = '';
            return { ...prev, [day]: list };
        });
    };

    // ── navigation ──────────────────────────────────────────────────
    const handleNext = () => {
        setError('');
        if (step === 1) {
            if (!username) { setError('Please choose a username'); return; }
            if (!height || !weight || Number(height) <= 0 || Number(weight) <= 0) {
                setError('Please enter valid height and weight'); return;
            }
            if (!experience) { setError('Please select your experience level'); return; }
            setStep(2);
        } else if (step === 2) {
            if (!selectedPath) { setError('Please select a path'); return; }
            setStep(3);
        } else if (step === 3) {
            if (!workoutSplit) { setError('Please select a split'); return; }
            setStep(4);
        } else if (step === 4) {
            setStep(5);
            // Pre-select first active workout day
            const days = getWorkoutDays(schedule);
            if (days.length > 0) setActivePlanDay(days[0].day);

            // If beginner, auto-assign exercises if none exist
            if (experience === 'beginner' && Object.keys(plannedByDay).length === 0) {
                const autoPlan: Record<string, PlannedExercise[]> = {};
                days.forEach(({ day, type }) => {
                    const muscles = workoutMuscleGroups[type] || [];
                    const exercises: PlannedExercise[] = muscles.flatMap(m =>
                        (exerciseDatabase[m as MuscleGroup] || []).slice(0, 2).map(ex => ({
                            exercise_name: ex,
                            muscle_group: m,
                            target_sets: 3,
                            target_rep_range: '8-10',
                            target_weight: 0,
                        }))
                    );
                    autoPlan[day] = exercises;
                });
                setPlannedByDay(autoPlan);
            }
        }
    };

    // ── final submit ────────────────────────────────────────────────
    const handleSubmit = async () => {
        setError('');
        if (!selectedPath) { setError('Please go back and choose a path.'); return; }
        if (!workoutSplit) { setError('Please go back and select a workout split.'); return; }
        if (!height || !weight) { setError('Please go back and enter your body stats.'); return; }
        setLoading(true);

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            setError('Session expired. Please sign in again.'); setLoading(false);
            setTimeout(() => router.push('/login'), 2000); return;
        }

        // 1. Save profile
        const { error: dbError } = await supabase.from('profiles').upsert({
            id: user.id,
            username: username || user.email?.split('@')[0],
            height: Number(height),
            weight: Number(weight),
            selected_path: selectedPath,
            gym_experience: experience,
            workout_split: workoutSplit,
            schedule,
            skipped_muscle_groups: skippedGroups,
        });
        if (dbError) { setError(`Failed to save profile: ${dbError.message}`); setLoading(false); return; }

        // 2. Save strength scores
        await supabase.from('strength_scores').upsert({
            user_id: user.id, total_strength_score: 0,
            tier_name: selectedPath === 'shred' ? 'Lean' : selectedPath === 'strength' ? 'Iron' : 'Built',
            squat_1rm: 0, bench_1rm: 0, deadlift_1rm: 0,
        });

        // 3. Save planned workouts — delete old ones first, then insert
        await supabase.from('planned_workouts').delete().eq('user_id', user.id);

        const rows: Record<string, unknown>[] = [];
        Object.entries(plannedByDay).forEach(([day, exercises]) => {
            exercises.forEach(ex => {
                if (ex.exercise_name && ex.muscle_group) {
                    rows.push({
                        user_id: user.id,
                        day_of_week: day,
                        exercise_name: ex.exercise_name,
                        muscle_group: ex.muscle_group,
                        target_sets: ex.target_sets,
                        target_rep_range: ex.target_rep_range,
                        target_weight: ex.target_weight,
                        progression_state: 'base',
                    });
                }
            });
        });

        if (rows.length > 0) {
            const { error: pwError } = await supabase.from('planned_workouts').insert(rows);
            if (pwError) console.warn('Planned workouts save failed:', pwError.message);
        }

        setStep(6); // Success step
    };

    // ── render helpers ───────────────────────────────────────────────

    const ExerciseRow = ({ day, ex, idx }: { day: string; ex: PlannedExercise; idx: number }) => {
        const availableExercises = ex.muscle_group
            ? (exerciseDatabase[ex.muscle_group as MuscleGroup] ?? [])
            : [];

        return (
            <div style={{ background: '#0e0e16', border: '1px solid #1e1e30', borderRadius: '14px', padding: '14px', marginBottom: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                        <label className="label-caps" style={{ display: 'block', marginBottom: '6px', fontSize: '0.65rem' }}>Muscle Group</label>
                        <select
                            value={ex.muscle_group}
                            onChange={e => updateExercise(day, idx, 'muscle_group', e.target.value)}
                            style={selectStyle}
                        >
                            <option value="">Select</option>
                            {MUSCLE_GROUPS_ALL.map(mg => <option key={mg} value={mg}>{mg}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label-caps" style={{ display: 'block', marginBottom: '6px', fontSize: '0.65rem' }}>Exercise</label>
                        <select
                            value={ex.exercise_name}
                            onChange={e => updateExercise(day, idx, 'exercise_name', e.target.value)}
                            style={{ ...selectStyle, opacity: ex.muscle_group ? 1 : 0.4 }}
                        >
                            <option value="">Select</option>
                            {availableExercises.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <div>
                        <label className="label-caps" style={{ display: 'block', marginBottom: '6px', fontSize: '0.65rem' }}>Sets</label>
                        <select
                            value={ex.target_sets}
                            onChange={e => updateExercise(day, idx, 'target_sets', Number(e.target.value))}
                            style={selectStyle}
                        >
                            {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} sets</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label-caps" style={{ display: 'block', marginBottom: '6px', fontSize: '0.65rem' }}>Rep Range</label>
                        <select
                            value={ex.target_rep_range}
                            onChange={e => updateExercise(day, idx, 'target_rep_range', e.target.value)}
                            style={selectStyle}
                        >
                            {REP_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label-caps" style={{ display: 'block', marginBottom: '6px', fontSize: '0.65rem' }}>Weight (kg)</label>
                        <input
                            type="number"
                            value={ex.target_weight || ''}
                            onChange={e => updateExercise(day, idx, 'target_weight', Number(e.target.value))}
                            placeholder="0"
                            min="0"
                            step="2.5"
                            style={inputStyle}
                        />
                    </div>
                </div>

                <button onClick={() => removeExercise(day, idx)} style={{
                    marginTop: '10px', background: 'transparent', border: 'none',
                    color: 'rgba(255,59,92,0.6)', fontSize: '0.78rem', cursor: 'pointer',
                    fontFamily: "'Space Grotesk', sans-serif",
                }}>− Remove</button>
            </div>
        );
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '32px 16px', background: '#06060a', position: 'relative', overflow: 'hidden',
        }}>
            {/* Ambient orbs */}
            <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, var(--color-accent-soft), transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '-20%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, var(--color-violet-soft), transparent 70%)', pointerEvents: 'none' }} />

            <div className="animate-slide-up" style={{ width: '100%', maxWidth: step === 5 ? '640px' : '520px', position: 'relative', zIndex: 1, transition: 'max-width 0.3s ease' }}>

                {/* ── HEADER ── */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--color-accent-soft)', border: '1px solid var(--color-accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚡</div>
                        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.04em', background: 'linear-gradient(135deg, var(--color-accent), var(--color-violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Ascend</span>
                    </div>
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.03em', color: '#f0f0f8', lineHeight: 1.2 }}>
                        Set Up Your Profile
                    </h1>
                    <p style={{ color: '#8888a8', marginTop: '6px', fontSize: '0.875rem' }}>Step {step} of {totalSteps} — {STEP_LABELS[step - 1]}</p>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '16px', justifyContent: 'center' }}>
                        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                            <div key={s} style={{
                                height: '3px', borderRadius: '99px', transition: 'all 0.35s ease',
                                width: s <= step ? '40px' : '20px',
                                background: s <= step ? 'linear-gradient(90deg, var(--color-accent), var(--color-violet))' : '#1e1e30',
                            }} />
                        ))}
                    </div>
                </div>

                {/* ── CARD ── */}
                <div style={{ background: '#12121c', border: '1px solid #1e1e30', borderRadius: '24px', padding: '32px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>

                    {/* ── Step 1: Body Stats ── */}
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.04em', color: '#f0f0f8', marginBottom: '4px' }}>Your Profile</h2>
                                <p style={{ color: '#44445a', fontSize: '0.83rem' }}>Set your identity and body stats</p>
                            </div>

                            <div>
                                <label className="label-caps" style={{ display: 'block', marginBottom: '8px' }}>Preferred Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="e.g. iron_lifter99"
                                    style={inputStyle}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                {[
                                    { label: 'Height (cm)', value: height, set: setHeight, placeholder: '175' },
                                    { label: 'Weight (kg)', value: weight, set: setWeight, placeholder: '75' },
                                ].map(({ label, value, set, placeholder }) => (
                                    <div key={label}>
                                        <label className="label-caps" style={{ display: 'block', marginBottom: '8px' }}>{label}</label>
                                        <input type="number" value={value} placeholder={placeholder}
                                            onChange={(e) => set(e.target.value)} style={inputStyle}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="label-caps" style={{ display: 'block', marginBottom: '8px' }}>Experience Level</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {[
                                        { id: 'beginner', label: 'Beginner', desc: 'New to training' },
                                        { id: 'experienced', label: 'Experienced', desc: 'Lifting for 6+ months' }
                                    ].map((exp) => (
                                        <button
                                            key={exp.id}
                                            type="button"
                                            onClick={() => setExperience(exp.id as any)}
                                            style={{
                                                flex: 1, padding: '14px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s',
                                                background: experience === exp.id ? 'var(--color-accent-soft)' : '#0e0e16',
                                                border: `1px solid ${experience === exp.id ? 'var(--color-accent)' : '#1e1e30'}`,
                                                textAlign: 'left'
                                            }}
                                        >
                                            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: experience === exp.id ? '#f0f0f8' : '#8888a8' }}>{exp.label}</p>
                                            <p style={{ fontSize: '0.72rem', color: '#44445a', marginTop: '2px' }}>{exp.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Path ── */}
                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.04em', color: '#f0f0f8', marginBottom: '4px' }}>Choose Your Path</h2>
                                <p style={{ color: '#44445a', fontSize: '0.83rem' }}>Shapes your tier targets and progress tracking</p>
                            </div>
                            {paths.map((p) => {
                                const isSelected = selectedPath === p.value;
                                return (
                                    <button key={p.value} onClick={() => setSelectedPath(p.value)} style={{
                                        width: '100%', textAlign: 'left', padding: '16px 18px', borderRadius: '14px', cursor: 'pointer',
                                        transition: 'all 0.18s', background: isSelected ? 'var(--color-accent-soft)' : '#0e0e16',
                                        border: `1px solid ${isSelected ? 'var(--color-accent)' : '#1e1e30'}`,
                                        boxShadow: isSelected ? `0 0 0 1px ${p.color}33` : 'none',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0, background: isSelected ? `${p.color}18` : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected ? p.color + '40' : '#1e1e30'}` }}>{p.icon}</div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: isSelected ? '#f0f0f8' : '#8888a8' }}>{p.label}</p>
                                                <p style={{ fontSize: '0.8rem', color: '#44445a', marginTop: '2px' }}>{p.desc}</p>
                                            </div>
                                            {isSelected && <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ color: 'white', fontSize: '0.65rem', fontWeight: 800 }}>✓</span></div>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Step 3: Split ── */}
                    {step === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.04em', color: '#f0f0f8', marginBottom: '4px' }}>Select Workout Split</h2>
                                <p style={{ color: '#44445a', fontSize: '0.83rem' }}>Pre-fills your weekly schedule — customize it next</p>
                            </div>
                            {splits.map((s) => {
                                const isSelected = workoutSplit === s.value;
                                return (
                                    <button key={s.value} onClick={() => handleSplitSelect(s.value)} style={{
                                        width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                                        transition: 'all 0.18s', background: isSelected ? 'var(--color-accent-soft)' : '#0e0e16',
                                        border: `1px solid ${isSelected ? 'var(--color-accent)' : '#1e1e30'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                                    }}>
                                        <div>
                                            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.92rem', color: isSelected ? '#f0f0f8' : '#8888a8' }}>{s.label}</p>
                                            <p style={{ fontSize: '0.78rem', color: '#44445a', marginTop: '2px' }}>{s.desc}</p>
                                        </div>
                                        <span className="tag-pill" style={{ flexShrink: 0, ...(isSelected ? { background: 'rgba(255,107,43,0.15)', borderColor: 'rgba(255,107,43,0.3)', color: '#ff6b2b' } : {}) }}>{s.tag}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Step 4: Schedule + Skip Muscle Groups ── */}
                    {step === 4 && schedule && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.04em', color: '#f0f0f8', marginBottom: '4px' }}>Customize Your Week</h2>
                                <p style={{ color: '#44445a', fontSize: '0.83rem' }}>Adjust each day's workout type — or leave as-is</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {DAYS.map((day) => (
                                    <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '0.72rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: '0.06em', color: '#44445a', width: '36px', flexShrink: 0 }}>{DAY_SHORT[day]}</span>
                                        <select value={schedule[day].type} onChange={(e) => setSchedule(prev => ({ ...prev!, [day]: { ...prev![day], type: e.target.value as WorkoutType } }))} style={{ flex: 1, background: '#0e0e16', border: `1px solid ${schedule[day].type === 'Rest' ? '#1e1e30' : 'var(--color-accent-glow)'}`, borderRadius: '10px', padding: '9px 12px', fontSize: '0.875rem', color: schedule[day].type === 'Rest' ? '#44445a' : '#f0f0f8', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}>
                                            {WORKOUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        {!schedule[day].type.includes('Rest') && (
                                            <input
                                                type="text"
                                                value={schedule[day].label}
                                                onChange={(e) => setSchedule(prev => ({ ...prev!, [day]: { ...prev![day], label: e.target.value } }))}
                                                placeholder="Day Label"
                                                style={{ ...inputStyle, width: '120px', padding: '8px 12px', fontSize: '0.8rem' }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.88rem', color: '#8888a8', marginBottom: '10px' }}>
                                    Skip muscle groups <span style={{ color: '#44445a', fontWeight: 400 }}>(e.g. due to injury)</span>
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {MUSCLE_GROUPS_ALL.map((group) => {
                                        const skipped = skippedGroups.includes(group);
                                        return (
                                            <button key={group} onClick={() => toggleMuscleGroup(group)} style={{ padding: '6px 14px', borderRadius: '99px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, transition: 'all 0.15s', background: skipped ? 'rgba(255,59,92,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${skipped ? 'rgba(255,59,92,0.35)' : '#1e1e30'}`, color: skipped ? '#ff3b5c' : '#8888a8', textDecoration: skipped ? 'line-through' : 'none' }}>{group}</button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 5: Plan Exercises ── */}
                    {step === 5 && (
                        <div>
                            <div style={{ marginBottom: '20px' }}>
                                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.04em', color: '#f0f0f8', marginBottom: '4px' }}>Plan Your Exercises</h2>
                                <p style={{ color: '#44445a', fontSize: '0.83rem' }}>Set exercises, sets, rep ranges and starting weights for each workout day</p>
                            </div>

                            {/* Day tabs */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
                                {workoutDays.map(({ day, type }) => {
                                    const isActive = activePlanDay === day;
                                    const count = (plannedByDay[day] ?? []).length;
                                    return (
                                        <button key={day} onClick={() => setActivePlanDay(day)} style={{
                                            padding: '7px 14px', borderRadius: '10px', fontSize: '0.78rem', cursor: 'pointer',
                                            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, transition: 'all 0.15s',
                                            background: isActive ? 'var(--color-accent-soft)' : '#0e0e16',
                                            border: `1px solid ${isActive ? 'var(--color-accent-glow)' : '#1e1e30'}`,
                                            color: isActive ? 'var(--color-accent)' : '#8888a8',
                                        }}>
                                            {DAY_SHORT[day as DayOfWeek]} <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>· {typeof type === 'object' ? (type as any).type : type}</span>
                                            {count > 0 && <span style={{ marginLeft: '6px', background: 'var(--color-accent)', color: 'white', borderRadius: '99px', padding: '1px 6px', fontSize: '0.65rem' }}>{count}</span>}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Exercise rows for active day */}
                            {activePlanDay && (
                                <div>
                                    <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.875rem', color: '#f0f0f8' }}>
                                            {activePlanDay}
                                            <span style={{ color: '#44445a', fontWeight: 400, marginLeft: '8px', fontSize: '0.8rem' }}>
                                                {schedule?.[activePlanDay as DayOfWeek]?.type}
                                            </span>
                                        </p>
                                        <p style={{ fontSize: '0.75rem', color: '#44445a' }}>
                                            Next range: {NEXT_REP_RANGE[(plannedByDay[activePlanDay]?.[0]?.target_rep_range ?? '8-10')]}
                                        </p>
                                    </div>

                                    {(plannedByDay[activePlanDay] ?? []).map((ex, idx) => (
                                        <ExerciseRow key={idx} day={activePlanDay} ex={ex} idx={idx} />
                                    ))}

                                    <button onClick={() => addExercise(activePlanDay)} style={{
                                        width: '100%', padding: '12px', borderRadius: '12px', cursor: 'pointer',
                                        background: 'transparent', border: '1px dashed var(--color-accent-glow)',
                                        color: 'var(--color-accent)', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.875rem',
                                        transition: 'all 0.15s',
                                    }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-accent-soft)'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                    >+ Add Exercise</button>
                                </div>
                            )}

                            {workoutDays.length === 0 && (
                                <p style={{ color: '#44445a', textAlign: 'center', padding: '24px 0' }}>No workout days in your schedule. Go back and add some.</p>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div style={{ background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.25)', color: '#ff3b5c', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem', marginTop: '16px' }}>
                            ⚠ {error}
                        </div>
                    )}

                    {/* Navigation */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                        {step > 1 && (
                            <button onClick={() => { setError(''); setStep(step - 1); }} style={{
                                flex: 1, padding: '13px', borderRadius: '14px', cursor: 'pointer',
                                background: 'transparent', border: '1px solid #1e1e30',
                                color: '#8888a8', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.18s',
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2e2e48'; (e.currentTarget as HTMLElement).style.color = '#f0f0f8'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1e1e30'; (e.currentTarget as HTMLElement).style.color = '#8888a8'; }}
                            >← Back</button>
                        )}
                        {step < totalSteps ? (
                            <button onClick={handleNext} className="btn-primary" style={{ flex: 1, padding: '13px' }}>Continue →</button>
                        ) : (
                            <button onClick={handleSubmit} disabled={loading} className="btn-primary"
                                style={{ flex: 1, padding: '13px', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                                {loading ? 'Setting up...' : 'Start Training 🚀'}
                            </button>
                        )}
                    </div>

                    {/* Skip exercises step */}
                    {step === 5 && (
                        <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.8rem', color: '#44445a', cursor: 'pointer' }}
                            onClick={handleSubmit}>
                            Skip for now — set exercises later
                        </p>
                    )}
                    {/* ── Step 6: Success ── */}
                    {step === 6 && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'var(--color-accent-soft)', border: '1px solid var(--color-accent-glow)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2.5rem', margin: '0 auto 24px'
                            }}>
                                🎉
                            </div>
                            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.04em', color: '#f0f0f8', marginBottom: '12px' }}>
                                Setup Successful!
                            </h2>
                            <p style={{ color: '#8888a8', fontSize: '1rem', lineHeight: 1.6, maxWidth: '320px', margin: '0 auto 32px' }}>
                                Your custom training routine has been forged. Time to hit the weights!
                            </p>
                            <button onClick={() => router.push('/dashboard')} className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                                Go to Dashboard →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

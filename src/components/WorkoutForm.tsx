'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { exerciseDatabase, muscleGroups } from '@/lib/exercises';
import { calculate1RM } from '@/lib/strength';
import { MuscleGroup } from '@/types';
import { REP_RANGES, REP_RANGE_MIDPOINT } from '@/lib/progression';

interface WorkoutFormProps {
    userId: string;
    onWorkoutLogged: () => void;
}

export default function WorkoutForm({ userId, onWorkoutLogged }: WorkoutFormProps) {
    const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | ''>('');
    const [exercise, setExercise] = useState('');
    const [weight, setWeight] = useState('');
    const [repRange, setRepRange] = useState('');
    const [sets, setSets] = useState('3');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const exercises = muscleGroup ? exerciseDatabase[muscleGroup] : [];
    const repMidpoint = repRange ? REP_RANGE_MIDPOINT[repRange] : null;
    const estimated1rm = weight && repMidpoint ? calculate1RM(Number(weight), repMidpoint) : null;

    const handleMuscleGroupChange = (value: string) => {
        setMuscleGroup(value as MuscleGroup);
        setExercise('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!muscleGroup || !exercise || !weight || !repRange || !sets) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        const mid = REP_RANGE_MIDPOINT[repRange] ?? 8;
        const est1rm = calculate1RM(Number(weight), mid);

        const { error: dbError } = await supabase.from('workouts').insert({
            user_id: userId,
            muscle_group: muscleGroup,
            exercise_name: exercise,
            weight: Number(weight),
            reps: mid,
            sets: Number(sets),
            estimated_1rm: est1rm,
            date: new Date().toISOString().split('T')[0],
        });

        if (dbError) { setError(dbError.message); setLoading(false); return; }

        setSuccess(true);
        setMuscleGroup(''); setExercise(''); setWeight(''); setRepRange(''); setSets('3');
        setLoading(false);
        onWorkoutLogged();
        setTimeout(() => setSuccess(false), 3000);
    };

    return (
        <div className="glass-card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
            {/* Top accent bar */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                background: 'linear-gradient(90deg, var(--color-accent), var(--color-violet))',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{
                    width: '44px', height: '44px', borderRadius: '14px',
                    background: 'var(--color-accent-soft)', border: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
                }}>
                    🏋️
                </div>
                <div>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                        Add New Entry
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Document your progress in the vault.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    {/* Muscle Group */}
                    <div className="form-group">
                        <label className="label-caps" style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>Muscle Group</label>
                        <select value={muscleGroup} onChange={(e) => handleMuscleGroupChange(e.target.value)}>
                            <option value="">Select group</option>
                            {muscleGroups.map((mg) => (
                                <option key={mg} value={mg}>{mg}</option>
                            ))}
                        </select>
                    </div>

                    {/* Exercise */}
                    <div className="form-group">
                        <label className="label-caps" style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>Exercise</label>
                        <select value={exercise} onChange={(e) => setExercise(e.target.value)} disabled={!muscleGroup}>
                            <option value="">Select exercise</option>
                            {exercises.map((ex) => (
                                <option key={ex} value={ex}>{ex}</option>
                            ))}
                        </select>
                    </div>

                    {/* Weight */}
                    <div className="form-group">
                        <label className="label-caps" style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>Weight (kg)</label>
                        <input
                            type="number"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            placeholder="e.g. 80"
                            min="0"
                            step="0.5"
                        />
                    </div>

                    {/* Rep Range */}
                    <div className="form-group">
                        <label className="label-caps" style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>Rep Range</label>
                        <select value={repRange} onChange={(e) => setRepRange(e.target.value)}>
                            <option value="">Select range</option>
                            {REP_RANGES.map((r) => (
                                <option key={r} value={r}>{r} reps</option>
                            ))}
                        </select>
                    </div>

                    {/* Sets */}
                    <div className="form-group">
                        <label className="label-caps" style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>Sets</label>
                        <input
                            type="number"
                            value={sets}
                            onChange={(e) => setSets(e.target.value)}
                            placeholder="e.g. 3"
                            min="1"
                            max="10"
                        />
                    </div>

                    {/* Live 1RM Preview */}
                    {estimated1rm && (
                        <div style={{
                            background: 'var(--color-accent-soft)', border: '1px solid var(--color-accent-soft)',
                            borderRadius: '16px', padding: '16px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                            animation: 'slide-up 0.3s ease both'
                        }}>
                            <p className="label-caps" style={{ marginBottom: '4px', fontSize: '0.65rem', color: 'var(--color-accent)' }}>Estimated 1RM</p>
                            <p style={{
                                fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2rem',
                                color: 'var(--color-accent)',
                            }}>
                                {estimated1rm}<span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>kg</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Feedback & Actions */}
                <div style={{ marginTop: '32px' }}>
                    {error && (
                        <div style={{
                            background: 'var(--color-error-soft)', border: '1px solid var(--color-error)',
                            color: 'var(--color-error)', padding: '12px 16px', borderRadius: '12px',
                            fontSize: '0.9rem', marginBottom: '20px', fontWeight: 600
                        }}>⚠ {error}</div>
                    )}

                    {success && (
                        <div style={{
                            background: 'var(--color-success-soft)', border: '1px solid var(--color-success)',
                            color: 'var(--color-success)', padding: '12px 16px', borderRadius: '12px',
                            fontSize: '0.9rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px',
                            fontWeight: 600, animation: 'slide-up 0.3s ease both'
                        }}>
                            <span>✓</span> Logged successfully. Keep pushing!
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="btn-primary"
                        style={{ width: '100%', padding: '18px', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'SYNCING...' : 'LOG THIS SET'}
                    </button>
                </div>
            </form>

            <style jsx>{`
                .form-group label {
                    display: block;
                    margin-bottom: 10px;
                    letter-spacing: 0.1em;
                }
                select, input {
                    width: 100%;
                    background: var(--color-bg-secondary);
                    border: 1px solid var(--color-border);
                    border-radius: 12px;
                    padding: 12px 16px;
                    color: var(--color-text-primary);
                    font-family: 'Space Grotesk', sans-serif;
                    font-weight: 600;
                    font-size: 0.95rem;
                    outline: none;
                    transition: all 0.2s ease;
                }
                select:focus, input:focus {
                    border-color: var(--color-accent);
                    box-shadow: 0 0 0 4px var(--color-accent-soft);
                    background: var(--color-bg-card);
                }
                select:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}

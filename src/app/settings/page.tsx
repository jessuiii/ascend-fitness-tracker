'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Profile, PathType, WorkoutSplit } from '@/types';
import { DAYS, DayOfWeek, WorkoutType, WORKOUT_TYPES, parseSchedule } from '@/lib/schedule';
import Navbar from '@/components/Navbar';

export default function SettingsPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const [username, setUsername] = useState('');
    const [selectedPath, setSelectedPath] = useState<PathType | ''>('');
    const [workoutSplit, setWorkoutSplit] = useState<WorkoutSplit | ''>('');
    const [schedule, setSchedule] = useState<Record<DayOfWeek, { type: WorkoutType; label: string }> | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }

            const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (p) {
                setProfile(p as Profile);
                setUsername(p.username || '');
                setSelectedPath(p.selected_path);
                setWorkoutSplit(p.workout_split);
                setSchedule(parseSchedule(p.schedule, p.workout_split) as Record<DayOfWeek, { type: WorkoutType; label: string }>);
            }
            setLoading(false);
        }
        fetchProfile();
    }, [router]);

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        setMessage('');

        const { error } = await supabase.from('profiles').update({
            username,
            selected_path: selectedPath,
            workout_split: workoutSplit,
            schedule,
        }).eq('id', profile.id);

        if (error) {
            setMessage(`Error: ${error.message}`);
        } else {
            setMessage('Settings saved successfully! ⚡');
        }
        setSaving(false);
    };

    if (loading) return <div style={{ minHeight: '100vh', background: '#06060a' }}><Navbar /></div>;

    const inputStyle = {
        background: '#0e0e16',
        border: '1px solid #1e1e30',
        borderRadius: '12px',
        padding: '12px 16px',
        width: '100%',
        color: '#f0f0f8',
        outline: 'none',
        fontFamily: "'DM Sans', sans-serif"
    };

    return (
        <div style={{ minHeight: '100vh', background: '#06060a' }}>
            <Navbar />
            <main className="page-max-wide animate-slide-up" style={{ paddingTop: '32px', paddingBottom: '60px', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '32px' }}>
                        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2.5rem', marginBottom: '8px' }}>Settings</h1>
                        <p style={{ color: '#8888a8' }}>Manage your profile and workout routine.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                        {/* ── Profile Section ── */}
                        <section className="dashboard-card" style={{ padding: '24px' }}>
                            <h3 className="label-caps" style={{ marginBottom: '20px', color: 'var(--color-accent)' }}>Profile Info</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label className="label-caps" style={{ fontSize: '0.7rem', marginBottom: '8px', display: 'block' }}>Username</label>
                                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} />
                                </div>
                            </div>
                        </section>

                        {/* ── Path Selection ── */}
                        <section className="dashboard-card" style={{ padding: '24px' }}>
                            <h3 className="label-caps" style={{ marginBottom: '20px', color: 'var(--color-accent)' }}>Workout Path</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                {(['shred', 'strength', 'hybrid'] as PathType[]).map(path => (
                                    <button
                                        key={path}
                                        onClick={() => setSelectedPath(path)}
                                        style={{
                                            padding: '16px 8px', borderRadius: '14px', border: '1px solid',
                                            borderColor: selectedPath === path ? 'var(--color-accent)' : '#1e1e30',
                                            background: selectedPath === path ? 'var(--color-accent-soft)' : '#0e0e16',
                                            color: selectedPath === path ? 'var(--color-text-primary)' : '#8888a8',
                                            textTransform: 'capitalize', fontWeight: 600, cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {path}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* ── Schedule Section ── */}
                        <section className="dashboard-card" style={{ padding: '24px' }}>
                            <h3 className="label-caps" style={{ marginBottom: '20px', color: 'var(--color-accent)' }}>Weekly Schedule</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {schedule && DAYS.map(day => (
                                    <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, width: '80px', flexShrink: 0 }}>{day}</span>
                                        <select
                                            value={schedule[day].type}
                                            onChange={e => setSchedule(prev => ({ ...prev!, [day]: { ...prev![day], type: e.target.value as WorkoutType } }))}
                                            style={{ ...inputStyle, padding: '8px 12px' }}
                                        >
                                            {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        {schedule[day].type !== 'Rest' && (
                                            <input
                                                type="text"
                                                value={schedule[day].label}
                                                onChange={e => setSchedule(prev => ({ ...prev!, [day]: { ...prev![day], label: e.target.value } }))}
                                                style={{ ...inputStyle, padding: '8px 12px', width: '120px' }}
                                                placeholder="Label"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                                {saving ? 'SAVING...' : 'SAVE CHANGES'}
                            </button>
                            {message && <p style={{ fontSize: '0.9rem', color: message.includes('Error') ? '#ff4b4b' : '#b5f23d', fontWeight: 600 }}>{message}</p>}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Profile, Workout, StrengthScore, PathType } from '@/types';
import { getBestLifts, calculateTSS, calculateBMI } from '@/lib/strength';
import { getTierInfo } from '@/lib/tiers';
import { getTodayWorkout, parseSchedule, DAYS, workoutMuscleGroups, WorkoutType } from '@/lib/schedule';
import { exerciseDatabase } from '@/lib/exercises';
import { MuscleGroup } from '@/types';
import Navbar from '@/components/Navbar';
import TierCard from '@/components/TierCard';
import StrengthChart from '@/components/StrengthChart';
import Link from 'next/link';

export default function DashboardPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [strengthScore, setStrengthScore] = useState<StrengthScore | null>(null);
    const [loading, setLoading] = useState(true);
    const [plannedExercises, setPlannedExercises] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedPlanned, setSelectedPlanned] = useState<string[]>([]);
    const [selectedPlannedMuscles, setSelectedPlannedMuscles] = useState<string[]>([]);
    const [userIdState, setUserIdState] = useState('');
    const [sessionDoneToday, setSessionDoneToday] = useState(false);

    const fetchData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        const userId = user.id;

        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (!profileData) { router.push('/onboarding'); return; }
        setProfile(profileData as Profile);

        const { data: workoutData } = await supabase
            .from('workouts').select('*').eq('user_id', userId)
            .order('date', { ascending: false }).limit(50);

        const workoutList = (workoutData || []) as Workout[];
        setWorkouts(workoutList);

        const todayJsDay = new Date().getDay();
        const todayDayName = DAYS[todayJsDay === 0 ? 6 : todayJsDay - 1];
        const { data: pwData } = await supabase
            .from('planned_workouts')
            .select('exercise_name, muscle_group')
            .eq('user_id', userId)
            .eq('day_of_week', todayDayName);
        const pwNames = pwData && pwData.length > 0 ? pwData.map((p: any) => p.exercise_name) : [];
        const pwMuscles = pwData && pwData.length > 0
            ? [...new Set(pwData.map((p: any) => p.muscle_group))]
            : [];
        setPlannedExercises(pwNames);
        setSelectedPlanned(pwNames);
        setSelectedPlannedMuscles(pwMuscles);
        setUserIdState(userId);

        const d = new Date();
        const localToday = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
        const { count } = await supabase
            .from('workouts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('date', localToday);
        setSessionDoneToday((count ?? 0) > 0);

        setLoading(false);
    }, [router]);

    const fetchPlannedForDay = useCallback(async (date: Date) => {
        const dayName = DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
        const { data } = await supabase
            .from('planned_workouts')
            .select('exercise_name, muscle_group')
            .eq('user_id', userIdState)
            .eq('day_of_week', dayName);
        setSelectedPlanned(data && data.length > 0 ? data.map((p: any) => p.exercise_name) : []);
        setSelectedPlannedMuscles(data && data.length > 0
            ? [...new Set(data.map((p: any) => p.muscle_group))]
            : []);
    }, [userIdState]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
                <Navbar />
                <div className="page-max-wide" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[160, 120, 200, 100].map((h, i) => (
                            <div key={i} className="shimmer" style={{ height: `${h}px`, borderRadius: '18px' }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    const parsedSchedule = parseSchedule(profile.schedule, profile.workout_split);
    const todayInfo = getTodayWorkout(parsedSchedule);
    const skipped = profile.skipped_muscle_groups || [];
    const todayMuscles = todayInfo.muscleGroups.filter(g => !skipped.includes(g));
    const genericExercises = todayMuscles.flatMap(g => (exerciseDatabase[g as MuscleGroup] || []).slice(0, 3));
    const todayExercises = plannedExercises.length > 0 ? plannedExercises : genericExercises;

    const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
    const jsDay = todayMidnight.getDay();
    const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(todayMidnight);
        d.setDate(todayMidnight.getDate() + mondayOffset + i);
        return d;
    });
    const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const selJsDay = selectedDate.getDay();
    const selDayName = DAYS[selJsDay === 0 ? 6 : selJsDay - 1];
    const selItem = parsedSchedule[selDayName] || { type: 'Rest' };
    const selWorkoutType: WorkoutType = (typeof selItem.type === 'object' && selItem.type !== null ? (selItem.type as any).type || 'Rest' : selItem.type) as WorkoutType;
    const selWorkoutLabel = String(typeof selItem.label === 'object' ? (selItem.label as any).label || (selItem.label as any).type || selWorkoutType : (selItem.label || selWorkoutType));
    const selIsRest = selWorkoutType === 'Rest';
    const selStaticMuscles = (workoutMuscleGroups[selWorkoutType] || []).filter(g => !skipped.includes(g));
    const selMuscles = selectedPlannedMuscles.length > 0 ? selectedPlannedMuscles : selStaticMuscles;
    const selGenericExercises = selStaticMuscles.flatMap(g => (exerciseDatabase[g as MuscleGroup] || []).slice(0, 3));
    const selExercises = selectedPlanned.length > 0 ? selectedPlanned : selGenericExercises;
    const selIsToday = selectedDate.toDateString() === todayMidnight.toDateString();

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
            <Navbar />

            <main className="page-max-wide animate-slide-up" style={{ paddingTop: '28px', paddingBottom: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* ── WEEK STRIP ── */}
                    <div style={{ overflowX: 'auto', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', paddingBottom: '4px', minWidth: 'max-content' }}>
                            {weekDays.map((d, i) => {
                                const isToday = d.toDateString() === todayMidnight.toDateString();
                                const isSelected = d.toDateString() === selectedDate.toDateString();
                                const dJsDay = d.getDay();
                                const dDayName = DAYS[dJsDay === 0 ? 6 : dJsDay - 1];
                                const dItem = parsedSchedule[dDayName] || { type: 'Rest' };
                                const wType = String(typeof dItem.type === 'object' && dItem.type !== null ? (dItem.type as any).type || 'Rest' : (dItem.type || 'Rest'));
                                const isRest = wType === 'Rest';
                                return (
                                    <button
                                        key={i}
                                        onClick={async () => {
                                            setSelectedDate(d);
                                            await fetchPlannedForDay(d);
                                        }}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            gap: '6px', padding: '12px', borderRadius: '16px',
                                            border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                                            background: isSelected ? 'var(--color-accent-soft)' : isToday ? 'rgba(99,102,241,0.05)' : 'var(--color-bg-card)',
                                            cursor: 'pointer', minWidth: '60px', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                            position: 'relative',
                                        }}
                                    >
                                        {isToday && !isSelected && (
                                            <div style={{ position: 'absolute', top: '8px', right: '8px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent)', boxShadow: '0 0 8px var(--color-accent)' }} />
                                        )}
                                        <span style={{ fontSize: '0.65rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: isSelected ? 'var(--color-accent)' : isToday ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                                            {SHORT_DAYS[i]}
                                        </span>
                                        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: isSelected || isToday ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                                            {d.getDate()}
                                        </span>
                                        <span style={{ fontSize: '0.6rem', color: isRest ? 'var(--color-text-muted)' : isSelected ? 'var(--color-accent)' : 'var(--color-text-secondary)', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
                                            {isRest ? 'Rest' : String(wType)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── SESSION CARD ── */}
                    {selIsRest ? (
                        <div className="today-banner" style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '20px', flexShrink: 0,
                                background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
                            }}>😴</div>
                            <div>
                                <p className="label-caps" style={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}>{selDayName} • Recovery</p>
                                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.75rem', color: 'var(--color-text-secondary)', letterSpacing: '-0.02em' }}>
                                    Rest Day
                                </h2>
                                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                    Focus on quality sleep and hydration today. Your muscles are rebuilding! ⚡
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="today-banner" style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <p className="label-caps" style={{ marginBottom: '8px', color: 'var(--color-text-muted)', letterSpacing: '0.2em' }}>
                                        {selDayName} — {selIsToday ? "Today's Session" : 'Scheduled'}
                                    </p>
                                    <h2 style={{
                                        fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.85rem',
                                        letterSpacing: '-0.02em', lineHeight: 1.1,
                                        background: 'linear-gradient(135deg, var(--color-accent), var(--color-violet))',
                                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                                    }}>
                                        {String(selWorkoutLabel)} Day
                                    </h2>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                                        {selMuscles.map(m => (
                                            <span key={m} className="tag-pill">{m}</span>
                                        ))}
                                    </div>
                                </div>
                                {selIsToday && (
                                    sessionDoneToday ? (
                                        <div style={{
                                            flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            gap: '6px', padding: '14px 24px', borderRadius: '18px',
                                            background: 'var(--color-lime-soft)', border: '1px solid var(--color-success)',
                                        }}>
                                            <span style={{ fontSize: '1.25rem', color: 'var(--color-success)' }}>✓</span>
                                            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-success)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Done!</span>
                                        </div>
                                    ) : (
                                        <Link href="/active-workout" className="btn-primary" style={{ flexShrink: 0, textDecoration: 'none', padding: '16px 32px', fontSize: '1rem' }}>
                                            START SESSION ▶
                                        </Link>
                                    )
                                )}
                            </div>

                            {selExercises.length > 0 && (
                                <div style={{ marginTop: '28px', paddingTop: '28px', borderTop: '1px solid var(--color-border)' }}>
                                    <p className="label-caps" style={{ marginBottom: '14px', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Target Exercises</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {selExercises.map(ex => (
                                            <span key={ex} style={{
                                                fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500,
                                                background: 'var(--color-bg-secondary)', padding: '6px 14px',
                                                borderRadius: '10px', border: '1px solid var(--color-border)',
                                                fontFamily: "'Space Grotesk', sans-serif"
                                            }}>{ex}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

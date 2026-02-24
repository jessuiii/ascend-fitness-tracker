// Split schedule library
// Each user can assign a workout type to each day of the week

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export type DayOfWeek = typeof DAYS[number];

// Workout types a day can be assigned
export const WORKOUT_TYPES = [
    'Push',
    'Pull',
    'Legs',
    'Upper',
    'Lower',
    'Full Body',
    'Chest',
    'Back',
    'Shoulders',
    'Arms',
    'Core',
    'Custom',
    'Rest',
] as const;
export type WorkoutType = typeof WORKOUT_TYPES[number];

// Maps a workout type to the muscle groups it covers
export const workoutMuscleGroups: Record<WorkoutType, string[]> = {
    Push: ['Chest', 'Shoulders', 'Triceps'],
    Pull: ['Back', 'Biceps'],
    Legs: ['Legs', 'Calves'],
    Upper: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
    Lower: ['Legs', 'Calves', 'Core'],
    'Full Body': ['Chest', 'Back', 'Shoulders', 'Legs', 'Core'],
    Chest: ['Chest'],
    Back: ['Back'],
    Shoulders: ['Shoulders'],
    Arms: ['Biceps', 'Triceps'],
    Core: ['Core'],
    Custom: [],
    Rest: [],
};

// Default schedules for each split (fallback if user hasn't customized)
export const defaultSchedules: Record<string, Record<DayOfWeek, WorkoutType>> = {
    ppl: {
        Monday: 'Push', Tuesday: 'Pull', Wednesday: 'Legs',
        Thursday: 'Push', Friday: 'Pull', Saturday: 'Legs', Sunday: 'Rest',
    },
    upper_lower: {
        Monday: 'Upper', Tuesday: 'Lower', Wednesday: 'Rest',
        Thursday: 'Upper', Friday: 'Lower', Saturday: 'Rest', Sunday: 'Rest',
    },
    bro_split: {
        Monday: 'Chest', Tuesday: 'Back', Wednesday: 'Shoulders',
        Thursday: 'Arms', Friday: 'Legs', Saturday: 'Core', Sunday: 'Rest',
    },
    full_body: {
        Monday: 'Full Body', Tuesday: 'Rest', Wednesday: 'Full Body',
        Thursday: 'Rest', Friday: 'Full Body', Saturday: 'Rest', Sunday: 'Rest',
    },
    custom: {
        Monday: 'Rest', Tuesday: 'Rest', Wednesday: 'Rest',
        Thursday: 'Rest', Friday: 'Rest', Saturday: 'Rest', Sunday: 'Rest',
    },
};

// Get today's workout type from a schedule
export function getTodayWorkout(schedule: Record<DayOfWeek, { type: WorkoutType; label?: string }>): {
    day: DayOfWeek;
    workoutType: WorkoutType;
    workoutLabel: string;
    muscleGroups: string[];
    isRest: boolean;
} {
    const dayIndex = new Date().getDay(); // 0=Sun, 1=Mon, ...6=Sat
    // Convert JS day (0=Sun) to our DAYS array (0=Mon)
    const day = DAYS[dayIndex === 0 ? 6 : dayIndex - 1];
    const item = schedule[day] || { type: 'Rest' };
    const rawType = item.type;
    const workoutType = (typeof rawType === 'object' && rawType !== null ? (rawType as any).type || 'Rest' : rawType || 'Rest') as WorkoutType;
    const rawLabel = item.label;
    const workoutLabel = String(typeof rawLabel === 'object' && rawLabel !== null ? (rawLabel as any).label || (rawLabel as any).type || workoutType : (rawLabel || workoutType));
    return {
        day,
        workoutType,
        workoutLabel,
        muscleGroups: workoutMuscleGroups[workoutType] || [],
        isRest: workoutType === 'Rest',
    };
}

// Parse a saved schedule from DB (stored as JSON object)
export function parseSchedule(
    raw: Record<string, any> | null | undefined,
    split: string
): Record<DayOfWeek, { type: WorkoutType; label?: string }> {
    if (!raw) {
        const base = defaultSchedules[split] || defaultSchedules.custom;
        const converted: Record<string, any> = {};
        Object.entries(base).forEach(([d, t]) => {
            converted[d] = { type: t, label: t + ' Day' };
        });
        return converted as Record<DayOfWeek, { type: WorkoutType; label?: string }>;
    }
    // Handle legacy string-only schedules
    const firstVal = Object.values(raw)[0];
    if (typeof firstVal === 'string') {
        const converted: Record<string, any> = {};
        Object.entries(raw).forEach(([d, t]) => {
            converted[d] = { type: t, label: (t as string) + ' Day' };
        });
        return converted as Record<DayOfWeek, { type: WorkoutType; label?: string }>;
    }
    // Defensively ensure all type values are strings (not nested objects)
    const sanitized: Record<string, any> = {};
    Object.entries(raw).forEach(([d, v]) => {
        if (v && typeof v === 'object') {
            const t = typeof v.type === 'object' && v.type !== null ? (v.type.type || 'Rest') : (v.type || 'Rest');
            sanitized[d] = { type: String(t), label: v.label ? String(typeof v.label === 'object' ? v.label.label || v.label.type || t : v.label) : undefined };
        } else {
            sanitized[d] = { type: String(v || 'Rest') };
        }
    });
    return sanitized as Record<DayOfWeek, { type: WorkoutType; label?: string }>;
}

// Get list of active workout days from a schedule
export function getWorkoutDays(schedule: Record<DayOfWeek, { type: WorkoutType; label?: string }> | null): { day: DayOfWeek; type: WorkoutType; label: string }[] {
    if (!schedule) return [];
    return DAYS.map(day => {
        const item = schedule[day];
        return {
            day,
            type: item.type,
            label: item.label || item.type,
        };
    }).filter(d => d.type !== 'Rest');
}

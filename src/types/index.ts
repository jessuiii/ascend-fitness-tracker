export interface Profile {
    id: string;
    username?: string;
    height: number;
    weight: number;
    selected_path: PathType;
    gym_experience: 'beginner' | 'experienced';
    workout_split: WorkoutSplit;
    schedule: Record<string, { type: string; label?: string }> | null;
    skipped_muscle_groups: string[] | null;
    created_at: string;
}

export interface Workout {
    id: string;
    user_id: string;
    muscle_group: string;
    exercise_name: string;
    weight: number;
    reps: number;
    sets: number;
    estimated_1rm: number;
    date: string;
    custom_workout_name?: string;
    custom_day_label?: string;
}

export interface StrengthScore {
    id: string;
    user_id: string;
    total_strength_score: number;
    tier_name: string;
    squat_1rm: number;
    bench_1rm: number;
    deadlift_1rm: number;
    updated_at: string;
}

export interface ChatConversation {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
}

export interface ChatMessage {
    id: string;
    user_id: string;
    conversation_id?: string;
    message: string;
    sender: 'user' | 'ai';
    created_at: string;
}

export interface CustomRoutine {
    id: string;
    user_id: string;
    name: string;
    muscle_groups: string[];
    created_at: string;
}

export type MuscleGroup =
    | 'Chest'
    | 'Back'
    | 'Shoulders'
    | 'Biceps'
    | 'Triceps'
    | 'Legs'
    | 'Core'
    | 'Calves';

export type PathType = 'shred' | 'strength' | 'hybrid';
export type WorkoutSplit = 'ppl' | 'upper_lower' | 'bro_split' | 'full_body' | 'custom';

export interface TierInfo {
    name: string;
    index: number;
    progress: number;
    nextTier: string | null;
}

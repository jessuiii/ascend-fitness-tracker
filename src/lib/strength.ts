import { Workout } from '@/types';
import { pushExercises, pullExercises, lowerExercises } from './exercises';

/**
 * Epley formula: 1RM = weight × (1 + reps / 30)
 */
export function calculate1RM(weight: number, reps: number): number {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Total Strength Score = (Squat 1RM + Bench 1RM + Deadlift 1RM) / Bodyweight
 */
export function calculateTSS(
    squat1RM: number,
    bench1RM: number,
    deadlift1RM: number,
    bodyweight: number
): number {
    if (bodyweight <= 0) return 0;
    return Math.round(((squat1RM + bench1RM + deadlift1RM) / bodyweight) * 100) / 100;
}

/**
 * Calculate BMI from height (cm) and weight (kg)
 */
export function calculateBMI(heightCm: number, weightKg: number): number {
    const heightM = heightCm / 100;
    if (heightM <= 0) return 0;
    return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Get the best 1RM per category from all workouts.
 * If the user doesn't log Squat/Bench/Deadlift specifically,
 * we use the strongest exercise from each category.
 */
export function getBestLifts(workouts: Workout[]): {
    squat1RM: number;
    bench1RM: number;
    deadlift1RM: number;
} {
    let squat1RM = 0;
    let bench1RM = 0;
    let deadlift1RM = 0;

    // First try exact matches
    for (const w of workouts) {
        const rm = w.estimated_1rm || calculate1RM(w.weight, w.reps);
        if (w.exercise_name === 'Barbell Squat' && rm > squat1RM) squat1RM = rm;
        if (w.exercise_name === 'Barbell Bench Press' && rm > bench1RM) bench1RM = rm;
        if (w.exercise_name === 'Deadlift' && rm > deadlift1RM) deadlift1RM = rm;
    }

    // Fall back to category bests if no exact match
    if (squat1RM === 0) {
        for (const w of workouts) {
            if (lowerExercises.includes(w.exercise_name)) {
                const rm = w.estimated_1rm || calculate1RM(w.weight, w.reps);
                if (rm > squat1RM) squat1RM = rm;
            }
        }
    }

    if (bench1RM === 0) {
        for (const w of workouts) {
            if (pushExercises.includes(w.exercise_name)) {
                const rm = w.estimated_1rm || calculate1RM(w.weight, w.reps);
                if (rm > bench1RM) bench1RM = rm;
            }
        }
    }

    if (deadlift1RM === 0) {
        for (const w of workouts) {
            if (pullExercises.includes(w.exercise_name)) {
                const rm = w.estimated_1rm || calculate1RM(w.weight, w.reps);
                if (rm > deadlift1RM) deadlift1RM = rm;
            }
        }
    }

    return { squat1RM, bench1RM, deadlift1RM };
}

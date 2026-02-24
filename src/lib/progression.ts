/**
 * Ascend — Double Progression Logic
 *
 * Each rep range has a "next" partner one step up.
 * When the user completes all sets within the NEXT range → add 2.5kg, reset to base.
 *
 * 2-4 → 4-6 → +2.5kg → 2-4
 * 4-6 → 6-8 → +2.5kg → 4-6
 * 6-8 → 8-10 → +2.5kg → 6-8
 * 8-10 → 10-12 → +2.5kg → 8-10
 */

export const REP_RANGES = ['2-4', '4-6', '6-8', '8-10', '10-12', '12-15', '15+'] as const;
export type RepRange = typeof REP_RANGES[number];

/** Map each base range to the "next" range one step up */
export const NEXT_REP_RANGE: Record<string, string> = {
    '2-4': '4-6',
    '4-6': '6-8',
    '6-8': '8-10',
    '8-10': '10-12',
    '10-12': '12-15',
    '12-15': '15+',
    '15+': '15+',
};

/** Mid-point rep count for 1RM calculation */
export const REP_RANGE_MIDPOINT: Record<string, number> = {
    '2-4': 3,
    '4-6': 5,
    '6-8': 7,
    '8-10': 9,
    '10-12': 11,
    '12-15': 13,
    '15+': 16,
};

/**
 * Returns the upper bound of a rep range string.
 * Used to detect whether the user "hit the top" of their range.
 */
export function repRangeUpperBound(range: string): number {
    if (range === '15+') return 16;
    const parts = range.split('-');
    return parseInt(parts[1] ?? parts[0], 10);
}

/**
 * Given the current planned workout state, return a progression suggestion.
 *
 * @param currentRepRange - e.g. '8-10'
 * @param progressionState - 'base' | 'next'
 * @param targetWeight - current target weight in kg
 * @param lastSessionReps - actual reps performed in last session (midpoint or exact)
 * @param lastSessionSetsCompleted - how many sets were completed out of target
 * @param targetSets - how many sets are planned
 */
export function getProgressionSuggestion(
    currentRepRange: string,
    progressionState: 'base' | 'next',
    targetWeight: number,
    lastSessionReps: number,
    lastSessionSetsCompleted: number,
    targetSets: number,
): {
    suggestedRepRange: string;
    suggestedWeight: number;
    nextProgressionState: 'base' | 'next';
    message: string;
} {
    const allSetsComplete = lastSessionSetsCompleted >= targetSets;
    const hitUpperBound = lastSessionReps >= repRangeUpperBound(currentRepRange);

    if (!allSetsComplete || !hitUpperBound) {
        // Not done with this range yet — stay here
        return {
            suggestedRepRange: currentRepRange,
            suggestedWeight: targetWeight,
            nextProgressionState: progressionState,
            message: `Keep pushing — aim for ${repRangeUpperBound(currentRepRange)} reps all sets`,
        };
    }

    if (progressionState === 'base') {
        // Completed base range → move up to next range, same weight
        const nextRange = NEXT_REP_RANGE[currentRepRange];
        return {
            suggestedRepRange: nextRange,
            suggestedWeight: targetWeight,
            nextProgressionState: 'next',
            message: `Great work! Push to ${nextRange} reps this week`,
        };
    } else {
        // Completed next range → add 2.5kg, drop back to base range
        // Base range = one step below current
        const baseRange = Object.entries(NEXT_REP_RANGE).find(([, next]) => next === currentRepRange)?.[0] ?? currentRepRange;
        return {
            suggestedRepRange: baseRange,
            suggestedWeight: targetWeight + 2.5,
            nextProgressionState: 'base',
            message: `+2.5kg unlocked! Drop back to ${baseRange} reps with more weight 💪`,
        };
    }
}

/** Heavy compound lifts that get a 2:30 rest timer */
export const HEAVY_COMPOUNDS = new Set([
    'Barbell Bench Press',
    'Incline Bench Press',
    'Incline Dumbbell Chest Press',
    'Lat Pulldown',
    'Pull-ups',
    'Deadlift',
    'Barbell Squat',
    'Romanian Deadlift',
    'Barbell Row',
    'Overhead Press',
    'Hack Squat',
    'Bulgarian Split Squat',
    'Hip Thrust',
    'T-Bar Row',
    'Close Grip Bench Press',
]);

/** Returns rest time in seconds for a given exercise */
export function getRestTime(exerciseName: string): number {
    return HEAVY_COMPOUNDS.has(exerciseName) ? 150 : 120; // 2:30 or 2:00
}

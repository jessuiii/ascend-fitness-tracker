import { MuscleGroup } from '@/types';

export const exerciseDatabase: Record<MuscleGroup, string[]> = {
    Chest: [
        'Barbell Bench Press',
        'Incline Bench Press',
        'Incline Dumbbell Chest Press',
        'Dumbbell Press',
        'Chest Fly',
        'Machine Press',
        'Cable Crossover',
        'Dips (Chest)',
        'Push-ups',
    ],
    Back: [
        'Deadlift',
        'Barbell Row',
        'Lat Pulldown',
        'Pull-ups',
        'Seated Row',
        'T-Bar Row',
        'Face Pulls',
        'Single Arm Dumbbell Row',
    ],
    Shoulders: [
        'Overhead Press',
        'Dumbbell Shoulder Press',
        'Dumbbell Lateral Raise',
        'Front Raise',
        'Arnold Press',
        'Reverse Fly',
        'Upright Row',
        'Cable Lateral Raise',
    ],
    Biceps: [
        'Barbell Curl',
        'Dumbbell Curl',
        'Hammer Curl',
        'Preacher Curl',
        'Concentration Curl',
        'Cable Curl',
        'EZ Bar Curl',
    ],
    Triceps: [
        'Tricep Pushdown',
        'Overhead Tricep Extension',
        'Skull Crushers',
        'Close Grip Bench Press',
        'Dips (Triceps)',
        'Kickbacks',
        'Cable Overhead Extension',
    ],
    Legs: [
        'Barbell Squat',
        'Leg Press',
        'Romanian Deadlift',
        'Leg Extension',
        'Leg Curl',
        'Bulgarian Split Squat',
        'Hip Thrust',
        'Lunges',
        'Hack Squat',
        'Goblet Squat',
    ],
    Core: [
        'Plank',
        'Cable Crunch',
        'Hanging Leg Raise',
        'Ab Rollout',
        'Russian Twist',
        'Decline Sit-ups',
        'Woodchoppers',
    ],
    Calves: [
        'Standing Calf Raise',
        'Seated Calf Raise',
        'Donkey Calf Raise',
        'Leg Press Calf Raise',
        'Smith Machine Calf Raise',
    ],
};

export const muscleGroups: MuscleGroup[] = Object.keys(exerciseDatabase) as MuscleGroup[];

// Categories for strength estimation when SBD not directly logged
export const pushExercises = [
    'Barbell Bench Press',
    'Incline Bench Press',
    'Incline Dumbbell Chest Press',
    'Dumbbell Press',
    'Machine Press',
    'Overhead Press',
    'Dumbbell Shoulder Press',
    'Close Grip Bench Press',
];

export const pullExercises = [
    'Deadlift',
    'Barbell Row',
    'Lat Pulldown',
    'Pull-ups',
    'Seated Row',
    'T-Bar Row',
    'Single Arm Dumbbell Row',
];

export const lowerExercises = [
    'Barbell Squat',
    'Leg Press',
    'Romanian Deadlift',
    'Bulgarian Split Squat',
    'Hip Thrust',
    'Hack Squat',
    'Goblet Squat',
    'Lunges',
];

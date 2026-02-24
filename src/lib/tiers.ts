import { PathType, TierInfo } from '@/types';

const tierPaths: Record<PathType, string[]> = {
    shred: ['Lean', 'Defined', 'Shredded', 'Stage', 'Elite Physique'],
    strength: ['Iron', 'Heavy', 'Strong', 'Max', 'Elite Lifter'],
    hybrid: ['Built', 'Athletic', 'Powerful', 'Complete', 'Prime'],
};

// Thresholds for TSS (Total Strength Score) to reach each tier
// These are relative-strength thresholds that scale across all paths
const tssThresholds: Record<PathType, number[]> = {
    // Shred: favors lower BMI + moderate strength
    shred: [0, 2.0, 3.5, 5.0, 6.5],
    // Strength: pure strength focus
    strength: [0, 3.0, 5.0, 7.0, 9.0],
    // Hybrid: balanced approach
    hybrid: [0, 2.5, 4.0, 6.0, 8.0],
};

// BMI adjustments for shred path — bonus for lower BMI
function getShredBMIBonus(bmi: number): number {
    if (bmi < 20) return 1.0;
    if (bmi < 22) return 0.5;
    if (bmi < 25) return 0.0;
    if (bmi < 28) return -0.5;
    return -1.0;
}

/**
 * Determine the user's current tier based on path, TSS, and BMI
 */
export function getTierInfo(
    path: PathType,
    tss: number,
    bmi: number
): TierInfo {
    const tiers = tierPaths[path];
    const thresholds = tssThresholds[path];

    // Apply BMI bonus for shred path
    let effectiveTSS = tss;
    if (path === 'shred') {
        effectiveTSS += getShredBMIBonus(bmi);
    }

    // Find current tier index
    let tierIndex = 0;
    for (let i = thresholds.length - 1; i >= 0; i--) {
        if (effectiveTSS >= thresholds[i]) {
            tierIndex = i;
            break;
        }
    }

    // Calculate progress to next tier
    let progress = 0;
    const nextTierIndex = tierIndex + 1;
    if (nextTierIndex < thresholds.length) {
        const currentThreshold = thresholds[tierIndex];
        const nextThreshold = thresholds[nextTierIndex];
        const range = nextThreshold - currentThreshold;
        if (range > 0) {
            progress = Math.min(
                100,
                Math.round(((effectiveTSS - currentThreshold) / range) * 100)
            );
        }
    } else {
        progress = 100; // Max tier reached
    }

    return {
        name: tiers[tierIndex],
        index: tierIndex,
        progress,
        nextTier: nextTierIndex < tiers.length ? tiers[nextTierIndex] : null,
    };
}

export function getTierNames(path: PathType): string[] {
    return tierPaths[path];
}

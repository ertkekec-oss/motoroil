import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

const dec = (val: number | string | Decimal) => new Decimal(val);

export class SalesPerformanceEngine {

    // 1. Process Period Performance
    static async processPeriodPerformance(assignmentId: string, actualSalesValue: number) {
        const assignment = await prisma.targetAssignment.findUnique({
            where: { id: assignmentId },
            include: { period: true, plan: true }
        });
        if (!assignment) throw new Error("Assignment not found");

        const target = assignment.target;
        const actual = dec(actualSalesValue);

        let achievement = dec(0);
        if (!target.equals(0)) {
            achievement = actual.dividedBy(target);
        }

        // Record performance
        const perf = await prisma.performance.create({
            data: {
                assignmentId,
                actual,
                achievement,
                isCumulative: false
            }
        });

        // 2. Bonus Calculator
        let baseBonus = assignment.bonusPotential;
        let accelerator = dec(1);
        let finalBonus = dec(0);

        const achNum = achievement.toNumber();

        if (achNum < 0.90) {
            finalBonus = dec(0);
        } else if (achNum >= 0.90 && achNum < 1) {
            finalBonus = baseBonus.mul(0.5);
        } else {
            // Apply accelerator (achievement > 1)
            if (achNum >= 1.30) accelerator = dec(2.0);
            else if (achNum >= 1.20) accelerator = dec(1.5);
            else if (achNum >= 1.10) accelerator = dec(1.2);
            else accelerator = dec(1.0);

            finalBonus = baseBonus.mul(accelerator);
        }

        const bonusResult = await prisma.bonusResult.create({
            data: {
                assignmentId,
                baseBonus,
                accelerator,
                finalBonus,
                isRecovered: false
            }
        });

        // 3. Accumulate Cumulative Recovery if Q2 or Q4
        const periodName = assignment.period.name;
        if (periodName === 'Q2' || periodName === 'Q4') {
            await this.processCumulativeRecovery(assignment.planId, assignment.staffId, periodName);
        }

        // 4. Update Gamification Badges
        await this.evaluateGamification(assignment.plan.companyId, assignment.staffId, assignment.periodId, achNum, actualSalesValue);

        return bonusResult;
    }

    // 5. Cumulative Recovery
    static async processCumulativeRecovery(planId: string, staffId: string, currentPeriodName: string) {
        const periodsToCheck = currentPeriodName === 'Q2' ? ['Q1', 'Q2'] : ['Q3', 'Q4'];

        const assignments = await prisma.targetAssignment.findMany({
            where: { planId, staffId, period: { name: { in: periodsToCheck } } },
            include: { performances: true, bonusResults: true, period: true }
        });

        if (assignments.length < 2) return;

        let totalTarget = dec(0);
        let totalActual = dec(0);
        let bonusIdsToUpdate: string[] = [];

        for (const ass of assignments) {
            totalTarget = totalTarget.add(ass.target);

            const perf = ass.performances[0];
            if (perf) totalActual = totalActual.add(perf.actual);

            const bResult = ass.bonusResults[0];
            if (bResult) {
                if (bResult.finalBonus.lessThan(ass.bonusPotential)) {
                    bonusIdsToUpdate.push(bResult.id); // Potential to recover
                }
            }
        }

        const cumulativeAch = totalTarget.equals(0) ? dec(1) : totalActual.dividedBy(totalTarget);

        // Return previously cut bonuses if cumulative is >= 1
        if (cumulativeAch.toNumber() >= 1 && bonusIdsToUpdate.length > 0) {
            for (const bId of bonusIdsToUpdate) {
                const bRes = await prisma.bonusResult.findUnique({ where: { id: bId }, include: { assignment: true } });
                if (bRes) {
                    await prisma.bonusResult.update({
                        where: { id: bId },
                        data: {
                            finalBonus: bRes.assignment.bonusPotential, // recover to 100% of base
                            isRecovered: true
                        }
                    });
                }
            }
        }
    }

    // 6. Gamification System
    static async evaluateGamification(companyId: string, staffId: string, periodId: string, achievement: number, actual: number) {
        // First Sale badge
        if (actual > 0) {
            const existFirst = await prisma.achievementBadge.findFirst({ where: { staffId, badgeType: 'FIRST_SALE' } });
            if (!existFirst) await prisma.achievementBadge.create({ data: { staffId, badgeType: 'FIRST_SALE' } });
        }

        // Target Crusher
        if (achievement >= 1.2) {
            await prisma.achievementBadge.create({ data: { staffId, badgeType: 'TARGET_CRUSHER' } });
        }

        // Streak Check (Consistency)
        const allPerfs = await prisma.performance.findMany({
            where: { assignment: { staffId } },
            orderBy: { createdAt: 'desc' },
            take: 6
        });

        let currentStreak = 0;
        for (const p of allPerfs) {
            if (p.achievement.toNumber() >= 1) currentStreak++;
            else break;
        }

        if (currentStreak >= 3) {
            // Check if we already gave this streak badge
            const existingStreak = await prisma.achievementBadge.findFirst({
                where: { staffId, badgeType: 'CONSISTENCY', streakCount: currentStreak }
            });
            if (!existingStreak) {
                await prisma.achievementBadge.create({ data: { staffId, badgeType: 'CONSISTENCY', streakCount: currentStreak } });
            }
        }
    }

    // 8. AI Target Recommendation
    static async generateAITargetSuggestion(planId: string, historicalAverage: number) {
        const safe = dec(historicalAverage * 1.05);
        const balanced = dec(historicalAverage * 1.12);
        const aggressive = dec(historicalAverage * 1.25);

        return prisma.aITargetSuggestion.create({
            data: {
                planId,
                safeTarget: safe,
                balancedTarget: balanced,
                aggressiveTarget: aggressive,
                analysisData: { trend: "Growth identified, predicting solid conversion in upcoming quarters." }
            }
        });
    }

    // Dashboard Data Aggregator
    static async getDashboardData(staffId: string) {
        const assignments = await prisma.targetAssignment.findMany({
            where: { staffId },
            include: { period: true, performances: true, bonusResults: true }
        });

        const badges = await prisma.achievementBadge.findMany({
            where: { staffId }
        });

        const latestLeaderboard = await prisma.leaderboardScore.findFirst({
            where: { staffId },
            orderBy: { createdAt: 'desc' }
        });

        return { assignments, badges, leaderboard: latestLeaderboard };
    }
}

import { Exercise, Evaluation, Student, SchoolClass, Gender } from "@/types/types";

export interface StudentRecordItem {
    studentId: string;
    studentName: string;
    gender: Gender;
    className: string;
    schoolYear: string;
    isArchived: boolean;
    performanceValue: string | number;
    performanceNum: number | null;
    displayPerformance: string;
    unit: string;
    score: number;
    createdAt: string;
}

export interface GenderRecord {
    record: StudentRecordItem | null;
    topList: StudentRecordItem[];
    averagePerformance: number | null;
    averageScore: number;
    totalEvaluations: number;
    archivedEvaluationsCount: number;
}

export interface ExerciseRecordsSummary {
    exerciseId: string;
    exerciseName: string;
    unit: string;
    isLowerBetter: boolean;
    male: GenderRecord;
    female: GenderRecord;
    hasHistoricalData: boolean;
    totalEvaluations: number;
}

/**
 * Determines whether a lower numeric value is better for this exercise.
 * For instance, in track & sprints (seconds), lower time is better.
 * For reps, cm, m, higher is better.
 */
export function isExerciseLowerBetter(exercise: Exercise): boolean {
    // If criteria based or qualitativo, higher score is always better
    if (
        exercise.evaluationType === 'criteria' ||
        exercise.evaluationType === 'criteria-ranges' ||
        exercise.unit === 'qualitativo'
    ) {
        return false;
    }

    if (exercise.unit === 'sec') {
        // Inspect evaluation ranges if present
        const rangesM = exercise.evaluationRanges?.M;
        const rangesF = exercise.evaluationRanges?.F;
        const ranges = (rangesM && rangesM.length > 1) ? rangesM : (rangesF && rangesF.length > 1) ? rangesF : null;

        if (ranges && ranges.length > 1) {
            // Find highest score range and lowest score range
            const sortedByScore = [...ranges].sort((a, b) => b.score - a.score);
            const highestScoreRange = sortedByScore[0];
            const lowestScoreRange = sortedByScore[sortedByScore.length - 1];

            if (highestScoreRange.min < lowestScoreRange.min) {
                return true; // lower seconds = higher score (e.g. 50m sprint)
            }
            if (highestScoreRange.min > lowestScoreRange.min) {
                return false; // higher seconds = higher score (e.g. plank hold)
            }
        }

        // Keywords check for sprints/running
        const runningRegex = /corsa|velocit|scatto|sprint|navetta|cooper|100m|50m|60m|1000m|tempo/i;
        if (runningRegex.test(exercise.name)) {
            return true;
        }

        // Default for 'sec' is true (time trial)
        return true;
    }

    // For 'reps', 'cm', 'm', 'qualitativo' higher is always better
    return false;
}

/**
 * Helper to parse numeric performance value
 */
export function parsePerformanceNumber(val: string | number | null | undefined): number | null {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return isNaN(val) ? null : val;
    const str = val.toString().trim();
    // Do not parse JSON objects or arrays (criteria scores)
    if (str.startsWith('{') || str.startsWith('[')) return null;
    const cleanStr = str.replace(',', '.');
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? null : parsed;
}

/**
 * Helper to format score cleanly (e.g., 8 or 8.5)
 */
export function formatScore(score: number): string {
    const rounded = Math.round(score * 10) / 10;
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
}

/**
 * Formats the performance string gracefully.
 * Never outputs raw JSON strings like {"Salto": 500}.
 */
export function formatPerformanceDisplay(
    performanceValue: string | number | null | undefined,
    score: number,
    unit: string,
    evaluationType?: string
): string {
    const formattedScore = formatScore(score);

    // If criteria based or qualitativo, display the overall score out of 10
    if (evaluationType === 'criteria' || evaluationType === 'criteria-ranges' || unit === 'qualitativo') {
        return `Voto ${formattedScore}/10`;
    }

    if (performanceValue !== null && performanceValue !== undefined && performanceValue !== '') {
        const valStr = performanceValue.toString().trim();
        // Catch JSON string fallback
        if (valStr.startsWith('{') || valStr.startsWith('[')) {
            return `Voto ${formattedScore}/10`;
        }

        const perfNum = parsePerformanceNumber(valStr);
        if (perfNum !== null) {
            if (unit && unit !== 'qualitativo') {
                return `${perfNum} ${unit}`;
            }
            return `${perfNum}`;
        }
    }

    if (score > 0) {
        return `Voto ${formattedScore}/10`;
    }

    return '-';
}

/**
 * Calculates historical records for an exercise divided by gender (M/F),
 * taking into account all evaluations from active and archived classes.
 */
export function getExerciseRecords(
    exercise: Exercise | undefined,
    evaluations: Evaluation[],
    students: Student[],
    classes: SchoolClass[]
): ExerciseRecordsSummary | null {
    if (!exercise) return null;

    const lowerBetter = isExerciseLowerBetter(exercise);

    // Create lookup maps
    const studentMap = new Map<string, Student>();
    students.forEach(s => studentMap.set(s.id, s));

    const classMap = new Map<string, SchoolClass>();
    classes.forEach(c => classMap.set(c.id, c));

    // Filter valid evaluations for this exercise
    const relevantEvals = evaluations.filter(e => {
        if (e.exerciseId !== exercise.id) return false;
        const hasScore = typeof e.score === 'number' && e.score > 0;
        const hasPerf = e.performanceValue !== null && e.performanceValue !== undefined && e.performanceValue !== '';
        return hasScore || hasPerf;
    });

    // Helper to extract student record item
    const toRecordItem = (ev: Evaluation): StudentRecordItem | null => {
        const student = studentMap.get(ev.studentId);
        if (!student) return null;

        const cls = classMap.get(student.currentClassId) ||
            classes.find(c => c.students && c.students.includes(student.id));

        const perfNum = parsePerformanceNumber(ev.performanceValue);
        const score = typeof ev.score === 'number' ? Math.round(ev.score * 10) / 10 : 0;
        const displayPerf = formatPerformanceDisplay(
            ev.performanceValue,
            score,
            exercise.unit,
            exercise.evaluationType
        );

        return {
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`.trim(),
            gender: student.gender || 'M',
            className: cls?.className || 'N/D',
            schoolYear: cls?.schoolYear || '',
            isArchived: Boolean(cls?.isArchived),
            performanceValue: ev.performanceValue ?? '',
            performanceNum: perfNum,
            displayPerformance: displayPerf,
            unit: exercise.unit,
            score: score,
            createdAt: ev.createdAt,
        };
    };

    const recordItems: StudentRecordItem[] = [];
    relevantEvals.forEach(ev => {
        const item = toRecordItem(ev);
        if (item) recordItems.push(item);
    });

    // Comparator function to rank performances
    const compareRecordItems = (a: StudentRecordItem, b: StudentRecordItem): number => {
        const aPerf = a.performanceNum;
        const bPerf = b.performanceNum;

        // If both have numeric performance value, compare them
        if (aPerf !== null && bPerf !== null) {
            if (aPerf !== bPerf) {
                return lowerBetter ? aPerf - bPerf : bPerf - aPerf;
            }
        } else if (aPerf !== null && bPerf === null) {
            return -1;
        } else if (aPerf === null && bPerf !== null) {
            return 1;
        }

        // Fallback to score
        if (b.score !== a.score) {
            return b.score - a.score;
        }

        // Tie-breaker: older record (achieved first)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    };

    // Helper to process one gender
    const processGender = (targetGender: Gender): GenderRecord => {
        const items = recordItems.filter(item => item.gender === targetGender);

        if (items.length === 0) {
            return {
                record: null,
                topList: [],
                averagePerformance: null,
                averageScore: 0,
                totalEvaluations: 0,
                archivedEvaluationsCount: 0,
            };
        }

        // Deduplicate by studentId to find each student's personal best
        const studentBestMap = new Map<string, StudentRecordItem>();
        items.forEach(item => {
            const existing = studentBestMap.get(item.studentId);
            if (!existing) {
                studentBestMap.set(item.studentId, item);
            } else {
                if (compareRecordItems(item, existing) < 0) {
                    studentBestMap.set(item.studentId, item);
                }
            }
        });

        // Sorted unique student list
        const sortedStudentBests = Array.from(studentBestMap.values()).sort(compareRecordItems);

        // Averages calculation
        const perfValues = items.map(i => i.performanceNum).filter((p): p is number => p !== null);
        const avgPerf = perfValues.length > 0
            ? Math.round((perfValues.reduce((s, v) => s + v, 0) / perfValues.length) * 10) / 10
            : null;

        const scores = items.map(i => i.score).filter(s => s > 0);
        const avgScore = scores.length > 0
            ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10
            : 0;

        const archivedCount = items.filter(i => i.isArchived).length;

        return {
            record: sortedStudentBests[0] || null,
            topList: sortedStudentBests.slice(0, 5),
            averagePerformance: avgPerf,
            averageScore: avgScore,
            totalEvaluations: items.length,
            archivedEvaluationsCount: archivedCount,
        };
    };

    const maleRecord = processGender('M');
    const femaleRecord = processGender('F');

    const hasHistorical = maleRecord.archivedEvaluationsCount > 0 || femaleRecord.archivedEvaluationsCount > 0;

    return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        unit: exercise.unit,
        isLowerBetter: lowerBetter,
        male: maleRecord,
        female: femaleRecord,
        hasHistoricalData: hasHistorical,
        totalEvaluations: relevantEvals.length,
    };
}

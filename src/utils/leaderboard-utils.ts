import { Exercise, Evaluation, Student, SchoolClass } from '@/types/types';

/**
 * Extracts criterion names from an exercise definition
 * Supports both 'criteria' and 'criteria-ranges' evaluation types
 */
export function extractCriteriaFromExercise(exercise: Exercise): string[] {
  if (!exercise) return [];

  // Handle evaluationCriteria (criteria type)
  if (exercise.evaluationCriteria && Array.isArray(exercise.evaluationCriteria)) {
    return exercise.evaluationCriteria.map((c) => c.name);
  }

  // Handle evaluationCriteriaWithRanges (criteria-ranges type)
  if (exercise.evaluationCriteriaWithRanges && Array.isArray(exercise.evaluationCriteriaWithRanges)) {
    return exercise.evaluationCriteriaWithRanges.map((c) => c.name);
  }

  return [];
}

/**
 * Represents a student's score and rank in a specific criterion
 */
export interface CriterionRanking {
  studentId: string;
  studentName: string;
  studentClass?: string; // Class name if showing all classes
  score: number | null; // null if no evaluation for this criterion
  performanceValue: number | string | null; // Raw performance value (25 reps, 120 cm, etc.)
  rank: number | null; // null if no evaluation
}

/**
 * Ranking data for all students in a specific criterion
 */
export interface CriteriaLeaderboard {
  criterionName: string;
  unit?: string; // Unit of measurement (reps, cm, sec, m)
  rankings: CriterionRanking[];
}

/**
 * Filters evaluations by exercise and student list
 */
export function filterEvaluationsByExerciseAndClass(
  evaluations: Evaluation[],
  exerciseId: string,
  students: Student[]
): Evaluation[] {
  if (!evaluations || !students) return [];

  // Get student IDs from the provided list (already filtered by class logic)
  const studentIds = new Set(students.map((s) => s.id));

  // Filter by exercise and student membership
  return evaluations.filter(
    (evaluation) => evaluation.exerciseId === exerciseId && studentIds.has(evaluation.studentId)
  );
}

/**
 * Calculates rankings for each criterion based on filtered evaluations
 * Returns leaderboards for all criteria, sorted by performance value (highest first)
 * Students with multiple evaluations: uses the most recent one per criterion
 * Displays raw performance values (e.g., "25 reps", "120 cm") instead of scores
 */
/**
 * Calculates rankings for each criterion based on filtered evaluations
 * Returns leaderboards for all criteria, sorted by performance value (highest first)
 * Students with multiple evaluations: uses the most recent one per criterion
 * Displays raw performance values (e.g., "25 reps", "120 cm") instead of scores
 */
export function calculateCriteriaRankings(
  evaluations: Evaluation[],
  criteria: string[],
  students: Student[],
  exercise: Exercise,
  classes?: SchoolClass[]
): CriteriaLeaderboard[] {
  const result: CriteriaLeaderboard[] = [];

  // Build class name map for quick lookup
  const classMap = new Map<string, string>();
  if (classes) {
    classes.forEach((cls) => {
      classMap.set(cls.id, cls.className);
    });
  }

  // Build a map of criterion name -> unit
  const criterionUnits = new Map<string, string>();
  if (exercise.evaluationCriteriaWithRanges && Array.isArray(exercise.evaluationCriteriaWithRanges)) {
    exercise.evaluationCriteriaWithRanges.forEach((c) => {
      criterionUnits.set(c.name, c.unit);
    });
  } else if (exercise.evaluationCriteria && Array.isArray(exercise.evaluationCriteria)) {
    // For regular criteria type, use the exercise unit
    exercise.evaluationCriteria.forEach((c) => {
      criterionUnits.set(c.name, exercise.unit || 'reps');
    });
  }

  for (const criterionName of criteria) {
    // Build unique student evaluations (most recent per student per criterion)
    const studentEvaluationMap = new Map<string, Evaluation>();
    for (const evaluation of evaluations) {
      const performanceValues = evaluation.criteriaPerformances || evaluation.criteriaScores;
      if (!performanceValues || !(criterionName in performanceValues)) continue;

      const key = evaluation.studentId;
      const existing = studentEvaluationMap.get(key);
      if (!existing || new Date(evaluation.createdAt) > new Date(existing.createdAt)) {
        studentEvaluationMap.set(key, evaluation);
      }
    }

    // Build rankings with performance values
    const rankingsWithValues: CriterionRanking[] = [];
    for (const student of students) {
      const evaluation = studentEvaluationMap.get(student.id);
      let performanceValue: number | string | null = null;

      if (evaluation?.criteriaPerformances && criterionName in evaluation.criteriaPerformances) {
        performanceValue = evaluation.criteriaPerformances[criterionName];
      } else if (evaluation?.criteriaScores && criterionName in evaluation.criteriaScores) {
        performanceValue = evaluation.criteriaScores[criterionName];
      }

      rankingsWithValues.push({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        studentClass: classMap.get(student.currentClassId),
        score: null,
        performanceValue,
        rank: null,
      });
    }

    // Sort by performance value (highest first, nulls last)
    rankingsWithValues.sort((a, b) => {
      const aVal = typeof a.performanceValue === 'string' ? parseFloat(a.performanceValue) : a.performanceValue;
      const bVal = typeof b.performanceValue === 'string' ? parseFloat(b.performanceValue) : b.performanceValue;
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return (bVal as number) - (aVal as number);
    });

    // Assign ranks (tie handling)
    let currentRank = 1;
    for (let i = 0; i < rankingsWithValues.length; i++) {
      if (rankingsWithValues[i].performanceValue === null) {
        rankingsWithValues[i].rank = null;
      } else {
        if (
          i > 0 &&
          rankingsWithValues[i].performanceValue !== rankingsWithValues[i - 1].performanceValue
        ) {
          currentRank = i + 1;
        }
        rankingsWithValues[i].rank = currentRank;
      }
    }

    result.push({
      criterionName,
      unit: criterionUnits.get(criterionName) || 'reps',
      rankings: rankingsWithValues,
    });
  }

  return result;
}

/**
 * Formats a ranking display string as "Score (#Rank)"
 * Returns empty string if no rank
 */
export function formatRankingDisplay(ranking: CriterionRanking): string {
  if (ranking.score === null || ranking.rank === null) {
    return '-';
  }
  return `${ranking.score.toFixed(1)} (#${ranking.rank})`;
}

/**
 * Gets color for rank badge styling
 */
export function getRankColor(rank: number | null): string {
  if (rank === null) return 'gray';
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'orange';
  return 'blue';
}

// Core type definitions for SportsGradeHub

export type ExerciseType =
    | 'coordinazione'
    | 'forza'
    | 'resistenza'
    | 'velocita'
    | 'flessibilita'
    | 'pallavolo'
    | 'basket'
    | 'calcio'
    | 'atletica'
    | 'ginnastica';

export interface Student {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    classId: string;
    className: string;
    avatar?: string;
    email?: string;
    dateOfBirth?: string;
    gender: 'M' | 'F';
    averageGrade: number;
    totalGrades: number;
    lastActivityDate: string;
    performanceLevel: 'excellent' | 'good' | 'average' | 'needs-improvement';
    trends: {
        improving: boolean;
        percentageChange: number;
    };
}

export interface EvaluationCriteria {
    technical: number; // 1-10
    effort: number; // 1-10
    teamwork?: number; // 1-10 (optional, for team sports)
    overall: number; // 1-10
}

export interface Grade {
    id: string;
    studentId: string;
    exerciseType: ExerciseType;
    exerciseName: string;
    date: string;
    criteria: EvaluationCriteria;
    finalGrade: number; // Weighted average
    notes?: string;
    teacherId?: string;
}

export type EvaluationCriterionType = 'technical' | 'effort' | 'teamwork' | 'overall';

// Evaluation mode for exercises
export type EvaluationMode = 'range' | 'criteria';

// Measurement units for range-based exercises
export type MeasurementUnit = 'cm' | 'm' | 'km' | 'sec' | 'min' | 'reps' | 'kg' | 'points';

// Score range for range-based exercises (e.g., Salto in Lungo)
export interface ScoreRange {
    minValue: number;    // Minimum performance value (e.g., 150 cm)
    maxValue: number;    // Maximum performance value (e.g., 200 cm)  
    score: number;       // Score assigned (1-10 Italian grading)
}

// Custom criterion for criteria-based exercises (e.g., Pallavolo)
export interface CustomCriterion {
    id: string;
    name: string;        // e.g., "Tecnica", "Velocità", "Posizionamento"
    maxScore: number;    // Maximum score for this criterion (default 10)
    weight?: number;     // Optional weight for weighted averaging
}

// Sub-exercise for composite exercises (each can have its own evaluation mode)
export interface SubExerciseItem {
    id: string;
    name: string;
    evaluationMode: 'range' | 'criteria';

    // For range-based sub-exercises
    unit?: MeasurementUnit;
    rangesMale?: ScoreRange[];
    rangesFemale?: ScoreRange[];
    useGenderRanges?: boolean;

    // For criteria-based sub-exercises
    customCriteria?: CustomCriterion[];

    weight?: number; // Optional weight for weighted grading
}

// Legacy sub-exercise interface (kept for backward compatibility)
export interface SubExercise {
    id: string;
    name: string;
    evaluationCriteria: EvaluationCriterionType[];
    weight?: number;
}

// Evaluation mode including composite
export type ExerciseEvaluationMode = 'range' | 'criteria' | 'composite';

export interface Exercise {
    id: string;
    name: string;
    type: ExerciseType;
    description?: string;
    requiresTeamwork: boolean;

    // Evaluation mode ('range', 'criteria', or 'composite')
    evaluationMode: EvaluationMode | 'composite';

    // For range-based exercises (e.g., Salto in Lungo)
    unit?: MeasurementUnit;
    rangesMale?: ScoreRange[];
    rangesFemale?: ScoreRange[];

    // For criteria-based exercises (e.g., Pallavolo)
    customCriteria?: CustomCriterion[];

    // For composite exercises with sub-exercises
    subExerciseItems?: SubExerciseItem[];

    // Legacy: sub-exercises (kept for backward compatibility)
    subExercises?: SubExercise[];
}

export interface Class {
    id: string;
    name: string;
    year: string;
    studentCount: number;
    averageGrade: number;
    totalExercises: number;
    studentIds: string[];
}

export interface PerformanceMetric {
    label: string;
    value: number;
    date: string;

}

export interface TrendData {
    period: string;
    average: number;
    count: number;
}

export interface ClassPerformance {
    classId: string;
    className: string;
    data: PerformanceMetric[];
}

export interface StudentComparison {
    studentId: string;
    studentName: string;
    metrics: {
        [key in ExerciseType]?: number;
    };
}

export interface GradeDistribution {
    range: string;
    count: number;
    percentage: number;
}

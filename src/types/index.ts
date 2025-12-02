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

export interface Exercise {
    id: string;
    name: string;
    type: ExerciseType;
    description?: string;
    requiresTeamwork: boolean;
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

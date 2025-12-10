export type Gender = 'M' | 'F' | 'N';

export interface Student {
    id: string;
    firstName: string;
    lastName: string;
    birthdate?: string;
    gender: Gender;
    justifiedDays: string[];
    currentClassId: string;
    classHistory: ClassHistoryEntry[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ClassHistoryEntry {
    classId: string;
    schoolYear: string;
    archived: boolean;
}

export interface SchoolClass {
    id: string;
    className: string;
    schoolYear: string;
    isArchived: boolean;
    students: Student[];          // ID Studenti
    exerciseGroups: string[];    // ID Gruppi di esercizi
    createdAt: string;
    updatedAt: string;
}

export interface ExerciseGroup {
    id: string;
    groupName: string;
    exercises: string[];
    createdAt: string;
    updatedAt: string;
}

export interface Exercise {
    id: string;
    exerciseGroupId: string;
    name: string;
    unit: 'cm' | 'sec' | 'm' | 'reps' | 'qualitativo';
    maxScore?: number;
    evaluationRanges?: Partial<Record<Gender, ScoreRange[]>>;
    createdAt: string;
    updatedAt: string;
}

export interface ScoreRange {
    min: number;
    max: number;
    score: number;
}

export interface Evaluation {
    studentId: string;
    exerciseId: string;
    performanceValue: string | number;
    score: number;
    createdAt: string;
    updatedAt: string;
    comments?: string;
}

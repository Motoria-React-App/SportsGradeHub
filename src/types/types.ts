export type Gender = 'M' | 'F' | 'N';

// Tipo per la singola giustifica
export interface Justification {
    id: string;         // UUID per identificare la giustifica
    date: string;       // Data della giustifica (YYYY-MM-DD)
    note?: string;      // Nota opzionale
    createdAt: string;  // Quando è stata registrata
}

export interface Student {
    id: string;
    ownerId: string;
    firstName: string;
    lastName: string;
    birthdate?: string;
    gender: Gender;
    justifications: Justification[];  // Array di giustifiche con dettagli
    currentClassId: string;
    classHistory: ClassHistoryEntry[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ClassHistoryEntry {
    classId: string;
    schoolYear: string;
    ownerId: string;
    archived: boolean;
}

export interface SchoolClass {
    id: string;
    ownerId: string;
    className: string;
    schoolYear: string;
    isArchived: boolean;
    students: string[];          // Array di ID Studenti
    exerciseGroups: string[];    // Array di ID Gruppi di esercizi
    assignedExercises: string[]; // Array di ID Esercizi assegnati direttamente
    createdAt: string;
    updatedAt: string;
}

export interface ExerciseGroup {
    id: string;
    ownerId: string;
    groupName: string;
    exercises: string[];         // Array di ID Esercizi
    createdAt: string;
    updatedAt: string;
}

export interface Exercise {
    id: string;
    ownerId: string;
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
    id: string;
    studentId: string;
    ownerId: string;
    exerciseId: string;
    performanceValue: string | number;
    score: number;
    createdAt: string;
    updatedAt: string;
    comments?: string;
}

// ============ EXPANDED TYPES FOR API RESPONSES ============
// These are used when the backend returns nested data (e.g., getClassById)

export interface ExerciseGroupExpanded extends Omit<ExerciseGroup, 'exercises'> {
    exercises: Exercise[];
}

export interface SchoolClassExpanded extends Omit<SchoolClass, 'students' | 'exerciseGroups'> {
    students: Student[];
    studentsCount: number;
    exerciseGroups: ExerciseGroupExpanded[];
    assignedExercisesList?: Exercise[];  // Esercizi assegnati direttamente (espansi)
}


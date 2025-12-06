import type { Student, Grade, Exercise, Class } from '../types';

// Italian first and last names for realistic mock data
const maleNames = [
    'Marco', 'Alessandro', 'Matteo', 'Lorenzo', 'Luca', 'Andrea',
    'Davide', 'Riccardo', 'Simone', 'Federico', 'Gabriele', 'Tommaso',
    'Nicola', 'Antonio', 'Filippo', 'Pietro', 'Giovanni', 'Emanuele',
    'Daniele', 'Stefano', 'Cristian', 'Paolo', 'Michele', 'Giacomo',
    'Roberto', 'Fabio', 'Vincenzo'
];

const femaleNames = [
    'Giulia', 'Francesca', 'Sofia', 'Chiara', 'Valentina', 'Martina',
    'Elena', 'Sara', 'Alessia', 'Beatrice', 'Alice', 'Giorgia',
    'Camilla', 'Laura', 'Elisa', 'Anna', 'Silvia', 'Federica',
    'Roberta', 'Serena', 'Claudia', 'Ilaria', 'Monica', 'Paola',
    'Veronica', 'Daniela', 'Rossella'
];

const lastNames = [
    'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano',
    'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo',
    'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo',
    'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani',
    'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone',
    'Longo', 'Gentile', 'Martinelli', 'Vitale', 'Lombardo', 'Serra'
];

// Exercise definitions
export const exercises: Exercise[] = [
    // Corsa 100m - times in seconds (lower is better)
    {
        id: 'ex1',
        name: 'Corsa 100m',
        type: 'velocita',
        requiresTeamwork: false,
        evaluationMode: 'range',
        unit: 'sec',
        rangesMale: [
            { minValue: 0, maxValue: 12.0, score: 10 },
            { minValue: 12.1, maxValue: 12.8, score: 9 },
            { minValue: 12.9, maxValue: 13.5, score: 8 },
            { minValue: 13.6, maxValue: 14.2, score: 7 },
            { minValue: 14.3, maxValue: 15.0, score: 6 },
            { minValue: 15.1, maxValue: 16.0, score: 5 },
            { minValue: 16.1, maxValue: 999, score: 4 }
        ],
        rangesFemale: [
            { minValue: 0, maxValue: 13.5, score: 10 },
            { minValue: 13.6, maxValue: 14.3, score: 9 },
            { minValue: 14.4, maxValue: 15.0, score: 8 },
            { minValue: 15.1, maxValue: 15.8, score: 7 },
            { minValue: 15.9, maxValue: 16.5, score: 6 },
            { minValue: 16.6, maxValue: 17.5, score: 5 },
            { minValue: 17.6, maxValue: 999, score: 4 }
        ]
    },
    // Corsa 1000m - times in minutes (lower is better, e.g., 3.5 = 3:30)
    {
        id: 'ex2',
        name: 'Corsa 1000m',
        type: 'resistenza',
        requiresTeamwork: false,
        evaluationMode: 'range',
        unit: 'min',
        rangesMale: [
            { minValue: 0, maxValue: 3.3, score: 10 },
            { minValue: 3.31, maxValue: 3.5, score: 9 },
            { minValue: 3.51, maxValue: 3.8, score: 8 },
            { minValue: 3.81, maxValue: 4.0, score: 7 },
            { minValue: 4.01, maxValue: 4.3, score: 6 },
            { minValue: 4.31, maxValue: 4.8, score: 5 },
            { minValue: 4.81, maxValue: 999, score: 4 }
        ],
        rangesFemale: [
            { minValue: 0, maxValue: 4.0, score: 10 },
            { minValue: 4.01, maxValue: 4.3, score: 9 },
            { minValue: 4.31, maxValue: 4.5, score: 8 },
            { minValue: 4.51, maxValue: 4.8, score: 7 },
            { minValue: 4.81, maxValue: 5.2, score: 6 },
            { minValue: 5.21, maxValue: 5.8, score: 5 },
            { minValue: 5.81, maxValue: 999, score: 4 }
        ]
    },
    // Salto in lungo - distance in cm (higher is better)
    {
        id: 'ex3',
        name: 'Salto in lungo',
        type: 'forza',
        requiresTeamwork: false,
        evaluationMode: 'range',
        unit: 'cm',
        rangesMale: [
            { minValue: 450, maxValue: 999, score: 10 },
            { minValue: 420, maxValue: 449, score: 9 },
            { minValue: 390, maxValue: 419, score: 8 },
            { minValue: 360, maxValue: 389, score: 7 },
            { minValue: 330, maxValue: 359, score: 6 },
            { minValue: 300, maxValue: 329, score: 5 },
            { minValue: 0, maxValue: 299, score: 4 }
        ],
        rangesFemale: [
            { minValue: 380, maxValue: 999, score: 10 },
            { minValue: 350, maxValue: 379, score: 9 },
            { minValue: 320, maxValue: 349, score: 8 },
            { minValue: 290, maxValue: 319, score: 7 },
            { minValue: 260, maxValue: 289, score: 6 },
            { minValue: 230, maxValue: 259, score: 5 },
            { minValue: 0, maxValue: 229, score: 4 }
        ]
    },
    // Lancio palla medica - distance in meters (higher is better)
    {
        id: 'ex4',
        name: 'Lancio palla medica',
        type: 'forza',
        requiresTeamwork: false,
        evaluationMode: 'range',
        unit: 'm',
        rangesMale: [
            { minValue: 10, maxValue: 999, score: 10 },
            { minValue: 9, maxValue: 9.99, score: 9 },
            { minValue: 8, maxValue: 8.99, score: 8 },
            { minValue: 7, maxValue: 7.99, score: 7 },
            { minValue: 6, maxValue: 6.99, score: 6 },
            { minValue: 5, maxValue: 5.99, score: 5 },
            { minValue: 0, maxValue: 4.99, score: 4 }
        ],
        rangesFemale: [
            { minValue: 8, maxValue: 999, score: 10 },
            { minValue: 7, maxValue: 7.99, score: 9 },
            { minValue: 6, maxValue: 6.99, score: 8 },
            { minValue: 5.5, maxValue: 5.99, score: 7 },
            { minValue: 5, maxValue: 5.49, score: 6 },
            { minValue: 4, maxValue: 4.99, score: 5 },
            { minValue: 0, maxValue: 3.99, score: 4 }
        ]
    },
    {
        id: 'ex5', name: 'Pallavolo - partita', type: 'pallavolo', requiresTeamwork: true, evaluationMode: 'criteria', customCriteria: [
            { id: 'c1', name: 'Tecnica', maxScore: 10 },
            { id: 'c2', name: 'Posizionamento', maxScore: 10 },
            { id: 'c3', name: 'Collaborazione', maxScore: 10 }
        ]
    },
    {
        id: 'ex6', name: 'Pallavolo - palleggio', type: 'pallavolo', requiresTeamwork: false, evaluationMode: 'criteria', customCriteria: [
            { id: 'c1', name: 'Tecnica', maxScore: 10 },
            { id: 'c2', name: 'Precisione', maxScore: 10 }
        ]
    },
    // Basket tiro libero - points scored out of 10 attempts (higher is better)
    {
        id: 'ex7',
        name: 'Basket - tiro libero',
        type: 'basket',
        requiresTeamwork: false,
        evaluationMode: 'range',
        unit: 'points',
        rangesMale: [
            { minValue: 9, maxValue: 10, score: 10 },
            { minValue: 8, maxValue: 8.99, score: 9 },
            { minValue: 7, maxValue: 7.99, score: 8 },
            { minValue: 6, maxValue: 6.99, score: 7 },
            { minValue: 5, maxValue: 5.99, score: 6 },
            { minValue: 4, maxValue: 4.99, score: 5 },
            { minValue: 0, maxValue: 3.99, score: 4 }
        ],
        rangesFemale: [
            { minValue: 8, maxValue: 10, score: 10 },
            { minValue: 7, maxValue: 7.99, score: 9 },
            { minValue: 6, maxValue: 6.99, score: 8 },
            { minValue: 5, maxValue: 5.99, score: 7 },
            { minValue: 4, maxValue: 4.99, score: 6 },
            { minValue: 3, maxValue: 3.99, score: 5 },
            { minValue: 0, maxValue: 2.99, score: 4 }
        ]
    },
    {
        id: 'ex8', name: 'Basket - partita', type: 'basket', requiresTeamwork: true, evaluationMode: 'criteria', customCriteria: [
            { id: 'c1', name: 'Tecnica', maxScore: 10 },
            { id: 'c2', name: 'Difesa', maxScore: 10 },
            { id: 'c3', name: 'Collaborazione', maxScore: 10 }
        ]
    },
    {
        id: 'ex9', name: 'Calcio - partita', type: 'calcio', requiresTeamwork: true, evaluationMode: 'criteria', customCriteria: [
            { id: 'c1', name: 'Tecnica', maxScore: 10 },
            { id: 'c2', name: 'Visione di gioco', maxScore: 10 },
            { id: 'c3', name: 'Impegno', maxScore: 10 }
        ]
    },
    {
        id: 'ex10', name: 'Calcio - dribbling', type: 'calcio', requiresTeamwork: false, evaluationMode: 'criteria', customCriteria: [
            { id: 'c1', name: 'Controllo palla', maxScore: 10 },
            { id: 'c2', name: 'Velocità', maxScore: 10 }
        ]
    },
    // Circuito coordinazione - time in seconds (lower is better)
    {
        id: 'ex11',
        name: 'Circuito coordinazione',
        type: 'coordinazione',
        requiresTeamwork: false,
        evaluationMode: 'range',
        unit: 'sec',
        rangesMale: [
            { minValue: 0, maxValue: 25, score: 10 },
            { minValue: 25.1, maxValue: 28, score: 9 },
            { minValue: 28.1, maxValue: 31, score: 8 },
            { minValue: 31.1, maxValue: 34, score: 7 },
            { minValue: 34.1, maxValue: 38, score: 6 },
            { minValue: 38.1, maxValue: 42, score: 5 },
            { minValue: 42.1, maxValue: 999, score: 4 }
        ],
        rangesFemale: [
            { minValue: 0, maxValue: 28, score: 10 },
            { minValue: 28.1, maxValue: 31, score: 9 },
            { minValue: 31.1, maxValue: 34, score: 8 },
            { minValue: 34.1, maxValue: 37, score: 7 },
            { minValue: 37.1, maxValue: 41, score: 6 },
            { minValue: 41.1, maxValue: 45, score: 5 },
            { minValue: 45.1, maxValue: 999, score: 4 }
        ]
    },
    // Percorso ostacoli - time in seconds (lower is better)
    {
        id: 'ex12',
        name: 'Percorso ostacoli',
        type: 'coordinazione',
        requiresTeamwork: false,
        evaluationMode: 'range',
        unit: 'sec',
        rangesMale: [
            { minValue: 0, maxValue: 18, score: 10 },
            { minValue: 18.1, maxValue: 20, score: 9 },
            { minValue: 20.1, maxValue: 22, score: 8 },
            { minValue: 22.1, maxValue: 24, score: 7 },
            { minValue: 24.1, maxValue: 27, score: 6 },
            { minValue: 27.1, maxValue: 30, score: 5 },
            { minValue: 30.1, maxValue: 999, score: 4 }
        ],
        rangesFemale: [
            { minValue: 0, maxValue: 20, score: 10 },
            { minValue: 20.1, maxValue: 22, score: 9 },
            { minValue: 22.1, maxValue: 24, score: 8 },
            { minValue: 24.1, maxValue: 26, score: 7 },
            { minValue: 26.1, maxValue: 29, score: 6 },
            { minValue: 29.1, maxValue: 32, score: 5 },
            { minValue: 32.1, maxValue: 999, score: 4 }
        ]
    },
    // Flessioni - number of reps (higher is better)
    {
        id: 'ex13',
        name: 'Flessioni',
        type: 'forza',
        requiresTeamwork: false,
        evaluationMode: 'range',
        unit: 'reps',
        rangesMale: [
            { minValue: 40, maxValue: 999, score: 10 },
            { minValue: 35, maxValue: 39, score: 9 },
            { minValue: 30, maxValue: 34, score: 8 },
            { minValue: 25, maxValue: 29, score: 7 },
            { minValue: 20, maxValue: 24, score: 6 },
            { minValue: 15, maxValue: 19, score: 5 },
            { minValue: 0, maxValue: 14, score: 4 }
        ],
        rangesFemale: [
            { minValue: 30, maxValue: 999, score: 10 },
            { minValue: 25, maxValue: 29, score: 9 },
            { minValue: 20, maxValue: 24, score: 8 },
            { minValue: 15, maxValue: 19, score: 7 },
            { minValue: 12, maxValue: 14, score: 6 },
            { minValue: 8, maxValue: 11, score: 5 },
            { minValue: 0, maxValue: 7, score: 4 }
        ]
    },
    // Addominali - number of reps in 1 minute (higher is better)
    {
        id: 'ex14',
        name: 'Addominali',
        type: 'forza',
        requiresTeamwork: false,
        evaluationMode: 'range',
        unit: 'reps',
        rangesMale: [
            { minValue: 50, maxValue: 999, score: 10 },
            { minValue: 45, maxValue: 49, score: 9 },
            { minValue: 40, maxValue: 44, score: 8 },
            { minValue: 35, maxValue: 39, score: 7 },
            { minValue: 30, maxValue: 34, score: 6 },
            { minValue: 25, maxValue: 29, score: 5 },
            { minValue: 0, maxValue: 24, score: 4 }
        ],
        rangesFemale: [
            { minValue: 45, maxValue: 999, score: 10 },
            { minValue: 40, maxValue: 44, score: 9 },
            { minValue: 35, maxValue: 39, score: 8 },
            { minValue: 30, maxValue: 34, score: 7 },
            { minValue: 25, maxValue: 29, score: 6 },
            { minValue: 20, maxValue: 24, score: 5 },
            { minValue: 0, maxValue: 19, score: 4 }
        ]
    },
    {
        id: 'ex15', name: 'Stretching', type: 'flessibilita', requiresTeamwork: false, evaluationMode: 'criteria', customCriteria: [
            { id: 'c1', name: 'Esecuzione', maxScore: 10 },
            { id: 'c2', name: 'Impegno', maxScore: 10 }
        ]
    },
    {
        id: 'ex16', name: 'Ginnastica artistica', type: 'ginnastica', requiresTeamwork: false, evaluationMode: 'criteria', customCriteria: [
            { id: 'c1', name: 'Tecnica', maxScore: 10 },
            { id: 'c2', name: 'Eleganza', maxScore: 10 },
            { id: 'c3', name: 'Difficoltà', maxScore: 10 }
        ]
    },
    // Salto con la corda - number of jumps in 1 minute (higher is better)
    {
        id: 'ex17',
        name: 'Salto con la corda',
        type: 'resistenza',
        requiresTeamwork: false,
        evaluationMode: 'range',
        unit: 'reps',
        rangesMale: [
            { minValue: 140, maxValue: 999, score: 10 },
            { minValue: 125, maxValue: 139, score: 9 },
            { minValue: 110, maxValue: 124, score: 8 },
            { minValue: 95, maxValue: 109, score: 7 },
            { minValue: 80, maxValue: 94, score: 6 },
            { minValue: 65, maxValue: 79, score: 5 },
            { minValue: 0, maxValue: 64, score: 4 }
        ],
        rangesFemale: [
            { minValue: 130, maxValue: 999, score: 10 },
            { minValue: 115, maxValue: 129, score: 9 },
            { minValue: 100, maxValue: 114, score: 8 },
            { minValue: 85, maxValue: 99, score: 7 },
            { minValue: 70, maxValue: 84, score: 6 },
            { minValue: 55, maxValue: 69, score: 5 },
            { minValue: 0, maxValue: 54, score: 4 }
        ]
    },
    // Staffetta 4x100 - time in seconds (lower is better)
    {
        id: 'ex18',
        name: 'Staffetta 4x100',
        type: 'velocita',
        requiresTeamwork: true,
        evaluationMode: 'range',
        unit: 'sec',
        rangesMale: [
            { minValue: 0, maxValue: 52, score: 10 },
            { minValue: 52.1, maxValue: 55, score: 9 },
            { minValue: 55.1, maxValue: 58, score: 8 },
            { minValue: 58.1, maxValue: 61, score: 7 },
            { minValue: 61.1, maxValue: 65, score: 6 },
            { minValue: 65.1, maxValue: 70, score: 5 },
            { minValue: 70.1, maxValue: 999, score: 4 }
        ],
        rangesFemale: [
            { minValue: 0, maxValue: 58, score: 10 },
            { minValue: 58.1, maxValue: 62, score: 9 },
            { minValue: 62.1, maxValue: 66, score: 8 },
            { minValue: 66.1, maxValue: 70, score: 7 },
            { minValue: 70.1, maxValue: 75, score: 6 },
            { minValue: 75.1, maxValue: 80, score: 5 },
            { minValue: 80.1, maxValue: 999, score: 4 }
        ]
    },
];

// Classes
export const classes: Class[] = [
    { id: 'c1', name: '1A', year: '2024/25', studentCount: 22, averageGrade: 7.5, totalExercises: 12, studentIds: [] },
    { id: 'c2', name: '1B', year: '2024/25', studentCount: 20, averageGrade: 6.8, totalExercises: 11, studentIds: [] },
    { id: 'c3', name: '2A', year: '2024/25', studentCount: 24, averageGrade: 8.2, totalExercises: 15, studentIds: [] },
    { id: 'c4', name: '2B', year: '2024/25', studentCount: 21, averageGrade: 7.1, totalExercises: 13, studentIds: [] },
    { id: 'c5', name: '3A', year: '2024/25', studentCount: 23, averageGrade: 7.9, totalExercises: 16, studentIds: [] },
    { id: 'c6', name: '3B', year: '2024/25', studentCount: 18, averageGrade: 6.5, totalExercises: 10, studentIds: [] },
];

// Helper to generate random date in the past
function getRandomPastDate(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    return date.toISOString().split('T')[0];
}

// Helper to determine performance level
function getPerformanceLevel(avg: number): 'excellent' | 'good' | 'average' | 'needs-improvement' {
    if (avg >= 8.5) return 'excellent';
    if (avg >= 7) return 'good';
    if (avg >= 6) return 'average';
    return 'needs-improvement';
}

// Generate students
export const students: Student[] = [];
let studentIdCounter = 1;

classes.forEach((cls) => {
    for (let i = 0; i < cls.studentCount; i++) {
        const gender = Math.random() > 0.5 ? 'M' : 'F';
        const nameList = gender === 'M' ? maleNames : femaleNames;
        const firstName = nameList[Math.floor(Math.random() * nameList.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const id = `s${studentIdCounter++}`;
        const averageGrade = parseFloat((Math.random() * 3 + 5.5).toFixed(1)); // 5.5 to 8.5
        const totalGrades = Math.floor(Math.random() * 15) + 5; // 5 to 20 grades
        const improving = Math.random() > 0.4;

        students.push({
            id,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            classId: cls.id,
            className: cls.name,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.it`,
            gender,
            averageGrade,
            totalGrades,
            lastActivityDate: getRandomPastDate(30),
            performanceLevel: getPerformanceLevel(averageGrade),
            trends: {
                improving,
                percentageChange: improving
                    ? parseFloat((Math.random() * 15 + 2).toFixed(1))
                    : -parseFloat((Math.random() * 10 + 1).toFixed(1))
            }
        });

        cls.studentIds.push(id);
    }
});

// Generate grades for students
export const grades: Grade[] = [];
let gradeIdCounter = 1;

students.forEach((student) => {
    const numGrades = student.totalGrades;

    for (let i = 0; i < numGrades; i++) {
        const exercise = exercises[Math.floor(Math.random() * exercises.length)];
        const technical = Math.floor(Math.random() * 5) + 5; // 5-10
        const effort = Math.floor(Math.random() * 5) + 5; // 5-10
        const overall = Math.floor(Math.random() * 5) + 5; // 5-10
        const teamwork = exercise.requiresTeamwork ? Math.floor(Math.random() * 5) + 5 : undefined;

        // Calculate weighted average
        let finalGrade: number;
        if (teamwork !== undefined) {
            finalGrade = (technical * 0.3 + effort * 0.2 + teamwork * 0.2 + overall * 0.3);
        } else {
            finalGrade = (technical * 0.35 + effort * 0.25 + overall * 0.4);
        }
        finalGrade = parseFloat(finalGrade.toFixed(1));

        grades.push({
            id: `g${gradeIdCounter++}`,
            studentId: student.id,
            exerciseType: exercise.type,
            exerciseName: exercise.name,
            date: getRandomPastDate(120), // within last 4 months
            criteria: {
                technical,
                effort,
                teamwork,
                overall
            },
            finalGrade,
            notes: Math.random() > 0.7 ? 'Ottima prestazione!' : undefined
        });
    }
});

// Helper functions
export function getStudentsByClass(classId: string): Student[] {
    return students.filter(s => s.classId === classId);
}

export function getGradesByStudent(studentId: string): Grade[] {
    return grades.filter(g => g.studentId === studentId).sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

export function getGradesByClass(classId: string): Grade[] {
    const studentIds = students.filter(s => s.classId === classId).map(s => s.id);
    return grades.filter(g => studentIds.includes(g.studentId));
}

export function getAllStudents(): Student[] {
    return students;
}

export function getStudentById(id: string): Student | undefined {
    return students.find(s => s.id === id);
}

export function getClassById(id: string): Class | undefined {
    return classes.find(c => c.id === id);
}

export function getAllClasses(): Class[] {
    return classes;
}

import type { Student, Grade, Exercise, Class } from '../types';

// Italian first and last names for realistic mock data
const firstNames = [
    'Marco', 'Giulia', 'Alessandro', 'Francesca', 'Matteo', 'Sofia',
    'Lorenzo', 'Chiara', 'Luca', 'Valentina', 'Andrea', 'Martina',
    'Davide', 'Elena', 'Riccardo', 'Sara', 'Simone', 'Alessia',
    'Federico', 'Beatrice', 'Gabriele', 'Alice', 'Tommaso', 'Giorgia',
    'Nicola', 'Camilla', 'Antonio', 'Laura', 'Filippo', 'Elisa',
    'Pietro', 'Anna', 'Giovanni', 'Silvia', 'Emanuele', 'Federica',
    'Daniele', 'Roberta', 'Stefano', 'Serena', 'Cristian', 'Claudia',
    'Paolo', 'Ilaria', 'Michele', 'Monica', 'Giacomo', 'Paola',
    'Roberto', 'Veronica', 'Fabio', 'Daniela', 'Vincenzo', 'Rossella'
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
    { id: 'ex1', name: 'Corsa 100m', type: 'velocita', requiresTeamwork: false },
    { id: 'ex2', name: 'Corsa 1000m', type: 'resistenza', requiresTeamwork: false },
    { id: 'ex3', name: 'Salto in lungo', type: 'forza', requiresTeamwork: false },
    { id: 'ex4', name: 'Lancio palla medica', type: 'forza', requiresTeamwork: false },
    { id: 'ex5', name: 'Pallavolo - partita', type: 'pallavolo', requiresTeamwork: true },
    { id: 'ex6', name: 'Pallavolo - palleggio', type: 'pallavolo', requiresTeamwork: false },
    { id: 'ex7', name: 'Basket - tiro libero', type: 'basket', requiresTeamwork: false },
    { id: 'ex8', name: 'Basket - partita', type: 'basket', requiresTeamwork: true },
    { id: 'ex9', name: 'Calcio - partita', type: 'calcio', requiresTeamwork: true },
    { id: 'ex10', name: 'Calcio - dribbling', type: 'calcio', requiresTeamwork: false },
    { id: 'ex11', name: 'Circuito coordinazione', type: 'coordinazione', requiresTeamwork: false },
    { id: 'ex12', name: 'Percorso ostacoli', type: 'coordinazione', requiresTeamwork: false },
    { id: 'ex13', name: 'Flessioni', type: 'forza', requiresTeamwork: false },
    { id: 'ex14', name: 'Addominali', type: 'forza', requiresTeamwork: false },
    { id: 'ex15', name: 'Stretching', type: 'flessibilita', requiresTeamwork: false },
    { id: 'ex16', name: 'Ginnastica artistica', type: 'ginnastica', requiresTeamwork: false },
    { id: 'ex17', name: 'Salto con la corda', type: 'resistenza', requiresTeamwork: false },
    { id: 'ex18', name: 'Staffetta 4x100', type: 'velocita', requiresTeamwork: true },
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
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
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

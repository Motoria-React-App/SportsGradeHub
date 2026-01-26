import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { useSchoolData } from '@/provider/clientProvider';
import { ArrowLeft, TrendingUp, Calendar, Users } from 'lucide-react';
import { useGradeFormatter } from '@/hooks/useGradeFormatter';
import { useDateFormatter } from '@/hooks/useDateFormatter';
import type { Student, ClassHistoryEntry, Evaluation, Exercise, SchoolClass } from '@/types/types';

export default function StudentDetail() {
    const { id } = useParams<{ id: string }>();
    const { students, classes, evaluations, exercises } = useSchoolData();
    const { formatGrade } = useGradeFormatter();
    const { formatDate } = useDateFormatter();

    const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');

    const student = useMemo(
        () => students.find((s: Student) => s.id === id),
        [students, id]
    );

    const studentClass = useMemo(() => {
        if (!student) return null;
        return classes.find((c: SchoolClass) => c.id === student.currentClassId);
    }, [student, classes]);

    const classHistory = student?.classHistory || [];

    // Get all unique exercises for this student (from their evaluations)
    const studentExercises = useMemo(() => {
        const uniqueExerciseIds = new Set(
            evaluations
                .filter((e: Evaluation) => e.studentId === student?.id && e.score > 0)
                .map((e: Evaluation) => e.exerciseId)
        );
        return Array.from(uniqueExerciseIds)
            .map((exId) => exercises.find((ex: Exercise) => ex.id === exId))
            .filter(Boolean) as Exercise[];
    }, [evaluations, exercises, student?.id]);

    // Evaluations for selected exercise
    const exerciseEvals = useMemo(() => {
        if (!selectedExerciseId) return [];
        return evaluations
            .filter((e: Evaluation) => e.studentId === student?.id && e.exerciseId === selectedExerciseId && e.score > 0)
            .sort((a: Evaluation, b: Evaluation) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [evaluations, student?.id, selectedExerciseId]);

    // Line chart data: year -> average score per school year
    const chartData = useMemo(() => {
        if (exerciseEvals.length <= 1) return [];

        const yearlyAvg: Record<string, { sum: number; count: number }> = {};
        exerciseEvals.forEach((evaluation: Evaluation) => {
            const year = new Date(evaluation.createdAt).getFullYear().toString();
            if (!yearlyAvg[year]) {
                yearlyAvg[year] = { sum: 0, count: 0 };
            }
            yearlyAvg[year].sum += evaluation.score;
            yearlyAvg[year].count += 1;
        });

        return Object.entries(yearlyAvg)
            .map(([year, { sum, count }]) => ({
                anno: year,
                media: Math.round((sum / count) * 10) / 10,
            }))
            .sort((a, b) => parseInt(a.anno) - parseInt(b.anno));
    }, [exerciseEvals]);

    // Yearly stats
    const yearlyStats = useMemo(() => {
        const stats: Record<string, { count: number; totalScore: number; avg: number }> = {};
        evaluations
            .filter((e: Evaluation) => e.studentId === student?.id && e.score > 0)
            .forEach((evaluation: Evaluation) => {
                const year = new Date(evaluation.createdAt).getFullYear().toString();
                if (!stats[year]) {
                    stats[year] = { count: 0, totalScore: 0, avg: 0 };
                }
                stats[year].count += 1;
                stats[year].totalScore += evaluation.score;
            });

        return Object.entries(stats).map(([anno, data]) => ({
            anno,
            numValutazioni: data.count,
            media: Math.round((data.totalScore / data.count) * 10) / 10,
        })).sort((a, b) => parseInt(b.anno) - parseInt(a.anno));
    }, [evaluations, student?.id]);

    if (!student) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
                <p className="text-muted-foreground">Studente non trovato</p>
                <Button asChild variant="outline" className="mt-4">
                    <Link to="/students">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Torna agli studenti
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col p-4 md:p-6 space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                    <Link to="/students">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                        {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {student.firstName} {student.lastName}
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className="text-sm">
                                {studentClass?.className || 'Nessuna classe'}
                            </Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                {student.gender === 'M' ? 'Maschio' : student.gender === 'F' ? 'Femmina' : 'N/D'}
                            </span>
                            {student.birthdate && (
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatDate(student.birthdate)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Classi frequentate
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{classHistory.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Cronologia Classi */}
            <Card>
                <CardHeader>
                    <CardTitle>Cronologia delle Classi</CardTitle>
                    <CardDescription>Classe e anno scolastico</CardDescription>
                </CardHeader>
                <CardContent>
                    {classHistory.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Nessuna cronologia disponibile</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Classe</TableHead>
                                    <TableHead>Anno Scolastico</TableHead>
                                    <TableHead>Stato</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classHistory.map((entry: ClassHistoryEntry) => {
                                    const cls = classes.find((c: SchoolClass) => c.id === entry.classId);
                                    return (
                                        <TableRow key={entry.classId}>
                                            <TableCell className="font-medium">{cls?.className || 'N/D'}</TableCell>
                                            <TableCell>{entry.schoolYear}</TableCell>
                                            <TableCell>
                                                <Badge variant={entry.archived ? "secondary" : "default"}>
                                                    {entry.archived ? 'Archiviata' : 'Attiva'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Grafico e Selezione Esercizio */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Andamento per Esercizio
                    </CardTitle>
                    <CardDescription>
                        Seleziona un esercizio per vedere l'andamento annuale (media voti)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {studentExercises.map((ex: Exercise) => (
                            <Button
                                key={ex.id}
                                variant={selectedExerciseId === ex.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedExerciseId(selectedExerciseId === ex.id ? '' : ex.id)}
                            >
                                {ex.name}
                            </Button>
                        ))}
                    </div>
                    {selectedExerciseId ? (
                        exerciseEvals.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">Nessuna valutazione per questo esercizio</p>
                        ) : exerciseEvals.length === 1 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground mb-2">Solo una valutazione disponibile:</p>
                                <div className="text-2xl font-bold">{formatGrade(exerciseEvals[0].score)}</div>
                                <p className="text-sm text-muted-foreground mt-1">{formatDate(exerciseEvals[0].createdAt)}</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="anno" />
                                    <YAxis domain={['dataMin', 'dataMax']} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="media" stroke="#8884d8" />
                                </LineChart>
                            </ResponsiveContainer>
                        )
                    ) : (
                        <p className="text-muted-foreground text-center py-12">Seleziona un esercizio per visualizzare il grafico</p>
                    )}
                </CardContent>
            </Card>

            {/* Media Annuale e Numero Valutazioni */}
            <Card>
                <CardHeader>
                    <CardTitle>Statistiche Annuali</CardTitle>
                    <CardDescription>Media voti e numero di valutazioni per anno</CardDescription>
                </CardHeader>
                <CardContent>
                    {yearlyStats.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Nessuna valutazione registrata</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Anno</TableHead>
                                    <TableHead>Media</TableHead>
                                    <TableHead>Valutazioni</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {yearlyStats.map((stat) => (
                                    <TableRow key={stat.anno}>
                                        <TableCell>{stat.anno}</TableCell>
                                        <TableCell className="font-medium">{formatGrade(stat.media)}</TableCell>
                                        <TableCell>{stat.numValutazioni}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

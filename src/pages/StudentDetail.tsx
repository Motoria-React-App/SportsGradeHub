import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { useSchoolData, useClient } from "@/provider/clientProvider";
import { ArrowLeft, Award, TrendingUp, Calendar, BookOpen, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGradeFormatter } from "@/hooks/useGradeFormatter";
import { useDateFormatter } from "@/hooks/useDateFormatter";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Evaluation } from "@/types/types";

export default function StudentDetail() {
    const { id } = useParams<{ id: string }>();
    const { students, classes, evaluations, exercises, exerciseGroups, refreshEvaluations } = useSchoolData();
    const client = useClient();
    const { formatGrade, getGradeColor, isPassing } = useGradeFormatter();
    const { formatDate } = useDateFormatter();

    // Delete evaluation state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [evaluationToDelete, setEvaluationToDelete] = useState<Evaluation | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Find the student
    const student = useMemo(() => {
        return students.find(s => s.id === id);
    }, [students, id]);

    // Get class info
    const studentClass = useMemo(() => {
        if (!student) return null;
        return classes.find(c => c.id === student.currentClassId);
    }, [student, classes]);

    // Get evaluations for this student (only confirmed ones with score > 0)
    const studentEvaluations = useMemo(() => {
        if (!student) return [];
        // Filter to only include evaluations with score > 0 (confirmed/valutato)
        // Excludes NON VALUTATO and VALUTANDO which have score = 0
        return evaluations.filter(e => e.studentId === student.id && e.score > 0);
    }, [evaluations, student]);

    // Get exercise info for an evaluation
    const getExerciseInfo = (exerciseId: string) => {
        const exercise = exercises.find(e => e.id === exerciseId);
        if (!exercise) return { name: "Sconosciuto", group: "N/A", unit: "" };
        const group = exerciseGroups.find(g => g.id === exercise.exerciseGroupId);
        return {
            name: exercise.name,
            group: group?.groupName || "N/A",
            unit: exercise.unit
        };
    };

    // Calculate stats
    const stats = useMemo(() => {
        if (studentEvaluations.length === 0) {
            return {
                totalEvaluations: 0,
                averageScore: 0,
                bestScore: 0,
                worstScore: 0
            };
        }

        const scores = studentEvaluations.map(e => e.score);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

        return {
            totalEvaluations: studentEvaluations.length,
            averageScore: Math.round(avg * 10) / 10,
            bestScore: Math.max(...scores),
            worstScore: Math.min(...scores)
        };
    }, [studentEvaluations]);

    // Chart data: scores by exercise group
    const groupScoresData = useMemo(() => {
        const groupScores: Record<string, { total: number; count: number }> = {};

        studentEvaluations.forEach(ev => {
            const info = getExerciseInfo(ev.exerciseId);
            if (!groupScores[info.group]) {
                groupScores[info.group] = { total: 0, count: 0 };
            }
            groupScores[info.group].total += ev.score;
            groupScores[info.group].count += 1;
        });

        return Object.entries(groupScores).map(([name, data]) => ({
            name,
            score: Math.round((data.total / data.count) * 10) / 10,
            fullMark: 10
        }));
    }, [studentEvaluations, exercises, exerciseGroups]);

    // Chart data: scores by individual exercise
    const exerciseScoresData = useMemo(() => {
        const exerciseScores: Record<string, { name: string; total: number; count: number }> = {};

        studentEvaluations.forEach(ev => {
            const info = getExerciseInfo(ev.exerciseId);
            if (!exerciseScores[ev.exerciseId]) {
                exerciseScores[ev.exerciseId] = { name: info.name, total: 0, count: 0 };
            }
            exerciseScores[ev.exerciseId].total += ev.score;
            exerciseScores[ev.exerciseId].count += 1;
        });

        return Object.values(exerciseScores).map(data => ({
            name: data.name.length > 12 ? data.name.substring(0, 12) + "..." : data.name,
            fullName: data.name,
            score: Math.round((data.total / data.count) * 10) / 10
        }));
    }, [studentEvaluations, exercises]);

    // Loading state
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
                                {studentClass?.className || "Nessuna classe"}
                            </Badge>
                            <span className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                                student.gender === 'M' && "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/20",
                                student.gender === 'F' && "bg-pink-50 text-pink-700 ring-pink-600/20 dark:bg-pink-900/30 dark:text-pink-400 dark:ring-pink-400/20",
                            )}>
                                {student.gender === 'M' ? 'Maschio' : student.gender === 'F' ? 'Femmina' : 'N/D'}
                            </span>
                            {student.birthdate && (
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(student.birthdate).toLocaleDateString("it-IT")}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Valutazioni
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.totalEvaluations}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Media Voti
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className={cn(
                            "text-3xl font-bold",
                            stats.averageScore > 0 ? getGradeColor(stats.averageScore) : ""
                        )}>
                            {stats.averageScore > 0 ? formatGrade(stats.averageScore) : "-"}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Voto Migliore
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-3xl font-bold", getGradeColor(stats.bestScore))}>
                            {stats.bestScore > 0 ? formatGrade(stats.bestScore) : "-"}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Voto Peggiore
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className={cn(
                            "text-3xl font-bold",
                            stats.worstScore > 0 ? getGradeColor(stats.worstScore) : ""
                        )}>
                            {stats.worstScore > 0 ? formatGrade(stats.worstScore) : "-"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            {studentEvaluations.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Bar Chart - Scores by Exercise */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Voti per Esercizio</CardTitle>
                            <CardDescription>Media voti per ogni esercizio valutato</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={exerciseScoresData} layout="vertical" margin={{ left: 20, right: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" domain={[0, 10]} />
                                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-popover border rounded-lg p-2 shadow-lg">
                                                            <p className="font-medium">{data.fullName}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Voto: <span className="font-semibold">{data.score}</span>
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                                            {exerciseScoresData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={isPassing(entry.score) ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Radar Chart - Scores by Group */}
                    {groupScoresData.length > 2 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Profilo per Gruppo</CardTitle>
                                <CardDescription>Media voti per gruppo di esercizi</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={groupScoresData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                                            <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                                            <Radar
                                                name="Voto"
                                                dataKey="score"
                                                stroke="hsl(var(--primary))"
                                                fill="hsl(var(--primary))"
                                                fillOpacity={0.3}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "hsl(var(--popover))",
                                                    borderColor: "hsl(var(--border))",
                                                    color: "hsl(var(--popover-foreground))",
                                                }}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Voti per Gruppo</CardTitle>
                                <CardDescription>Media voti per gruppo di esercizi</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={groupScoresData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" />
                                            <YAxis domain={[0, 10]} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "hsl(var(--popover))",
                                                    borderColor: "hsl(var(--border))",
                                                    color: "hsl(var(--popover-foreground))",
                                                }}
                                            />
                                            <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                                                {groupScoresData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={isPassing(entry.score) ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Evaluations Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Storico Valutazioni</CardTitle>
                    <CardDescription>
                        {studentEvaluations.length > 0
                            ? `${studentEvaluations.length} valutazioni registrate`
                            : "Nessuna valutazione registrata"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {studentEvaluations.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Esercizio</TableHead>
                                    <TableHead>Gruppo</TableHead>
                                    <TableHead>Prestazione</TableHead>
                                    <TableHead>Voto</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentEvaluations.map((ev, index) => {
                                    const info = getExerciseInfo(ev.exerciseId);
                                    return (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{info.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{info.group}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {ev.performanceValue} {info.unit}
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                                                    isPassing(ev.score)
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                )}>
                                                    {formatGrade(ev.score)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(ev.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => {
                                                        setEvaluationToDelete(ev);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                <BookOpen className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">
                                Nessuna valutazione ancora registrata per questo studente.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminare questa valutazione?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Stai per eliminare la valutazione per l'esercizio "{evaluationToDelete ? getExerciseInfo(evaluationToDelete.exerciseId).name : ''}".
                            Questa azione non può essere annullata.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                            onClick={async (e) => {
                                e.preventDefault();
                                if (!evaluationToDelete) return;
                                
                                setIsDeleting(true);
                                try {
                                    const response = await client.deleteEvaluation(evaluationToDelete.id);
                                    if (response.success) {
                                        await refreshEvaluations();
                                        setDeleteDialogOpen(false);
                                        setEvaluationToDelete(null);
                                    } else {
                                        console.error("Failed to delete evaluation:", response.error);
                                    }
                                } catch (error) {
                                    console.error("Error deleting evaluation:", error);
                                } finally {
                                    setIsDeleting(false);
                                }
                            }}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Eliminazione...
                                </>
                            ) : (
                                "Elimina"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

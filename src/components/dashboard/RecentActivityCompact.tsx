import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSchoolData } from "@/provider/clientProvider";
import { useGradeFormatter } from "@/hooks/useGradeFormatter";
import { useDateFormatter } from "@/hooks/useDateFormatter";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface RecentActivityCompactProps {
    selectedClassId: string;
}

export function RecentActivityCompact({ selectedClassId }: RecentActivityCompactProps) {
    const { evaluations, students, exercises, exerciseGroups } = useSchoolData();
    const { formatGrade, getGradeColor } = useGradeFormatter();
    const { formatDate } = useDateFormatter();

    // Get last 4 evaluations with scores (filtered by class if selected)
    const recentEvaluations = useMemo(() => {
        // Get student IDs for selected class
        const classStudentIds = selectedClassId
            ? students.filter(s => s.currentClassId === selectedClassId).map(s => s.id)
            : students.map(s => s.id);

        return [...evaluations]
            .filter(e => e.score > 0 && classStudentIds.includes(e.studentId))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 4)
            .map(evaluation => {
                const student = students.find(s => s.id === evaluation.studentId);
                const exercise = exercises.find(e => e.id === evaluation.exerciseId);
                const group = exercise
                    ? exerciseGroups.find(g => g.id === exercise.exerciseGroupId)
                    : null;

                return {
                    id: `${evaluation.studentId}-${evaluation.exerciseId}`,
                    studentName: student ? `${student.firstName} ${student.lastName}` : "Studente",
                    studentInitials: student ? `${student.firstName[0]}${student.lastName[0]}` : "??",
                    exerciseName: exercise?.name || "Esercizio",
                    groupName: group?.groupName || "",
                    score: evaluation.score,
                    date: evaluation.createdAt,
                };
            });
    }, [evaluations, students, exercises, exerciseGroups, selectedClassId]);

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Attività Recente</CardTitle>
                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                        <Link to={selectedClassId ? `/valutazioni/${selectedClassId}/all` : "/valutazioni/all/all"}>
                            Vedi tutte
                            <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {recentEvaluations.length > 0 ? (
                    <div className="space-y-3">
                        {recentEvaluations.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                        {item.studentInitials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {item.studentName}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {item.exerciseName}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-bold ${getGradeColor(item.score)}`}>
                                        {formatGrade(item.score)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {formatDate(item.date)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Nessuna valutazione recente
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

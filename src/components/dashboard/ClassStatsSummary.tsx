import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSchoolData } from "@/provider/clientProvider";
import { useGradeFormatter } from "@/hooks/useGradeFormatter";
import { Users, GraduationCap, TrendingUp } from "lucide-react";

interface ClassStatsSummaryProps {
    selectedClassId: string;
}

export function ClassStatsSummary({ selectedClassId }: ClassStatsSummaryProps) {
    const { uiClasses, students, evaluations } = useSchoolData();
    const { formatGrade, getGradeColor } = useGradeFormatter();

    // Get stats for selected class
    const stats = useMemo(() => {
        if (!selectedClassId) {
            return null;
        }

        const classInfo = uiClasses.find(c => c.id === selectedClassId);
        const classStudents = students.filter(s => s.currentClassId === selectedClassId);
        const classEvaluations = evaluations.filter(e => {
            const studentIds = classStudents.map(s => s.id);
            return studentIds.includes(e.studentId) && e.score > 0;
        });

        // Calculate average
        const avgScore = classEvaluations.length > 0
            ? classEvaluations.reduce((sum, e) => sum + e.score, 0) / classEvaluations.length
            : null;

        // Count evaluations this month
        const now = new Date();
        const monthEvaluations = classEvaluations.filter(e => {
            const evalDate = new Date(e.createdAt);
            return evalDate.getMonth() === now.getMonth() && evalDate.getFullYear() === now.getFullYear();
        });

        return {
            className: classInfo?.name || "Classe",
            studentCount: classStudents.length,
            averageGrade: avgScore,
            monthEvaluations: monthEvaluations.length,
            totalEvaluations: classEvaluations.length,
        };
    }, [selectedClassId, uiClasses, students, evaluations]);

    if (!stats) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Statistiche Classe</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Nessuna classe selezionata
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">{stats.className}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Students */}
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                        <Users className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Studenti</p>
                        <p className="text-lg font-semibold">{stats.studentCount}</p>
                    </div>
                </div>

                {/* Average Grade */}
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                        <GraduationCap className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Media Classe</p>
                        <p className={`text-lg font-semibold ${stats.averageGrade ? getGradeColor(stats.averageGrade) : ""}`}>
                            {stats.averageGrade ? formatGrade(stats.averageGrade) : "N/A"}
                        </p>
                    </div>
                </div>

                {/* Evaluations this month */}
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                        <TrendingUp className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Valutazioni questo mese</p>
                        <p className="text-lg font-semibold">{stats.monthEvaluations}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

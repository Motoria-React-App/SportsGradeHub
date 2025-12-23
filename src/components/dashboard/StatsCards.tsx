import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UIClass, UIStudent, UIGrade } from "@/provider/clientProvider";
import { Users, GraduationCap, TrendingUp, Trophy } from "lucide-react";

interface StatsCardsProps {
    selectedClass: UIClass;
    students: UIStudent[];
    grades: UIGrade[];
}

export function StatsCards({ selectedClass, students, grades }: StatsCardsProps) {
    // Calculate metrics
    const studentCount = students.length;

    // Calculate average grade
    const averageGrade = grades.length > 0
        ? (grades.reduce((sum, g) => sum + g.finalGrade, 0) / grades.length).toFixed(1)
        : "N/A";

    const lastMonthGrades = grades.filter(g => {
        const gradeDate = new Date(g.date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - gradeDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
    });

    // Find best category
    const categoryScores: Record<string, { sum: number, count: number }> = {};
    grades.forEach(g => {
        if (!categoryScores[g.exerciseType]) {
            categoryScores[g.exerciseType] = { sum: 0, count: 0 };
        }
        categoryScores[g.exerciseType].sum += g.finalGrade;
        categoryScores[g.exerciseType].count += 1;
    });

    let bestCategory = "N/A";
    let bestScore = 0;

    Object.entries(categoryScores).forEach(([cat, data]) => {
        const avg = data.sum / data.count;
        if (avg > bestScore) {
            bestScore = avg;
            bestCategory = cat;
        }
    });

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Totale Studenti</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{studentCount}</div>
                    <p className="text-xs text-muted-foreground">
                        Iscritti alla classe {selectedClass.name}
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Media Classe</CardTitle>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{averageGrade}</div>
                    <p className="text-xs text-muted-foreground">
                        Basata su {grades.length} valutazioni
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valutazioni Recenti</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{lastMonthGrades.length}</div>
                    <p className="text-xs text-muted-foreground">
                        Negli ultimi 30 giorni
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Trophy className="w-24 h-24" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Miglior Categoria</CardTitle>
                    <Trophy className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold capitalize">{bestCategory}</div>
                    <p className="text-xs text-muted-foreground">
                        Media: {bestScore > 0 ? bestScore.toFixed(1) : '-'}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

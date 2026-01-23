import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UIGrade, UIStudent } from "@/provider/clientProvider";
import { useGradeFormatter } from "@/hooks/useGradeFormatter";
import { useDateFormatter } from "@/hooks/useDateFormatter";

interface RecentActivityProps {
    grades: UIGrade[];
    students: UIStudent[];
}

export function RecentActivity({ grades, students }: RecentActivityProps) {
    const { formatGrade, getGradeColor } = useGradeFormatter();
    const { formatDate } = useDateFormatter();

    // Sort by date descending and take top 5
    const recentGrades = [...grades]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    const getStudent = (id: string) => students.find(s => s.id === id);

    return (
        <Card className="col-span-1 lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
                <CardTitle>Attività Recente</CardTitle>
                <CardDescription>
                    Ultime valutazioni registrate
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {recentGrades.length > 0 ? (
                        recentGrades.map((grade) => {
                            const student = getStudent(grade.studentId);
                            return (
                                <div key={grade.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={`/avatars/${student?.id}.png`} alt={student?.firstName} />
                                        <AvatarFallback>
                                            {student?.firstName[0]}
                                            {student?.lastName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-1 flex-col justify-center gap-0.5 space-y-0">
                                        <p className="text-sm font-medium leading-none">
                                            {student?.fullName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {grade.exerciseName}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5">
                                        <div className={`text-sm font-bold ${getGradeColor(grade.finalGrade)}`}>
                                            {formatGrade(grade.finalGrade)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {formatDate(grade.date)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center text-muted-foreground py-4">
                            Nessuna attività recente.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

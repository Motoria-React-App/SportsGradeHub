import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSchoolData } from "@/provider/clientProvider";
import { useGradeFormatter } from "@/hooks/useGradeFormatter";
import { useDateFormatter } from "@/hooks/useDateFormatter";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { scaleIn, cardHover, staggerContainer, listItemVariants } from "@/lib/motion";

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
            .map((evaluation, index) => {
                const student = students.find(s => s.id === evaluation.studentId);
                const exercise = exercises.find(e => e.id === evaluation.exerciseId);
                const group = exercise
                    ? exerciseGroups.find(g => g.id === exercise.exerciseGroupId)
                    : null;

                return {
                    id: evaluation.id || `${evaluation.studentId}-${evaluation.exerciseId}-${index}`,
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
        <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
        >
            <motion.div {...cardHover}>
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Attività Recente</CardTitle>
                            <motion.div {...cardHover}>
                                <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                                    <Link to={selectedClassId ? `/valutazioni/${selectedClassId}/all` : "/valutazioni/all/all"}>
                                        Vedi tutte
                                        <ArrowRight className="ml-1 h-3 w-3" />
                                    </Link>
                                </Button>
                            </motion.div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentEvaluations.length > 0 ? (
                            <motion.div
                                className="space-y-3"
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                            >
                                {recentEvaluations.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        variants={listItemVariants}
                                        custom={index}
                                        whileHover={{ x: 4, backgroundColor: "rgba(var(--muted), 0.5)" }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                        <div className="flex items-center gap-3 p-2 rounded-lg">
                                            <motion.div
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                transition={{ type: "spring", stiffness: 300 }}
                                            >
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="text-xs">
                                                        {item.studentInitials}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </motion.div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {item.studentName}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {item.exerciseName}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <motion.p
                                                    className={`text-sm font-bold ${getGradeColor(item.score)}`}
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 200 }}
                                                >
                                                    {formatGrade(item.score)}
                                                </motion.p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {formatDate(item.date)}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.p
                                className="text-sm text-muted-foreground text-center py-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Nessuna valutazione recente
                            </motion.p>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}

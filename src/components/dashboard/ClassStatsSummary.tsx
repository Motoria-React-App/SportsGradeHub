import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSchoolData } from "@/provider/clientProvider";
import { useGradeFormatter } from "@/hooks/useGradeFormatter";
import { Users, GraduationCap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { scaleIn, cardHover, staggerContainer, staggerItem } from "@/lib/motion";
import { useAnimatedValue } from "@/components/dashboard/StatsCards";

interface ClassStatsSummaryProps {
    selectedClassId: string;
}

export function ClassStatsSummary({ selectedClassId }: ClassStatsSummaryProps) {
    const { uiClasses, students, evaluations } = useSchoolData();
    const { formatGrade, getGradeColor } = useGradeFormatter();

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

        const avgScore = classEvaluations.length > 0
            ? classEvaluations.reduce((sum, e) => sum + e.score, 0) / classEvaluations.length
            : null;

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

    const animatedStudentCount = useAnimatedValue(stats?.studentCount || 0);
    const animatedMonthEvaluations = useAnimatedValue(stats?.monthEvaluations || 0);

    if (!stats) {
        return (
            <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
            >
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
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
        >
            <motion.div {...cardHover}>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">{stats.className}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <motion.div
                            className="space-y-4"
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div
                                className="flex items-center gap-3"
                                variants={staggerItem}
                            >
                                <motion.div
                                    className="p-2 rounded-lg bg-blue-500/10"
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <Users className="h-4 w-4 text-blue-500" />
                                </motion.div>
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">Studenti</p>
                                    <motion.p
                                        className="text-lg font-semibold"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                    >
                                        {animatedStudentCount}
                                    </motion.p>
                                </div>
                            </motion.div>

                            <motion.div
                                className="flex items-center gap-3"
                                variants={staggerItem}
                            >
                                <motion.div
                                    className="p-2 rounded-lg bg-emerald-500/10"
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <GraduationCap className="h-4 w-4 text-emerald-500" />
                                </motion.div>
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">Media Classe</p>
                                    <motion.p
                                        className={`text-lg font-semibold ${stats.averageGrade ? getGradeColor(stats.averageGrade) : ""}`}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                                    >
                                        {stats.averageGrade ? formatGrade(stats.averageGrade) : "N/A"}
                                    </motion.p>
                                </div>
                            </motion.div>

                            <motion.div
                                className="flex items-center gap-3"
                                variants={staggerItem}
                            >
                                <motion.div
                                    className="p-2 rounded-lg bg-amber-500/10"
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <TrendingUp className="h-4 w-4 text-amber-500" />
                                </motion.div>
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">Valutazioni questo mese</p>
                                    <motion.p
                                        className="text-lg font-semibold"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                                    >
                                        {animatedMonthEvaluations}
                                    </motion.p>
                                </div>
                            </motion.div>
                        </motion.div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}

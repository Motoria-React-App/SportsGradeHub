import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UIClass, UIStudent, UIGrade } from "@/provider/clientProvider";
import { Users, GraduationCap, TrendingUp, Trophy } from "lucide-react";
import { useGradeFormatter } from "@/hooks/useGradeFormatter";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cardHover, staggerContainer, staggerItem } from "@/lib/motion";

function useAnimatedValue(value: number, duration: number = 1000) {
    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        const startValue = 0;
        const endValue = value;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            const easeProgress = 1 - Math.pow(1 - progress, 3);
            setAnimatedValue(Math.round(startValue + (endValue - startValue) * easeProgress));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return animatedValue;
}

export { useAnimatedValue };

interface StatsCardsProps {
    selectedClass: UIClass;
    students: UIStudent[];
    grades: UIGrade[];
}

export function StatsCards({ selectedClass, students, grades }: StatsCardsProps) {
    const { formatGrade, getGradeColor } = useGradeFormatter();

    const studentCount = students.length;

    const averageGradeValue = grades.length > 0
        ? grades.reduce((sum, g) => sum + g.finalGrade, 0) / grades.length
        : null;
    const averageGrade = averageGradeValue !== null ? formatGrade(averageGradeValue) : "N/A";
    const averageGradeColor = averageGradeValue !== null ? getGradeColor(averageGradeValue) : "";

    const lastMonthGrades = grades.filter(g => {
        const gradeDate = new Date(g.date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - gradeDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
    });

    const animatedStudentCount = useAnimatedValue(studentCount);
    const animatedRecentGrades = useAnimatedValue(lastMonthGrades.length);

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
        <motion.div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={staggerItem}>
                <motion.div
                    className="shadow-sm hover:shadow-md transition-shadow"
                    {...cardHover}
                >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Totale Studenti</CardTitle>
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            >
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </motion.div>
                        </CardHeader>
                        <CardContent>
                            <motion.div
                                className="text-2xl font-bold"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                            >
                                {animatedStudentCount}
                            </motion.div>
                            <p className="text-xs text-muted-foreground">
                                Iscritti alla classe {selectedClass.name}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            <motion.div variants={staggerItem}>
                <motion.div
                    className="shadow-sm hover:shadow-md transition-shadow"
                    {...cardHover}
                >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Media Classe</CardTitle>
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                            >
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            </motion.div>
                        </CardHeader>
                        <CardContent>
                            <motion.div
                                className={`text-2xl font-bold ${averageGradeColor}`}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                            >
                                {averageGrade}
                            </motion.div>
                            <p className="text-xs text-muted-foreground">
                                Basata su {grades.length} valutazioni
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            <motion.div variants={staggerItem}>
                <motion.div
                    className="shadow-sm hover:shadow-md transition-shadow"
                    {...cardHover}
                >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Valutazioni Recenti</CardTitle>
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                            >
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </motion.div>
                        </CardHeader>
                        <CardContent>
                            <motion.div
                                className="text-2xl font-bold"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                            >
                                +{animatedRecentGrades}
                            </motion.div>
                            <p className="text-xs text-muted-foreground">
                                Negli ultimi 30 giorni
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            <motion.div variants={staggerItem}>
                <motion.div
                    className="shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                    {...cardHover}
                >
                    <Card>
                        <motion.div
                            className="absolute top-0 right-0 p-2 opacity-10"
                            initial={{ scale: 0, rotate: 0 }}
                            animate={{ scale: 1, rotate: 15 }}
                            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                        >
                            <Trophy className="w-24 h-24" />
                        </motion.div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Miglior Categoria</CardTitle>
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                            >
                                <Trophy className="h-4 w-4 text-yellow-500" />
                            </motion.div>
                        </CardHeader>
                        <CardContent>
                            <motion.div
                                className="text-2xl font-bold capitalize"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                            >
                                {bestCategory}
                            </motion.div>
                            <p className="text-xs text-muted-foreground">
                                Media: {bestScore > 0 ? formatGrade(bestScore) : '-'}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

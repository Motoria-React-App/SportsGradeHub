import { useMemo } from "react";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSchoolData } from "@/provider/clientProvider";
import { Activity } from "lucide-react";
import { motion } from "framer-motion";
import { scaleIn, cardHover } from "@/lib/motion";

interface ClassPerformanceRadarProps {
    selectedClassId: string;
}

export function ClassPerformanceRadar({ selectedClassId }: ClassPerformanceRadarProps) {
    const { classes, evaluations, exercises, exerciseGroups } = useSchoolData();

    // Calculate metrics
    const radarData = useMemo(() => {
        if (!selectedClassId) return [];

        const schoolClass = classes.find((c) => c.id === selectedClassId);
        if (!schoolClass) return [];

        // 1. Get all exercises assigned to this class
        const studentIds = schoolClass.students;

        // Filter evaluations for this class
        const classEvaluations = evaluations.filter((ev) =>
            studentIds.includes(ev.studentId) && ev.score > 0
        );

        if (classEvaluations.length === 0) return [];

        // Group scores by Exercise Group
        const groupScores: Record<string, { total: number; count: number }> = {};

        classEvaluations.forEach((ev) => {
            const exercise = exercises.find((ex) => ex.id === ev.exerciseId);
            if (!exercise) return;

            const groupId = exercise.exerciseGroupId || "ungrouped";

            if (!groupScores[groupId]) {
                groupScores[groupId] = { total: 0, count: 0 };
            }

            groupScores[groupId].total += ev.score;
            groupScores[groupId].count += 1;
        });

        // Format data for Recharts
        const data = Object.keys(groupScores).map((groupId) => {
            const group = exerciseGroups.find((g) => g.id === groupId);
            const groupName = group ? group.groupName : "Altri";
            // Shorten very long names if needed
            const displayName = groupName.length > 15 ? groupName.substring(0, 15) + "..." : groupName;

            return {
                subject: displayName,
                fullSubject: groupName,
                A: Math.round((groupScores[groupId].total / groupScores[groupId].count) * 10) / 10, // Average score formatted to 1 decimal
                fullMark: 10, // Assuming 10 is max grade
            };
        });

        // Filter out groups with very few evaluations if needed, or just show all
        // Sort by subject name or keep specific order? Alphabetical is fine.
        return data.sort((a, b) => a.subject.localeCompare(b.subject));
    }, [selectedClassId, classes, evaluations, exercises, exerciseGroups]);

    if (!selectedClassId) return null;

    return (
        <motion.div
            className="col-span-1"
            variants={scaleIn}
            initial="hidden"
            animate="visible"
        >
            <motion.div {...cardHover}>
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            >
                                <Activity className="w-4 h-4 text-primary" />
                            </motion.div>
                            Profilo Atletico
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full flex items-center justify-center">
                            {radarData.length >= 3 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                    className="w-full h-full"
                                >
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                            <PolarGrid strokeDasharray="3 3" className="opacity-50" />
                                            <PolarAngleAxis
                                                dataKey="subject"
                                                tick={{ fill: 'currentColor', fontSize: 12, className: 'text-muted-foreground' }}
                                            />
                                            <PolarRadiusAxis
                                                angle={30}
                                                domain={[0, 10]}
                                                tick={false}
                                                axisLine={false}
                                            />
                                            <Radar
                                                name="Media Classe"
                                                dataKey="A"
                                                stroke="#3b82f6"
                                                fill="#3b82f6"
                                                fillOpacity={0.5}
                                                animationDuration={1000}
                                                animationEasing="ease-out"
                                            />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <motion.div
                                                                className="rounded-lg border bg-popover p-2 shadow-sm"
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                            >
                                                                <p className="text-sm font-medium text-popover-foreground">
                                                                    {data.fullSubject}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Media Voto: <span className="font-bold text-foreground">{data.A}</span>
                                                                </p>
                                                            </motion.div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </motion.div>
                            ) : radarData.length > 0 ? (
                                <motion.div
                                    className="text-center text-muted-foreground p-6"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <p>Dati insufficienti per il grafico radar.</p>
                                    <p className="text-sm mt-2">Servono valutazioni in almeno 3 gruppi di esercizi diversi.</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    className="text-center text-muted-foreground p-6"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <p>Nessun dato di valutazione disponibile.</p>
                                    <p className="text-sm mt-2">Valuta gli esercizi per vedere il profilo della classe.</p>
                                </motion.div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    Line,
    LineChart,
    CartesianGrid,
    Legend,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
} from "recharts";
import { useSchoolData } from "@/provider/clientProvider";
import { useSettings } from "@/provider/settingsProvider";
import { SiteHeader } from "@/components/site-header";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition, slideUp, staggerContainer, staggerItem, cardHover } from "@/lib/motion";
import {
    Archive,
    ArrowLeftRight,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Users,
    Award,
    GraduationCap,
    Search,
    BarChart3,
    Layers,
    History,
    Sparkles,
    Calendar,
} from "lucide-react";
import { SchoolClass, Evaluation, Exercise, ExerciseGroup } from "@/types/types";

interface ClassMetrics {
    cls: SchoolClass;
    studentCount: number;
    evalCount: number;
    avgGrade: number;
    passingRate: number;
    highestGrade: number;
    lowestGrade: number;
    gradeDistribution: {
        range: string;
        label: string;
        count: number;
        percentage: number;
    }[];
    groupAverages: {
        groupId: string;
        groupName: string;
        avgGrade: number;
        evalCount: number;
    }[];
    exerciseAverages: Map<string, {
        exercise: Exercise;
        avgGrade: number;
        evalCount: number;
    }>;
}

function computeClassMetrics(
    cls: SchoolClass | undefined,
    evaluations: Evaluation[],
    exercises: Exercise[],
    exerciseGroups: ExerciseGroup[],
    passingGrade: number
): ClassMetrics | null {
    if (!cls) return null;

    const studentIds = new Set(cls.students || []);
    const classEvals = evaluations.filter(
        e => studentIds.has(e.studentId) && typeof e.score === "number" && e.score > 0
    );

    const totalScore = classEvals.reduce((sum, e) => sum + e.score, 0);
    const avgGrade = classEvals.length > 0 ? Math.round((totalScore / classEvals.length) * 10) / 10 : 0;

    const passingCount = classEvals.filter(e => e.score >= passingGrade).length;
    const passingRate = classEvals.length > 0 ? Math.round((passingCount / classEvals.length) * 100) : 0;

    const scores = classEvals.map(e => e.score);
    const highestGrade = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestGrade = scores.length > 0 ? Math.min(...scores) : 0;

    // Grade brackets
    const b1 = classEvals.filter(e => e.score < 6).length;
    const b2 = classEvals.filter(e => e.score >= 6 && e.score < 7).length;
    const b3 = classEvals.filter(e => e.score >= 7 && e.score < 8).length;
    const b4 = classEvals.filter(e => e.score >= 8 && e.score < 9).length;
    const b5 = classEvals.filter(e => e.score >= 9).length;

    const total = classEvals.length;
    const gradeDistribution = [
        { range: "< 6", label: "Insuff. (<6)", count: b1, percentage: total > 0 ? Math.round((b1 / total) * 100) : 0 },
        { range: "6 - 6.9", label: "Suff. (6-6.9)", count: b2, percentage: total > 0 ? Math.round((b2 / total) * 100) : 0 },
        { range: "7 - 7.9", label: "Discreto (7-7.9)", count: b3, percentage: total > 0 ? Math.round((b3 / total) * 100) : 0 },
        { range: "8 - 8.9", label: "Buono (8-8.9)", count: b4, percentage: total > 0 ? Math.round((b4 / total) * 100) : 0 },
        { range: "9 - 10", label: "Ottimo (9-10)", count: b5, percentage: total > 0 ? Math.round((b5 / total) * 100) : 0 },
    ];

    // Group averages
    const groupAverages = exerciseGroups.map(grp => {
        const grpExercises = exercises.filter(ex => ex.exerciseGroupId === grp.id);
        const grpExerciseIds = new Set(grpExercises.map(ex => ex.id));
        const grpEvals = classEvals.filter(e => grpExerciseIds.has(e.exerciseId));
        const grpSum = grpEvals.reduce((sum, e) => sum + e.score, 0);
        const grpAvg = grpEvals.length > 0 ? Math.round((grpSum / grpEvals.length) * 10) / 10 : 0;
        return {
            groupId: grp.id,
            groupName: grp.groupName,
            avgGrade: grpAvg,
            evalCount: grpEvals.length,
        };
    });

    // Exercise averages
    const exerciseAverages = new Map<string, { exercise: Exercise; avgGrade: number; evalCount: number }>();
    exercises.forEach(ex => {
        const exEvals = classEvals.filter(e => e.exerciseId === ex.id);
        if (exEvals.length > 0) {
            const exSum = exEvals.reduce((sum, e) => sum + e.score, 0);
            exerciseAverages.set(ex.id, {
                exercise: ex,
                avgGrade: Math.round((exSum / exEvals.length) * 10) / 10,
                evalCount: exEvals.length,
            });
        }
    });

    return {
        cls,
        studentCount: (cls.students || []).length,
        evalCount: classEvals.length,
        avgGrade,
        passingRate,
        highestGrade,
        lowestGrade,
        gradeDistribution,
        groupAverages,
        exerciseAverages,
    };
}

export default function Analytics() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { classes, activeClasses, archivedClasses, students, evaluations, exercises, exerciseGroups } = useSchoolData();
    const { settings } = useSettings();

    const paramTab = searchParams.get("tab");
    const [activeTab, setActiveTab] = useState<string>(paramTab || "generale");

    // Selection for comparison
    const [classAId, setClassAId] = useState<string>(searchParams.get("class1") || "");
    const [classBId, setClassBId] = useState<string>(searchParams.get("class2") || "");

    // Comparison view mode: "bars" | "radar"
    const [disciplineChartMode, setDisciplineChartMode] = useState<"bars" | "radar">("bars");
    const [exerciseSearch, setExerciseSearch] = useState<string>("");

    // Sync from searchParams when changed externally
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
        const c1 = searchParams.get("class1");
        if (c1 && c1 !== classAId) {
            setClassAId(c1);
        }
        const c2 = searchParams.get("class2");
        if (c2 && c2 !== classBId) {
            setClassBId(c2);
        }
    }, [searchParams]);

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        const newParams = new URLSearchParams(searchParams);
        newParams.set("tab", val);
        setSearchParams(newParams, { replace: true });
    };

    const handleSelectClassA = (id: string) => {
        setClassAId(id);
        const newParams = new URLSearchParams(searchParams);
        newParams.set("tab", "classi");
        newParams.set("class1", id);
        if (classBId) newParams.set("class2", classBId);
        setSearchParams(newParams, { replace: true });
    };

    const handleSelectClassB = (id: string) => {
        setClassBId(id);
        const newParams = new URLSearchParams(searchParams);
        newParams.set("tab", "classi");
        if (classAId) newParams.set("class1", classAId);
        newParams.set("class2", id);
        setSearchParams(newParams, { replace: true });
    };

    const handleSwapClasses = () => {
        const temp = classAId;
        setClassAId(classBId);
        setClassBId(temp);
        const newParams = new URLSearchParams(searchParams);
        newParams.set("tab", "classi");
        if (classBId) newParams.set("class1", classBId);
        else newParams.delete("class1");
        if (temp) newParams.set("class2", temp);
        else newParams.delete("class2");
        setSearchParams(newParams, { replace: true });
    };

    // Auto-select Class A if not selected and classes exist
    useEffect(() => {
        if (!classAId && classes.length > 0) {
            if (activeClasses.length > 0) {
                setClassAId(activeClasses[0].id);
            } else {
                setClassAId(classes[0].id);
            }
        }
    }, [classAId, classes, activeClasses]);

    // Active classes and metrics
    const classA = useMemo(() => classes.find(c => c.id === classAId), [classes, classAId]);
    const classB = useMemo(() => classes.find(c => c.id === classBId), [classes, classBId]);

    const metricsA = useMemo(() => {
        return computeClassMetrics(classA, evaluations, exercises, exerciseGroups, settings.passingGrade || 6);
    }, [classA, evaluations, exercises, exerciseGroups, settings.passingGrade]);

    const metricsB = useMemo(() => {
        return computeClassMetrics(classB, evaluations, exercises, exerciseGroups, settings.passingGrade || 6);
    }, [classB, evaluations, exercises, exerciseGroups, settings.passingGrade]);

    // Suggested historical comparisons for Class A
    const suggestedComparisons = useMemo(() => {
        if (!classA) return [];
        return archivedClasses
            .filter(c => c.id !== classA.id)
            .sort((a, b) => {
                // Prioritize matching className
                if (a.className === classA.className) return -1;
                if (b.className === classA.className) return 1;
                return b.schoolYear.localeCompare(a.schoolYear);
            })
            .slice(0, 3);
    }, [classA, archivedClasses]);

    // General Overview Data
    const generalClassList = useMemo(() => {
        return classes.map(c => {
            const m = computeClassMetrics(c, evaluations, exercises, exerciseGroups, settings.passingGrade || 6);
            return {
                id: c.id,
                name: c.className,
                year: c.schoolYear,
                isArchived: c.isArchived,
                studentCount: (c.students || []).length,
                evalCount: m?.evalCount || 0,
                avgGrade: m?.avgGrade || 0,
                passingRate: m?.passingRate || 0,
            };
        });
    }, [classes, evaluations, exercises, exerciseGroups, settings.passingGrade]);

    const globalStats = useMemo(() => {
        const validEvals = evaluations.filter(e => typeof e.score === "number" && e.score > 0);
        const sum = validEvals.reduce((s, e) => s + e.score, 0);
        const avg = validEvals.length > 0 ? Math.round((sum / validEvals.length) * 10) / 10 : 0;
        const passGrade = settings.passingGrade || 6;
        const passing = validEvals.filter(e => e.score >= passGrade).length;
        const passRate = validEvals.length > 0 ? Math.round((passing / validEvals.length) * 100) : 0;

        return {
            totalClasses: classes.length,
            activeClassesCount: activeClasses.length,
            archivedClassesCount: archivedClasses.length,
            totalStudents: students.length,
            totalEvaluations: validEvals.length,
            globalAverage: avg,
            globalPassingRate: passRate,
        };
    }, [classes, activeClasses, archivedClasses, students, evaluations, settings.passingGrade]);

    // Monthly Evaluation Trends
    const monthlyTrendData = useMemo(() => {
        const monthNames = ["Set", "Ott", "Nov", "Dic", "Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago"];
        const monthMap = new Map<number, { count: number; totalScore: number }>();
        for (let i = 0; i < 12; i++) {
            monthMap.set(i, { count: 0, totalScore: 0 });
        }

        evaluations.forEach(e => {
            if (!e.createdAt || typeof e.score !== "number" || e.score <= 0) return;
            const date = new Date(e.createdAt);
            if (!isNaN(date.getTime())) {
                const m = date.getMonth(); // 0-11
                const cur = monthMap.get(m)!;
                cur.count++;
                cur.totalScore += e.score;
            }
        });

        // Order according to Italian school year: Sep (8) to Aug (7)
        const schoolYearMonthIndices = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7];
        return schoolYearMonthIndices.map(idx => {
            const data = monthMap.get(idx)!;
            const avg = data.count > 0 ? Math.round((data.totalScore / data.count) * 10) / 10 : 0;
            return {
                month: monthNames[idx === 8 ? 0 : idx === 9 ? 1 : idx === 10 ? 2 : idx === 11 ? 3 : idx + 4],
                valutazioni: data.count,
                media: avg,
            };
        });
    }, [evaluations]);

    // Group comparison data for Discipline chart
    const groupChartData = useMemo(() => {
        if (!metricsA && !metricsB) return [];
        return exerciseGroups
            .map(grp => {
                const gA = metricsA?.groupAverages.find(g => g.groupId === grp.id);
                const gB = metricsB?.groupAverages.find(g => g.groupId === grp.id);
                return {
                    name: grp.groupName.length > 15 ? grp.groupName.slice(0, 15) + "..." : grp.groupName,
                    fullName: grp.groupName,
                    classeA: gA?.avgGrade || 0,
                    classeB: gB?.avgGrade || 0,
                    A: gA?.avgGrade || 0,
                    B: gB?.avgGrade || 0,
                    subject: grp.groupName.length > 13 ? grp.groupName.slice(0, 13) + "..." : grp.groupName,
                    fullMark: 10,
                };
            })
            .filter(item => item.classeA > 0 || item.classeB > 0);
    }, [metricsA, metricsB, exerciseGroups]);

    // Grade Distribution comparison data
    const distributionChartData = useMemo(() => {
        if (!metricsA && !metricsB) return [];
        const brackets = [
            { range: "< 6", label: "< 6 (Insuff.)" },
            { range: "6 - 6.9", label: "6 - 6.9 (Suff.)" },
            { range: "7 - 7.9", label: "7 - 7.9 (Discreto)" },
            { range: "8 - 8.9", label: "8 - 8.9 (Buono)" },
            { range: "9 - 10", label: "9 - 10 (Ottimo)" },
        ];

        return brackets.map((b, idx) => {
            const pA = metricsA?.gradeDistribution[idx]?.percentage || 0;
            const pB = metricsB?.gradeDistribution[idx]?.percentage || 0;
            return {
                range: b.label,
                classeA: pA,
                classeB: pB,
            };
        });
    }, [metricsA, metricsB]);

    // Exercise Detailed Comparison Table data
    const exerciseComparisonList = useMemo(() => {
        if (!metricsA && !metricsB) return [];

        const list = exercises
            .map(ex => {
                const aData = metricsA?.exerciseAverages.get(ex.id);
                const bData = metricsB?.exerciseAverages.get(ex.id);
                const grp = exerciseGroups.find(g => g.id === ex.exerciseGroupId);

                if (!aData && !bData) return null;

                const avgA = aData ? aData.avgGrade : null;
                const avgB = bData ? bData.avgGrade : null;
                const diff = avgA !== null && avgB !== null ? Math.round((avgA - avgB) * 10) / 10 : null;

                return {
                    id: ex.id,
                    name: ex.name,
                    groupName: grp?.groupName || "Generale",
                    unit: ex.unit,
                    avgA,
                    countA: aData?.evalCount || 0,
                    avgB,
                    countB: bData?.evalCount || 0,
                    diff,
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

        if (!exerciseSearch.trim()) return list;

        const term = exerciseSearch.toLowerCase();
        return list.filter(
            ex => ex.name.toLowerCase().includes(term) || ex.groupName.toLowerCase().includes(term)
        );
    }, [metricsA, metricsB, exercises, exerciseGroups, exerciseSearch]);

    // Calculated deltas
    const deltaAvg = useMemo(() => {
        if (!metricsA || !metricsB || metricsA.avgGrade === 0 || metricsB.avgGrade === 0) return null;
        return Math.round((metricsA.avgGrade - metricsB.avgGrade) * 10) / 10;
    }, [metricsA, metricsB]);

    const deltaPassing = useMemo(() => {
        if (!metricsA || !metricsB || metricsA.evalCount === 0 || metricsB.evalCount === 0) return null;
        return metricsA.passingRate - metricsB.passingRate;
    }, [metricsA, metricsB]);

    return (
        <motion.div
            className="flex flex-1 flex-col p-4 md:p-6 space-y-6"
            variants={pageTransition}
            initial="hidden"
            animate="visible"
        >
            <SiteHeader />

            <motion.div variants={slideUp} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        Analisi & Confronto Dati
                    </h1>
                    <p className="text-muted-foreground">
                        Statistiche dell'istituto, monitoraggio dell'andamento e confronto dettagliato con lo storico delle classi archiviate
                    </p>
                </div>
            </motion.div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="generale">Panoramica</TabsTrigger>
                    <TabsTrigger value="classi" className="flex items-center gap-1.5">
                        <ArrowLeftRight className="h-4 w-4" />
                        Confronto Classi
                    </TabsTrigger>
                    <TabsTrigger value="andamento">Valutazioni</TabsTrigger>
                </TabsList>

                <div className="relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                        >
                            {/* ===================== TAB GENERALE ===================== */}
                            {activeTab === "generale" && (
                                <TabsContent value="generale" forceMount className="space-y-6 mt-0">
                                    <motion.div
                                        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                                        variants={staggerContainer}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        <motion.div variants={staggerItem}>
                                            <motion.div {...cardHover}>
                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                                        <CardTitle className="text-sm font-medium">Totale Classi</CardTitle>
                                                        <Layers className="h-4 w-4 text-muted-foreground" />
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-3xl font-bold">{globalStats.totalClasses}</div>
                                                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                                                ● {globalStats.activeClassesCount} attive
                                                            </span>
                                                            <span>•</span>
                                                            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                                                                <Archive className="h-3 w-3" /> {globalStats.archivedClassesCount} archiviate
                                                            </span>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        </motion.div>

                                        <motion.div variants={staggerItem}>
                                            <motion.div {...cardHover}>
                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                                        <CardTitle className="text-sm font-medium">Totale Studenti</CardTitle>
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-3xl font-bold">{globalStats.totalStudents}</div>
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            Iscritti nelle classi del registro
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        </motion.div>

                                        <motion.div variants={staggerItem}>
                                            <motion.div {...cardHover}>
                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                                        <CardTitle className="text-sm font-medium">Valutazioni Registrate</CardTitle>
                                                        <Award className="h-4 w-4 text-muted-foreground" />
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-3xl font-bold">{globalStats.totalEvaluations}</div>
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            Prove ed esercizi registrati
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        </motion.div>

                                        <motion.div variants={staggerItem}>
                                            <motion.div {...cardHover}>
                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                                        <CardTitle className="text-sm font-medium">Media d'Istituto</CardTitle>
                                                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-3xl font-bold">
                                                            {globalStats.globalAverage > 0 ? `${globalStats.globalAverage}/10` : "N/D"}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            Tasso sufficienze: <strong className="text-foreground">{globalStats.globalPassingRate}%</strong>
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        </motion.div>
                                    </motion.div>

                                    {/* Overview Charts */}
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Studenti per Classe</CardTitle>
                                                <CardDescription>Distribuzione tra classi attive e archiviate</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                {generalClassList.length > 0 ? (
                                                    <div className="h-[300px] w-full">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={generalClassList} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                                <XAxis
                                                                    dataKey="name"
                                                                    tick={{ fontSize: 12 }}
                                                                />
                                                                <YAxis />
                                                                <Tooltip
                                                                    contentStyle={{
                                                                        backgroundColor: "hsl(var(--popover))",
                                                                        borderColor: "hsl(var(--border))",
                                                                        color: "hsl(var(--popover-foreground))",
                                                                        borderRadius: "8px",
                                                                    }}
                                                                    formatter={(val: any, _: any, item: any) => [
                                                                        `${val} studenti (${item.payload.year}${item.payload.isArchived ? " - Archiviata" : ""})`,
                                                                        "Iscritti",
                                                                    ]}
                                                                />
                                                                <Bar
                                                                    dataKey="studentCount"
                                                                    fill="hsl(var(--primary))"
                                                                    radius={[4, 4, 0, 0]}
                                                                    name="Studenti"
                                                                />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                ) : (
                                                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                                        Nessuna classe disponibile
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Media Voti per Classe</CardTitle>
                                                <CardDescription>Rendimento medio complessivo per ogni classe</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                {generalClassList.length > 0 ? (
                                                    <div className="h-[300px] w-full">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={generalClassList} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                                <XAxis
                                                                    dataKey="name"
                                                                    tick={{ fontSize: 12 }}
                                                                />
                                                                <YAxis domain={[0, 10]} ticks={[2, 4, 6, 8, 10]} />
                                                                <Tooltip
                                                                    contentStyle={{
                                                                        backgroundColor: "hsl(var(--popover))",
                                                                        borderColor: "hsl(var(--border))",
                                                                        color: "hsl(var(--popover-foreground))",
                                                                        borderRadius: "8px",
                                                                    }}
                                                                    formatter={(val: any, _: any, item: any) => [
                                                                        `${val} / 10 (${item.payload.year}${item.payload.isArchived ? " - Archiviata" : ""})`,
                                                                        "Media",
                                                                    ]}
                                                                />
                                                                <Bar
                                                                    dataKey="avgGrade"
                                                                    fill="#10b981"
                                                                    radius={[4, 4, 0, 0]}
                                                                    name="Media Voti"
                                                                />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                ) : (
                                                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                                        Nessuna valutazione registrata
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                            )}

                            {/* ===================== TAB CONFRONTO CLASSI ===================== */}
                            {activeTab === "classi" && (
                                <TabsContent value="classi" forceMount className="space-y-6 mt-0">
                                    {/* Class Selection Controls Card */}
                                    <Card className="border-primary/20 bg-muted/20">
                                        <CardHeader className="pb-4">
                                            <CardTitle className="text-lg flex items-center justify-between">
                                                <span className="flex items-center gap-2">
                                                    <ArrowLeftRight className="h-5 w-5 text-primary" />
                                                    Selettore di Confronto
                                                </span>
                                                <span className="text-xs text-muted-foreground font-normal">
                                                    Confronta qualsiasi classe attiva o storico archiviato
                                                </span>
                                            </CardTitle>
                                            <CardDescription>
                                                Seleziona una classe di riferimento (Classe A) e una classe con cui confrontarla (Classe B, ad es. l'anno precedente archiviato).
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
                                                {/* Select Class A */}
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                                        <span>Classe A (Riferimento / Nuova)</span>
                                                        {classA && (
                                                            <Badge variant={classA.isArchived ? "outline" : "default"} className="text-[10px] h-5 gap-1">
                                                                {classA.isArchived ? <Archive className="h-2.5 w-2.5" /> : "●"}
                                                                {classA.isArchived ? "Archiviata" : "Attiva"}
                                                            </Badge>
                                                        )}
                                                    </label>
                                                    <Select value={classAId} onValueChange={handleSelectClassA}>
                                                        <SelectTrigger className="w-full bg-background">
                                                            <SelectValue placeholder="Seleziona Classe A..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {activeClasses.length > 0 && (
                                                                <SelectGroup>
                                                                    <SelectLabel className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                                                        Classi Attive
                                                                    </SelectLabel>
                                                                    {activeClasses.map(c => (
                                                                        <SelectItem key={c.id} value={c.id}>
                                                                            {c.className} ({c.schoolYear})
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectGroup>
                                                            )}
                                                            {archivedClasses.length > 0 && (
                                                                <SelectGroup>
                                                                    <SelectLabel className="font-semibold text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                                                        <Archive className="h-3 w-3" /> Classi Archiviate
                                                                    </SelectLabel>
                                                                    {archivedClasses.map(c => (
                                                                        <SelectItem key={c.id} value={c.id}>
                                                                            {c.className} ({c.schoolYear}) [Archiviata]
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectGroup>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Swap Button */}
                                                <div className="flex justify-center pt-5">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="rounded-full shadow-sm hover:bg-primary/10 hover:text-primary transition-colors"
                                                        onClick={handleSwapClasses}
                                                        disabled={!classAId || !classBId}
                                                        title="Inverti Classi"
                                                    >
                                                        <ArrowLeftRight className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {/* Select Class B */}
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                                        <span>Classe B (Confronto / Storico)</span>
                                                        {classB && (
                                                            <Badge variant={classB.isArchived ? "outline" : "secondary"} className="text-[10px] h-5 gap-1">
                                                                {classB.isArchived ? <Archive className="h-2.5 w-2.5" /> : "●"}
                                                                {classB.isArchived ? "Archiviata" : "Attiva"}
                                                            </Badge>
                                                        )}
                                                    </label>
                                                    <Select value={classBId} onValueChange={handleSelectClassB}>
                                                        <SelectTrigger className="w-full bg-background">
                                                            <SelectValue placeholder="Seleziona Classe B (storica o attiva)..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {archivedClasses.length > 0 && (
                                                                <SelectGroup>
                                                                    <SelectLabel className="font-semibold text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                                                        <Archive className="h-3 w-3" /> Classi Archiviate (Storico)
                                                                    </SelectLabel>
                                                                    {archivedClasses.map(c => (
                                                                        <SelectItem key={c.id} value={c.id} disabled={c.id === classAId}>
                                                                            {c.className} ({c.schoolYear}) [Archiviata]
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectGroup>
                                                            )}
                                                            {activeClasses.length > 0 && (
                                                                <SelectGroup>
                                                                    <SelectLabel className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                                                        Classi Attive
                                                                    </SelectLabel>
                                                                    {activeClasses.map(c => (
                                                                        <SelectItem key={c.id} value={c.id} disabled={c.id === classAId}>
                                                                            {c.className} ({c.schoolYear})
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectGroup>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Smart Historical Suggestions if only Class A selected */}
                                            {classA && !classBId && suggestedComparisons.length > 0 && (
                                                <div className="pt-2 border-t flex flex-wrap items-center gap-2 text-xs">
                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                                        Confronto rapido consigliato:
                                                    </span>
                                                    {suggestedComparisons.map(arch => (
                                                        <Button
                                                            key={arch.id}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs gap-1 border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/10"
                                                            onClick={() => handleSelectClassB(arch.id)}
                                                        >
                                                            <History className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                                            {arch.className} ({arch.schoolYear})
                                                        </Button>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Case 1: No Class B selected */}
                                    {(!classA || !classB) ? (
                                        <Card className="border-dashed py-12 text-center">
                                            <CardContent className="space-y-4 max-w-md mx-auto">
                                                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                                                    <ArrowLeftRight className="h-7 w-7" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="font-semibold text-lg">Seleziona due classi da confrontare</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Scegli la Classe A (ad es. la classe attuale) e la Classe B (ad es. la stessa classe dell'anno scorso archiviata) per vedere il confronto delle performance motorie, medie voti e radar delle abilità.
                                                    </p>
                                                </div>
                                                {archivedClasses.length > 0 && activeClasses.length > 0 && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="gap-2 mt-2"
                                                        onClick={() => {
                                                            handleSelectClassA(activeClasses[0].id);
                                                            handleSelectClassB(archivedClasses[0].id);
                                                        }}
                                                    >
                                                        <History className="h-4 w-4 text-amber-600" />
                                                        Confronta {activeClasses[0].className} con {archivedClasses[0].className} ({archivedClasses[0].schoolYear})
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        /* Case 2: Both classes selected - FULL COMPARISON VIEW */
                                        <div className="space-y-6">
                                            {/* Comparison Header Banner */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Card Class A */}
                                                <Card className="border-l-4 border-l-primary bg-card/60">
                                                    <CardContent className="pt-5 pb-4">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Classe A</span>
                                                                <h2 className="text-2xl font-bold tracking-tight">{classA.className}</h2>
                                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                                    <Calendar className="h-3 w-3" />
                                                                    Anno Scolastico: {classA.schoolYear}
                                                                </p>
                                                            </div>
                                                            <Badge variant={classA.isArchived ? "outline" : "default"} className="gap-1">
                                                                {classA.isArchived ? <Archive className="h-3 w-3 text-amber-600" /> : "●"}
                                                                {classA.isArchived ? "Archiviata" : "In Corso"}
                                                            </Badge>
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                {/* Card Class B */}
                                                <Card className="border-l-4 border-l-amber-500 bg-card/60">
                                                    <CardContent className="pt-5 pb-4">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Classe B (Confronto)</span>
                                                                <h2 className="text-2xl font-bold tracking-tight">{classB.className}</h2>
                                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                                    <Calendar className="h-3 w-3" />
                                                                    Anno Scolastico: {classB.schoolYear}
                                                                </p>
                                                            </div>
                                                            <Badge variant={classB.isArchived ? "outline" : "secondary"} className="gap-1">
                                                                {classB.isArchived ? <Archive className="h-3 w-3 text-amber-600" /> : "●"}
                                                                {classB.isArchived ? "Archiviata" : "In Corso"}
                                                            </Badge>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Key Metrics Comparison Cards */}
                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                                {/* Metric 1: Media Voti */}
                                                <Card>
                                                    <CardHeader className="pb-2">
                                                        <div className="flex items-center justify-between">
                                                            <CardTitle className="text-sm font-medium">Media Generale</CardTitle>
                                                            {deltaAvg !== null && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-xs gap-1 font-semibold ${
                                                                        deltaAvg > 0
                                                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                                            : deltaAvg < 0
                                                                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                                                            : "bg-muted text-muted-foreground"
                                                                    }`}
                                                                >
                                                                    {deltaAvg > 0 ? (
                                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                                    ) : deltaAvg < 0 ? (
                                                                        <ArrowDownRight className="h-3.5 w-3.5" />
                                                                    ) : (
                                                                        <Minus className="h-3.5 w-3.5" />
                                                                    )}
                                                                    {deltaAvg > 0 ? `+${deltaAvg}` : `${deltaAvg}`}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="flex items-baseline justify-between mt-1">
                                                            <div>
                                                                <span className="text-2xl font-bold text-primary">
                                                                    {metricsA?.avgGrade ? `${metricsA.avgGrade}` : "N/D"}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground ml-1">({classA.className})</span>
                                                            </div>
                                                            <span className="text-muted-foreground text-xs font-semibold">vs</span>
                                                            <div className="text-right">
                                                                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                                                    {metricsB?.avgGrade ? `${metricsB.avgGrade}` : "N/D"}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground ml-1">({classB.className})</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground mt-3">
                                                            {deltaAvg !== null && deltaAvg > 0
                                                                ? "La classe attuale ha una media superiore rispetto allo storico"
                                                                : deltaAvg !== null && deltaAvg < 0
                                                                ? "La classe attuale ha una media inferiore rispetto allo storico"
                                                                : "Prestazioni allineate tra le due classi"}
                                                        </p>
                                                    </CardContent>
                                                </Card>

                                                {/* Metric 2: Tasso di Sufficienza */}
                                                <Card>
                                                    <CardHeader className="pb-2">
                                                        <div className="flex items-center justify-between">
                                                            <CardTitle className="text-sm font-medium">Tasso Sufficienza (≥ 6)</CardTitle>
                                                            {deltaPassing !== null && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-xs gap-1 font-semibold ${
                                                                        deltaPassing > 0
                                                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                                            : deltaPassing < 0
                                                                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                                                            : "bg-muted text-muted-foreground"
                                                                    }`}
                                                                >
                                                                    {deltaPassing > 0 ? `+${deltaPassing}%` : `${deltaPassing}%`}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="flex items-baseline justify-between mt-1">
                                                            <div>
                                                                <span className="text-2xl font-bold text-primary">
                                                                    {metricsA?.passingRate ?? 0}%
                                                                </span>
                                                                <span className="text-xs text-muted-foreground ml-1">({classA.className})</span>
                                                            </div>
                                                            <span className="text-muted-foreground text-xs font-semibold">vs</span>
                                                            <div className="text-right">
                                                                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                                                    {metricsB?.passingRate ?? 0}%
                                                                </span>
                                                                <span className="text-xs text-muted-foreground ml-1">({classB.className})</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground mt-3">
                                                            Soglia minima di sufficienza impostata: {settings.passingGrade || 6}.0
                                                        </p>
                                                    </CardContent>
                                                </Card>

                                                {/* Metric 3: Studenti */}
                                                <Card>
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-sm font-medium">Studenti Iscritti</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="flex items-baseline justify-between mt-1">
                                                            <div>
                                                                <span className="text-2xl font-bold text-primary">
                                                                    {metricsA?.studentCount ?? 0}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground ml-1">({classA.className})</span>
                                                            </div>
                                                            <span className="text-muted-foreground text-xs font-semibold">vs</span>
                                                            <div className="text-right">
                                                                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                                                    {metricsB?.studentCount ?? 0}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground ml-1">({classB.className})</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground mt-3">
                                                            Differenza: {Math.abs((metricsA?.studentCount || 0) - (metricsB?.studentCount || 0))} studenti
                                                        </p>
                                                    </CardContent>
                                                </Card>

                                                {/* Metric 4: Valutazioni */}
                                                <Card>
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-sm font-medium">Valutazioni Registrate</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="flex items-baseline justify-between mt-1">
                                                            <div>
                                                                <span className="text-2xl font-bold text-primary">
                                                                    {metricsA?.evalCount ?? 0}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground ml-1">({classA.className})</span>
                                                            </div>
                                                            <span className="text-muted-foreground text-xs font-semibold">vs</span>
                                                            <div className="text-right">
                                                                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                                                    {metricsB?.evalCount ?? 0}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground ml-1">({classB.className})</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground mt-3">
                                                            Totale voti registrati nelle schede
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Comparative Visualizations */}
                                            <div className="grid gap-6 md:grid-cols-2">
                                                {/* Chart 1: Discipline Comparison */}
                                                <Card>
                                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                        <div>
                                                            <CardTitle className="text-base">Confronto per Gruppi di Esercizi</CardTitle>
                                                            <CardDescription>
                                                                Medie nelle diverse abilità e discipline motorie (scala 1-10)
                                                            </CardDescription>
                                                        </div>
                                                        <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg text-xs">
                                                            <Button
                                                                variant={disciplineChartMode === "bars" ? "secondary" : "ghost"}
                                                                size="sm"
                                                                className="h-6 px-2 text-xs"
                                                                onClick={() => setDisciplineChartMode("bars")}
                                                            >
                                                                Barre
                                                            </Button>
                                                            <Button
                                                                variant={disciplineChartMode === "radar" ? "secondary" : "ghost"}
                                                                size="sm"
                                                                className="h-6 px-2 text-xs"
                                                                onClick={() => setDisciplineChartMode("radar")}
                                                            >
                                                                Radar
                                                            </Button>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                        {groupChartData.length > 0 ? (
                                                            <div className="h-[320px] w-full">
                                                                {disciplineChartMode === "bars" ? (
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <BarChart data={groupChartData} margin={{ top: 15, right: 15, left: -20, bottom: 20 }}>
                                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                                                            <YAxis domain={[0, 10]} ticks={[2, 4, 6, 8, 10]} />
                                                                            <Tooltip
                                                                                contentStyle={{
                                                                                    backgroundColor: "hsl(var(--popover))",
                                                                                    borderColor: "hsl(var(--border))",
                                                                                    color: "hsl(var(--popover-foreground))",
                                                                                    borderRadius: "8px",
                                                                                }}
                                                                                formatter={(val: any) => [`${val} / 10`, ""]}
                                                                            />
                                                                            <Legend />
                                                                            <Bar
                                                                                dataKey="classeA"
                                                                                name={`${classA.className} (${classA.schoolYear})`}
                                                                                fill="hsl(var(--primary))"
                                                                                radius={[4, 4, 0, 0]}
                                                                            />
                                                                            <Bar
                                                                                dataKey="classeB"
                                                                                name={`${classB.className} (${classB.schoolYear})`}
                                                                                fill="#f59e0b"
                                                                                radius={[4, 4, 0, 0]}
                                                                            />
                                                                        </BarChart>
                                                                    </ResponsiveContainer>
                                                                ) : (
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={groupChartData}>
                                                                            <PolarGrid stroke="hsl(var(--border))" />
                                                                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                                                                            <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="hsl(var(--muted-foreground))" />
                                                                            <Radar
                                                                                name={`${classA.className} (${classA.schoolYear})`}
                                                                                dataKey="A"
                                                                                stroke="hsl(var(--primary))"
                                                                                fill="hsl(var(--primary))"
                                                                                fillOpacity={0.4}
                                                                            />
                                                                            <Radar
                                                                                name={`${classB.className} (${classB.schoolYear})`}
                                                                                dataKey="B"
                                                                                stroke="#f59e0b"
                                                                                fill="#f59e0b"
                                                                                fillOpacity={0.3}
                                                                            />
                                                                            <Legend />
                                                                            <Tooltip
                                                                                contentStyle={{
                                                                                    backgroundColor: "hsl(var(--popover))",
                                                                                    borderColor: "hsl(var(--border))",
                                                                                    color: "hsl(var(--popover-foreground))",
                                                                                    borderRadius: "8px",
                                                                                }}
                                                                            />
                                                                        </RadarChart>
                                                                    </ResponsiveContainer>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">
                                                                Dati insufficienti per il confronto delle discipline
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>

                                                {/* Chart 2: Grade Distribution Comparison */}
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="text-base">Distribuzione dei Voti (% su totale)</CardTitle>
                                                        <CardDescription>
                                                            Ripartizione percentuale dei voti per fasce di rendimento
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        {distributionChartData.length > 0 ? (
                                                            <div className="h-[320px] w-full">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <BarChart data={distributionChartData} margin={{ top: 15, right: 15, left: -20, bottom: 20 }}>
                                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                                        <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                                                                        <YAxis unit="%" domain={[0, 100]} />
                                                                        <Tooltip
                                                                            contentStyle={{
                                                                                backgroundColor: "hsl(var(--popover))",
                                                                                borderColor: "hsl(var(--border))",
                                                                                color: "hsl(var(--popover-foreground))",
                                                                                borderRadius: "8px",
                                                                            }}
                                                                            formatter={(val: any) => [`${val}%`, ""]}
                                                                        />
                                                                        <Legend />
                                                                        <Bar
                                                                            dataKey="classeA"
                                                                            name={`${classA.className} (${classA.schoolYear})`}
                                                                            fill="hsl(var(--primary))"
                                                                            radius={[4, 4, 0, 0]}
                                                                        />
                                                                        <Bar
                                                                            dataKey="classeB"
                                                                            name={`${classB.className} (${classB.schoolYear})`}
                                                                            fill="#f59e0b"
                                                                            radius={[4, 4, 0, 0]}
                                                                        />
                                                                    </BarChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        ) : (
                                                            <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">
                                                                Nessuna valutazione registrata
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Exercise-by-Exercise Detailed Comparison Table */}
                                            <Card>
                                                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                    <div>
                                                        <CardTitle className="text-lg flex items-center gap-2">
                                                            <Award className="h-5 w-5 text-primary" />
                                                            Dettaglio Singoli Esercizi
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Confronto prestazione esercizio per esercizio tra le due classi
                                                        </CardDescription>
                                                    </div>
                                                    <div className="flex items-center gap-2 w-full md:w-64">
                                                        <div className="relative w-full">
                                                            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                                                            <Input
                                                                placeholder="Cerca esercizio..."
                                                                value={exerciseSearch}
                                                                onChange={e => setExerciseSearch(e.target.value)}
                                                                className="pl-8 h-9 text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    {exerciseComparisonList.length > 0 ? (
                                                        <div className="rounded-md border overflow-hidden">
                                                            <Table>
                                                                <TableHeader className="bg-muted/50">
                                                                    <TableRow>
                                                                        <TableHead className="font-semibold">Esercizio</TableHead>
                                                                        <TableHead className="font-semibold">Gruppo</TableHead>
                                                                        <TableHead className="text-right font-semibold">
                                                                            Media {classA.className}
                                                                        </TableHead>
                                                                        <TableHead className="text-right font-semibold">
                                                                            Media {classB.className}
                                                                        </TableHead>
                                                                        <TableHead className="text-center font-semibold">Differenza (Δ)</TableHead>
                                                                        <TableHead className="text-right font-semibold">Verdetto</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {exerciseComparisonList.map(row => (
                                                                        <TableRow key={row.id} className="hover:bg-muted/40">
                                                                            <TableCell className="font-medium text-sm">
                                                                                {row.name}
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Badge variant="outline" className="text-[11px]">
                                                                                    {row.groupName}
                                                                                </Badge>
                                                                            </TableCell>
                                                                            <TableCell className="text-right font-semibold text-primary">
                                                                                {row.avgA !== null ? (
                                                                                    <span>
                                                                                        {row.avgA} <span className="text-xs font-normal text-muted-foreground">({row.countA})</span>
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-muted-foreground font-normal text-xs">-</span>
                                                                                )}
                                                                            </TableCell>
                                                                            <TableCell className="text-right font-semibold text-amber-600 dark:text-amber-400">
                                                                                {row.avgB !== null ? (
                                                                                    <span>
                                                                                        {row.avgB} <span className="text-xs font-normal text-muted-foreground">({row.countB})</span>
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-muted-foreground font-normal text-xs">-</span>
                                                                                )}
                                                                            </TableCell>
                                                                            <TableCell className="text-center">
                                                                                {row.diff !== null ? (
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className={`text-xs gap-1 font-semibold ${
                                                                                            row.diff > 0
                                                                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                                                                : row.diff < 0
                                                                                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                                                                                : "bg-muted text-muted-foreground"
                                                                                        }`}
                                                                                    >
                                                                                        {row.diff > 0 ? `+${row.diff}` : `${row.diff}`}
                                                                                    </Badge>
                                                                                ) : (
                                                                                    <span className="text-muted-foreground text-xs">-</span>
                                                                                )}
                                                                            </TableCell>
                                                                            <TableCell className="text-right text-xs">
                                                                                {row.diff !== null ? (
                                                                                    row.diff > 0.3 ? (
                                                                                        <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                                                                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                                                                            Superiore in {classA.className}
                                                                                        </span>
                                                                                    ) : row.diff < -0.3 ? (
                                                                                        <span className="text-rose-600 dark:text-rose-400 font-medium inline-flex items-center gap-1">
                                                                                            <ArrowDownRight className="h-3.5 w-3.5" />
                                                                                            Superiore in {classB.className}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="text-muted-foreground font-medium inline-flex items-center gap-1">
                                                                                            <Minus className="h-3.5 w-3.5" />
                                                                                            Equivalente
                                                                                        </span>
                                                                                    )
                                                                                ) : row.avgA !== null ? (
                                                                                    <span className="text-muted-foreground">Solo in {classA.className}</span>
                                                                                ) : (
                                                                                    <span className="text-muted-foreground">Solo in {classB.className}</span>
                                                                                )}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    ) : (
                                                        <div className="py-8 text-center text-muted-foreground text-sm">
                                                            Nessun esercizio trovato con i criteri specificati
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )}
                                </TabsContent>
                            )}

                            {/* ===================== TAB ANDAMENTO VALUTAZIONI ===================== */}
                            {activeTab === "andamento" && (
                                <TabsContent value="andamento" forceMount className="space-y-6 mt-0">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Valutazioni nel Tempo</CardTitle>
                                                <CardDescription>Numero di prove registrate mese per mese nell'anno scolastico</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="h-[350px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                                            <YAxis />
                                                            <Tooltip
                                                                contentStyle={{
                                                                    backgroundColor: "hsl(var(--popover))",
                                                                    borderColor: "hsl(var(--border))",
                                                                    color: "hsl(var(--popover-foreground))",
                                                                    borderRadius: "8px",
                                                                }}
                                                                formatter={(val: any) => [`${val} valutazioni`, "Totale"]}
                                                            />
                                                            <Bar
                                                                dataKey="valutazioni"
                                                                fill="hsl(var(--primary))"
                                                                radius={[4, 4, 0, 0]}
                                                                name="Valutazioni"
                                                            />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Andamento Media Voti</CardTitle>
                                                <CardDescription>Evoluzione della media mensile delle valutazioni</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="h-[350px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                                            <YAxis domain={[0, 10]} ticks={[2, 4, 6, 8, 10]} />
                                                            <Tooltip
                                                                contentStyle={{
                                                                    backgroundColor: "hsl(var(--popover))",
                                                                    borderColor: "hsl(var(--border))",
                                                                    color: "hsl(var(--popover-foreground))",
                                                                    borderRadius: "8px",
                                                                }}
                                                                formatter={(val: any) => [`${val} / 10`, "Media Voti"]}
                                                            />
                                                            <Line
                                                                type="monotone"
                                                                dataKey="media"
                                                                stroke="#10b981"
                                                                strokeWidth={2.5}
                                                                dot={{ r: 4, fill: "#10b981" }}
                                                                name="Media Mensile"
                                                            />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </Tabs>
        </motion.div>
    );
}

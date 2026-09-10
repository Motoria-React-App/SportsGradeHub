import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useClient, useSchoolData } from "@/provider/clientProvider";
import { useSettings, getCurrentSchoolYearLabel } from "@/provider/settingsProvider";
import { SchoolClassExpanded, Student, Evaluation, Exercise } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Users, Link2, Check, Clock, AlertCircle, Loader2, ExternalLink, Archive, RotateCcw, ClipboardCheck, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudentDialog } from "@/components/student-dialog";
import { StudentsTable } from "@/components/students-table";
import { TransferStudentDialog } from "@/components/TransferStudentDialog";
import { PromoteClassDialog } from "@/components/PromoteClassDialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useGradeFormatter } from "@/hooks/useGradeFormatter";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition, slideUp, staggerContainer, staggerItem, buttonPress, cardHover, modalVariants, overlayVariants } from "@/lib/motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { toast } from "sonner";
import LoadingPage from "./Loading";



export default function Classes() {

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const client = useClient();
    const { evaluations, setEvaluations, classes, setClasses, exercises: allExercises, exerciseGroups, archiveClass, unarchiveClass } = useSchoolData();
    const { settings } = useSettings();
    const { formatGrade, getGradeColor } = useGradeFormatter();

    const [schoolClass, setSchoolClass] = useState<SchoolClassExpanded | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState("students");

    // Archive dialog state
    const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
    const [unarchiveDialogOpen, setUnarchiveDialogOpen] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);

    // Exercise linking state
    const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
    const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
    const [isSavingExercises, setIsSavingExercises] = useState(false);
    const [selectedExerciseForPreview, setSelectedExerciseForPreview] = useState<Exercise | null>(null);

    // Transfer student state
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [studentToTransfer, setStudentToTransfer] = useState<Student | null>(null);
    const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);

    const handleArchiveClass = async () => {
        if (!schoolClass) return;
        setIsArchiving(true);
        try {
            const ok = await archiveClass(schoolClass.id);
            if (ok) {
                setSchoolClass(prev => prev ? { ...prev, isArchived: true } : prev);
                toast.success(`Classe "${schoolClass.className}" archiviata con successo`);
            } else {
                toast.error("Errore durante l'archiviazione della classe");
            }
        } catch {
            toast.error("Errore durante l'archiviazione della classe");
        } finally {
            setIsArchiving(false);
            setArchiveDialogOpen(false);
        }
    };

    const handleUnarchiveClass = async () => {
        if (!schoolClass) return;
        setIsArchiving(true);
        try {
            const ok = await unarchiveClass(schoolClass.id);
            if (ok) {
                setSchoolClass(prev => prev ? { ...prev, isArchived: false } : prev);
                toast.success(`Classe "${schoolClass.className}" ripristinata tra le classi attive`);
            } else {
                toast.error("Errore durante il ripristino della classe");
            }
        } catch {
            toast.error("Errore durante il ripristino della classe");
        } finally {
            setIsArchiving(false);
            setUnarchiveDialogOpen(false);
        }
    };

    // Class analytics for Analisi tab
    const classAnalytics = useMemo(() => {
        if (!schoolClass) return null;
        const studentIds = new Set(schoolClass.students.map(s => s.id));
        const classEvals = evaluations.filter(e => studentIds.has(e.studentId) && e.score > 0);
        
        const avgGrade = classEvals.length > 0
            ? Math.round((classEvals.reduce((sum, e) => sum + e.score, 0) / classEvals.length) * 10) / 10
            : 0;

        const passingGrade = settings.passingGrade || 6;
        const passingCount = classEvals.filter(e => e.score >= passingGrade).length;
        const passingRate = classEvals.length > 0
            ? Math.round((passingCount / classEvals.length) * 100)
            : 0;

        // Group scores by exercise group
        const groupScores: Record<string, { total: number; count: number; name: string }> = {};
        classEvals.forEach(ev => {
            const ex = allExercises.find(x => x.id === ev.exerciseId);
            if (!ex) return;
            const grp = exerciseGroups.find(g => g.id === ex.exerciseGroupId);
            const grpId = grp?.id || "ungrouped";
            const grpName = grp?.groupName || "Altro";
            if (!groupScores[grpId]) {
                groupScores[grpId] = { total: 0, count: 0, name: grpName };
            }
            groupScores[grpId].total += ev.score;
            groupScores[grpId].count += 1;
        });

        const radarData = Object.values(groupScores).map(g => ({
            subject: g.name.length > 14 ? g.name.slice(0, 14) + "..." : g.name,
            fullSubject: g.name,
            A: Math.round((g.total / g.count) * 10) / 10,
            fullMark: 10,
        })).sort((a, b) => a.subject.localeCompare(b.subject));

        return {
            avgGrade,
            passingRate,
            totalEvaluations: classEvals.length,
            radarData,
        };
    }, [schoolClass, evaluations, allExercises, exerciseGroups, settings.passingGrade]);

    const startMonth = settings.schoolYearStartMonth ?? 9;
    const startDay = settings.schoolYearStartDay ?? 1;
    const currentYearLabel = getCurrentSchoolYearLabel(startMonth, startDay);

    const isFifthGrade = useMemo(() => {
        if (!schoolClass) return false;
        const prefixes = Array.isArray(settings.graduatedClassPrefixes) && settings.graduatedClassPrefixes.length > 0
            ? settings.graduatedClassPrefixes
            : ["5"];
        const name = schoolClass.className.trim().toLowerCase();
        return prefixes.some(p => name.startsWith(p.trim().toLowerCase()));
    }, [schoolClass, settings.graduatedClassPrefixes]);

    const isPendingArchive = useMemo(() => {
        if (!schoolClass || schoolClass.isArchived) return false;
        return Boolean(schoolClass.schoolYear && schoolClass.schoolYear.trim() !== "" && schoolClass.schoolYear.trim() !== currentYearLabel.trim());
    }, [schoolClass, currentYearLabel]);

    // Selection handlers
    const toggleSelectAll = () => {
        if (!schoolClass) return;
        if (selectedStudents.size === schoolClass.students.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(schoolClass.students.map(s => s.id)));
        }
    };

    const toggleSelectStudent = (studentId: string) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    // Student dialog state
    const [studentDialogOpen, setStudentDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // Calculate average score for a student in current year
    const getStudentYearAverage = (studentId: string): number | null => {
        const currentYear = new Date().getFullYear();
        const studentEvals = evaluations.filter(
            (e: Evaluation) =>
                e.studentId === studentId &&
                e.score > 0 &&
                new Date(e.createdAt).getFullYear() === currentYear
        );

        if (studentEvals.length === 0) return null;

        const sum = studentEvals.reduce((acc: number, e: Evaluation) => acc + e.score, 0);
        return Math.round((sum / studentEvals.length) * 10) / 10;
    };

    // Get class name by id
    const getClassName = (classId: string) => {
        const cls = classes.find((c: any) => c.id === classId);
        return cls?.className || "N/A";
    };

    // Check if student exceeds justification limit
    const currentPeriod = settings.schoolPeriods.find(
        (p: any) => p.id === settings.currentPeriodId
    );

    const getJustificationsInPeriod = (justifications: any[]) => {
        if (!currentPeriod) return justifications.length;
        return justifications.filter((j: any) => {
            const jDate = new Date(j.date);
            return jDate >= new Date(currentPeriod.startDate) && jDate <= new Date(currentPeriod.endDate);
        }).length;
    };

    const isOverLimit = (student: Student) => {
        const count = getJustificationsInPeriod(student.justifications || []);
        return count >= settings.maxJustifications;
    };

    // Fetch class data
    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const classRes = await client.getClassById(id);
            if (classRes.success && classRes.data) {
                setSchoolClass(classRes.data);
                // Initialize selected exercises with currently assigned ones
                setSelectedExerciseIds(classRes.data.assignedExercises || []);
            }
        } catch (error) {
            console.error("Failed to fetch class data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Handle openLinkExercises query param
        const params = new URLSearchParams(location.search);
        if (params.get('openLinkExercises') === 'true') {
            setExerciseDialogOpen(true);
            // Clean up the URL
            navigate(location.pathname, { replace: true });
        }
    }, [id, client, location.search]);

    // Get evaluations for a specific exercise in this class
    const getExerciseEvaluations = (exerciseId: string): Evaluation[] => {
        if (!schoolClass) return [];
        const studentIds = schoolClass.students.map(s => s.id);
        return evaluations.filter(
            ev => ev.exerciseId === exerciseId && studentIds.includes(ev.studentId)
        );
    };

    // Get student by ID from the class
    const getStudent = (studentId: string): Student | undefined => {
        return schoolClass?.students.find(s => s.id === studentId);
    };

    // Handle toggle exercise selection
    const handleToggleExercise = (exerciseId: string) => {
        setSelectedExerciseIds(prev =>
            prev.includes(exerciseId)
                ? prev.filter(id => id !== exerciseId)
                : [...prev, exerciseId]
        );
    };

    // Save assigned exercises
    const handleSaveExercises = async () => {
        if (!schoolClass) return;
        setIsSavingExercises(true);
        try {
            const response = await client.updateClass(schoolClass.id, {
                assignedExercises: selectedExerciseIds
            });

            if (response.success) {
                // Determine which exercises were newly added
                // We compare selectedExerciseIds with what was already assigned
                const previouslyAssigned = new Set(schoolClass.assignedExercises || []);
                const newlyAssigned = selectedExerciseIds.filter(id => !previouslyAssigned.has(id));

                if (newlyAssigned.length > 0) {
                    const evaluationsToCreate: Omit<Evaluation, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>[] = [];

                    // For each new exercise, create evaluations for all students
                    for (const exerciseId of newlyAssigned) {
                        for (const student of schoolClass.students) {
                            // Double check to ensure we don't duplicate if something is out of sync
                            const alreadyExists = evaluations.some(
                                ev => ev.studentId === student.id && ev.exerciseId === exerciseId
                            );

                            if (!alreadyExists) {
                                evaluationsToCreate.push({
                                    studentId: student.id,
                                    exerciseId: exerciseId,
                                    performanceValue: "",
                                    score: 0,
                                    comments: "",
                                });
                            }
                        }
                    }

                    // Send batch request if there are evaluations to create
                    if (evaluationsToCreate.length > 0) {
                        const batchRes = await client.createEvaluationsBatch(evaluationsToCreate);
                        if (batchRes.success && batchRes.data?.evaluations) {
                            setEvaluations((prev: Evaluation[]) => [...prev, ...batchRes.data!.evaluations]);
                        }
                    }
                }

                // Update local state for the class and global classes list
                const updatedAssigned = selectedExerciseIds;
                const updatedAssignedList = allExercises.filter(e => updatedAssigned.includes(e.id));

                setSchoolClass(prev => prev ? {
                    ...prev,
                    assignedExercises: updatedAssigned,
                    assignedExercisesList: updatedAssignedList
                } : null);

                setClasses(prev => prev.map(c =>
                    c.id === schoolClass.id
                        ? { ...c, assignedExercises: updatedAssigned }
                        : c
                ));

                setExerciseDialogOpen(false);
                setIsSavingExercises(false);
            }
        } catch (error) {
            console.error("Failed to save exercises:", error);
            setIsSavingExercises(false);
        }
    };

    // Group exercises by their exercise group for display in dialog
    const groupedExercises = useMemo(() => {
        const groups: Record<string, { groupName: string; exercises: Exercise[] }> = {};

        allExercises.forEach(exercise => {
            const group = exerciseGroups.find(g => g.id === exercise.exerciseGroupId);
            const groupId = group?.id || 'ungrouped';
            const groupName = group?.groupName || 'Senza Gruppo';

            if (!groups[groupId]) {
                groups[groupId] = { groupName, exercises: [] };
            }
            groups[groupId].exercises.push(exercise);
        });

        return Object.values(groups);
    }, [allExercises, exerciseGroups]);

    // Get evaluation stats for an exercise
    const getExerciseStats = (exerciseId: string) => {
        const evals = getExerciseEvaluations(exerciseId);
        const completed = evals.filter(ev => ev.score > 0).length;
        const inProgress = evals.filter(ev => ev.performanceValue !== null && ev.performanceValue !== undefined && ev.performanceValue !== "" && ev.score === 0).length;
        const notStarted = evals.filter(ev => (ev.performanceValue === null || ev.performanceValue === undefined || ev.performanceValue === "") && ev.score === 0).length;
        const total = evals.length;
        const avgScore = completed > 0
            ? evals.filter(ev => ev.score > 0).reduce((sum, ev) => sum + ev.score, 0) / completed
            : 0;

        return { completed, inProgress, notStarted, total, avgScore };
    };

    if (loading) {
        return <LoadingPage />;
    }

    if (!schoolClass) {
        return (
            <motion.div
                className="flex flex-col items-center justify-center h-full gap-4"
                variants={pageTransition}
                initial="hidden"
                animate="visible"
            >
                <h2 className="text-2xl font-bold">Classe non trovata</h2>
                <p className="text-muted-foreground">La classe richiesta non esiste o è stata rimossa.</p>
                <motion.div {...buttonPress}>
                    <Button onClick={() => window.history.back()}>
                        Torna indietro
                    </Button>
                </motion.div>
            </motion.div>
        );
    }

    // Get the assigned exercises (expanded)
    const assignedExercises = schoolClass.assignedExercisesList || [];

    return (
        <motion.div
            className="flex flex-1 flex-col p-4 md:p-6 space-y-6"
            variants={pageTransition}
            initial="hidden"
            animate="visible"
        >
            {/* Header Section */}
            <motion.div
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                variants={slideUp}
            >
                <div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h1 className="text-3xl font-bold tracking-tight">{schoolClass.className}</h1>
                        <motion.span
                            className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        >
                            {schoolClass.schoolYear}
                        </motion.span>
                        {schoolClass.isArchived && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 gap-1.5 py-0.5">
                                <Archive className="w-3.5 h-3.5" />
                                Archiviata
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {schoolClass.students.length} Studenti iscritti
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {schoolClass.isArchived ? (
                        <>
                            <motion.div {...buttonPress}>
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => navigate(`/valutazioni/${schoolClass.id}/all`)}
                                >
                                    <ClipboardCheck className="w-4 h-4 text-primary" />
                                    Valutazioni
                                </Button>
                            </motion.div>
                            <motion.div {...buttonPress}>
                                <Button
                                    variant="outline"
                                    className="gap-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/20"
                                    onClick={() => setUnarchiveDialogOpen(true)}
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Ripristina
                                </Button>
                            </motion.div>
                        </>
                    ) : (
                        <>
                            {!isFifthGrade && (
                                <motion.div {...buttonPress}>
                                    <Button
                                        variant="outline"
                                        className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
                                        onClick={() => setPromoteDialogOpen(true)}
                                    >
                                        <GraduationCap className="w-4 h-4" />
                                        Promuovi Classe
                                    </Button>
                                </motion.div>
                            )}
                            <motion.div {...buttonPress}>
                                <Button
                                    variant="outline"
                                    className="gap-2 text-amber-600 border-amber-300 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/20"
                                    onClick={() => setArchiveDialogOpen(true)}
                                >
                                    <Archive className="w-4 h-4" />
                                    Archivia
                                </Button>
                            </motion.div>
                            <motion.div {...buttonPress}>
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => {
                                        setSelectedExerciseIds(schoolClass.assignedExercises || []);
                                        setExerciseDialogOpen(true);
                                    }}
                                >
                                    <Link2 className="w-4 h-4" />
                                    Collega Esercizi
                                </Button>
                            </motion.div>
                            <motion.div {...buttonPress}>
                                <Button className="gap-2" onClick={() => { setSelectedStudent(null); setStudentDialogOpen(true); }}>
                                    <Users className="w-4 h-4" />
                                    Aggiungi Studente
                                </Button>
                            </motion.div>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Pending Archive / Promotion Alert Banner for non-5th past year classes */}
            {!schoolClass.isArchived && isPendingArchive && !isFifthGrade && (
                <motion.div
                    className="rounded-xl border border-amber-300/80 bg-amber-500/10 p-4 dark:border-amber-900/60 dark:bg-amber-950/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                    variants={slideUp}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/15 rounded-lg text-amber-600 dark:text-amber-400 shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm text-foreground">
                                    Anno Scolastico {schoolClass.schoolYear || "Precedente"} — Classe da Archiviare
                                </h4>
                                <Badge variant="secondary" className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300/40">
                                    Inizio Nuovo Anno
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Questa classe fa parte dell'anno precedente. Puoi promuovere e trasferire gli studenti nella nuova classe per l'anno {currentYearLabel}, escludendo i non ammessi (bocciati).
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                            size="sm"
                            className="gap-1.5 text-xs h-8"
                            onClick={() => setPromoteDialogOpen(true)}
                        >
                            <GraduationCap className="w-3.5 h-3.5" />
                            Promuovi Studenti ({schoolClass.students.length})
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Archived Alert Banner */}
            {schoolClass.isArchived && (
                <motion.div
                    className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                    variants={slideUp}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-700 dark:text-amber-300">
                            <Archive className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                                Classe Archiviata — Anno Scolastico {schoolClass.schoolYear}
                            </h4>
                            <p className="text-xs text-amber-700/80 dark:text-amber-300/70 mt-0.5">
                                I dati sono conservati nell'archivio storico. Puoi confrontare i risultati atletici di questa classe con le classi attive nella sezione Analisi.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 bg-background shadow-xs text-xs"
                            onClick={() => navigate(`/valutazioni/${schoolClass.id}/all`)}
                        >
                            <ClipboardCheck className="w-3.5 h-3.5 text-primary" />
                            Valutazioni
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 bg-background shadow-xs text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800"
                            onClick={() => setUnarchiveDialogOpen(true)}
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Ripristina
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full md:w-[400px] grid-cols-3">
                    <TabsTrigger value="students">Studenti</TabsTrigger>
                    <TabsTrigger value="exercises">Esercizi</TabsTrigger>
                    <TabsTrigger value="analytics">Analisi</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                        >
                            {activeTab === "students" && (
                                <TabsContent value="students" forceMount className="space-y-4 mt-0">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Elenco Studenti</CardTitle>
                                            <CardDescription>
                                                Gestisci l'anagrafica degli studenti della classe {schoolClass.className}.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <StudentsTable
                                                students={[...schoolClass.students].sort((a, b) => a.lastName.localeCompare(b.lastName))}
                                                onEdit={(student) => {
                                                    setSelectedStudent(student);
                                                    setStudentDialogOpen(true);
                                                }}
                                                onTransfer={!schoolClass.isArchived ? (student) => {
                                                    setStudentToTransfer(student);
                                                    setTransferDialogOpen(true);
                                                } : undefined}
                                                showCheckboxes={false}
                                                showNotes={true}
                                                showYearAverage={true}
                                                getYearAverage={getStudentYearAverage}
                                                getClassName={getClassName}
                                                isOverLimit={isOverLimit}
                                                getJustificationsCount={(student) => getJustificationsInPeriod(student.justifications || [])}
                                                maxJustifications={settings.maxJustifications}
                                                selectedStudents={selectedStudents}
                                                onToggleSelect={toggleSelectStudent}
                                                onToggleSelectAll={toggleSelectAll}
                                            />
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            )}

                            {activeTab === "exercises" && (
                                <TabsContent value="exercises" forceMount className="mt-0">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium">Esercizi Assegnati</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Esercizi collegati a questa classe per le valutazioni.
                                                </p>
                                            </div>
                                            <Button
                                                className="gap-2"
                                                onClick={() => {
                                                    setSelectedExerciseIds(schoolClass.assignedExercises || []);
                                                    setExerciseDialogOpen(true);
                                                }}
                                            >
                                                <Link2 className="w-4 h-4" />
                                                Collega Esercizi
                                            </Button>
                                        </div>

                                        {assignedExercises.length > 0 ? (
                                            <motion.div
                                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                                variants={staggerContainer}
                                                initial="hidden"
                                                animate="visible"
                                            >
                                                {assignedExercises.map((exercise, index) => {
                                                    const stats = getExerciseStats(exercise.id);
                                                    const group = exerciseGroups.find(g => g.id === exercise.exerciseGroupId);

                                                    return (
                                                        <motion.div key={exercise.id} variants={staggerItem} custom={index}>
                                                            <motion.div {...cardHover}>
                                                                <Card
                                                                    className={cn(
                                                                        "flex flex-col h-full cursor-pointer group/card",
                                                                        selectedExerciseForPreview?.id === exercise.id && "ring-2 ring-primary"
                                                                    )}
                                                                    onClick={() => setSelectedExerciseForPreview(exercise)}
                                                                >
                                                                    <CardHeader className="pb-3">
                                                                        <div className="flex justify-between items-start gap-2">
                                                                            <div className="space-y-1">
                                                                                <CardTitle className="text-base font-bold leading-tight group-hover/card:text-primary transition-colors">
                                                                                    {exercise.name}
                                                                                </CardTitle>
                                                                                {group && (
                                                                                    <p className="text-xs text-muted-foreground">{group.groupName}</p>
                                                                                )}
                                                                            </div>
                                                                            {exercise.unit && (
                                                                                <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                                                                    {exercise.unit}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </CardHeader>
                                                                    <CardContent className="flex-1 pb-3 space-y-3">
                                                                        {/* Stats */}
                                                                        <div className="flex items-center gap-3 text-xs">
                                                                            <div className="flex items-center gap-1">
                                                                                <Check className="w-3 h-3 text-green-500" />
                                                                                <span>{stats.completed}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <Clock className="w-3 h-3 text-yellow-500" />
                                                                                <span>{stats.inProgress}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <AlertCircle className="w-3 h-3 text-slate-400" />
                                                                                <span>{stats.notStarted}</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Progress bar */}
                                                                        {stats.total > 0 && (
                                                                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                                                                <motion.div
                                                                                    className="h-full bg-green-500"
                                                                                    initial={{ width: 0 }}
                                                                                    animate={{ width: `${(stats.completed / stats.total) * 100}%` }}
                                                                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                                                                />
                                                                            </div>
                                                                        )}

                                                                        {/* Average score */}
                                                                        {stats.completed > 0 && (
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-xs text-muted-foreground">Media</span>
                                                                                <span className={cn("font-bold", getGradeColor(stats.avgScore))}>
                                                                                    {formatGrade(stats.avgScore)}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </CardContent>
                                                                </Card>
                                                            </motion.div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </motion.div>
                                        ) : (
                                            <Card>
                                                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                                    <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                                    <h3 className="text-lg font-medium">Nessun esercizio collegato</h3>
                                                    <p className="text-muted-foreground max-w-sm mt-1 mb-4">
                                                        Collega degli esercizi a questa classe per iniziare le valutazioni.
                                                    </p>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedExerciseIds([]);
                                                            setExerciseDialogOpen(true);
                                                        }}
                                                    >
                                                        <Link2 className="w-4 h-4 mr-2" />
                                                        Collega Esercizi
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                </TabsContent>
                            )}

                            {activeTab === "analytics" && (
                                <TabsContent value="analytics" forceMount className="mt-0 space-y-6">
                                    {/* Overview Metrics Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                                    Media Generale Classe
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className={cn("text-3xl font-bold", classAnalytics?.avgGrade ? getGradeColor(classAnalytics.avgGrade) : "text-muted-foreground")}>
                                                    {classAnalytics?.avgGrade ? formatGrade(classAnalytics.avgGrade) : "N/D"}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Basata su {classAnalytics?.totalEvaluations || 0} valutazioni
                                                </p>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                                    Tasso di Sufficienza
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-bold text-foreground">
                                                    {classAnalytics?.passingRate ?? 0}%
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Voti con punteggio ≥ {settings.passingGrade || 6}
                                                </p>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                                    Valutazioni Registrate
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-bold text-foreground">
                                                    {classAnalytics?.totalEvaluations || 0}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Su {schoolClass.students.length} studenti iscritti
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Radar Athletic Profile & Comparison CTA */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <Card className="lg:col-span-2">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Activity className="h-5 w-5 text-primary" />
                                                    Profilo Atletico per Disciplina
                                                </CardTitle>
                                                <CardDescription>
                                                    Punteggio medio ottenuto dalla classe {schoolClass.className} nelle diverse categorie di esercizi.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                {classAnalytics && classAnalytics.radarData.length > 0 ? (
                                                    <div className="h-[320px] w-full">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <RadarChart data={classAnalytics.radarData}>
                                                                <PolarGrid stroke="hsl(var(--border))" />
                                                                <PolarAngleAxis
                                                                    dataKey="subject"
                                                                    tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                                                                />
                                                                <PolarRadiusAxis
                                                                    angle={30}
                                                                    domain={[0, 10]}
                                                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                                                                />
                                                                <RechartsTooltip
                                                                    contentStyle={{
                                                                        backgroundColor: "hsl(var(--popover))",
                                                                        borderColor: "hsl(var(--border))",
                                                                        borderRadius: "8px",
                                                                        color: "hsl(var(--popover-foreground))",
                                                                    }}
                                                                />
                                                                <Radar
                                                                    name="Media Classe"
                                                                    dataKey="A"
                                                                    stroke="hsl(var(--primary))"
                                                                    fill="hsl(var(--primary))"
                                                                    fillOpacity={0.35}
                                                                />
                                                            </RadarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                ) : (
                                                    <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground text-center p-4">
                                                        <Activity className="h-10 w-10 mb-2 opacity-30" />
                                                        <p>Nessun dato sufficiente per tracciare il profilo atletico.</p>
                                                        <p className="text-xs text-muted-foreground mt-1">Registra le valutazioni negli esercizi per visualizzare il grafico radar.</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Comparison Action Card */}
                                        <Card className="flex flex-col justify-between border-primary/20 bg-primary/[0.02]">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <ClipboardCheck className="h-5 w-5 text-primary" />
                                                    Valutazioni & Record
                                                </CardTitle>
                                                <CardDescription>
                                                    Confronta {schoolClass.className} con le classi degli altri anni o attive.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <p className="text-sm text-muted-foreground">
                                                    {schoolClass.isArchived
                                                        ? "Questa classe è archiviata. Puoi usarla come parametro di riferimento storico per valutare i progressi delle nuove classi."
                                                        : "Confronta il rendimento di questa classe con le classi degli anni precedenti per individuare punti di forza e aree di miglioramento."}
                                                </p>
                                                <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
                                                    <div className="font-semibold text-foreground">Confronti disponibili:</div>
                                                    <div className="text-muted-foreground">• Media generale & Tasso sufficienze</div>
                                                    <div className="text-muted-foreground">• Radar delle abilità atletiche a confronto</div>
                                                    <div className="text-muted-foreground">• Analisi per singolo esercizio</div>
                                                </div>
                                            </CardContent>
                                            <CardContent className="pt-0">
                                                <Button
                                                    className="w-full gap-2 shadow-sm"
                                                    onClick={() => navigate(`/valutazioni/${schoolClass.id}/all`)}
                                                >
                                                    <ClipboardCheck className="w-4 h-4" />
                                                    Vai alle Valutazioni della Classe
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </Tabs>

            {/* Exercise Linking Dialog */}
            <AnimatePresence>
                <Dialog open={exerciseDialogOpen} onOpenChange={setExerciseDialogOpen}>
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <DialogContent className="sm:max-w-[600px]">
                            <motion.div
                                variants={modalVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <DialogHeader>
                                    <DialogTitle>Collega Esercizi alla Classe</DialogTitle>
                                    <DialogDescription>
                                        Seleziona gli esercizi da associare alla classe {schoolClass.className}.
                                    </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="h-[400px] pr-4">
                                    <div className="space-y-6">
                                        {groupedExercises.length > 0 ? (
                                            groupedExercises.map((group, index) => (
                                                <motion.div key={index} className="space-y-3" variants={staggerItem} custom={index}>
                                                    <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                                        <Activity className="w-4 h-4" />
                                                        {group.groupName}
                                                    </h4>
                                                    <div className="space-y-2 pl-6">
                                                        {group.exercises.map((exercise) => (
                                                            <motion.div
                                                                key={exercise.id}
                                                                className={cn(
                                                                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                                                    selectedExerciseIds.includes(exercise.id)
                                                                        ? "bg-primary/5 border-primary"
                                                                        : "hover:bg-muted/50"
                                                                )}
                                                                onClick={() => handleToggleExercise(exercise.id)}
                                                                whileHover={{ x: 4 }}
                                                                whileTap={{ scale: 0.98 }}
                                                            >
                                                                <Checkbox
                                                                    checked={selectedExerciseIds.includes(exercise.id)}
                                                                    onCheckedChange={() => handleToggleExercise(exercise.id)}
                                                                />
                                                                <div className="flex-1">
                                                                    <p className="font-medium">{exercise.name}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Unità: {exercise.unit}
                                                                        {(exercise.evaluationType === 'criteria' && exercise.evaluationCriteria && exercise.evaluationCriteria.length > 0)
                                                                            ? ` • ${exercise.evaluationCriteria.length} Criteri`
                                                                            : exercise.evaluationRanges
                                                                                ? " • Fasce configurate"
                                                                                : " • Senza fasce"}
                                                                    </p>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                                <p>Nessun esercizio disponibile.</p>
                                                <p className="text-sm mt-1">Crea degli esercizi dalla pagina Esercizi.</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                                <DialogFooter>
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-sm text-muted-foreground">
                                            {selectedExerciseIds.length} esercizi selezionati
                                        </span>
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={() => setExerciseDialogOpen(false)}>
                                                Annulla
                                            </Button>
                                            <Button onClick={handleSaveExercises} disabled={isSavingExercises}>
                                                {isSavingExercises ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Salvataggio...
                                                    </>
                                                ) : (
                                                    "Salva"
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </DialogFooter>
                            </motion.div>
                        </DialogContent>
                    </motion.div>
                </Dialog>
            </AnimatePresence>

            {/* Exercise Evaluation Preview Panel */}
            <AnimatePresence>
                {selectedExerciseForPreview && (
                    <Dialog open={!!selectedExerciseForPreview} onOpenChange={() => setSelectedExerciseForPreview(null)}>
                        <motion.div
                            variants={overlayVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <DialogContent className="sm:max-w-[600px]">
                                <motion.div
                                    variants={modalVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                >
                                    <DialogHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <DialogTitle>{selectedExerciseForPreview.name}</DialogTitle>
                                                <DialogDescription>
                                                    Valutazioni per questo esercizio nella classe {schoolClass.className}
                                                </DialogDescription>
                                            </div>
                                        </div>
                                    </DialogHeader>

                                    <div className="space-y-4">
                                        {/* Stats Summary */}
                                        {(() => {
                                            const stats = getExerciseStats(selectedExerciseForPreview.id);
                                            return (
                                                <motion.div
                                                    className="grid grid-cols-3 gap-4"
                                                    variants={staggerContainer}
                                                    initial="hidden"
                                                    animate="visible"
                                                >
                                                    <motion.div variants={staggerItem} className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                                                        <motion.div
                                                            className="text-2xl font-bold text-green-600"
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                                        >
                                                            {stats.completed}
                                                        </motion.div>
                                                        <div className="text-xs text-green-600/70">Completati</div>
                                                    </motion.div>
                                                    <motion.div variants={staggerItem} className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-center">
                                                        <motion.div
                                                            className="text-2xl font-bold text-yellow-600"
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                                                        >
                                                            {stats.inProgress}
                                                        </motion.div>
                                                        <div className="text-xs text-yellow-600/70">In Corso</div>
                                                    </motion.div>
                                                    <motion.div variants={staggerItem} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                                                        <motion.div
                                                            className="text-2xl font-bold text-slate-600"
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                                                        >
                                                            {stats.notStarted}
                                                        </motion.div>
                                                        <div className="text-xs text-slate-600/70">Non Iniziati</div>
                                                    </motion.div>
                                                </motion.div>
                                            );
                                        })()}

                                        {/* Evaluation List */}
                                        <ScrollArea className="h-[250px]">
                                            <div className="space-y-2">
                                                {getExerciseEvaluations(selectedExerciseForPreview.id).length > 0 ? (
                                                    getExerciseEvaluations(selectedExerciseForPreview.id)
                                                        .sort((a, b) => {
                                                            const studentA = getStudent(a.studentId);
                                                            const studentB = getStudent(b.studentId);
                                                            return (studentA?.lastName || "").localeCompare(studentB?.lastName || "");
                                                        })
                                                        .map((ev, index) => {
                                                            const student = getStudent(ev.studentId);
                                                            if (!student) return null;

                                                            const status = ev.score > 0 ? "valutato" :
                                                                (ev.performanceValue !== null && ev.performanceValue !== undefined && ev.performanceValue !== "") ? "valutando" : "non-valutato";

                                                            return (
                                                                <motion.div
                                                                    key={ev.id}
                                                                    className="flex items-center justify-between p-3 rounded-lg border"
                                                                    initial={{ opacity: 0, x: -20 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: index * 0.05 }}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <motion.div
                                                                            className={cn(
                                                                                "w-2 h-2 rounded-full",
                                                                                status === "valutato" ? "bg-green-500" :
                                                                                    status === "valutando" ? "bg-yellow-500" : "bg-slate-300"
                                                                            )}
                                                                            animate={{ scale: [1, 1.2, 1] }}
                                                                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                                                        />
                                                                        <span className="font-medium">{student.lastName} {student.firstName}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        {ev.performanceValue && (
                                                                            <span className="text-sm text-muted-foreground">
                                                                                {ev.performanceValue} {selectedExerciseForPreview.unit}
                                                                            </span>
                                                                        )}
                                                                        {ev.score > 0 && (
                                                                            <span className={cn("font-bold", getGradeColor(ev.score))}>
                                                                                {formatGrade(ev.score)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            );
                                                        })
                                                ) : (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                                        <p>Nessuna valutazione per questo esercizio.</p>
                                                        <p className="text-sm mt-1">Vai alle Valutazioni per assegnare l'esercizio.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>

                                    <DialogFooter>
                                        <motion.div {...buttonPress} className="w-full">
                                            <Button
                                                className="w-full gap-2"
                                                onClick={() => navigate(`/valutazioni/${schoolClass.id}/${selectedExerciseForPreview.id}`)}
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Vai alle Valutazioni
                                            </Button>
                                        </motion.div>
                                    </DialogFooter>
                                </motion.div>
                            </DialogContent>
                        </motion.div>
                    </Dialog>
                )}
            </AnimatePresence>

             {/* Student Dialog */}
             <StudentDialog
                 open={studentDialogOpen}
                 onOpenChange={setStudentDialogOpen}
                 student={selectedStudent}
                 defaultClassId={schoolClass.id}
                 onSuccess={fetchData}
             />

             {/* Transfer Student Dialog */}
             <TransferStudentDialog
                 open={transferDialogOpen}
                 onOpenChange={setTransferDialogOpen}
                 student={studentToTransfer}
                 currentClassId={schoolClass.id}
                 onSuccess={fetchData}
             />

             {/* Archive Class Confirmation Dialog */}
             <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
                 <AlertDialogContent>
                     <AlertDialogHeader>
                         <AlertDialogTitle className="flex items-center gap-2">
                             <Archive className="w-5 h-5 text-amber-600" />
                             Archiviare la classe {schoolClass.className}?
                         </AlertDialogTitle>
                         <AlertDialogDescription className="space-y-2">
                             <p>
                                 La classe verrà spostata nell'archivio storico (Anno {schoolClass.schoolYear}) e nascosta dalla navigazione attiva.
                             </p>
                             <p className="text-xs text-muted-foreground">
                                 Tutti i dati, le valutazioni e i voti degli studenti rimarranno intatti e potranno essere consultati o utilizzati per i confronti nelle Analisi. Potrai ripristinarla in qualsiasi momento.
                             </p>
                         </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                         <AlertDialogCancel disabled={isArchiving}>Annulla</AlertDialogCancel>
                         <AlertDialogAction
                             onClick={(e) => {
                                 e.preventDefault();
                                 handleArchiveClass();
                             }}
                             disabled={isArchiving}
                             className="bg-amber-600 hover:bg-amber-700 text-white"
                         >
                             {isArchiving ? (
                                 <>
                                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                     Archiviazione...
                                 </>
                             ) : (
                                 "Archivia Classe"
                             )}
                         </AlertDialogAction>
                     </AlertDialogFooter>
                 </AlertDialogContent>
             </AlertDialog>

             {/* Unarchive Class Confirmation Dialog */}
             <AlertDialog open={unarchiveDialogOpen} onOpenChange={setUnarchiveDialogOpen}>
                 <AlertDialogContent>
                     <AlertDialogHeader>
                         <AlertDialogTitle className="flex items-center gap-2">
                             <RotateCcw className="w-5 h-5 text-emerald-600" />
                             Ripristinare la classe {schoolClass.className}?
                         </AlertDialogTitle>
                         <AlertDialogDescription>
                             La classe tornerà nell'elenco delle classi attive e sarà nuovamente visibile nel menu laterale e nella gestione quotidiana.
                         </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                         <AlertDialogCancel disabled={isArchiving}>Annulla</AlertDialogCancel>
                         <AlertDialogAction
                             onClick={(e) => {
                                 e.preventDefault();
                                 handleUnarchiveClass();
                             }}
                             disabled={isArchiving}
                             className="bg-emerald-600 hover:bg-emerald-700 text-white"
                         >
                             {isArchiving ? (
                                 <>
                                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                     Ripristino...
                                 </>
                             ) : (
                                 "Ripristina Classe"
                             )}
                         </AlertDialogAction>
                     </AlertDialogFooter>
                 </AlertDialogContent>
             </AlertDialog>
             {/* Promote Class Dialog */}
             <PromoteClassDialog
                 open={promoteDialogOpen}
                 onOpenChange={setPromoteDialogOpen}
                 sourceClass={schoolClass}
             />
         </motion.div>
     );
}

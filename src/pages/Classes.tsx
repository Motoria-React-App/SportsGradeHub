import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useClient, useSchoolData } from "@/provider/clientProvider";
import { useSettings } from "@/provider/settingsProvider";
import { SchoolClassExpanded, Student, Evaluation, Exercise } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Users, Link2, Check, Clock, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudentDialog } from "@/components/student-dialog";
import { StudentsTable } from "@/components/students-table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useGradeFormatter } from "@/hooks/useGradeFormatter";


export default function Classes() {

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const client = useClient();
    const { evaluations, classes, exercises: allExercises, exerciseGroups, refreshClasses, refreshEvaluations } = useSchoolData();
    const { settings } = useSettings();
    const { formatGrade, getGradeColor } = useGradeFormatter();

    const [schoolClass, setSchoolClass] = useState<SchoolClassExpanded | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState("students");

    // Exercise linking state
    const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
    const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
    const [isSavingExercises, setIsSavingExercises] = useState(false);
    const [selectedExerciseForPreview, setSelectedExerciseForPreview] = useState<Exercise | null>(null);

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
                        await client.createEvaluationsBatch(evaluationsToCreate);
                        await refreshEvaluations(); // Refresh evaluations to show them immediately
                    }
                }

                // Close dialog FIRST to prevent flash during refresh
                setExerciseDialogOpen(false);
                setIsSavingExercises(false);
                await fetchData();
                await refreshClasses();
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
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-64 bg-muted rounded"></div>
                    <div className="h-4 w-48 bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    if (!schoolClass) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <h2 className="text-2xl font-bold">Classe non trovata</h2>
                <p className="text-muted-foreground">La classe richiesta non esiste o è stata rimossa.</p>
                <Button onClick={() => window.history.back()}>
                    Torna indietro
                </Button>
            </div>
        );
    }

    // Get the assigned exercises (expanded)
    const assignedExercises = schoolClass.assignedExercisesList || [];

    return (
        <div className="flex flex-1 flex-col p-4 md:p-6 space-y-6 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold tracking-tight">{schoolClass.className}</h1>
                        <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            {schoolClass.schoolYear}
                        </span>
                    </div>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {schoolClass.students.length} Studenti iscritti
                    </p>
                </div>
                <div className="flex gap-2">
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
                    <Button className="gap-2" onClick={() => { setSelectedStudent(null); setStudentDialogOpen(true); }}>
                        <Users className="w-4 h-4" />
                        Aggiungi Studente
                    </Button>
                </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full md:w-[400px] grid-cols-3">
                    <TabsTrigger value="students">Studenti</TabsTrigger>
                    <TabsTrigger value="exercises">Esercizi</TabsTrigger>
                    <TabsTrigger value="analytics">Analisi</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="students" className="space-y-4">
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

                    <TabsContent value="exercises">
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {assignedExercises.map((exercise) => {
                                        const stats = getExerciseStats(exercise.id);
                                        const group = exerciseGroups.find(g => g.id === exercise.exerciseGroupId);

                                        return (
                                            <Card
                                                key={exercise.id}
                                                className={cn(
                                                    "flex flex-col h-full hover:shadow-md transition-all duration-200 cursor-pointer group/card",
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
                                                            <div
                                                                className="h-full bg-green-500 transition-all"
                                                                style={{ width: `${(stats.completed / stats.total) * 100}%` }}
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
                                        );
                                    })}
                                </div>
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

                    <TabsContent value="analytics">
                        <Card>
                            <CardHeader>
                                <CardTitle>Analisi Classe</CardTitle>
                                <CardDescription>Stats e andamento generale.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">Grafici in arrivo...</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Exercise Linking Dialog */}
            <Dialog open={exerciseDialogOpen} onOpenChange={setExerciseDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
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
                                    <div key={index} className="space-y-3">
                                        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                            <Activity className="w-4 h-4" />
                                            {group.groupName}
                                        </h4>
                                        <div className="space-y-2 pl-6">
                                            {group.exercises.map((exercise) => (
                                                <div
                                                    key={exercise.id}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                                        selectedExerciseIds.includes(exercise.id)
                                                            ? "bg-primary/5 border-primary"
                                                            : "hover:bg-muted/50"
                                                    )}
                                                    onClick={() => handleToggleExercise(exercise.id)}
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
                                                </div>
                                            ))}
                                        </div>
                                    </div>
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
                </DialogContent>
            </Dialog>

            {/* Exercise Evaluation Preview Panel */}
            {selectedExerciseForPreview && (
                <Dialog open={!!selectedExerciseForPreview} onOpenChange={() => setSelectedExerciseForPreview(null)}>
                    <DialogContent className="sm:max-w-[600px]">
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
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                                            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                                            <div className="text-xs text-green-600/70">Completati</div>
                                        </div>
                                        <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-center">
                                            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                                            <div className="text-xs text-yellow-600/70">In Corso</div>
                                        </div>
                                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                                            <div className="text-2xl font-bold text-slate-600">{stats.notStarted}</div>
                                            <div className="text-xs text-slate-600/70">Non Iniziati</div>
                                        </div>
                                    </div>
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
                                            .map((ev) => {
                                                const student = getStudent(ev.studentId);
                                                if (!student) return null;

                                                const status = ev.score > 0 ? "valutato" :
                                                    (ev.performanceValue !== null && ev.performanceValue !== undefined && ev.performanceValue !== "") ? "valutando" : "non-valutato";

                                                return (
                                                    <div key={ev.id} className="flex items-center justify-between p-3 rounded-lg border">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-2 h-2 rounded-full",
                                                                status === "valutato" ? "bg-green-500" :
                                                                    status === "valutando" ? "bg-yellow-500" : "bg-slate-300"
                                                            )} />
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
                                                    </div>
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
                            <Button
                                className="w-full gap-2"
                                onClick={() => navigate(`/valutazioni/${schoolClass.id}/${selectedExerciseForPreview.id}`)}
                            >
                                <ExternalLink className="w-4 h-4" />
                                Vai alle Valutazioni
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Student Dialog */}
            <StudentDialog
                open={studentDialogOpen}
                onOpenChange={setStudentDialogOpen}
                student={selectedStudent}
                defaultClassId={schoolClass.id}
                onSuccess={fetchData}
            />
        </div>
    );
}

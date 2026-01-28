import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSchoolData, useClient } from "@/provider/clientProvider";
import type { Student, Exercise, Evaluation, Gender } from "@/types/types";
import { Plus, User, Check, Clock, AlertCircle, X, ChevronRight, Loader2, Save, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGradeFormatter } from "@/hooks/useGradeFormatter";
import { useSettings } from "@/provider/settingsProvider";
import { useParams } from "react-router-dom";
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

// Types for evaluation state
type EvaluationStatus = "non-valutato" | "valutando" | "valutato";

// Helper to determine status based on evaluation value
function getEvaluationStatus(evaluation: Evaluation): EvaluationStatus {
    if (evaluation.score > 0) return "valutato";
    if (evaluation.performanceValue !== null && evaluation.performanceValue !== undefined && evaluation.performanceValue !== "") {
        return "valutando";
    }
    return "non-valutato";
}

// Calculate score from performance value using evaluation ranges
function calculateScore(
    performanceValue: number,
    exercise: Exercise,
    studentGender: Gender
): number | null {
    if (!exercise.evaluationRanges) return null;

    const ranges = exercise.evaluationRanges[studentGender] || exercise.evaluationRanges['M'];
    if (!ranges || ranges.length === 0) return null;

    // Find matching range
    for (const range of ranges) {
        if (performanceValue >= range.min && performanceValue <= range.max) {
            return range.score;
        }
    }

    return null;
}

export default function Valutazioni() {
    const {
        students,
        classes,
        exercises,
        evaluations,
        refreshEvaluations,
    } = useSchoolData();
    const client = useClient();
    const { formatGrade, getGradeColor } = useGradeFormatter();
    const { settings } = useSettings();

    // Filters
    const [selectedClassId, setSelectedClassId] = useState<string>("all");
    const [selectedExerciseId, setSelectedExerciseId] = useState<string>("all");

    const { classId, exerciseId } = useParams();

    useEffect(() => {
        if (classId && exerciseId) {
            setSelectedClassId(classId);
            setSelectedExerciseId(exerciseId);

            if (classId !== "all") {
                localStorage.setItem("sportsgrade_last_class", classId);
            }
        }
    }, [classId, exerciseId]);

    // Modal states
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [selectedEvaluationForGrading, setSelectedEvaluationForGrading] = useState<Evaluation | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Session management - stores the start time of current session per exercise
    // Evaluations created before this time are hidden (considered "old session")
    const [sessionStartTimes, setSessionStartTimes] = useState<Record<string, string>>({});

    // Assignment modal state
    const [assignExerciseId, setAssignExerciseId] = useState<string>("");
    const [assignClassId, setAssignClassId] = useState<string>("");
    const [assignStudentIds, setAssignStudentIds] = useState<string[]>([]);
    const [assignMode, setAssignMode] = useState<"class" | "students">("class");

    // Grading panel state
    const [performanceInputValue, setPerformanceInputValue] = useState<string>("");
    const [notesValue, setNotesValue] = useState<string>("");
    // Criteria scores state for criteria-based evaluation
    const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({});

    // Get students for a class
    const getStudentsForClass = useCallback((classId: string) => {
        return students.filter(s => s.currentClassId === classId);
    }, [students]);

    // Filter and deduplicate evaluations based on selected filters
    // Keep only the LATEST evaluation for each studentId+exerciseId pair
    const filteredEvaluations = useMemo(() => {
        // First, deduplicate: keep only the latest evaluation for each student+exercise pair
        const latestEvaluations = new Map<string, Evaluation>();

        evaluations.forEach((ev) => {
            const key = `${ev.studentId}-${ev.exerciseId}`;
            const existing = latestEvaluations.get(key);

            // Keep the one with the latest createdAt or updatedAt
            if (!existing || new Date(ev.createdAt) > new Date(existing.createdAt)) {
                latestEvaluations.set(key, ev);
            }
        });

        // Then filter by selected class, exercise, and session time
        return Array.from(latestEvaluations.values()).filter((ev) => {
            const student = students.find((s) => s.id === ev.studentId);
            if (!student) return false;

            const matchesClass = selectedClassId === "all" || student.currentClassId === selectedClassId;
            const matchesExercise = selectedExerciseId === "all" || ev.exerciseId === selectedExerciseId;

            // Session filtering: hide evaluations from before the session start time
            const sessionStart = sessionStartTimes[ev.exerciseId];
            if (sessionStart) {
                const evalTime = new Date(ev.createdAt).getTime();
                const sessionTime = new Date(sessionStart).getTime();
                if (evalTime < sessionTime) {
                    return false; // This evaluation is from a previous session
                }
            }

            return matchesClass && matchesExercise;
        });
    }, [evaluations, students, selectedClassId, selectedExerciseId, sessionStartTimes]);

    // Group evaluations by status
    const groupedEvaluations = useMemo(() => {
        const groups: Record<EvaluationStatus, Evaluation[]> = {
            "non-valutato": [],
            "valutando": [],
            "valutato": [],
        };

        filteredEvaluations.forEach((ev) => {
            let status = getEvaluationStatus(ev);

            // If this evaluation is currently selected for grading, force status to "valutando"
            // This ensures the user sees who they are currently evaluating in the middle column
            if (selectedEvaluationForGrading &&
                ev.studentId === selectedEvaluationForGrading.studentId &&
                ev.exerciseId === selectedEvaluationForGrading.exerciseId) {
                status = "valutando";
            }

            groups[status].push(ev);
        });

        return groups;
    }, [filteredEvaluations, selectedEvaluationForGrading]);

    // Handle assigning exercise to students (creates evaluations)
    const handleAssignExercise = async () => {
        if (!assignExerciseId) return;

        let studentIds: string[] = [];
        if (assignMode === "class" && assignClassId) {
            studentIds = students.filter((s) => s.currentClassId === assignClassId).map((s) => s.id);
        } else {
            studentIds = assignStudentIds;
        }

        if (studentIds.length === 0) return;

        setIsSubmitting(true);
        try {
            // Create evaluations for each student (avoid duplicates)
            for (const studentId of studentIds) {
                const exists = evaluations.some(
                    (ev) => ev.studentId === studentId && ev.exerciseId === assignExerciseId
                );
                if (!exists) {
                    await client.createEvaluation({
                        studentId,
                        exerciseId: assignExerciseId,
                        performanceValue: "",
                        score: 0,
                        comments: "",
                    });
                }
            }

            await refreshEvaluations();
            setIsAssignModalOpen(false);
            setAssignExerciseId("");
            setAssignClassId("");
            setAssignStudentIds([]);

            // Auto-select the exercise filter
            if (selectedExerciseId === "all") {
                setSelectedExerciseId(assignExerciseId);
            }
        } catch (error) {
            console.error("Error assigning exercise:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Select an evaluation for grading
    const selectEvaluationForGrading = (evaluation: Evaluation) => {
        setSelectedEvaluationForGrading(evaluation);
        setPerformanceInputValue(evaluation.performanceValue?.toString() || "");
        setNotesValue(evaluation.comments || "");
        // Load criteria scores if they exist
        if (evaluation.criteriaScores) {
            setCriteriaScores(evaluation.criteriaScores);
        } else {
            setCriteriaScores({});
        }
    };

    // Save evaluation changes - this creates a new record (backend will have duplicates, but we deduplicate on frontend)
    const handleSaveEvaluation = async (confirmed: boolean) => {
        if (!selectedEvaluationForGrading) return;

        const student = students.find(s => s.id === selectedEvaluationForGrading.studentId);
        const exercise = exercises.find(e => e.id === selectedEvaluationForGrading.exerciseId);
        if (!student || !exercise) return;

        setIsSaving(true);
        try {
            let calculatedScore = 0;
            const isCriteriaBased = exercise.evaluationType === 'criteria' && exercise.evaluationCriteria && exercise.evaluationCriteria.length > 0;

            if (confirmed) {
                if (isCriteriaBased) {
                    // Calculate score from criteria: (sum / max) * maxScore
                    const totalMax = exercise.evaluationCriteria!.reduce((sum, c) => sum + c.maxScore, 0);
                    const totalScored = exercise.evaluationCriteria!.reduce((sum, c) => sum + (criteriaScores[c.name] || 0), 0);
                    const maxScore = exercise.maxScore || 10;
                    
                    if (settings.enableBasePoint) {
                        // Formula with base 1: 1 + (percentage * (maxScore - 1))
                        const percentage = totalMax > 0 ? totalScored / totalMax : 0;
                        calculatedScore = 1 + (percentage * (maxScore - 1));
                    } else {
                        // Standard formula: (percentage * maxScore)
                        calculatedScore = totalMax > 0 ? (totalScored / totalMax) * maxScore : 0;
                    }
                    calculatedScore = Math.round(calculatedScore * 10) / 10; // Round to 1 decimal
                } else {
                    // Calculate score from performance value using ranges
                    const performanceNum = parseFloat(performanceInputValue);
                    if (!isNaN(performanceNum)) {
                        let score = calculateScore(performanceNum, exercise, student.gender);
                        
                        if (score !== null) {
                            if (settings.enableBasePoint) {
                                // Apply Base Point logic to range score
                                // Assuming range score is 0-10 or 0-maxScore
                                const maxScore = exercise.maxScore || 10;
                                const percentage = maxScore > 0 ? score / maxScore : 0;
                                score = 1 + (percentage * (maxScore - 1));
                            }
                            calculatedScore = score;
                        }
                    }
                }
            }

            // Create new evaluation with updated values
            // The frontend deduplication will keep only the latest one
            await client.createEvaluation({
                studentId: selectedEvaluationForGrading.studentId,
                exerciseId: selectedEvaluationForGrading.exerciseId,
                performanceValue: isCriteriaBased ? JSON.stringify(criteriaScores) : performanceInputValue,
                score: calculatedScore,
                comments: notesValue,
                criteriaScores: isCriteriaBased ? criteriaScores : undefined,
            });

            await refreshEvaluations();

            if (confirmed) {
                setSelectedEvaluationForGrading(null);
                setCriteriaScores({});
            } else {
                // Update the object manually so UI reflects change without closing.
                setSelectedEvaluationForGrading({
                    ...selectedEvaluationForGrading,
                    performanceValue: isCriteriaBased ? JSON.stringify(criteriaScores) : performanceInputValue,
                    score: calculatedScore,
                    comments: notesValue,
                    criteriaScores: isCriteriaBased ? criteriaScores : undefined,
                } as Evaluation);
            }
        } catch (error) {
            console.error("Error saving evaluation:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Reset current session - set a new session start time to hide old evaluations
    const handleResetSession = () => {
        if (selectedExerciseId === "all") return;

        // Set the session start time for this exercise to NOW
        // This will filter out all evaluations created before this time
        setSessionStartTimes(prev => ({
            ...prev,
            [selectedExerciseId]: new Date().toISOString()
        }));

        setIsResetDialogOpen(false);
        setSelectedEvaluationForGrading(null);
    };

    // Handle deleting an evaluation
    const handleDeleteEvaluation = async () => {
        if (!selectedEvaluationForGrading) return;

        setIsDeleting(true);
        try {
            const response = await client.deleteEvaluation(selectedEvaluationForGrading.id);
            if (response.success) {
                await refreshEvaluations();
                setSelectedEvaluationForGrading(null);
                setIsDeleteDialogOpen(false);
            } else {
                console.error("Failed to delete evaluation:", response.error);
            }
        } catch (error) {
            console.error("Error deleting evaluation:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    // Get student details
    const getStudent = (studentId: string): Student | undefined => {
        return students.find((s) => s.id === studentId);
    };

    // Get exercise details
    const getExercise = (exerciseId: string): Exercise | undefined => {
        return exercises.find((e) => e.id === exerciseId);
    };

    // Get class name
    const getClassName = (classId: string): string => {
        const cls = classes.find(c => c.id === classId);
        return cls?.className || "N/A";
    };

    // Column component
    const Column = ({
        title,
        status,
        icon: Icon,
        colorClass,
        bgClass,
    }: {
        title: string;
        status: EvaluationStatus;
        icon: React.ElementType;
        colorClass: string;
        bgClass: string;
    }) => {
        const items = groupedEvaluations[status];

        return (
            <div className={cn("flex-1 min-w-[300px] rounded-xl border", bgClass)}>
                <div className={cn("p-4 border-b flex items-center gap-2", colorClass)}>
                    <Icon className="h-5 w-5" />
                    <h3 className="font-semibold">{title}</h3>
                    <Badge variant="secondary" className="ml-auto">
                        {items.length}
                    </Badge>
                </div>
                <ScrollArea className="h-[calc(100vh-320px)]">
                    <div className="p-3 space-y-3">
                        {items.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8 text-sm">
                                Nessuno studente
                            </div>
                        ) : (
                            items.map((ev) => {
                                const student = getStudent(ev.studentId);
                                const exercise = getExercise(ev.exerciseId);
                                if (!student || !exercise) return null;

                                const isSelected = selectedEvaluationForGrading?.studentId === ev.studentId &&
                                    selectedEvaluationForGrading?.exerciseId === ev.exerciseId;

                                return (
                                    <Card
                                        key={`${ev.studentId}-${ev.exerciseId}`}
                                        className={cn(
                                            "cursor-pointer transition-all hover:shadow-md",
                                            isSelected && "ring-2 ring-primary"
                                        )}
                                        onClick={() => selectEvaluationForGrading(ev)}
                                    >
                                        <CardContent className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{student.firstName} {student.lastName}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Badge variant="outline" className="text-xs">
                                                            {getClassName(student.currentClassId)}
                                                        </Badge>
                                                        <span className="truncate">{exercise.name}</span>
                                                    </div>
                                                </div>
                                                {ev.score > 0 && (
                                                    <div
                                                        className={cn(
                                                            "text-lg font-bold",
                                                            getGradeColor(ev.score)
                                                        )}
                                                    >
                                                        {formatGrade(ev.score)}
                                                    </div>
                                                )}
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>
        );
    };

    // Grading panel data (calculated outside render to avoid inline component issues)
    const gradingStudent = selectedEvaluationForGrading ? getStudent(selectedEvaluationForGrading.studentId) : null;
    const gradingExercise = selectedEvaluationForGrading ? getExercise(selectedEvaluationForGrading.exerciseId) : null;
    const gradingStatus = selectedEvaluationForGrading ? getEvaluationStatus(selectedEvaluationForGrading) : null;
    const gradingPerformanceNum = parseFloat(performanceInputValue);
    const gradingPreviewScore = useMemo(() => {
        if (!isNaN(gradingPerformanceNum) && gradingExercise && gradingStudent) {
            let score = calculateScore(gradingPerformanceNum, gradingExercise, gradingStudent.gender);
            
            if (score !== null && settings.enableBasePoint) {
                 const maxScore = gradingExercise.maxScore || 10;
                 const percentage = maxScore > 0 ? score / maxScore : 0;
                 score = 1 + (percentage * (maxScore - 1));
                 
                 // Apply rounding
                 score = Math.round(score * 10) / 10;
            }
            
            return score;
        }
        return null;
    }, [gradingPerformanceNum, gradingExercise, gradingStudent, settings.enableBasePoint]);

    // Stats
    const totalEvaluations = filteredEvaluations.length;
    const completedEvaluations = groupedEvaluations["valutato"].length;

    return (
        <>
            <div className="flex flex-1 flex-col p-4 md:p-6 space-y-6 animate-in fade-in duration-700">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Valutazioni</h1>
                        <p className="text-muted-foreground">
                            Gestisci le valutazioni degli studenti
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedExerciseId !== "all" && filteredEvaluations.length > 0 && (
                            <Button
                                variant="outline"
                                className="gap-2 text-destructive hover:text-destructive"
                                onClick={() => setIsResetDialogOpen(true)}
                            >
                                <RotateCcw className="h-4 w-4" />
                                Nuova Sessione
                            </Button>
                        )}
                        <Button className="gap-2" onClick={() => setIsAssignModalOpen(true)}>
                            <Plus className="h-4 w-4" />
                            Assegna Esercizio
                        </Button>
                    </div>
                </div>

                {/* Filters and stats */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filtra per classe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tutte le classi</SelectItem>
                                {classes.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                        Classe {cls.className}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filtra per esercizio" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tutti gli esercizi</SelectItem>
                                {exercises.map((ex) => (
                                    <SelectItem key={ex.id} value={ex.id}>
                                        {ex.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {totalEvaluations > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-base px-3 py-1">
                                {completedEvaluations}/{totalEvaluations} valutati
                            </Badge>
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 transition-all"
                                    style={{
                                        width: `${(completedEvaluations / totalEvaluations) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Kanban columns and grading panel */}
                <div className="flex gap-6 items-start relative">
                    {/* Columns */}
                    <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
                        <Column
                            title="Non Valutato"
                            status="non-valutato"
                            icon={AlertCircle}
                            colorClass="text-slate-600 dark:text-slate-400"
                            bgClass="bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800"
                        />
                        <Column
                            title="Valutando"
                            status="valutando"
                            icon={Clock}
                            colorClass="text-yellow-600 dark:text-yellow-400"
                            bgClass="bg-yellow-50/50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                        />
                        <Column
                            title="Valutato"
                            status="valutato"
                            icon={Check}
                            colorClass="text-green-600 dark:text-green-400"
                            bgClass="bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        />
                    </div>

                    {/* Grading panel - positioned fixed on right */}
                    <AnimatePresence>
                        {selectedEvaluationForGrading && gradingStudent && gradingExercise && (
                            <motion.div
                                key="grading-panel"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="fixed right-6 top-24 z-50"
                            >
                                <Card className="w-[400px] shadow-xl border-2">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Valutazione</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSelectedEvaluationForGrading(null)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="h-12 w-12 rounded-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                        <User className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{gradingStudent.firstName} {gradingStudent.lastName}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {getClassName(gradingStudent.currentClassId)} • {gradingExercise.name}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Status badge */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Stato:</span>
                                    <Badge
                                        variant={
                                            gradingStatus === "valutato"
                                                ? "default"
                                                : gradingStatus === "valutando"
                                                    ? "secondary"
                                                    : "outline"
                                        }
                                        className={cn(
                                            gradingStatus === "valutato" && "bg-green-600",
                                            gradingStatus === "valutando" && "bg-yellow-500 text-black"
                                        )}
                                    >
                                        {gradingStatus === "non-valutato" && "Non Valutato"}
                                        {gradingStatus === "valutando" && "Valutando"}
                                        {gradingStatus === "valutato" && "Valutato"}
                                    </Badge>
                                </div>

                                {/* Performance input - conditional based on evaluation type */}
                                {gradingExercise.evaluationType === 'criteria' && gradingExercise.evaluationCriteria && gradingExercise.evaluationCriteria.length > 0 ? (
                                    /* Criteria-based evaluation */
                                    <div className="space-y-3">
                                        <Label>Punteggi per Criterio</Label>
                                        <div className="space-y-2">
                                            {gradingExercise.evaluationCriteria.map((criterion) => (
                                                <div key={criterion.name} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{criterion.name}</p>
                                                        <p className="text-xs text-muted-foreground">Max: {criterion.maxScore}</p>
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max={criterion.maxScore}
                                                        value={criteriaScores[criterion.name] || ''}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            const clampedVal = Math.min(Math.max(val, 0), criterion.maxScore);
                                                            setCriteriaScores({
                                                                ...criteriaScores,
                                                                [criterion.name]: clampedVal
                                                            });
                                                        }}
                                                        className="w-20 h-8 text-center"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Criteria score preview */}
                                        {(() => {
                                            const totalMax = gradingExercise.evaluationCriteria.reduce((sum, c) => sum + c.maxScore, 0);
                                            const totalScored = gradingExercise.evaluationCriteria.reduce((sum, c) => sum + (criteriaScores[c.name] || 0), 0);
                                            const maxScore = gradingExercise.maxScore || 10;
                                            let calculatedGrade = 0;
                                            if (settings.enableBasePoint) {
                                                const percentage = totalMax > 0 ? totalScored / totalMax : 0;
                                                calculatedGrade = 1 + (percentage * (maxScore - 1));
                                            } else {
                                                calculatedGrade = totalMax > 0 ? (totalScored / totalMax) * maxScore : 0;
                                            }
                                            
                                            const roundedGrade = Math.round(calculatedGrade * 10) / 10;
                                            
                                            return (
                                                <div className="p-4 rounded-lg bg-muted/50 text-center">
                                                    <p className="text-sm text-muted-foreground mb-1">
                                                        Punteggio: {totalScored} / {totalMax}
                                                    </p>
                                                    <p className={cn("text-3xl font-bold", getGradeColor(roundedGrade))}>
                                                        {formatGrade(roundedGrade)}
                                                    </p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    /* Range-based evaluation */
                                    <>
                                        <div className="space-y-2">
                                            <Label>Prestazione ({gradingExercise.unit})</Label>
                                            <Input
                                                type="text"
                                                placeholder={`Inserisci ${gradingExercise.unit}`}
                                                value={performanceInputValue}
                                                onChange={(e) => setPerformanceInputValue(e.target.value)}
                                            />
                                        </div>

                                        {/* Score preview */}
                                        {gradingPreviewScore !== null ? (
                                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                                                <p className="text-sm text-muted-foreground mb-1">Voto Provvisorio</p>
                                                <p
                                                    className={cn(
                                                        "text-3xl font-bold",
                                                        getGradeColor(gradingPreviewScore)
                                                    )}
                                                >
                                                    {formatGrade(gradingPreviewScore)}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                                                <p className="text-sm text-muted-foreground">Inserisci un valore per vedere il voto</p>
                                            </div>
                                        )}
                                        {/* Score preview */}
                                        {gradingPreviewScore !== null ? (
                                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                                                <p className="text-sm text-muted-foreground mb-1">Voto Provvisorio</p>
                                                <p
                                                    className={cn(
                                                        "text-3xl font-bold",
                                                        getGradeColor(gradingPreviewScore)
                                                    )}
                                                >
                                                    {formatGrade(gradingPreviewScore)}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-lg bg-muted/50 text-center">
                                                <p className="text-sm text-muted-foreground">Inserisci un valore per vedere il voto</p>
                                            </div>
                                        )}

                                        {!gradingExercise.evaluationRanges && (
                                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
                                                ⚠️ Questo esercizio non ha fasce di valutazione configurate.
                                                Vai alla pagina Esercizi per configurarle.
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label>Note</Label>
                                    <Textarea
                                        value={notesValue}
                                        onChange={(e) => setNotesValue(e.target.value)}
                                        placeholder="Aggiungi note sulla prestazione..."
                                        rows={3}
                                    />
                                </div>

                                {/* Action buttons */}
                                {(() => {
                                    const isCriteriaBased = gradingExercise.evaluationType === 'criteria' && gradingExercise.evaluationCriteria && gradingExercise.evaluationCriteria.length > 0;
                                    const hasCriteriaInput = isCriteriaBased && Object.values(criteriaScores).some(v => v > 0);
                                    const hasRangeInput = !isCriteriaBased && performanceInputValue;
                                    const hasAnyInput = hasCriteriaInput || hasRangeInput;
                                    const canConfirm = isCriteriaBased ? hasCriteriaInput : (hasRangeInput && gradingPreviewScore !== null);
                                    
                                    return (
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleSaveEvaluation(false)}
                                                disabled={isSaving || !hasAnyInput}
                                            >
                                                {isSaving ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Save className="mr-2 h-4 w-4" />
                                                )}
                                                Salva Bozza
                                            </Button>
                                            <Button
                                                onClick={() => handleSaveEvaluation(true)}
                                                disabled={isSaving || !canConfirm}
                                            >
                                                {isSaving ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Check className="mr-2 h-4 w-4" />
                                                )}
                                                Conferma Voto
                                            </Button>
                                        </div>
                                    );
                                })()}

                                {/* Delete button */}
                                <Button
                                    variant="ghost"
                                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 mt-2"
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Elimina Valutazione
                                </Button>
                            </CardContent>
                        </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Empty state */}
                {evaluations.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Nessuna valutazione</h3>
                        <p className="text-muted-foreground mb-4">
                            Inizia assegnando un esercizio a una classe o a degli studenti
                        </p>
                        <Button onClick={() => setIsAssignModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Assegna Esercizio
                        </Button>
                    </div>
                )}
            </div>

            {/* Assign Exercise Modal */}
            <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Assegna Esercizio</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Exercise selection */}
                        <div className="space-y-2">
                            <Label>Esercizio</Label>
                            <Select value={assignExerciseId} onValueChange={setAssignExerciseId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleziona esercizio" />
                                </SelectTrigger>
                                <SelectContent>
                                    {exercises.map((ex) => (
                                        <SelectItem key={ex.id} value={ex.id}>
                                            {ex.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Assignment mode toggle */}
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={assignMode === "class" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setAssignMode("class")}
                            >
                                Intera Classe
                            </Button>
                            <Button
                                type="button"
                                variant={assignMode === "students" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setAssignMode("students")}
                            >
                                Singoli Studenti
                            </Button>
                        </div>

                        {/* Class selection */}
                        {assignMode === "class" && (
                            <div className="space-y-2">
                                <Label>Classe</Label>
                                <Select value={assignClassId} onValueChange={setAssignClassId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleziona classe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id}>
                                                {cls.className} ({getStudentsForClass(cls.id).length} studenti)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Student multi-select */}
                        {assignMode === "students" && (
                            <div className="space-y-2">
                                <Label>Studenti</Label>
                                <ScrollArea className="h-[200px] border rounded-md p-3">
                                    <div className="space-y-2">
                                        {students.map((student) => (
                                            <div key={student.id} className="flex items-center gap-2">
                                                <Checkbox
                                                    id={student.id}
                                                    checked={assignStudentIds.includes(student.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setAssignStudentIds([...assignStudentIds, student.id]);
                                                        } else {
                                                            setAssignStudentIds(
                                                                assignStudentIds.filter((id) => id !== student.id)
                                                            );
                                                        }
                                                    }}
                                                />
                                                <label
                                                    htmlFor={student.id}
                                                    className="text-sm flex-1 cursor-pointer"
                                                >
                                                    {student.firstName} {student.lastName}
                                                    <span className="text-muted-foreground ml-2">
                                                        ({getClassName(student.currentClassId)})
                                                    </span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                {assignStudentIds.length > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        {assignStudentIds.length} studenti selezionati
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
                            Annulla
                        </Button>
                        <Button
                            onClick={handleAssignExercise}
                            disabled={
                                isSubmitting ||
                                !assignExerciseId ||
                                (assignMode === "class" && !assignClassId) ||
                                (assignMode === "students" && assignStudentIds.length === 0)
                            }
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Assegna
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Session Confirmation Dialog */}
            <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Nuova Sessione di Valutazione</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vuoi iniziare una nuova sessione di valutazione?
                            Le valutazioni esistenti rimarranno salvate nel sistema.
                            Puoi riassegnare l'esercizio alla classe per ricominciare.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetSession}>
                            Conferma
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Evaluation Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminare questa valutazione?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Stai per eliminare la valutazione per questo studente.
                            Questa azione non può essere annullata.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteEvaluation();
                            }}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Eliminazione...
                                </>
                            ) : (
                                "Elimina"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

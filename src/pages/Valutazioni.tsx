import { useState, useMemo, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { students, classes, exercises } from "@/data/mockData";
import { Plus, User, Check, Clock, AlertCircle, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Student, Exercise, CustomCriterion } from "@/types";
import { useParams } from "react-router-dom";

// Types for evaluation state
interface StudentEvaluation {
    studentId: string;
    exerciseId: string;
    criteriaValues: Record<string, number | null>; // criterion id -> value (null = not set)
    notes: string;
    createdAt: string;
}

type EvaluationStatus = "non-valutato" | "valutando" | "valutato";

// Helper to determine status based on criteria completion
function getEvaluationStatus(
    evaluation: StudentEvaluation,
    exercise: Exercise
): EvaluationStatus {
    const criteria = exercise.customCriteria || [];
    if (criteria.length === 0) {
        // For range-based exercises, check if there's a single value
        const hasValue = evaluation.criteriaValues["value"] !== null && evaluation.criteriaValues["value"] !== undefined;
        return hasValue ? "valutato" : "non-valutato";
    }

    const filledCount = criteria.filter(
        (c) => evaluation.criteriaValues[c.id] !== null && evaluation.criteriaValues[c.id] !== undefined
    ).length;

    if (filledCount === 0) return "non-valutato";
    if (filledCount === criteria.length) return "valutato";
    return "valutando";
}

// Calculate final grade from criteria
// Calculate final grade from criteria or ranges
function calculateFinalGrade(evaluation: StudentEvaluation, exercise: Exercise, student?: Student): number | null {
    const criteria = exercise.customCriteria || [];

    // Range-based evaluation
    if (criteria.length === 0) {
        const rawValue = evaluation.criteriaValues["value"];
        if (rawValue === null || rawValue === undefined) return null;

        // If no student provided or no ranges, fallback to raw value (as grade)
        if (!student || (!exercise.rangesMale && !exercise.rangesFemale)) {
            return rawValue;
        }

        // Determine ranges based on gender
        const ranges = student.gender === 'M'
            ? exercise.rangesMale
            : exercise.rangesFemale;

        if (!ranges) return rawValue; // Fallback if specific gender ranges missing

        // Find matching range
        const matchedRange = ranges.find(r => rawValue >= r.minValue && rawValue <= r.maxValue);

        return matchedRange ? matchedRange.score : null;
    }

    // Criteria-based evaluation
    const values = criteria
        .map((c) => evaluation.criteriaValues[c.id])
        .filter((v): v is number => v !== null && v !== undefined);

    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

// Helper component for buffered input
function BufferedInput({
    value,
    onCommit,
    ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "onBlur" | "onKeyDown"> & {
    value: number | null | undefined;
    onCommit: (val: number | null) => void;
}) {
    const [localValue, setLocalValue] = useState<string>(value?.toString() ?? "");

    // Sync with prop changes (e.g. when switching student)
    useEffect(() => {
        setLocalValue(value?.toString() ?? "");
    }, [value]);

    const handleCommit = () => {
        if (localValue === "") {
            onCommit(null);
            return;
        }
        const parsed = parseFloat(localValue);
        // If parsed is NaN, we treat it as null (cleared) or revert? 
        // Let's treat valid numbers as updates.
        if (!isNaN(parsed)) {
            // Only commit if different
            if (parsed !== value) {
                onCommit(parsed);
            }
        } else {
            // If invalid input, maybe clear it?
            if (value !== null) onCommit(null);
        }
    };

    return (
        <Input
            {...props}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    handleCommit();
                    (e.currentTarget as HTMLInputElement).blur();
                }
            }}
        />
    );
}

export default function Valutazioni() {
    // Filters
    const [selectedClassId, setSelectedClassId] = useState<string>("all");
    const [selectedExerciseId, setSelectedExerciseId] = useState<string>("all");

    const { classId, exerciseId } = useParams();
    console.log(classId, exerciseId);
    useEffect(() => {
        if (classId && exerciseId) { 
            setSelectedClassId(classId);
            setSelectedExerciseId(exerciseId);
        }
    }, [classId, exerciseId]);

    // Evaluations state (in real app, this would come from backend)
    const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);

    // Modal states
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedStudentForGrading, setSelectedStudentForGrading] = useState<string | null>(null);

    // Assignment modal state
    const [assignExerciseId, setAssignExerciseId] = useState<string>("");
    const [assignClassId, setAssignClassId] = useState<string>("");
    const [assignStudentIds, setAssignStudentIds] = useState<string[]>([]);
    const [assignMode, setAssignMode] = useState<"class" | "students">("class");

    // Get current exercise
    // const currentExercise = exercises.find((e) => e.id === selectedExerciseId);

    // Filter evaluations based on selected filters
    const filteredEvaluations = useMemo(() => {
        return evaluations.filter((ev) => {
            const student = students.find((s) => s.id === ev.studentId);
            if (!student) return false;

            const matchesClass = selectedClassId === "all" || student.classId === selectedClassId;
            const matchesExercise = selectedExerciseId === "all" || ev.exerciseId === selectedExerciseId;

            return matchesClass && matchesExercise;
        });
    }, [evaluations, selectedClassId, selectedExerciseId]);

    // Group evaluations by status
    const groupedEvaluations = useMemo(() => {
        const groups: Record<EvaluationStatus, StudentEvaluation[]> = {
            "non-valutato": [],
            "valutando": [],
            "valutato": [],
        };

        filteredEvaluations.forEach((ev) => {
            const exercise = exercises.find((e) => e.id === ev.exerciseId);
            if (exercise) {
                const status = getEvaluationStatus(ev, exercise);
                groups[status].push(ev);
            }
        });

        return groups;
    }, [filteredEvaluations]);

    // Handle assigning exercise
    const handleAssignExercise = () => {
        if (!assignExerciseId) return;

        let studentIds: string[] = [];
        if (assignMode === "class" && assignClassId) {
            studentIds = students.filter((s) => s.classId === assignClassId).map((s) => s.id);
        } else {
            studentIds = assignStudentIds;
        }

        const exercise = exercises.find((e) => e.id === assignExerciseId);
        if (!exercise) return;

        // Create initial criteria values (all null)
        const initialCriteria: Record<string, number | null> = {};
        if (exercise.customCriteria && exercise.customCriteria.length > 0) {
            exercise.customCriteria.forEach((c) => {
                initialCriteria[c.id] = null;
            });
        } else {
            initialCriteria["value"] = null;
        }

        // Create evaluations for each student (avoid duplicates)
        const newEvaluations: StudentEvaluation[] = [];
        studentIds.forEach((studentId) => {
            const exists = evaluations.some(
                (ev) => ev.studentId === studentId && ev.exerciseId === assignExerciseId
            );
            if (!exists) {
                newEvaluations.push({
                    studentId,
                    exerciseId: assignExerciseId,
                    criteriaValues: { ...initialCriteria },
                    notes: "",
                    createdAt: new Date().toISOString(),
                });
            }
        });

        setEvaluations([...evaluations, ...newEvaluations]);
        setIsAssignModalOpen(false);
        setAssignExerciseId("");
        setAssignClassId("");
        setAssignStudentIds([]);

        // Auto-select the exercise filter
        if (selectedExerciseId === "all") {
            setSelectedExerciseId(assignExerciseId);
        }
    };

    // Handle updating a criterion value
    const handleUpdateCriterion = (studentId: string, criterionId: string, value: number) => {
        setEvaluations((prev) =>
            prev.map((ev) => {
                if (ev.studentId === studentId && ev.exerciseId === selectedExerciseId) {
                    return {
                        ...ev,
                        criteriaValues: { ...ev.criteriaValues, [criterionId]: value },
                    };
                }
                return ev;
            })
        );
    };

    // Handle updating notes
    const handleUpdateNotes = (studentId: string, notes: string) => {
        setEvaluations((prev) =>
            prev.map((ev) => {
                if (ev.studentId === studentId && ev.exerciseId === selectedExerciseId) {
                    return { ...ev, notes };
                }
                return ev;
            })
        );
    };

    // Get student details
    const getStudent = (studentId: string): Student | undefined => {
        return students.find((s) => s.id === studentId);
    };

    // Get exercise details
    const getExercise = (exerciseId: string): Exercise | undefined => {
        return exercises.find((e) => e.id === exerciseId);
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

                                const finalGrade = calculateFinalGrade(ev, exercise, student);
                                const isSelected = selectedStudentForGrading === ev.studentId;

                                return (
                                    <Card
                                        key={`${ev.studentId}-${ev.exerciseId}`}
                                        className={cn(
                                            "cursor-pointer transition-all hover:shadow-md",
                                            isSelected && "ring-2 ring-primary"
                                        )}
                                        onClick={() => setSelectedStudentForGrading(ev.studentId)}
                                    >
                                        <CardContent className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{student.fullName}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Badge variant="outline" className="text-xs">
                                                            {student.className}
                                                        </Badge>
                                                        <span className="truncate">{exercise.name}</span>
                                                    </div>
                                                </div>
                                                {finalGrade !== null && (
                                                    <div
                                                        className={cn(
                                                            "text-lg font-bold",
                                                            finalGrade >= 6 ? "text-green-600" : "text-red-600"
                                                        )}
                                                    >
                                                        {finalGrade}
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

    // Grading panel component
    const GradingPanel = () => {
        if (!selectedStudentForGrading || selectedExerciseId === "all") return null;

        const evaluation = evaluations.find(
            (ev) => ev.studentId === selectedStudentForGrading && ev.exerciseId === selectedExerciseId
        );
        if (!evaluation) return null;

        const student = getStudent(selectedStudentForGrading);
        const exercise = getExercise(selectedExerciseId);
        if (!student || !exercise) return null;

        const criteria = exercise.customCriteria || [];
        const isRangeBased = criteria.length === 0;
        const finalGrade = calculateFinalGrade(evaluation, exercise, student);
        const status = getEvaluationStatus(evaluation, exercise);

        return (
            <Card className="w-full max-w-md">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Valutazione</CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedStudentForGrading(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="h-12 w-12 rounded-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold">{student.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                                {student.className} • {exercise.name}
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
                                status === "valutato"
                                    ? "default"
                                    : status === "valutando"
                                        ? "secondary"
                                        : "outline"
                            }
                            className={cn(
                                status === "valutato" && "bg-green-600",
                                status === "valutando" && "bg-yellow-500 text-black"
                            )}
                        >
                            {status === "non-valutato" && "Non Valutato"}
                            {status === "valutando" && "Valutando"}
                            {status === "valutato" && "Valutato"}
                        </Badge>
                    </div>

                    {/* Criteria sliders */}
                    <div className="space-y-4">
                        {isRangeBased ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Prestazione ({exercise.unit || 'valore'})</Label>
                                    <div className="flex gap-2">
                                        <BufferedInput
                                            type="number"
                                            step="0.01"
                                            placeholder={`Inserisci ${exercise.unit || 'valore'}`}
                                            value={evaluation.criteriaValues["value"]}
                                            onCommit={(val) => {
                                                handleUpdateCriterion(student.id, "value", val as any);
                                            }}
                                        />
                                    </div>
                                </div>

                                {evaluation.criteriaValues["value"] !== null && finalGrade !== null && (
                                    <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2 rounded">
                                        <span className="text-sm font-medium">Voto Calcolato:</span>
                                        <Badge variant={finalGrade >= 6 ? "default" : "destructive"}>
                                            {finalGrade}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        ) : (
                            criteria.map((criterion: CustomCriterion) => (
                                <div key={criterion.id} className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>{criterion.name}</Label>
                                        <span className="text-sm font-medium">
                                            {evaluation.criteriaValues[criterion.id] ?? "-"}/{criterion.maxScore}
                                        </span>
                                    </div>
                                    <Slider
                                        value={[evaluation.criteriaValues[criterion.id] ?? 1]}
                                        onValueChange={(vals) =>
                                            handleUpdateCriterion(student.id, criterion.id, vals[0])
                                        }
                                        min={1}
                                        max={criterion.maxScore}
                                        step={0.5}
                                    />
                                </div>
                            ))
                        )}
                    </div>

                    {/* Final grade */}
                    {finalGrade !== null && (
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                            <p className="text-sm text-muted-foreground mb-1">Voto Finale</p>
                            <p
                                className={cn(
                                    "text-3xl font-bold",
                                    finalGrade >= 6 ? "text-green-600" : "text-red-600"
                                )}
                            >
                                {finalGrade}
                            </p>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Note</Label>
                        <Textarea
                            value={evaluation.notes}
                            onChange={(e) => handleUpdateNotes(student.id, e.target.value)}
                            placeholder="Aggiungi note sulla prestazione..."
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>
        );
    };

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
                    <Button className="gap-2" onClick={() => setIsAssignModalOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Assegna Esercizio
                    </Button>
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
                                        Classe {cls.name}
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
                <div className="flex gap-6">
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

                    {/* Grading panel */}
                    {selectedStudentForGrading && selectedExerciseId !== "all" && (
                        <GradingPanel />
                    )}
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
                                                {cls.name} ({cls.studentCount} studenti)
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
                                                    {student.fullName}
                                                    <span className="text-muted-foreground ml-2">
                                                        ({student.className})
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
                                !assignExerciseId ||
                                (assignMode === "class" && !assignClassId) ||
                                (assignMode === "students" && assignStudentIds.length === 0)
                            }
                        >
                            Assegna
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </>
    );
}

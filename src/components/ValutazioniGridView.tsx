import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Student, Exercise, Evaluation, SchoolClass, SortMode, ScoreRange } from "@/types/types";
import { User, Grid3X3, Check, MousePointerClick } from "lucide-react";


interface ValutazioniGridViewProps {
    filteredEvaluations: Evaluation[];
    students: Student[];
    exercises: Exercise[];
    classes: SchoolClass[];
    filteredExercises: Exercise[];
    selectedClassId: string;
    selectedExerciseId: string;
    formatGrade: (value: number) => string;
    getGradeColor: (value: number) => string;
    getGradeBgColor: (value: number) => string;
    sortMode: SortMode;
    onSaveEvaluation: (
        studentId: string,
        exerciseId: string,
        data: {
            performanceValue: string;
            score: number;
            criteriaScores?: Record<string, number>;
            criteriaPerformances?: Record<string, number>;
            comments?: string;
        }
    ) => Promise<void>;
    enableBasePoint: boolean;
}

// Calculate score from performance value using evaluation ranges
function calculateScoreFromRanges(
    performanceValue: number,
    ranges: ScoreRange[] | undefined
): number | null {
    if (!ranges || ranges.length === 0) return null;
    for (const range of ranges) {
        if (performanceValue >= range.min && performanceValue <= range.max) {
            return range.score;
        }
    }
    return null;
}

// Parse numeric input with comma support
function parseInputNumber(val: string): number | null {
    if (val === "" || val === undefined || val === null) return null;
    const parsed = parseFloat(val.toString().replace(",", "."));
    return isNaN(parsed) ? null : parsed;
}

// Format number with comma as decimal separator
function formatNumber(val: number | null): string {
    if (val === null || val === undefined) return "";
    return val.toString().replace(".", ",");
}

// ─── Inline editable cell ───────────────────────────────────────────────────
interface InlineCellProps {
    value: number | null;
    onCommit: (value: number | null) => void;
    maxValue?: number;
    unit?: string;
    isSaving?: boolean;
    justSaved?: boolean;
}

function InlineCell({ value, onCommit, maxValue, unit, isSaving, justSaved }: InlineCellProps) {
    const [editing, setEditing] = useState(false);
    const [localValue, setLocalValue] = useState(formatNumber(value));
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync local value when external value changes and not editing
    useEffect(() => {
        if (!editing) {
            setLocalValue(formatNumber(value));
        }
    }, [value, editing]);

    const handleFocus = () => {
        setEditing(true);
        setLocalValue(formatNumber(value));
    };

    const handleBlur = () => {
        setEditing(false);
        const parsed = parseInputNumber(localValue);
        const clamped = (parsed !== null && maxValue !== undefined) ? Math.min(parsed, maxValue) : parsed;
        if (clamped !== value) {
            onCommit(clamped);
        } else {
            setLocalValue(formatNumber(value));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/[^0-9,.\-]/.test(val)) {
            toast.error("Inserire solo valori numerici");
            return;
        }
        setLocalValue(val);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            inputRef.current?.blur();
        }
        if (e.key === "Escape") {
            setLocalValue(formatNumber(value));
            setEditing(false);
            inputRef.current?.blur();
        }
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={editing ? localValue : formatNumber(value)}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={unit ? `${unit}` : "—"}
                className={cn(
                    "w-full h-full text-center text-sm bg-transparent border-0 outline-none",
                    "focus:bg-primary/5 focus:ring-2 focus:ring-primary/30 focus:rounded-md",
                    "transition-all duration-150",
                    isSaving && "opacity-50",
                    justSaved && "bg-green-50 dark:bg-green-900/20"
                )}
            />
            {justSaved && (
                <Check className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-green-500 animate-in fade-in duration-300" />
            )}
        </div>
    );
}


// ─── Row status computation ──────────────────────────────────────────────────
type RowStatus = "complete" | "partial" | "none";

export default function ValutazioniGridView({
    filteredEvaluations,
    students,
    classes,
    filteredExercises,
    selectedClassId,
    selectedExerciseId,
    formatGrade,
    getGradeColor,
    getGradeBgColor,
    sortMode,
    onSaveEvaluation,
    enableBasePoint,
}: ValutazioniGridViewProps) {

    // Track saving state and "just saved" flash per cell
    const [savingCells, setSavingCells] = useState<Set<string>>(new Set());
    const [savedCells, setSavedCells] = useState<Set<string>>(new Set());

    // Optimistic evaluations
    const [optimisticEvals, setOptimisticEvals] = useState<Record<string, Evaluation>>({});

    // ─── Exercise must be selected ──────────────────────────────────────────
    const exercise = useMemo(() => {
        if (selectedExerciseId === "all") return null;
        return filteredExercises.find(e => e.id === selectedExerciseId)
            || null;
    }, [selectedExerciseId, filteredExercises]);

    // ─── Students filtered by class ─────────────────────────────────────────
    const classStudents = useMemo(() => {
        if (selectedClassId === "all") return students;
        return students.filter(s => s.currentClassId === selectedClassId);
    }, [students, selectedClassId]);

    // ─── Evaluation lookup map ──────────────────────────────────────────────
    const evalMap = useMemo(() => {
        const map = new Map<string, Evaluation>();
        filteredEvaluations.forEach(ev => {
            const key = `${ev.studentId}-${ev.exerciseId}`;
            const existing = map.get(key);
            if (!existing || new Date(ev.createdAt) > new Date(existing.createdAt)) {
                // Parse missing fields from performanceValue (API might return only stringified performanceValue)
                const parsedEv = { ...ev };
                if (
                    !parsedEv.criteriaScores &&
                    !parsedEv.criteriaPerformances &&
                    typeof parsedEv.performanceValue === 'string' &&
                    parsedEv.performanceValue.startsWith('{')
                ) {
                    try {
                        const parsed = JSON.parse(parsedEv.performanceValue);
                        parsedEv.criteriaScores = parsed;
                        parsedEv.criteriaPerformances = parsed;
                    } catch (e) {
                        // ignore parse error
                    }
                }
                map.set(key, parsedEv);
            }
        });

        // Apply optimistic overrides
        Object.values(optimisticEvals).forEach(ev => {
            const key = `${ev.studentId}-${ev.exerciseId}`;
            map.set(key, ev); 
        });

        return map;
    }, [filteredEvaluations, optimisticEvals]);

    // ─── Determine column layout ────────────────────────────────────────────
    type ColumnDef = {
        key: string;
        label: string;
        unit?: string;
        maxScore?: number;
    };

    const columns: ColumnDef[] = useMemo(() => {
        if (!exercise) return [];

        if (exercise.evaluationType === "criteria" && exercise.evaluationCriteria?.length) {
            return exercise.evaluationCriteria.map(c => ({
                key: c.name,
                label: c.name,
                maxScore: c.maxScore,
            }));
        }

        if (exercise.evaluationType === "criteria-ranges" && exercise.evaluationCriteriaWithRanges?.length) {
            return exercise.evaluationCriteriaWithRanges.map(c => ({
                key: c.name,
                label: c.name,
                unit: c.unit,
                maxScore: c.maxScore,
            }));
        }

        // Default: range-based with single performance column
        return [{
            key: "__performance",
            label: `Prestazione (${exercise.unit})`,
            unit: exercise.unit,
        }];
    }, [exercise]);

    // ─── Compute final score for a student ──────────────────────────────────
    const computeFinalScore = useCallback((
        student: Student,
        ev: Evaluation | undefined,
    ): number => {
        if (!exercise || !ev) return 0;

        const isCriteriaBased = exercise.evaluationType === "criteria" && exercise.evaluationCriteria?.length;
        const isCriteriaRangesBased = exercise.evaluationType === "criteria-ranges" && exercise.evaluationCriteriaWithRanges?.length;

        if (isCriteriaBased) {
            const totalMax = exercise.evaluationCriteria!.reduce((sum, c) => sum + c.maxScore, 0);
            const totalScored = exercise.evaluationCriteria!.reduce(
                (sum, c) => sum + (ev.criteriaScores?.[c.name] || 0), 0
            );
            const maxScore = exercise.maxScore || 10;

            let score: number;
            if (enableBasePoint) {
                const pct = totalMax > 0 ? totalScored / totalMax : 0;
                score = 1 + (pct * (maxScore - 1));
            } else {
                score = totalMax > 0 ? (totalScored / totalMax) * maxScore : 0;
            }
            return Math.round(score * 10) / 10;
        }

        if (isCriteriaRangesBased) {
            let totalScored = 0;
            let totalMax = 0;

            exercise.evaluationCriteriaWithRanges!.forEach(criterion => {
                const performance = ev.criteriaPerformances?.[criterion.name];
                if (performance !== undefined && !isNaN(performance)) {
                    const ranges = criterion.ranges?.[student.gender] || criterion.ranges?.["M"];
                    if (ranges?.length) {
                        for (const range of ranges) {
                            if (performance >= range.min && performance <= range.max) {
                                totalScored += range.score;
                                break;
                            }
                        }
                    }
                }
                totalMax += criterion.maxScore;
            });

            const maxScore = exercise.maxScore || 10;
            let score: number;
            if (enableBasePoint) {
                const pct = totalMax > 0 ? totalScored / totalMax : 0;
                score = 1 + (pct * (maxScore - 1));
            } else {
                score = totalMax > 0 ? (totalScored / totalMax) * maxScore : 0;
            }
            return Math.round(score * 10) / 10;
        }

        // Range-based
        const perfStr = ev.performanceValue?.toString() || "";
        const performanceNum = parseInputNumber(perfStr);
        if (performanceNum === null || isNaN(performanceNum)) return 0;

        const ranges = exercise.evaluationRanges?.[student.gender] || exercise.evaluationRanges?.["M"];
        let rangeScore = calculateScoreFromRanges(performanceNum, ranges);

        if (rangeScore !== null) {
            if (enableBasePoint) {
                const maxScore = exercise.maxScore || 10;
                const pct = maxScore > 0 ? rangeScore / maxScore : 0;
                rangeScore = 1 + (pct * (maxScore - 1));
            }
            return Math.round(rangeScore * 10) / 10;
        }

        return 0;
    }, [exercise, enableBasePoint]);

    // ─── Save handler for a single cell ─────────────────────────────────────
    const handleCellCommit = useCallback(async (
        student: Student,
        columnKey: string,
        newValue: number | null
    ) => {
        if (!exercise) return;

        const cellKey = `${student.id}-${columnKey}`;
        setSavingCells(prev => new Set(prev).add(cellKey));

        try {
            const ev = evalMap.get(`${student.id}-${exercise.id}`);

            const isCriteriaBased = exercise.evaluationType === "criteria" && exercise.evaluationCriteria?.length;
            const isCriteriaRangesBased = exercise.evaluationType === "criteria-ranges" && exercise.evaluationCriteriaWithRanges?.length;

            let payload: {
                performanceValue: string;
                score: number;
                criteriaScores?: Record<string, number>;
                criteriaPerformances?: Record<string, number>;
                comments?: string;
            };

            if (isCriteriaBased) {
                const updatedScores = { ...(ev?.criteriaScores || {}) };
                if (newValue === null) {
                    delete updatedScores[columnKey];
                } else {
                    updatedScores[columnKey] = newValue;
                }

                // Calculate final score
                const totalMax = exercise.evaluationCriteria!.reduce((sum, c) => sum + c.maxScore, 0);
                const totalScored = exercise.evaluationCriteria!.reduce(
                    (sum, c) => sum + (updatedScores[c.name] || 0), 0
                );
                const maxScore = exercise.maxScore || 10;

                let calculatedScore: number;
                if (enableBasePoint) {
                    const pct = totalMax > 0 ? totalScored / totalMax : 0;
                    calculatedScore = 1 + (pct * (maxScore - 1));
                } else {
                    calculatedScore = totalMax > 0 ? (totalScored / totalMax) * maxScore : 0;
                }
                calculatedScore = Math.round(calculatedScore * 10) / 10;

                payload = {
                    performanceValue: JSON.stringify(updatedScores),
                    score: calculatedScore,
                    criteriaScores: updatedScores,
                    comments: ev?.comments || "",
                };
            } else if (isCriteriaRangesBased) {
                const updatedPerformances = { ...(ev?.criteriaPerformances || {}) };
                if (newValue === null) {
                    delete updatedPerformances[columnKey];
                } else {
                    updatedPerformances[columnKey] = newValue;
                }

                // Compute per-criterion scores
                const computedCriteriaScores: Record<string, number> = {};
                let totalScored = 0;
                let totalMax = 0;

                exercise.evaluationCriteriaWithRanges!.forEach(criterion => {
                    const perf = updatedPerformances[criterion.name];
                    if (perf !== undefined && !isNaN(perf)) {
                        const ranges = criterion.ranges?.[student.gender] || criterion.ranges?.["M"];
                        if (ranges?.length) {
                            for (const range of ranges) {
                                if (perf >= range.min && perf <= range.max) {
                                    computedCriteriaScores[criterion.name] = range.score;
                                    totalScored += range.score;
                                    break;
                                }
                            }
                        }
                    }
                    totalMax += criterion.maxScore;
                });

                const maxScore = exercise.maxScore || 10;
                let calculatedScore: number;
                if (enableBasePoint) {
                    const pct = totalMax > 0 ? totalScored / totalMax : 0;
                    calculatedScore = 1 + (pct * (maxScore - 1));
                } else {
                    calculatedScore = totalMax > 0 ? (totalScored / totalMax) * maxScore : 0;
                }
                calculatedScore = Math.round(calculatedScore * 10) / 10;

                payload = {
                    performanceValue: JSON.stringify(updatedPerformances),
                    score: calculatedScore,
                    criteriaScores: computedCriteriaScores,
                    criteriaPerformances: updatedPerformances,
                    comments: ev?.comments || "",
                };
            } else {
                // Range-based: single performance value
                const performanceValue = newValue === null ? "" : newValue.toString();
                const ranges = exercise.evaluationRanges?.[student.gender] || exercise.evaluationRanges?.["M"];
                let rangeScore = newValue === null ? null : calculateScoreFromRanges(newValue, ranges);

                if (rangeScore !== null && enableBasePoint) {
                    const maxScore = exercise.maxScore || 10;
                    const pct = maxScore > 0 ? rangeScore / maxScore : 0;
                    rangeScore = 1 + (pct * (maxScore - 1));
                    rangeScore = Math.round(rangeScore * 10) / 10;
                }

                payload = {
                    performanceValue,
                    score: rangeScore ?? 0,
                    comments: ev?.comments || "",
                };
            }

            // Apply optimistic update immediately
            const updatedEv: Evaluation = {
                ...(ev || {
                    id: 'temp-' + Date.now(),
                    studentId: student.id,
                    ownerId: '',
                    exerciseId: exercise.id,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    performanceValue: "",
                    score: 0,
                }),
                performanceValue: payload.performanceValue,
                score: payload.score,
                criteriaScores: payload.criteriaScores,
                criteriaPerformances: payload.criteriaPerformances,
                comments: payload.comments || "",
            };
            setOptimisticEvals(prev => ({ ...prev, [`${student.id}-${exercise.id}`]: updatedEv }));

            // Save to backend
            await onSaveEvaluation(student.id, exercise.id, payload);

            // Flash saved
            setSavedCells(prev => new Set(prev).add(cellKey));
            setTimeout(() => {
                setSavedCells(prev => {
                    const next = new Set(prev);
                    next.delete(cellKey);
                    return next;
                });
            }, 1200);
        } catch (err) {
            console.error("Error saving cell:", err);
        } finally {
            setSavingCells(prev => {
                const next = new Set(prev);
                next.delete(cellKey);
                return next;
            });
            // Clear optimistic eval AFTER backend sync so we sync with the server's real data
            setOptimisticEvals(prev => {
                const next = { ...prev };
                delete next[`${student.id}-${exercise.id}`];
                return next;
            });
        }
    }, [exercise, evalMap, onSaveEvaluation, enableBasePoint]);

    // ─── Get cell value from evaluation ─────────────────────────────────────
    const getCellValue = useCallback((ev: Evaluation | undefined, columnKey: string): number | null => {
        if (!ev || !exercise) return null;

        const isCriteriaBased = exercise.evaluationType === "criteria" && exercise.evaluationCriteria?.length;
        const isCriteriaRangesBased = exercise.evaluationType === "criteria-ranges" && exercise.evaluationCriteriaWithRanges?.length;

        if (isCriteriaBased) {
            return ev.criteriaScores?.[columnKey] ?? null;
        }
        if (isCriteriaRangesBased) {
            return ev.criteriaPerformances?.[columnKey] ?? null;
        }
        // Range-based
        const perfStr = ev.performanceValue?.toString() || "";
        return parseInputNumber(perfStr);
    }, [exercise]);

    // ─── Sort rows ──────────────────────────────────────────────────────────
    const sortedRows = useMemo(() => {
        if (!exercise) return [];

        const rows = classStudents.map(student => {
            const ev = evalMap.get(`${student.id}-${exercise.id}`);
            const finalScore = computeFinalScore(student, ev);

            let filledCount = 0;
            columns.forEach(col => {
                // Determine if this specific cell has data (not strictly > 0, just has a defined valid value)
                const isCriteriaBased = exercise.evaluationType === "criteria" && exercise.evaluationCriteria?.length;
                const isCriteriaRangesBased = exercise.evaluationType === "criteria-ranges" && exercise.evaluationCriteriaWithRanges?.length;
                let hasVal = false;

                if (isCriteriaBased) {
                    hasVal = ev?.criteriaScores?.[col.key] !== undefined && ev.criteriaScores[col.key] !== null;
                } else if (isCriteriaRangesBased) {
                    hasVal = ev?.criteriaPerformances?.[col.key] !== undefined && ev.criteriaPerformances[col.key] !== null && !isNaN(ev.criteriaPerformances[col.key]);
                } else {
                    const val = ev?.performanceValue;
                    hasVal = val !== undefined && val !== null && val !== "" && parseInputNumber(val.toString()) !== null;
                }

                if (hasVal) filledCount++;
            });

            let status: RowStatus = "none";
            if (filledCount === columns.length && columns.length > 0) {
                status = "complete";
            } else if (filledCount > 0) {
                status = "partial";
            }

            return { student, ev, finalScore, status, filledCount };
        });

        switch (sortMode) {
            case "alpha-asc":
                rows.sort((a, b) =>
                    `${a.student.lastName} ${a.student.firstName}`.localeCompare(
                        `${b.student.lastName} ${b.student.firstName}`
                    )
                );
                break;
            case "alpha-desc":
                rows.sort((a, b) =>
                    `${b.student.lastName} ${b.student.firstName}`.localeCompare(
                        `${a.student.lastName} ${a.student.firstName}`
                    )
                );
                break;
            case "grade-high":
                rows.sort((a, b) => b.finalScore - a.finalScore);
                break;
            case "grade-low":
                rows.sort((a, b) => a.finalScore - b.finalScore);
                break;
            case "completion":
                rows.sort((a, b) => b.filledCount - a.filledCount);
                break;
        }

        return rows;
    }, [classStudents, exercise, evalMap, computeFinalScore, sortMode, columns, getCellValue]);

    // ─── Helper ─────────────────────────────────────────────────────────────
    const getClassName = (classId: string): string => {
        const cls = classes.find(c => c.id === classId);
        return cls?.className || "N/A";
    };

    // ─── Empty / prompt states ──────────────────────────────────────────────
    if (selectedExerciseId === "all" || !exercise) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center flex-1">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <MousePointerClick className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Seleziona un esercizio</h3>
                <p className="text-muted-foreground max-w-sm">
                    Per utilizzare la vista griglia, seleziona un esercizio specifico dal filtro in alto.
                </p>
            </div>
        );
    }

    if (columns.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center flex-1">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Grid3X3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nessun criterio</h3>
                <p className="text-muted-foreground">
                    Questo esercizio non ha criteri configurati.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Legend */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm bg-slate-300 dark:bg-slate-600" />
                    <span className="text-xs text-muted-foreground">Non Valutato</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm bg-yellow-400 dark:bg-yellow-500" />
                    <span className="text-xs text-muted-foreground">Parziale</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm bg-green-500" />
                    <span className="text-xs text-muted-foreground">Valutato</span>
                </div>
                <div className="ml-auto text-xs text-muted-foreground italic flex items-center gap-1.5">
                    <MousePointerClick className="h-3.5 w-3.5" />
                    Clicca su una cella per modificarla
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border overflow-auto flex-1 min-h-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="sticky left-0 z-10 bg-muted/80 backdrop-blur-sm min-w-[200px] border-r">
                                Studente
                            </TableHead>
                            {columns.map(col => (
                                <TableHead key={col.key} className="text-center min-w-[100px]">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="cursor-default truncate block max-w-[120px] mx-auto">
                                                {col.label}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{col.label}</p>
                                            {col.unit && <p className="text-muted-foreground">Unità: {col.unit}</p>}
                                            {col.maxScore !== undefined && <p className="text-muted-foreground">Max: {col.maxScore}</p>}
                                        </TooltipContent>
                                    </Tooltip>
                                </TableHead>
                            ))}
                            <TableHead className="text-center min-w-[80px] border-l bg-muted/50 font-bold">
                                Voto
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedRows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + 2}
                                    className="text-center text-muted-foreground py-8"
                                >
                                    Nessuno studente trovato.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedRows.map(({ student, ev, finalScore, status }) => {
                                const rowBg = status === "complete"
                                    ? "bg-green-50/50 dark:bg-green-900/20"
                                    : status === "partial"
                                        ? "bg-yellow-50/50 dark:bg-yellow-900/20"
                                        : "bg-slate-50/50 dark:bg-slate-900/30";

                                const rowBorder = status === "complete"
                                    ? "border-l-4 border-l-green-500 dark:border-l-green-500"
                                    : status === "partial"
                                        ? "border-l-4 border-l-yellow-400 dark:border-l-yellow-500"
                                        : "border-l-4 border-l-slate-300 dark:border-l-slate-600";

                                return (
                                    <TableRow
                                        key={student.id}
                                        className={cn(rowBg, "transition-colors")}
                                    >
                                        {/* Student name – sticky */}
                                        <TableCell className={cn(
                                            "sticky left-0 z-10 border-r font-medium backdrop-blur-sm",
                                            rowBg,
                                            rowBorder
                                        )}>
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs",
                                                    status === "none" && "bg-slate-100 dark:bg-slate-800 text-slate-500",
                                                    status === "partial" && "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400",
                                                    status === "complete" && "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
                                                )}>
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate">
                                                        {student.lastName} {student.firstName}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold opacity-70">
                                                        {getClassName(student.currentClassId)}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Criteria / performance cells */}
                                        {columns.map(col => {
                                            const cellKey = `${student.id}-${col.key}`;
                                            const cellValue = getCellValue(ev, col.key);

                                            return (
                                                <TableCell
                                                    key={col.key}
                                                    className="text-center p-0 h-12"
                                                >
                                                    <InlineCell
                                                        value={cellValue}
                                                        maxValue={col.maxScore}
                                                        unit={col.unit}
                                                        isSaving={savingCells.has(cellKey)}
                                                        justSaved={savedCells.has(cellKey)}
                                                        onCommit={(val) => handleCellCommit(student, col.key, val)}
                                                    />
                                                </TableCell>
                                            );
                                        })}

                                        {/* Final score column */}
                                        <TableCell className="text-center border-l bg-muted/20">
                                            {finalScore > 0 ? (
                                                <Badge
                                                    variant="secondary"
                                                    className={cn(
                                                        "text-sm font-bold px-2.5 py-0.5",
                                                        getGradeBgColor(finalScore),
                                                        getGradeColor(finalScore)
                                                    )}
                                                >
                                                    {formatGrade(finalScore)}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useSchoolData, useClient } from "@/provider/clientProvider";
import { Student } from "@/types/types";
import { ArrowRightLeft, CheckCircle2, Info, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface TransferStudentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: Student | null;
    currentClassId?: string;
    onSuccess?: () => void;
}

export function TransferStudentDialog({
    open,
    onOpenChange,
    student,
    currentClassId,
    onSuccess,
}: TransferStudentDialogProps) {
    const { t } = useTranslation();
    const client = useClient();
    const { activeClasses, classes, evaluations, exercises, refreshClasses, refreshStudents } = useSchoolData();

    const [targetClassId, setTargetClassId] = useState<string>("");
    const [initializeExercises, setInitializeExercises] = useState<boolean>(true);
    const [isTransferring, setIsTransferring] = useState<boolean>(false);

    // Identify current class
    const effectiveCurrentClassId = currentClassId || student?.currentClassId;
    const currentClass = useMemo(() => {
        return classes.find(c => c.id === effectiveCurrentClassId);
    }, [classes, effectiveCurrentClassId]);

    // Available active classes for transfer (excluding current class)
    const availableClasses = useMemo(() => {
        return activeClasses.filter(c => c.id !== effectiveCurrentClassId);
    }, [activeClasses, effectiveCurrentClassId]);

    const targetClass = useMemo(() => {
        return classes.find(c => c.id === targetClassId);
    }, [classes, targetClassId]);

    // Target class assigned exercises that student doesn't have yet
    const missingTargetExercises = useMemo(() => {
        if (!student || !targetClass) return [];
        const assignedIds = targetClass.assignedExercises || [];
        const existingEvalExIds = new Set(
            evaluations.filter(e => e.studentId === student.id).map(e => e.exerciseId)
        );

        return assignedIds
            .filter(exId => !existingEvalExIds.has(exId))
            .map(exId => exercises.find(e => e.id === exId))
            .filter(Boolean);
    }, [student, targetClass, evaluations, exercises]);

    if (!student) return null;

    const handleTransfer = async () => {
        if (!targetClassId || !student) return;
        setIsTransferring(true);

        try {
            // 1. Update student's currentClassId
            const updateStudentRes = await client.updateStudent(student.id, {
                currentClassId: targetClassId,
            });

            if (!updateStudentRes.success) {
                toast.error(t("common.error"));
                setIsTransferring(false);
                return;
            }

            // 2. Add student to target class's students array (if not already included)
            const targetStudents = targetClass?.students || [];
            if (!targetStudents.includes(student.id)) {
                await client.updateClass(targetClassId, {
                    students: [...targetStudents, student.id],
                });
            }

            // Note: As decided, we DO NOT remove the student from the old class's students array,
            // to preserve the historical roll / attendance record of the previous / archived class.

            // 3. If requested, batch create evaluations for target class exercises
            if (initializeExercises && missingTargetExercises.length > 0) {
                const newEvaluations = missingTargetExercises.map(ex => ({
                    studentId: student.id,
                    exerciseId: ex!.id,
                    performanceValue: "",
                    score: 0,
                    comments: "",
                }));

                await client.createEvaluationsBatch(newEvaluations);
            }

            toast.success(t("dialogs.transferStudent.transferSuccess"));

            await Promise.all([refreshClasses(), refreshStudents()]);

            setTargetClassId("");
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error transferring student:", error);
            toast.error(t("common.error"));
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <ArrowRightLeft className="h-4 w-4" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold">
                                {t("dialogs.transferStudent.title")}
                            </DialogTitle>
                            <DialogDescription className="text-xs mt-0.5">
                                {t("dialogs.transferStudent.desc")}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Student Current Info */}
                    <div className="p-3 rounded-lg border bg-muted/30 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                            <User className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm text-foreground truncate">
                                {student.firstName} {student.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                                <span>{t("dialogs.transferStudent.currentClass")}:</span>
                                <Badge variant="secondary" className="text-[11px] h-4.5 px-1.5">
                                    {currentClass ? `${currentClass.className} (${currentClass.schoolYear || "N/A"})` : "N/A"}
                                </Badge>
                                {currentClass?.isArchived && (
                                    <Badge variant="outline" className="text-[9px] h-4 text-muted-foreground">
                                        {t("classes.isArchivedBadge")}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Target Class Selection */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                            {t("dialogs.transferStudent.targetClass")} <span className="text-destructive">*</span>
                        </Label>
                        <Select value={targetClassId} onValueChange={setTargetClassId}>
                            <SelectTrigger className="w-full text-xs">
                                <SelectValue placeholder={t("dialogs.transferStudent.selectTargetClass")} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableClasses.length === 0 ? (
                                    <div className="p-2 text-xs text-muted-foreground text-center">
                                        {t("classes.noClassFound")}
                                    </div>
                                ) : (
                                    availableClasses.map(cls => (
                                        <SelectItem key={cls.id} value={cls.id} className="text-xs">
                                            {cls.className} {cls.schoolYear ? `(${cls.schoolYear})` : ""} • {cls.students?.length || 0} {t("dashboard.studentsCount")}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Exercise initialization option */}
                    {targetClass && missingTargetExercises.length > 0 && (
                        <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
                            <div className="flex items-start gap-2">
                                <Checkbox
                                    id="init-exercises"
                                    checked={initializeExercises}
                                    onCheckedChange={(checked) => setInitializeExercises(Boolean(checked))}
                                    className="mt-0.5"
                                />
                                <label htmlFor="init-exercises" className="text-xs text-foreground cursor-pointer font-medium">
                                    {missingTargetExercises.length} {t("classes.assignedExercises")}
                                </label>
                            </div>
                            <div className="text-[11px] text-muted-foreground pl-6">
                                <span className="font-semibold text-foreground/80">
                                    {missingTargetExercises.map(e => e?.name).join(", ")}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Historical Preservation Notice */}
                    <div className="p-2.5 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-300 flex items-start gap-2">
                        <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                        <div className="space-y-1">
                            <span>
                                {t("dialogs.transferStudent.desc")}
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={isTransferring}
                    >
                        {t("common.cancel")}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleTransfer}
                        disabled={!targetClassId || isTransferring}
                        className="gap-1.5"
                    >
                        {isTransferring ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                {t("common.loading")}
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {t("dialogs.transferStudent.transferBtn")}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

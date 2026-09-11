import { useState, useMemo, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useSchoolData, useClient } from "@/provider/clientProvider";
import { useSettings, getCurrentSchoolYearLabel } from "@/provider/settingsProvider";
import { SchoolClass, SchoolClassExpanded, Student } from "@/types/types";
import { GraduationCap, Loader2, UserX } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

interface PromoteClassDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sourceClass: SchoolClass | SchoolClassExpanded | null;
    onSuccess?: (newClassId: string) => void;
}

// Helper to auto-suggest the next year class name (e.g. 1A -> 2A, 2 B -> 3 B)
function suggestNextClassName(name: string): string {
    if (!name) return "";
    const match = name.trim().match(/^(\d+)(.*)$/);
    if (match) {
        const nextNum = parseInt(match[1], 10) + 1;
        return `${nextNum}${match[2]}`;
    }
    return `${name} (Next Year)`;
}

export function PromoteClassDialog({
    open,
    onOpenChange,
    sourceClass,
    onSuccess,
}: PromoteClassDialogProps) {
    const { t } = useTranslation();
    const client = useClient();
    const navigate = useNavigate();
    const { students: allStudents, archiveClass, refreshClasses, refreshStudents } = useSchoolData();
    const { settings } = useSettings();

    const startMonth = settings.schoolYearStartMonth ?? 9;
    const startDay = settings.schoolYearStartDay ?? 1;
    const defaultSchoolYear = getCurrentSchoolYearLabel(startMonth, startDay);

    const [newClassName, setNewClassName] = useState<string>("");
    const [newSchoolYear, setNewSchoolYear] = useState<string>("");
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [archiveOldClass, setArchiveOldClass] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Get the students belonging to sourceClass
    const classStudents = useMemo(() => {
        if (!sourceClass) return [];
        if (sourceClass.students && sourceClass.students.length > 0 && typeof sourceClass.students[0] === "object") {
            return sourceClass.students as Student[];
        }
        const studentIdSet = new Set((sourceClass.students as string[]) || []);
        return allStudents.filter(s => studentIdSet.has(s.id) || s.currentClassId === sourceClass.id);
    }, [sourceClass, allStudents]);

    // Reset and initialize fields when opening
    useEffect(() => {
        if (open && sourceClass) {
            setNewClassName(suggestNextClassName(sourceClass.className));
            setNewSchoolYear(defaultSchoolYear);
            setSelectedStudentIds(classStudents.map(s => s.id));
            setArchiveOldClass(true);
        }
    }, [open, sourceClass, defaultSchoolYear, classStudents.length]);

    if (!sourceClass) return null;

    const toggleStudent = (id: string) => {
        setSelectedStudentIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedStudentIds.length === classStudents.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(classStudents.map(s => s.id));
        }
    };

    const excludedCount = classStudents.length - selectedStudentIds.length;

    const handlePromote = async () => {
        if (!newClassName.trim()) {
            toast.error(t("dialogs.promoteClass.newClassName"));
            return;
        }
        if (selectedStudentIds.length === 0) {
            toast.error(t("dialogs.promoteClass.studentsSelection"));
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Create the new class
            const createRes = await client.createClass({
                className: newClassName.trim(),
                schoolYear: newSchoolYear.trim() || defaultSchoolYear,
            });

            if (!createRes.success || !createRes.data?.classId) {
                toast.error(t("common.error"));
                setIsSubmitting(false);
                return;
            }

            const newClassId = createRes.data.classId;

            // 2. Assign selected students to the new class
            // Update the students' currentClassId
            for (const studentId of selectedStudentIds) {
                await client.updateStudent(studentId, {
                    currentClassId: newClassId,
                });
            }

            // Update the new class's students array
            await client.updateClass(newClassId, {
                students: selectedStudentIds,
            });

            // 3. Optionally archive the source class
            if (archiveOldClass) {
                await archiveClass(sourceClass.id);
            }

            await Promise.all([refreshClasses(), refreshStudents()]);

            toast.success(t("classes.promoteSuccess"));

            onOpenChange(false);
            if (onSuccess) {
                onSuccess(newClassId);
            } else {
                navigate(`/classes/${newClassId}`);
            }
        } catch (error) {
            console.error("Error promoting class:", error);
            toast.error(t("common.error"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-3 border-b">
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base sm:text-lg font-bold">
                                {t("dialogs.promoteClass.title")}
                            </DialogTitle>
                            <DialogDescription className="text-xs mt-0.5">
                                {t("dialogs.promoteClass.desc")} (
                                <strong className="text-foreground">{sourceClass.className}</strong>).
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                    {/* Class Name & School Year Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="newClassName" className="text-xs font-semibold">
                                {t("dialogs.promoteClass.newClassName")} <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="newClassName"
                                value={newClassName}
                                onChange={e => setNewClassName(e.target.value)}
                                placeholder="es. 2A"
                                className="h-9 text-xs"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="newSchoolYear" className="text-xs font-semibold">
                                {t("dialogs.promoteClass.newSchoolYear")}
                            </Label>
                            <Input
                                id="newSchoolYear"
                                value={newSchoolYear}
                                onChange={e => setNewSchoolYear(e.target.value)}
                                placeholder="es. 2025/2026"
                                className="h-9 text-xs font-mono"
                            />
                        </div>
                    </div>

                    {/* Students Selection List */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="font-semibold text-foreground">
                                    {t("dialogs.promoteClass.studentsSelection")}
                                </span>
                                <span className="text-muted-foreground ml-1.5">
                                    ({selectedStudentIds.length}/{classStudents.length})
                                </span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[11px] px-2 text-primary"
                                onClick={handleSelectAll}
                            >
                                {selectedStudentIds.length === classStudents.length ? t("common.deselectAll") : t("common.selectAll")}
                            </Button>
                        </div>

                        {excludedCount > 0 && (
                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                <UserX className="h-4 w-4 shrink-0" />
                                <span>
                                    {t("dialogs.promoteClass.excludedCount", { count: excludedCount })}
                                </span>
                            </div>
                        )}

                        <div className="rounded-lg border divide-y max-h-52 overflow-y-auto">
                            {classStudents.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground text-xs">
                                    {t("classes.noStudentsInClass")}
                                </div>
                            ) : (
                                classStudents.map((s: Student) => {
                                    const isSelected = selectedStudentIds.includes(s.id);
                                    return (
                                        <label
                                            key={s.id}
                                            className={`flex items-center justify-between p-2.5 hover:bg-muted/40 cursor-pointer transition-colors ${
                                                !isSelected ? "bg-muted/20 opacity-75" : ""
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => toggleStudent(s.id)}
                                                />
                                                <div className="min-w-0">
                                                    <span className={`font-medium truncate block ${!isSelected ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                                        {s.lastName} {s.firstName}
                                                    </span>
                                                    {s.gender && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {t("students.gender")}: {s.gender}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="shrink-0 ml-2">
                                                {isSelected ? (
                                                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20">
                                                        {settings.language === 'en' ? 'Promoted' : 'Promosso'}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-300 bg-rose-50/50 dark:bg-rose-950/20">
                                                        {settings.language === 'en' ? 'Excluded / Retained' : 'Bocciato / Escluso'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Archive source class checkbox */}
                    <div className="p-3 rounded-lg border bg-muted/30 flex items-start gap-2.5">
                        <Checkbox
                            id="archiveOldClass"
                            checked={archiveOldClass}
                            onCheckedChange={c => setArchiveOldClass(Boolean(c))}
                            className="mt-0.5"
                        />
                        <div className="min-w-0">
                            <label htmlFor="archiveOldClass" className="font-semibold text-foreground cursor-pointer block">
                                {t("dialogs.promoteClass.archiveOld")} ({sourceClass.className})
                            </label>
                            <p className="text-muted-foreground text-[11px] mt-0.5">
                                {t("classes.archiveConfirmDesc")}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 sm:p-6 pt-3 border-t gap-2 sm:gap-0 bg-muted/10">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        {t("common.cancel")}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handlePromote}
                        disabled={isSubmitting || !newClassName.trim() || selectedStudentIds.length === 0}
                        className="gap-1.5"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                {t("common.loading")}
                            </>
                        ) : (
                            <>
                                <GraduationCap className="h-4 w-4" />
                                {t("dialogs.promoteClass.promoteBtn")} ({selectedStudentIds.length})
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

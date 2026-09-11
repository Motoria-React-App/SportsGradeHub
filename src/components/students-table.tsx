import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreHorizontal, Pencil, Trash2, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Student } from "@/types/types";
import { useDateFormatter } from "@/hooks/useDateFormatter";
import { useTranslation } from "@/hooks/useTranslation";

interface StudentsTableProps {
    students: Student[];
    onEdit?: (student: Student) => void;
    onTransfer?: (student: Student) => void;
    onDelete?: (student: Student) => void;
    showCheckboxes?: boolean;
    showNotes?: boolean;
    showYearAverage?: boolean;
    getYearAverage?: (studentId: string) => number | null;
    getClassName?: (classId: string) => string;
    isOverLimit?: (student: Student) => boolean;
    getJustificationsCount?: (student: Student) => number;
    maxJustifications?: number;
    selectedStudents?: Set<string>;
    onToggleSelect?: (studentId: string) => void;
    onToggleSelectAll?: () => void;
}

export function StudentsTable({
    students,
    onEdit,
    onTransfer,
    onDelete,
    showCheckboxes = false,
    showNotes = false,
    showYearAverage = false,
    getYearAverage,
    getClassName,
    isOverLimit,
    getJustificationsCount,
    maxJustifications,
    selectedStudents = new Set(),
    onToggleSelect,
    onToggleSelectAll,
}: StudentsTableProps) {
    const navigate = useNavigate();
    const { formatDate } = useDateFormatter();
    const { t } = useTranslation();

    const allSelected = selectedStudents.size === students.length && students.length > 0;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {showCheckboxes && (
                        <TableHead className="w-12 text-center">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={onToggleSelectAll}
                            />
                        </TableHead>
                    )}
                    <TableHead className={`${showCheckboxes ? '' : 'pl-4'}`}>{t("students.firstName")}</TableHead>
                    <TableHead>{t("students.lastName")}</TableHead>
                    <TableHead>{t("students.gender")}</TableHead>
                    {getClassName && <TableHead>{t("classes.studentsTab")}</TableHead>}
                    <TableHead>{t("students.birthdate")}</TableHead>
                    {showNotes && <TableHead>{t("common.notes")}</TableHead>}
                    {showYearAverage && <TableHead>{t("students.averageGrade")}</TableHead>}
                    <TableHead className="text-right pr-4">{t("common.actions")}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {students.length > 0 ? (
                    students.map((student) => {
                        const isSelected = selectedStudents.has(student.id);
                        const yearAvg = getYearAverage ? getYearAverage(student.id) : null;
                        const overLimit = isOverLimit ? isOverLimit(student) : false;

                        return (
                            <TableRow
                                key={student.id}
                                className={cn(
                                    "cursor-pointer hover:bg-muted/50",
                                    isSelected && "bg-muted/30"
                                )}
                                onClick={() => navigate(`/students/${student.id}`)}
                            >
                                {showCheckboxes && (
                                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => onToggleSelect?.(student.id)}
                                        />
                                    </TableCell>
                                )}
                                <TableCell className={`font-medium ${showCheckboxes ? '' : 'pl-4'}`}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                            {student.firstName[0]}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {student.firstName}
                                            {overLimit && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <AlertTriangle className="h-4 w-4 text-destructive" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>
                                                                {t("students.maxJustificationsReached")}
                                                                {getJustificationsCount && maxJustifications &&
                                                                    ` (${getJustificationsCount(student)}/${maxJustifications})`
                                                                }
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{student.lastName}</TableCell>
                                <TableCell>
                                    <span className={cn(
                                        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                        student.gender === 'M' && "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                        student.gender === 'F' && "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
                                        !student.gender && "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                                    )}>
                                    {student.gender === 'M' ? t("students.male") : student.gender === 'F' ? t("students.female") : t("common.na")}
                                    </span>
                                </TableCell>
                                {getClassName && (
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                                            {getClassName(student.currentClassId)}
                                        </span>
                                    </TableCell>
                                )}
                                <TableCell className="text-sm text-muted-foreground">
                                    {student.birthdate ? formatDate(student.birthdate) : "-"}
                                </TableCell>
                                {showNotes && (
                                    <TableCell className="max-w-[150px]">
                                        {student.notes ? (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="text-xs text-muted-foreground truncate cursor-help">
                                                            {student.notes}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        <p>{student.notes}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                )}
                                {showYearAverage && (
                                    <TableCell>
                                        {yearAvg !== null ? (
                                            <span className={cn(
                                                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                                                yearAvg >= 6
                                                    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                            )}>
                                                {yearAvg.toFixed(1)}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">{t("common.na")}</span>
                                        )}
                                    </TableCell>
                                )}
                                <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {onEdit && (
                                                <DropdownMenuItem onSelect={() => onEdit(student)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    {t("common.edit")}
                                                </DropdownMenuItem>
                                            )}
                                            {onTransfer && (
                                                <DropdownMenuItem onSelect={() => onTransfer(student)}>
                                                    <ArrowRightLeft className="mr-2 h-4 w-4 text-primary" />
                                                    {t("classes.transferStudent")}
                                                </DropdownMenuItem>
                                            )}
                                            {(onEdit || onTransfer) && onDelete && <DropdownMenuSeparator />}
                                            {onDelete && (
                                                <DropdownMenuItem
                                                    onSelect={(e) => {
                                                        e.preventDefault();
                                                        onDelete(student);
                                                    }}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    {t("common.delete")}
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })
                ) : (
                    <TableRow>
                        <TableCell
                            colSpan={
                                (showCheckboxes ? 1 : 0) +
                                5 +
                                (getClassName ? 1 : 0) +
                                (showNotes ? 1 : 0) +
                                (showYearAverage ? 1 : 0)
                            }
                            className="h-24 text-center text-muted-foreground"
                        >
                            {t("students.noStudents")}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

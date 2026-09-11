import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Archive, Medal, Award } from "lucide-react";
import { ExerciseRecordsSummary, StudentRecordItem } from "@/utils/record-utils";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface ExerciseRecordBannerProps {
    records: ExerciseRecordsSummary | null;
    className?: string;
    onViewDetail?: () => void;
}

/**
 * Reusable student name component with shadcn Tooltip for long names.
 * Truncates gracefully with a subtle dotted underline and shows full details on hover.
 */
function StudentNameTooltip({
    name,
    className,
    studentClass,
    schoolYear,
    isArchived,
    maxWidthClass = "max-w-[200px] sm:max-w-[260px] lg:max-w-[320px]",
}: {
    name: string;
    className?: string;
    studentClass?: string;
    schoolYear?: string;
    isArchived?: boolean;
    maxWidthClass?: string;
}) {
    const { t } = useTranslation();

    return (
        <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
                <span
                    tabIndex={0}
                    className={cn(
                        "font-semibold text-foreground/95 truncate cursor-help inline-block align-bottom underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 hover:decoration-foreground hover:text-foreground transition-colors",
                        maxWidthClass,
                        className
                    )}
                >
                    {name}
                </span>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className="bg-popover text-popover-foreground border border-border shadow-xl rounded-lg p-2.5 max-w-xs z-50 text-left"
            >
                <div className="space-y-1">
                    <p className="font-bold text-xs text-foreground tracking-tight">
                        {name}
                    </p>
                    {(studentClass || schoolYear) && (
                        <p className="text-[11px] text-muted-foreground leading-normal flex items-center gap-1.5 flex-wrap">
                            <span>{t("banners.records.classLabel")} <strong className="text-foreground font-semibold">{studentClass}</strong></span>
                            {schoolYear && <span>• {t("banners.records.yearLabel")} {schoolYear}</span>}
                            {isArchived && (
                                <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">
                                    {t("banners.records.archivedBadge")}
                                </span>
                            )}
                        </p>
                    )}
                </div>
            </TooltipContent>
        </Tooltip>
    );
}

export function ExerciseRecordBanner({ records, className }: ExerciseRecordBannerProps) {
    const { t } = useTranslation();
    const [detailOpen, setDetailOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"male" | "female">("male");

    if (!records) return null;

    const { male, female, exerciseName, hasHistoricalData } = records;

    const renderRankMedal = (index: number) => {
        if (index === 0) return <span className="text-base leading-none">🥇</span>;
        if (index === 1) return <span className="text-base leading-none">🥈</span>;
        if (index === 2) return <span className="text-base leading-none">🥉</span>;
        return <span className="text-xs font-bold text-muted-foreground w-5 text-center">{index + 1}°</span>;
    };

    return (
        <>
            <Card className={cn("border bg-card shadow-xs overflow-hidden", className)}>
                <CardContent className="p-3 sm:p-3.5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Header info */}
                        <div className="flex items-center gap-2.5 shrink-0">
                            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <Trophy className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        {t("banners.records.historicalRecords")}
                                    </span>
                                    {hasHistoricalData && (
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] h-4.5 px-1.5 font-normal text-muted-foreground gap-1 bg-muted/60"
                                        >
                                            <Archive className="h-2.5 w-2.5" />
                                            {t("banners.records.historicalIncluded")}
                                        </Badge>
                                    )}
                                </div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs cursor-default">
                                            {exerciseName}
                                        </h4>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        <p className="font-semibold text-xs">{exerciseName}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>

                        {/* Gender Record Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 max-w-3xl">
                            {/* Male Record */}
                            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-muted/30 min-w-0">
                                <div className="h-6 w-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                                    ♂
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline gap-1.5 flex-wrap">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                            {t("students.male")}
                                        </span>
                                        {male.record ? (
                                            <>
                                                <span className="font-bold text-xs sm:text-sm text-foreground">
                                                    {male.record.displayPerformance}
                                                </span>
                                                {!male.record.displayPerformance.startsWith("Voto") && male.record.score > 0 && (
                                                    <span className="text-[10px] text-muted-foreground font-medium">
                                                        ({t("banners.records.gradeLabel")} {male.record.score}/10)
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-[11px] text-muted-foreground italic">{t("banners.records.noRecord")}</span>
                                        )}
                                    </div>
                                    {male.record && (
                                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5 min-w-0">
                                            <StudentNameTooltip
                                                name={male.record.studentName}
                                                studentClass={male.record.className}
                                                schoolYear={male.record.schoolYear}
                                                isArchived={male.record.isArchived}
                                                maxWidthClass="max-w-[180px] sm:max-w-[240px] lg:max-w-[280px]"
                                            />
                                            <span className="text-muted-foreground/60 shrink-0">•</span>
                                            <span className="shrink-0">{male.record.className} {male.record.schoolYear}</span>
                                            {male.record.isArchived && (
                                                <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 text-muted-foreground border-border shrink-0">
                                                    {t("banners.records.archivedBadge")}
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Female Record */}
                            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-muted/30 min-w-0">
                                <div className="h-6 w-6 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center shrink-0">
                                    ♀
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline gap-1.5 flex-wrap">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                            {t("students.female")}
                                        </span>
                                        {female.record ? (
                                            <>
                                                <span className="font-bold text-xs sm:text-sm text-foreground">
                                                    {female.record.displayPerformance}
                                                </span>
                                                {!female.record.displayPerformance.startsWith("Voto") && female.record.score > 0 && (
                                                    <span className="text-[10px] text-muted-foreground font-medium">
                                                        ({t("banners.records.gradeLabel")} {female.record.score}/10)
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-[11px] text-muted-foreground italic">{t("banners.records.noRecord")}</span>
                                        )}
                                    </div>
                                    {female.record && (
                                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5 min-w-0">
                                            <StudentNameTooltip
                                                name={female.record.studentName}
                                                studentClass={female.record.className}
                                                schoolYear={female.record.schoolYear}
                                                isArchived={female.record.isArchived}
                                                maxWidthClass="max-w-[180px] sm:max-w-[240px] lg:max-w-[280px]"
                                            />
                                            <span className="text-muted-foreground/60 shrink-0">•</span>
                                            <span className="shrink-0">{female.record.className} {female.record.schoolYear}</span>
                                            {female.record.isArchived && (
                                                <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 text-muted-foreground border-border shrink-0">
                                                    {t("banners.records.archivedBadge")}
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action button */}
                        <div className="flex items-center justify-end shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1.5 font-medium hover:bg-muted"
                                onClick={() => setDetailOpen(true)}
                            >
                                <Medal className="h-3.5 w-3.5 text-amber-500" />
                                <span>{t("banners.records.detailsBtn")}</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Record Modal */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <Trophy className="h-4 w-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-base sm:text-lg font-bold">
                                    {t("banners.records.dialogTitle", { name: exerciseName })}
                                </DialogTitle>
                                <DialogDescription className="text-xs mt-0.5">
                                    {t("banners.records.dialogDesc")}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "male" | "female")} className="mt-2">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="male" className="text-xs gap-1.5">
                                <span className="text-blue-500 font-bold">♂</span> {t("banners.records.maleCategory")}
                                {male.record && <Badge variant="secondary" className="text-[10px] ml-1 h-4">{male.topList.length}</Badge>}
                            </TabsTrigger>
                            <TabsTrigger value="female" className="text-xs gap-1.5">
                                <span className="text-rose-500 font-bold">♀</span> {t("banners.records.femaleCategory")}
                                {female.record && <Badge variant="secondary" className="text-[10px] ml-1 h-4">{female.topList.length}</Badge>}
                            </TabsTrigger>
                        </TabsList>

                        {/* ============= MALE TAB ============= */}
                        <TabsContent value="male" className="space-y-4 pt-3">
                            {male.record ? (
                                <>
                                    {/* All-time best card */}
                                    <div className="p-4 rounded-xl border bg-muted/30 relative">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                                <span>{t("banners.records.maleAbsoluteRecord")}</span>
                                            </div>
                                            {male.record.isArchived && (
                                                <Badge variant="outline" className="text-[10px] h-4.5 font-normal">
                                                    {t("banners.records.archivedBadge")}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                                            <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                                                {male.record.displayPerformance}
                                            </span>
                                            {!male.record.displayPerformance.startsWith("Voto") && male.record.score > 0 && (
                                                <span className="text-sm font-semibold text-muted-foreground">
                                                    ({t("banners.records.gradeLabel")} {male.record.score}/10)
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
                                            <span className="font-semibold text-foreground text-sm sm:text-base break-words">
                                                {male.record.studentName}
                                            </span>
                                            <span>•</span>
                                            <span>{t("banners.records.classLabel")} {male.record.className}</span>
                                            <span>•</span>
                                            <span>{t("banners.records.yearLabel")} {male.record.schoolYear}</span>
                                        </div>
                                    </div>

                                    {/* Top 5 list */}
                                    <div>
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                                            <Award className="h-3.5 w-3.5" />
                                            {t("banners.records.top5Male")}
                                        </h4>
                                        <div className="rounded-lg border overflow-hidden divide-y">
                                            {male.topList.map((item, idx) => (
                                                <div
                                                    key={item.studentId}
                                                    className="p-3 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                                                        {renderRankMedal(idx)}
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-sm flex items-center gap-1.5">
                                                                <StudentNameTooltip
                                                                    name={item.studentName}
                                                                    studentClass={item.className}
                                                                    schoolYear={item.schoolYear}
                                                                    isArchived={item.isArchived}
                                                                    maxWidthClass="max-w-[180px] sm:max-w-xs md:max-w-md"
                                                                    className="text-sm"
                                                                />
                                                                {item.isArchived && (
                                                                    <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 text-muted-foreground shrink-0">
                                                                        {t("banners.records.archivedBadge")}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                <span>{t("banners.records.classLabel")} {item.className}</span>
                                                                <span>•</span>
                                                                <span>{item.schoolYear}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="font-bold text-sm text-foreground">
                                                            {item.displayPerformance}
                                                        </div>
                                                        {!item.displayPerformance.startsWith("Voto") && item.score > 0 && (
                                                            <div className="text-[11px] text-muted-foreground">
                                                                {t("banners.records.gradeLabel")} {item.score}/10
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Historical summary stats */}
                                    <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                                        <div className="p-2.5 rounded-lg bg-muted/30 border">
                                            <div className="text-muted-foreground text-[10px]">{t("banners.records.avgPerformance")}</div>
                                            <div className="font-bold text-sm mt-0.5">
                                                {male.averagePerformance !== null && records.unit !== 'qualitativo'
                                                    ? `${male.averagePerformance} ${records.unit}`
                                                    : "-"}
                                            </div>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-muted/30 border">
                                            <div className="text-muted-foreground text-[10px]">{t("banners.records.avgGrades")}</div>
                                            <div className="font-bold text-sm mt-0.5">
                                                {male.averageScore > 0 ? `${male.averageScore}/10` : "-"}
                                            </div>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-muted/30 border">
                                            <div className="text-muted-foreground text-[10px]">{t("banners.records.testedCount")}</div>
                                            <div className="font-bold text-sm mt-0.5">
                                                {male.totalEvaluations} ({t("banners.records.historicalEvaluationsCount", { count: male.archivedEvaluationsCount })})
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="py-8 text-center text-muted-foreground text-xs">
                                    {t("banners.records.noEvaluationsMale")}
                                </div>
                            )}
                        </TabsContent>

                        {/* ============= FEMALE TAB ============= */}
                        <TabsContent value="female" className="space-y-4 pt-3">
                            {female.record ? (
                                <>
                                    {/* All-time best card */}
                                    <div className="p-4 rounded-xl border bg-muted/30 relative">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                                                <span>{t("banners.records.femaleAbsoluteRecord")}</span>
                                            </div>
                                            {female.record.isArchived && (
                                                <Badge variant="outline" className="text-[10px] h-4.5 font-normal">
                                                    {t("banners.records.archivedBadge")}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                                            <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                                                {female.record.displayPerformance}
                                            </span>
                                            {!female.record.displayPerformance.startsWith("Voto") && female.record.score > 0 && (
                                                <span className="text-sm font-semibold text-muted-foreground">
                                                    ({t("banners.records.gradeLabel")} {female.record.score}/10)
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
                                            <span className="font-semibold text-foreground text-sm sm:text-base break-words">
                                                {female.record.studentName}
                                            </span>
                                            <span>•</span>
                                            <span>{t("banners.records.classLabel")} {female.record.className}</span>
                                            <span>•</span>
                                            <span>{t("banners.records.yearLabel")} {female.record.schoolYear}</span>
                                        </div>
                                    </div>

                                    {/* Top 5 list */}
                                    <div>
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                                            <Award className="h-3.5 w-3.5" />
                                            {t("banners.records.top5Female")}
                                        </h4>
                                        <div className="rounded-lg border overflow-hidden divide-y">
                                            {female.topList.map((item, idx) => (
                                                <div
                                                    key={item.studentId}
                                                    className="p-3 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                                                        {renderRankMedal(idx)}
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-sm flex items-center gap-1.5">
                                                                <StudentNameTooltip
                                                                    name={item.studentName}
                                                                    studentClass={item.className}
                                                                    schoolYear={item.schoolYear}
                                                                    isArchived={item.isArchived}
                                                                    maxWidthClass="max-w-[180px] sm:max-w-xs md:max-w-md"
                                                                    className="text-sm"
                                                                />
                                                                {item.isArchived && (
                                                                    <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 text-muted-foreground shrink-0">
                                                                        {t("banners.records.archivedBadge")}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                <span>{t("banners.records.classLabel")} {item.className}</span>
                                                                <span>•</span>
                                                                <span>{item.schoolYear}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="font-bold text-sm text-foreground">
                                                            {item.displayPerformance}
                                                        </div>
                                                        {!item.displayPerformance.startsWith("Voto") && item.score > 0 && (
                                                            <div className="text-[11px] text-muted-foreground">
                                                                {t("banners.records.gradeLabel")} {item.score}/10
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Historical summary stats */}
                                    <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                                        <div className="p-2.5 rounded-lg bg-muted/30 border">
                                            <div className="text-muted-foreground text-[10px]">{t("banners.records.avgPerformance")}</div>
                                            <div className="font-bold text-sm mt-0.5">
                                                {female.averagePerformance !== null && records.unit !== 'qualitativo'
                                                    ? `${female.averagePerformance} ${records.unit}`
                                                    : "-"}
                                            </div>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-muted/30 border">
                                            <div className="text-muted-foreground text-[10px]">{t("banners.records.avgGrades")}</div>
                                            <div className="font-bold text-sm mt-0.5">
                                                {female.averageScore > 0 ? `${female.averageScore}/10` : "-"}
                                            </div>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-muted/30 border">
                                            <div className="text-muted-foreground text-[10px]">{t("banners.records.testedCount")}</div>
                                            <div className="font-bold text-sm mt-0.5">
                                                {female.totalEvaluations} ({t("banners.records.historicalEvaluationsCount", { count: female.archivedEvaluationsCount })})
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="py-8 text-center text-muted-foreground text-xs">
                                    {t("banners.records.noEvaluationsFemale")}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </>
    );
}

/**
 * Compact inline badge to show in the grading panel for a specific student's gender
 */
export function ExerciseGenderRecordBadge({
    recordItem,
    gender,
}: {
    recordItem: StudentRecordItem | null;
    gender: "M" | "F" | "N";
}) {
    const { t } = useTranslation();
    if (!recordItem) return null;

    const isFemale = gender === "F";
    const label = isFemale ? t("banners.records.femaleRecord") : t("banners.records.maleRecord");
    const symbol = isFemale ? "♀" : "♂";
    const badgeColor = isFemale
        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
        : "bg-blue-500/10 text-blue-600 dark:text-blue-400";

    return (
        <div className="p-2.5 rounded-lg border bg-muted/30 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn("h-6 w-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0", badgeColor)}>
                    {symbol}
                </div>
                <div className="leading-tight min-w-0">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            {label}:
                        </span>
                        <span className="font-bold text-foreground">
                            {recordItem.displayPerformance}
                        </span>
                        {!recordItem.displayPerformance.startsWith("Voto") && recordItem.score > 0 && (
                            <span className="text-[10px] text-muted-foreground font-medium">
                                ({t("banners.records.gradeLabel")} {recordItem.score}/10)
                            </span>
                        )}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5 min-w-0">
                        <StudentNameTooltip
                            name={recordItem.studentName}
                            studentClass={recordItem.className}
                            schoolYear={recordItem.schoolYear}
                            isArchived={recordItem.isArchived}
                            maxWidthClass="max-w-[180px] sm:max-w-[240px]"
                        />
                        <span className="text-muted-foreground/60 shrink-0">•</span>
                        <span className="shrink-0">{recordItem.className} {recordItem.schoolYear}</span>
                        {recordItem.isArchived && (
                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 text-muted-foreground border-border shrink-0">
                                {t("banners.records.archivedBadge")}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
            <Trophy className="h-4 w-4 text-amber-500 shrink-0 ml-1" />
        </div>
    );
}

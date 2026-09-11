import { useNavigate, useSearchParams } from "react-router-dom";
import { useSettings, SchoolPeriod } from "@/provider/settingsProvider";
import { useSchedule, DAYS_ORDER, DAY_LABELS } from "@/provider/scheduleProvider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClient } from "@/provider/clientProvider";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    HelpCircle,
    LogOut,
    Moon,
    Palette,
    Settings as SettingsIcon,
    Sun,
    User,
    Database,
    FileText,
    Download,
    RefreshCw,
    Trash2,
    ArrowLeft,
    Clock,
    Plus,
    Calendar,
    AlertTriangle,
    Languages,
    CheckCircle2,
    Archive,
    ClipboardCheck,
    RotateCcw,
    GraduationCap,
} from "lucide-react";
import { useSchoolData } from "@/provider/clientProvider";
import { useExport } from "@/hooks/useExport";
import { useDateFormatter } from "@/hooks/useDateFormatter";
import type { DayOfWeek } from "@/types/scheduleTypes";
import { useState, useRef } from "react";
import * as XLSX from 'xlsx';

import { toast } from "sonner";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { pageTransition, slideUp } from "@/lib/motion";
import { useTranslation } from "@/hooks/useTranslation";

export default function Settings() {
    const { settings, updateSettings, clearCache, resetSettings, lastSync } = useSettings();
    const { schedule, addSlot, removeSlot, getSlotsByDay, resetSchedule, importSchedule } = useSchedule();
    const { classes, activeClasses, archivedClasses, unarchiveClass, archiveClassesBatch } = useSchoolData();
    const { theme, setTheme } = useTheme();
    const client = useClient();
    const user = client.UserModel;
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "grading";
    const { t } = useTranslation();
    const { exportAllEvaluations, exportAllStudents } = useExport();
    const { formatDate } = useDateFormatter()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Year-end archive state
    const [selectedYearToArchive, setSelectedYearToArchive] = useState<string>('');
    const [batchArchiveConfirmOpen, setBatchArchiveConfirmOpen] = useState(false);
    const [isBatchArchiving, setIsBatchArchiving] = useState(false);

    const activeList = activeClasses || classes.filter(c => !c.isArchived);
    const archivedList = archivedClasses || classes.filter(c => c.isArchived);

    const activeSchoolYears = Array.from(
        new Set(activeList.map(c => c.schoolYear).filter(Boolean))
    ).sort().reverse();

    const classesInSelectedYear = selectedYearToArchive
        ? activeList.filter(c => c.schoolYear === selectedYearToArchive)
        : [];

    // Graduated / Quinte class settings state
    const [newPrefixInput, setNewPrefixInput] = useState('');
    const prefixes = settings.graduatedClassPrefixes || ["5"];

    const handleAddPrefix = () => {
        const trimmed = newPrefixInput.trim();
        if (!trimmed) return;
        if (prefixes.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
            toast.info("Prefisso già presente");
            return;
        }
        updateSettings({ graduatedClassPrefixes: [...prefixes, trimmed] });
        setNewPrefixInput('');
        toast.success(`Prefisso "${trimmed}" aggiunto`);
    };

    const handleRemovePrefix = (prefixToRemove: string) => {
        if (prefixes.length <= 1) {
            toast.error("È necessario mantenere almeno un prefisso");
            return;
        }
        const updated = prefixes.filter(p => p !== prefixToRemove);
        updateSettings({ graduatedClassPrefixes: updated });
        toast.success(`Prefisso "${prefixToRemove}" rimosso`);
    };

    const handleResetBannerToday = () => {
        localStorage.removeItem("sportsgrade_newyear_dismissed_date");
        toast.success("Promemoria ripristinato: sarà visibile nella Dashboard");
    };

    const matchingGraduatingClasses = activeList.filter(c => {
        const name = c.className.trim().toLowerCase();
        return prefixes.some(p => name.startsWith(p.trim().toLowerCase()));
    });

    const handleBatchArchiveYear = async () => {
        if (!selectedYearToArchive || classesInSelectedYear.length === 0) return;
        setIsBatchArchiving(true);
        try {
            const classIds = classesInSelectedYear.map(c => c.id);
            const ok = await archiveClassesBatch(classIds);
            if (ok) {
                toast.success(`Archiviate con successo ${classIds.length} classi dell'anno scolastico ${selectedYearToArchive}`);
                setSelectedYearToArchive('');
            } else {
                toast.error("Alcune classi non sono state archiviate correttamente");
            }
        } catch {
            toast.error("Errore durante l'archiviazione di fine anno");
        } finally {
            setIsBatchArchiving(false);
            setBatchArchiveConfirmOpen(false);
        }
    };

    const handleUnarchiveSingleClass = async (classId: string, className: string) => {
        try {
            const ok = await unarchiveClass(classId);
            if (ok) {
                toast.success(`Classe "${className}" ripristinata tra le classi attive`);
            } else {
                toast.error("Errore durante il ripristino della classe");
            }
        } catch {
            toast.error("Errore durante il ripristino della classe");
        }
    };

    // State for adding new slot
    const [newSlotDay, setNewSlotDay] = useState<DayOfWeek>('lunedi');
    const [newSlotStart, setNewSlotStart] = useState('08:00');
    const [newSlotEnd, setNewSlotEnd] = useState('09:00');
    const [newSlotClass, setNewSlotClass] = useState(classes[0]?.id || '');
    const [isExporting, setIsExporting] = useState(false);

    // Account details state
    const [firstName, setFirstName] = useState(user?.user.displayName?.split(' ')?.[0] || "");
    const [lastName, setLastName] = useState(user?.user.displayName?.split(' ')?.[1] || "");
    // const [isRecalculating, setIsRecalculating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                processImportedSchedule(data);
            } catch (error) {
                console.error("Error parsing file", error);
                toast.error("Errore durante la lettura del file. Verifica il formato.");
            }
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const processImportedSchedule = (data: any[]) => {
        if (!data || data.length === 0) {
            toast.warning("Il file sembra vuoto.");
            return;
        }

        const newSlots: any[] = [];
        let errors = 0;

        // Helper to normalize day
        const normalizeDay = (d: string): DayOfWeek | null => {
            if (!d) return null;
            const str = d.toString().toLowerCase().trim();
            if (str.includes('lun')) return 'lunedi';
            if (str.includes('mar')) return 'martedi';
            if (str.includes('mer')) return 'mercoledi';
            if (str.includes('gio')) return 'giovedi';
            if (str.includes('ven')) return 'venerdi';
            if (str.includes('sab')) return 'sabato';
            return null;
        };

        // Helper to format time HH:MM
        const formatTime = (t: any): string | null => {
            if (!t) return null;

            // Excel decimal time handle (e.g. 0.3333 for 8:00)
            if (typeof t === 'number') {
                const totalSeconds = Math.round(t * 86400);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }

            const str = t.toString().trim();
            // Check if matches HH:MM
            if (/^\d{1,2}:\d{2}$/.test(str)) {
                return str.padStart(5, '0');
            }
            return null;
        };

        data.forEach((row, index) => {
            // Flexible keys: Giorno, Day, Start, Inizio, End, Fine, Class, Classe
            const dayRaw = row['Giorno'] || row['Day'] || row['giorno'] || row['day'];
            const startRaw = row['Inizio'] || row['Start'] || row['inizio'] || row['start'] || row['Ora Inizio'];
            const endRaw = row['Fine'] || row['End'] || row['fine'] || row['end'] || row['Ora Fine'];
            const classRaw = row['Classe'] || row['Class'] || row['classe'] || row['class'];

            const day = normalizeDay(dayRaw);
            const start = formatTime(startRaw);
            const end = formatTime(endRaw);

            let classId = null;
            if (classRaw) {
                const classStr = classRaw.toString().trim();
                const foundClass = classes.find(c => c.className.toLowerCase() === classStr.toLowerCase());
                if (foundClass) {
                    classId = foundClass.id;
                }
            }

            if (day && start && end && classId) {
                newSlots.push({
                    id: `import_${Date.now()}_${index}`,
                    dayOfWeek: day,
                    startTime: start,
                    endTime: end,
                    classId: classId
                });
            } else {
                console.warn(`Row ${index + 1} skipped/invalid:`, row);
                errors++;
            }
        });

        if (newSlots.length > 0) {
            if (confirm(`Trovati ${newSlots.length} slot validi. ${errors > 0 ? `(${errors} righe ignorate)` : ''} Vuoi sovrascrivere l'orario attuale?`)) {
                importSchedule(newSlots);
                toast.success("Orario importato con successo!");
            }
        } else {
            toast.error("Nessuno slot valido trovato nel file. Controlla le intestazioni (Giorno, Inizio, Fine, Classe).");
        }
    };

    const downloadTemplate = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [
            ["Giorno", "Ora Inizio", "Ora Fine", "Classe"],
            ["Lunedi", "08:00", "09:00", classes[0]?.className || "1A"],
            ["Martedi", "10:00", "11:00", classes[1]?.className || "2B"],
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Modello Orario");
        XLSX.writeFile(wb, "modello_orario.xlsx");
    };


    // State for adding new period
    const [newPeriodName, setNewPeriodName] = useState('');
    const [newPeriodStart, setNewPeriodStart] = useState('');
    const [newPeriodEnd, setNewPeriodEnd] = useState('');

    const handleAddSlot = () => {
        if (newSlotStart && newSlotEnd && newSlotClass) {
            addSlot({
                dayOfWeek: newSlotDay,
                startTime: newSlotStart,
                endTime: newSlotEnd,
                classId: newSlotClass,
            });
        }
    };

    const handleDateChange = (value: string, setter: (val: string) => void) => {
        // Remove non-digit characters
        let val = value.replace(/\D/g, '');

        // Limit length
        if (val.length > 8) val = val.slice(0, 8);

        // Add slashes
        if (val.length > 4) {
            val = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4);
        } else if (val.length > 2) {
            val = val.slice(0, 2) + '/' + val.slice(2);
        }

        setter(val);
    };

    const handleAddPeriod = () => {
        if (newPeriodName && newPeriodStart.length === 10 && newPeriodEnd.length === 10) {
            // Convert DD/MM/YYYY to YYYY-MM-DD for storage
            const [startDay, startMonth, startYear] = newPeriodStart.split('/');
            const [endDay, endMonth, endYear] = newPeriodEnd.split('/');

            const isoStartDate = `${startYear}-${startMonth}-${startDay}`;
            const isoEndDate = `${endYear}-${endMonth}-${endDay}`;

            const newPeriod: SchoolPeriod = {
                id: crypto.randomUUID(),
                name: newPeriodName,
                startDate: isoStartDate,
                endDate: isoEndDate,
            };
            updateSettings({
                schoolPeriods: [...settings.schoolPeriods, newPeriod],
            });
            setNewPeriodName('');
            setNewPeriodStart('');
            setNewPeriodEnd('');
        }
    };

    const handleRemovePeriod = (periodId: string) => {
        updateSettings({
            schoolPeriods: settings.schoolPeriods.filter(p => p.id !== periodId),
            currentPeriodId: settings.currentPeriodId === periodId ? null : settings.currentPeriodId,
        });
    };

    // const handleRecalculateGrades = async () => {
    //     if (!confirm("ATTENZIONE: Questa operazione ricalcolerà tutti i voti degli esercizi basati su criteri usando l'impostazione attuale (Punto Base). Vuoi procedere?")) return;

    //     setIsRecalculating(true);
    //     try {
    //         // 1. Deduplicate to find latest evaluations
    //         const latestEvaluations = new Map<string, any>();
    //         evaluations.forEach((ev) => {
    //             const key = `${ev.studentId}-${ev.exerciseId}`;
    //             const existing = latestEvaluations.get(key);
    //             if (!existing || new Date(ev.createdAt) > new Date(existing.createdAt)) {
    //                 latestEvaluations.set(key, ev);
    //             }
    //         });

    //         // 2. Filter for criteria-based exercises
    //         let updatedCount = 0;
    //         const evalsToProcess = Array.from(latestEvaluations.values());

    //         for (const ev of evalsToProcess) {
    //             const ex = exercises.find(e => e.id === ev.exerciseId);
    //             if (!ex) continue;

    //             const maxScore = ex.maxScore || 10;
    //             let newScore = 0;
    //             let shouldUpdate = false;

    //             if (ex.evaluationType === 'criteria' && ex.evaluationCriteria) {
    //                 // Criteria-based calculation
    //                 let criteriaScores: Record<string, number> = {};
    //                 try {
    //                     criteriaScores = JSON.parse(ev.performanceValue || '{}');
    //                 } catch (e) { continue; }

    //                 const totalMax = ex.evaluationCriteria.reduce((sum, c) => sum + c.maxScore, 0);
    //                 const totalScored = ex.evaluationCriteria.reduce((sum, c) => sum + (criteriaScores[c.name] || 0), 0);

    //                 if (settings.enableBasePoint) {
    //                     const percentage = totalMax > 0 ? totalScored / totalMax : 0;
    //                     newScore = 1 + (percentage * (maxScore - 1));
    //                 } else {
    //                     newScore = totalMax > 0 ? (totalScored / totalMax) * maxScore : 0;
    //                 }
    //                 shouldUpdate = true;
    //             } else if (ex.evaluationType === 'range' && ex.evaluationRanges) {
    //                 // Range-based calculation
    //                 // Need student gender
    //                 const student = students.find(s => s.id === ev.studentId);
    //                 if (!student) continue;

    //                 const performanceNum = parseFloat(ev.performanceValue);
    //                 if (isNaN(performanceNum)) continue;

    //                 const ranges = ex.evaluationRanges[student.gender] || ex.evaluationRanges['M'];
    //                 if (!ranges) continue;

    //                 let rawScore: number | null = null;
    //                 for (const range of ranges) {
    //                     if (performanceNum >= range.min && performanceNum <= range.max) {
    //                         rawScore = range.score;
    //                         break;
    //                     }
    //                 }

    //                 if (rawScore !== null) {
    //                     if (settings.enableBasePoint) {
    //                         const percentage = maxScore > 0 ? rawScore / maxScore : 0;
    //                         newScore = 1 + (percentage * (maxScore - 1));
    //                     } else {
    //                         newScore = rawScore;
    //                     }
    //                     shouldUpdate = true;
    //                 }
    //             }

    //             if (shouldUpdate) {
    //                 newScore = Math.round(newScore * 10) / 10;

    //                 if (Math.abs(newScore - ev.score) > 0.01) {
    //                     await client.createEvaluation({
    //                         studentId: ev.studentId,
    //                         exerciseId: ev.exerciseId,
    //                         performanceValue: ev.performanceValue,
    //                         score: newScore,
    //                         comments: ev.comments,
    //                         criteriaScores: (ev as any).criteriaScores
    //                     });
    //                     updatedCount++;
    //                 }
    //             }
    //         }

    //         if (updatedCount > 0) {
    //             await refreshEvaluations();
    //             toast.success(`Aggiornati ${updatedCount} voti con successo.`);
    //         } else {
    //             toast.info("Nessun voto necessitava di aggiornamento.");
    //         }
    //     } catch (error) {
    //         console.error("Error recalculating grades:", error);
    //         toast.error("Errore durante il ricalcolo dei voti.");
    //     } finally {
    //         setIsRecalculating(false);
    //     }
    // };



    return (
        <motion.div
            className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10 max-w-6xl mx-auto w-full"
            variants={pageTransition}
            initial="hidden"
            animate="visible"
        >
            <motion.div
                className="flex items-center gap-4"
                variants={slideUp}
            >
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="grid w-full gap-2">
                    <h1 className="text-3xl font-semibold">{t("settings.title")}</h1>
                    <p className="text-muted-foreground">
                        {t("settings.subtitle")}
                    </p>
                </div>
            </motion.div>

            <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })} className="flex flex-col md:flex-row gap-8 items-start">
                <aside className="w-full md:w-[250px] shrink-0">
                    <TabsList className="flex flex-col h-auto w-full justify-start gap-1 bg-transparent p-0">
                        <TabsTrigger
                            value="grading"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <FileText className="h-4 w-4" />
                            {t("settings.tabs.grading")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="display"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <Palette className="h-4 w-4" />
                            {t("settings.tabs.display")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="schedule"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <Calendar className="h-4 w-4" />
                            {t("settings.tabs.schedule")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="justifications"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <AlertTriangle className="h-4 w-4" />
                            {t("settings.tabs.justifications")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="export"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <Download className="h-4 w-4" />
                            {t("settings.tabs.export")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="data"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <Database className="h-4 w-4" />
                            {t("settings.tabs.data")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="account"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <User className="h-4 w-4" />
                            {t("settings.tabs.account")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="language"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <Languages className="h-4 w-4" />
                            {t("settings.tabs.language")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="about"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <HelpCircle className="h-4 w-4" />
                            {t("settings.tabs.about")}
                        </TabsTrigger>
                    </TabsList>
                </aside>

                <div className="flex-1 w-full space-y-6">
                    {/* Grading Settings */}
                    <TabsContent value="grading" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">{t("settings.grading.title")}</h2>
                            <p className="text-sm text-muted-foreground">{t("settings.grading.desc")}</p>
                        </div>
                        <Separator />

                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings.grading.criteriaTitle")}</CardTitle>
                                <CardDescription>{t("settings.grading.criteriaDesc")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">{t("settings.grading.passingGrade")}</Label>
                                        <p className="text-sm text-muted-foreground">{t("settings.grading.passingGradeDesc")}</p>
                                    </div>
                                    <Select
                                        value={settings.passingGrade.toString()}
                                        onValueChange={(val) => updateSettings({ passingGrade: parseFloat(val) })}
                                    >
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder={t("common.select")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5.5">5.5</SelectItem>
                                            <SelectItem value="6">6.0</SelectItem>
                                            <SelectItem value="6.5">6.5</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">{t("settings.grading.roundingMode")}</Label>
                                        <p className="text-sm text-muted-foreground">{t("settings.grading.roundingModeDesc")}</p>
                                    </div>
                                    <Select
                                        value={settings.roundingMode}
                                        onValueChange={(val: any) => updateSettings({ roundingMode: val })}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder={t("common.select")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="nearest">{t("settings.grading.nearest")}</SelectItem>
                                            <SelectItem value="up">{t("settings.grading.up")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings.grading.showDecimals")}</CardTitle>
                                <CardDescription>{t("settings.grading.desc")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="show-decimals" className="text-base">{t("settings.grading.showDecimals")}</Label>
                                        <p className="text-sm text-muted-foreground">{t("settings.grading.showDecimalsDesc")}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Switch
                                            id="show-decimals"
                                            checked={settings.showDecimals}
                                            onCheckedChange={(checked) => updateSettings({ showDecimals: checked })}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="highlight-fail" className="text-base">{t("settings.grading.highlightFailing")}</Label>
                                        <p className="text-sm text-muted-foreground">{t("settings.grading.highlightFailingDesc")}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Switch
                                            id="highlight-fail"
                                            checked={settings.highlightFailing}
                                            onCheckedChange={(checked) => updateSettings({ highlightFailing: checked })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings.grading.exerciseGroups")}</CardTitle>
                                <CardDescription>{t("settings.grading.exerciseGroupsDesc")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="enable-groups" className="text-base">{t("settings.grading.exerciseGroups")}</Label>
                                        <p className="text-sm text-muted-foreground">{t("settings.grading.exerciseGroupsDesc")}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Switch
                                            id="enable-groups"
                                            checked={settings.enableExerciseGroups}
                                            onCheckedChange={(checked) => updateSettings({ enableExerciseGroups: checked })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Display Settings */}
                    <TabsContent value="display" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">{t("settings.display.title")}</h2>
                            <p className="text-sm text-muted-foreground">{t("settings.display.desc")}</p>
                        </div>
                        <Separator />

                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings.display.themeTitle")}</CardTitle>
                                <CardDescription>{t("settings.display.themeDesc")}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4 max-w-sm">
                                    <Button
                                        variant={theme === "light" ? "default" : "outline"}
                                        className="flex flex-col gap-2 h-auto py-4"
                                        onClick={() => setTheme("light")}
                                    >
                                        <Sun className="h-6 w-6" />
                                        <span>{t("settings.display.lightTheme")}</span>
                                    </Button>
                                    <Button
                                        variant={theme === "dark" ? "default" : "outline"}
                                        className="flex flex-col gap-2 h-auto py-4"
                                        onClick={() => setTheme("dark")}
                                    >
                                        <Moon className="h-6 w-6" />
                                        <span>{t("settings.display.darkTheme")}</span>
                                    </Button>
                                    <Button
                                        variant={theme === "system" ? "default" : "outline"}
                                        className="flex flex-col gap-2 h-auto py-4"
                                        onClick={() => setTheme("system")}
                                    >
                                        <SettingsIcon className="h-6 w-6" />
                                        <span>{t("settings.display.systemTheme")}</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings.display.title")}</CardTitle>
                                <CardDescription>{t("settings.display.desc")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">{t("settings.display.defaultView")}</Label>
                                        <p className="text-sm text-muted-foreground">{t("settings.display.defaultViewDesc")}</p>
                                    </div>
                                    <Select
                                        value={settings.defaultView}
                                        onValueChange={(val: any) => updateSettings({ defaultView: val })}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder={t("common.select")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dashboard">{t("settings.display.views.dashboard")}</SelectItem>
                                            <SelectItem value="valutazioni">{t("settings.display.views.valutazioni")}</SelectItem>
                                            <SelectItem value="exercises">{t("settings.display.views.exercises")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="collapsible-classes" className="text-base">{t("settings.display.collapsibleClasses")}</Label>
                                        <p className="text-sm text-muted-foreground">{t("settings.display.collapsibleClassesDesc")}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Switch
                                            id="collapsible-classes"
                                            checked={settings.collapsibleClasses}
                                            onCheckedChange={(checked) => updateSettings({ collapsibleClasses: checked })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Schedule Settings */}
                    <TabsContent value="schedule" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">{t("settings.schedule.title")}</h2>
                            <p className="text-sm text-muted-foreground">{t("settings.schedule.desc")}</p>
                        </div>
                        <Separator />


                        {/* Import/Export Schedule */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings.schedule.importSchedule")} / {t("settings.schedule.exportSchedule")}</CardTitle>
                                <CardDescription>{t("settings.export.optionsDesc")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept=".csv,.xlsx,.xls"
                                    />
                                    <Button variant="outline" onClick={handleImportClick}>
                                        <Download className="h-4 w-4 mr-2 rotate-180" />
                                        {t("settings.schedule.importSchedule")}
                                    </Button>
                                    <Button variant="secondary" onClick={downloadTemplate}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        {t("settings.export.downloadFile")}
                                    </Button>
                                </div>
                                <div className="text-sm text-muted-foreground p-3 bg-secondary/30 rounded-md border border-secondary">
                                    <p className="font-medium mb-1">{t("common.details")}:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>{settings.language === 'en' ? "Use the template to ensure the formatting is correct." : "Usa il modello per assicurarti che il formato sia corretto."}</li>
                                        <li>{settings.language === 'en' ? "Required columns: Day, Start Time, End Time, Class." : "Le colonne richieste sono: Giorno, Ora Inizio, Ora Fine, Classe."}</li>
                                        <li>{settings.language === 'en' ? "Class names must match exactly with those in the system." : "I nomi delle classi devono corrispondere esattamente a quelli nel sistema."}</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Add new slot */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings.schedule.addSlot")}</CardTitle>
                                <CardDescription>{t("settings.schedule.desc")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t("settings.schedule.day")}</Label>
                                        <Select value={newSlotDay} onValueChange={(val) => setNewSlotDay(val as DayOfWeek)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DAYS_ORDER.map((day) => (
                                                    <SelectItem key={day} value={day}>{t(`days.${day}`)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t("settings.schedule.startTime")}</Label>
                                        <Input
                                            type="time"
                                            value={newSlotStart}
                                            onChange={(e) => setNewSlotStart(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t("settings.schedule.endTime")}</Label>
                                        <Input
                                            type="time"
                                            value={newSlotEnd}
                                            onChange={(e) => setNewSlotEnd(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t("settings.schedule.selectClass")}</Label>
                                        <Select value={newSlotClass} onValueChange={setNewSlotClass}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classes.map((cls) => (
                                                    <SelectItem key={cls.id} value={cls.id}>{cls.className}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button onClick={handleAddSlot} className="w-full md:w-auto">
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t("settings.schedule.addSlotBtn")}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Current schedule by day */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("dashboard.weeklySchedule")}</CardTitle>
                                <CardDescription>{schedule.length} {settings.language === 'en' ? "lessons scheduled" : "lezioni programmate"}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {DAYS_ORDER.map((day) => {
                                    const daySlots = getSlotsByDay(day);
                                    if (daySlots.length === 0) return null;

                                    return (
                                        <div key={day} className="space-y-2">
                                            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                                                {t(`days.${day}`)}
                                            </h4>
                                            <div className="grid gap-2">
                                                {daySlots.map((slot) => {
                                                    const classInfo = classes.find(c => c.id === slot.classId);
                                                    return (
                                                        <div
                                                            key={slot.id}
                                                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                                  <Clock className="h-4 w-4" />
                                                                  {slot.startTime} - {slot.endTime}
                                                                </div>
                                                                <div className="font-medium">
                                                                    {classInfo?.className || slot.classId}
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeSlot(slot.id)}
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}

                                {schedule.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>{t("dashboard.noSchedule")}</p>
                                        <p className="text-sm">{t("dashboard.noScheduleDesc")}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Reset schedule */}
                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="text-destructive">{t("settings.schedule.resetSchedule")}</CardTitle>
                                <CardDescription>{t("settings.schedule.confirmResetSchedule")}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="destructive" onClick={resetSchedule}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    {t("settings.schedule.resetSchedule")}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Justifications Settings */}
                    <TabsContent value="justifications" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">{t("settings.justifications.title")}</h2>
                            <p className="text-sm text-muted-foreground">{t("settings.justifications.desc")}</p>
                        </div>
                        <Separator />

                        {/* Max Justifications */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings.justifications.limitsTitle")}</CardTitle>
                                <CardDescription>{t("settings.justifications.maxJustificationsDesc")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">{t("settings.justifications.maxJustifications")}</Label>
                                        <p className="text-sm text-muted-foreground">{t("settings.justifications.limitsDesc")}</p>
                                    </div>
                                    <Select
                                        value={settings.maxJustifications.toString()}
                                        onValueChange={(val) => updateSettings({ maxJustifications: parseInt(val) })}
                                    >
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder={t("common.select")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                                <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Add new period */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings.justifications.addPeriod")}</CardTitle>
                                <CardDescription>{t("settings.justifications.periodsDesc")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t("settings.justifications.periodName")}</Label>
                                        <Input
                                            placeholder={settings.language === 'en' ? "e.g. 1st Semester" : "es. Trimestre"}
                                            value={newPeriodName}
                                            onChange={(e) => setNewPeriodName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t("settings.justifications.startDate")}</Label>
                                        <Input
                                            type="text"
                                            placeholder="GG/MM/AAAA"
                                            value={newPeriodStart}
                                            onChange={(e) => handleDateChange(e.target.value, setNewPeriodStart)}
                                            maxLength={10}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t("settings.justifications.endDate")}</Label>
                                        <Input
                                            type="text"
                                            placeholder="GG/MM/AAAA"
                                            value={newPeriodEnd}
                                            onChange={(e) => handleDateChange(e.target.value, setNewPeriodEnd)}
                                            maxLength={10}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button onClick={handleAddPeriod} className="w-full" disabled={!newPeriodName || newPeriodStart.length !== 10 || newPeriodEnd.length !== 10}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            {t("common.add")}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Current periods */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings.justifications.periodsTitle")}</CardTitle>
                                <CardDescription>
                                    {settings.schoolPeriods.length} {settings.language === 'en' ? "periods configured." : "periodi configurati."}
                                    {settings.currentPeriodId && ` ${t("settings.justifications.activePeriod")}: ${settings.schoolPeriods.find(p => p.id === settings.currentPeriodId)?.name || (settings.language === 'en' ? 'None' : 'Nessuno')}`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {settings.schoolPeriods.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>{t("settings.justifications.noPeriods")}</p>
                                        <p className="text-sm">{settings.language === 'en' ? "Add your first period above" : "Aggiungi il tuo primo periodo sopra"}</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {settings.schoolPeriods.map((period) => {
                                            const isActive = settings.currentPeriodId === period.id;
                                            const startFormatted = formatDate(period.startDate);
                                            const endFormatted = formatDate(period.endDate);

                                            return (
                                                <div
                                                    key={period.id}
                                                    className={`flex items-center justify-between p-4 rounded-lg border ${isActive ? 'bg-primary/10 border-primary' : 'bg-secondary/50'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div>
                                                            <div className="font-medium flex items-center gap-2">
                                                                {period.name}
                                                                {isActive && (
                                                                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                                                        {t("classes.activeBadge")}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {startFormatted} - {endFormatted}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemovePeriod(period.id)}
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Export Settings */}
                    <TabsContent value="export" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">{t("settings.export.title")}</h2>
                            <p className="text-sm text-muted-foreground">{t("settings.export.desc")}</p>
                        </div>
                        <Separator />

                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings.export.optionsTitle")}</CardTitle>
                                <CardDescription>{t("settings.export.optionsDesc")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">{t("settings.export.exportFormat")}</Label>
                                        <p className="text-sm text-muted-foreground">{t("settings.export.exportFormatDesc")}</p>
                                    </div>
                                    <Select
                                        value={settings.exportFormat}
                                        onValueChange={(val: any) => updateSettings({ exportFormat: val })}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder={t("common.select")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="csv">CSV (Excel, Sheets)</SelectItem>
                                            <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <Label htmlFor="export-notes" className="flex flex-col justify-start items-start space-y-0.5">
                                        <span>{t("settings.export.includeNotes")}</span>
                                        <span className="font-normal text-sm text-muted-foreground">{t("settings.export.includeNotesDesc")}</span>
                                    </Label>
                                    <Switch
                                        id="export-notes"
                                        checked={settings.includeNotesInExport}
                                        onCheckedChange={(checked) => updateSettings({ includeNotesInExport: checked })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings.export.actionsTitle")}</CardTitle>
                                <CardDescription>{t("settings.export.actionsDesc")}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    disabled={isExporting}
                                    onClick={async () => {
                                        setIsExporting(true);
                                        try {
                                            await exportAllEvaluations();
                                        } finally {
                                            setIsExporting(false);
                                        }
                                    }}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    {isExporting ? t("common.loading") : t("settings.export.exportEvaluations")}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    disabled={isExporting}
                                    onClick={async () => {
                                        setIsExporting(true);
                                        try {
                                            await exportAllStudents();
                                        } finally {
                                            setIsExporting(false);
                                        }
                                    }}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    {isExporting ? t("common.loading") : t("settings.export.exportStudents")}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Data Management */}
                    <TabsContent value="data" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">{t("settings.data.title")}</h2>
                            <p className="text-sm text-muted-foreground">{t("settings.data.desc")}</p>
                        </div>
                        <Separator />

                        <Card>
                            <CardHeader>
                                <CardTitle>{t("settings.data.syncTitle")}</CardTitle>
                                <CardDescription>{t("settings.data.syncDesc")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
                                            <RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{t("settings.data.lastSync")}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {lastSync ? lastSync.toLocaleString() : t("settings.data.neverSynced")}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">{t("settings.data.syncNow")}</Button>
                                </div>

                                <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-4">
                                    <div className="flex">
                                        <div className="shrink-0">
                                            <Database className="h-5 w-5 text-blue-400" aria-hidden="true" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">{settings.language === 'en' ? "Database Status" : "Stato Database"}</h3>
                                            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                                <p>{settings.language === 'en' ? "All data is securely stored locally and synced when online." : "Tutti i dati sono salvati localmente e sincronizzati quando online."}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* New School Year & Graduating Classes Configuration */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-primary" />
                                    {t("settings.data.graduatedTitle")}
                                </CardTitle>
                                <CardDescription>
                                    {t("settings.data.graduatedDesc")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Start Date of the School Year */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3.5 rounded-lg border bg-muted/30">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-semibold">{settings.language === 'en' ? "School Year Start Date" : "Data di Inizio Anno Scolastico"}</Label>
                                        <p className="text-xs text-muted-foreground">
                                            {settings.language === 'en' ? "Date when the new school year reminder banner activates." : "Data in cui scatta l'avviso di inizio anno e il ciclo delle classi nella Dashboard."}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={String(settings.schoolYearStartMonth ?? 9)}
                                            onValueChange={(val) => updateSettings({ schoolYearStartMonth: parseInt(val, 10) })}
                                        >
                                            <SelectTrigger className="w-[140px] bg-background text-xs">
                                                <SelectValue placeholder={settings.language === 'en' ? "Month" : "Mese"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="8">{settings.language === 'en' ? "August" : "Agosto"}</SelectItem>
                                                <SelectItem value="9">{settings.language === 'en' ? "September" : "Settembre"}</SelectItem>
                                                <SelectItem value="10">{settings.language === 'en' ? "October" : "Ottobre"}</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-muted-foreground">{settings.language === 'en' ? "Day:" : "Giorno:"}</span>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={31}
                                                value={settings.schoolYearStartDay ?? 1}
                                                onChange={(e) => {
                                                    const v = parseInt(e.target.value, 10);
                                                    if (!isNaN(v) && v >= 1 && v <= 31) {
                                                        updateSettings({ schoolYearStartDay: v });
                                                    }
                                                }}
                                                className="w-16 h-8 text-xs bg-background"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Prefixes for Graduating Classes */}
                                <div className="space-y-3 p-3.5 rounded-lg border bg-muted/30">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-semibold">{t("settings.data.prefixes")}</Label>
                                        <p className="text-xs text-muted-foreground">
                                            {t("settings.data.graduatedDesc")}
                                        </p>
                                    </div>

                                    {/* Badges list */}
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        {prefixes.map((prefix) => (
                                            <Badge
                                                key={prefix}
                                                variant="secondary"
                                                className="text-xs py-1 px-2.5 gap-1.5 flex items-center bg-background border"
                                            >
                                                <span>{settings.language === 'en' ? "Starts with" : "Inizia con"} "<strong>{prefix}</strong>"</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePrefix(prefix)}
                                                    className="text-muted-foreground hover:text-destructive transition-colors ml-0.5 font-bold"
                                                    title={t("common.remove")}
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>

                                    {/* Add Prefix Input */}
                                    <div className="flex items-center gap-2 pt-1">
                                        <Input
                                            placeholder={t("settings.data.prefixPlaceholder")}
                                            value={newPrefixInput}
                                            onChange={(e) => setNewPrefixInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddPrefix();
                                                }
                                            }}
                                            className="max-w-[220px] h-8 text-xs bg-background"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs gap-1"
                                            onClick={handleAddPrefix}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            {t("common.add")}
                                        </Button>
                                    </div>

                                    {/* Live matching preview */}
                                    <div className="text-xs pt-1 text-muted-foreground border-t mt-2">
                                        {settings.language === 'en' ? "Currently matching active classes: " : "Classi attive attualmente corrispondenti: "}
                                        {matchingGraduatingClasses.length > 0 ? (
                                            <span className="font-semibold text-foreground">
                                                {matchingGraduatingClasses.map(c => c.className).join(", ")} ({matchingGraduatingClasses.length})
                                            </span>
                                        ) : (
                                            <span className="italic">{settings.language === 'en' ? "no active classes match prefix" : "nessuna classe attiva corrisponde ai prefissi"}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Reset prompt button */}
                                <div className="flex items-center justify-between pt-1">
                                    <div className="text-xs text-muted-foreground">
                                        {t("settings.data.resetBannerDesc")}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-8 gap-1.5"
                                        onClick={handleResetBannerToday}
                                    >
                                        <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                                        {t("settings.data.resetBannerBtn")}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Year-End Archiving and Class Archive Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Archive className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    {t("settings.data.yearEndTitle")}
                                </CardTitle>
                                <CardDescription>
                                    {t("settings.data.yearEndDesc")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Batch Archiving by School Year */}
                                <div className="p-4 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="space-y-1">
                                            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                                                {t("settings.data.yearEndTitle")}
                                            </h4>
                                            <p className="text-xs text-muted-foreground">
                                                {t("settings.data.yearEndDesc")}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Select value={selectedYearToArchive} onValueChange={setSelectedYearToArchive}>
                                                <SelectTrigger className="w-[170px] bg-background">
                                                    <SelectValue placeholder={t("settings.data.selectYearToArchive")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {activeSchoolYears.map((year) => {
                                                        const count = activeList.filter(c => c.schoolYear === year).length;
                                                        return (
                                                            <SelectItem key={year} value={year}>
                                                                {year} ({count} {count === 1 ? (settings.language === 'en' ? 'class' : 'classe') : (settings.language === 'en' ? 'classes' : 'classi')})
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                disabled={!selectedYearToArchive || classesInSelectedYear.length === 0}
                                                className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                                                onClick={() => setBatchArchiveConfirmOpen(true)}
                                            >
                                                <Archive className="w-4 h-4" />
                                                {t("settings.data.archiveYearBtn")}
                                            </Button>
                                        </div>
                                    </div>

                                    {selectedYearToArchive && classesInSelectedYear.length > 0 && (
                                        <div className="text-xs text-amber-800 dark:text-amber-300 bg-background/70 p-2.5 rounded border border-amber-200/70 dark:border-amber-900/40">
                                            {settings.language === 'en' ? `Classes that will be archived (${classesInSelectedYear.length}): ` : `Classi che verranno archiviate (${classesInSelectedYear.length}): `}
                                            <span className="font-semibold">
                                                {classesInSelectedYear.map(c => c.className).join(", ")}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Archived Classes List */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold flex items-center gap-2">
                                            {settings.language === 'en' ? `Archived Classes (${archivedList.length})` : `Classi Archiviate (${archivedList.length})`}
                                        </h4>
                                        {archivedList.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs gap-1.5 text-primary"
                                                onClick={() => navigate('/valutazioni')}
                                            >
                                                <ClipboardCheck className="w-3.5 h-3.5" />
                                                {t("sidebar.evaluations")}
                                            </Button>
                                        )}
                                    </div>

                                    {archivedList.length === 0 ? (
                                        <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                                            {settings.language === 'en' ? "No archived classes at this time." : "Nessuna classe archiviata al momento."}
                                        </div>
                                    ) : (
                                        <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1">
                                            {archivedList.map((cls) => (
                                                <div
                                                    key={cls.id}
                                                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-muted rounded-md text-muted-foreground">
                                                            <Archive className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-sm flex items-center gap-2">
                                                                {cls.className}
                                                                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted font-mono">
                                                                    {cls.schoolYear}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {cls.students.length} {t("dashboard.studentsCount")} • {cls.exerciseGroups.length} {t("classes.groupExercises")}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs gap-1 h-8"
                                                            onClick={() => navigate(`/classes/${cls.id}`)}
                                                        >
                                                            {t("common.details")}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs gap-1 h-8 text-primary"
                                                            onClick={() => navigate(`/valutazioni/${cls.id}/all`)}
                                                        >
                                                            <ClipboardCheck className="w-3 h-3" />
                                                            {t("sidebar.evaluations")}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-xs gap-1 h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                                            onClick={() => handleUnarchiveSingleClass(cls.id, cls.className)}
                                                        >
                                                            <RotateCcw className="w-3 h-3" />
                                                            {t("common.unarchive")}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="text-destructive">{settings.language === 'en' ? "Danger Zone" : "Zona Pericolosa"}</CardTitle>
                                <CardDescription>{settings.language === 'en' ? "Actions that clear local or cached data." : "Azioni che rimuovono dati locali."}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">{t("settings.data.clearCacheBtn")}</Label>
                                        <p className="text-sm text-muted-foreground">{t("settings.data.cacheDesc")}</p>
                                    </div>
                                    <Button variant="destructive" onClick={clearCache}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {t("settings.data.clearCacheBtn")}
                                    </Button>
                                </div>

                                <Separator />

                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">{t("settings.data.resetSettingsTitle")}</Label>
                                        <p className="text-sm text-muted-foreground">{t("settings.data.resetSettingsDesc")}</p>
                                    </div>
                                    <Button variant="outline" onClick={resetSettings}>
                                        {t("settings.data.resetSettingsBtn")}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Account Settings */}
                    <TabsContent value="account" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">{t("settings.account.title")}</h2>
                            <p className="text-sm text-muted-foreground">{t("settings.account.desc")}</p>
                        </div>
                        <Separator />

                        <Card className="overflow-hidden">
                            <CardHeader className="pb-0">
                                <div className="flex flex-row justify-center items-center gap-6">
                                    <div className="relative group">
                                        <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                                            <AvatarImage src={user?.user.avatar} alt={firstName} />
                                            <AvatarFallback className="text-3xl bg-primary/10 text-primary uppercase font-bold">
                                                {firstName?.[0]}{lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg border border-background opacity-0 group-hover:opacity-100 transition-opacity"
                                            title={t("settings.account.avatar")}
                                        >
                                            <Palette className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex-1 text-center sm:text-left space-y-1">
                                        <h3 className="text-2xl capitalize font-bold tracking-tight">{firstName} {lastName}</h3>
                                        <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                {t("common.activeAccount")}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {t("settings.data.lastSync")} {lastSync ? formatDate(lastSync.toISOString()) : t("common.today")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid gap-6">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName" className="text-sm font-semibold">{t("students.firstName")}</Label>
                                            <Input
                                                id="firstName"
                                                placeholder={t("students.firstName")}
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="bg-secondary/20 focus-visible:ring-primary"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName" className="text-sm font-semibold">{t("students.lastName")}</Label>
                                            <Input
                                                id="lastName"
                                                placeholder={t("students.lastName")}
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="bg-secondary/20 focus-visible:ring-primary"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-semibold">{t("settings.account.email")} ({settings.language === 'en' ? 'Read-only' : 'Non modificabile'})</Label>
                                            <Input
                                                id="email"
                                                value={user?.user.email || ""}
                                                disabled
                                                className="bg-muted/50 cursor-not-allowed border-dashed"
                                            />
                                        </div>
                                    </div>

                                    <Separator className="my-2" />

                                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-100 dark:border-amber-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="space-y-1 text-center sm:text-left">
                                            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">{settings.language === 'en' ? "Account Security" : "Sicurezza Account"}</h4>
                                            <p className="text-xs text-amber-800/70 dark:text-amber-300/60">
                                                {settings.language === 'en' ? "Regular password updates help keep your account secure." : "È consigliabile cambiare la password regolarmente per mantenere l'account sicuro."}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-amber-200 bg-white text-amber-900 hover:bg-amber-50 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200"
                                            onClick={() => toast.info(settings.language === 'en' ? "Password reset feature coming soon" : "Funzionalità di reset password in arrivo")}
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            {settings.language === 'en' ? "Reset Password" : "Reset Password"}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t bg-secondary/10 px-6 py-6">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full sm:w-auto order-2 sm:order-1"
                                    onClick={() => setDeleteDialogOpen(true)}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    {t("sidebar.logout")}
                                </Button>

                                <Button
                                    className="w-full sm:w-auto order-1 sm:order-2 shadow-lg shadow-primary/20"
                                    onClick={() => {
                                        toast.success(t("common.saveChanges"));
                                    }}
                                >
                                    {t("common.saveChanges")}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{settings.language === 'en' ? "Are you sure you want to sign out?" : "Sei sicuro di voler uscire dall'account?"}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t("settings.account.logoutDesc")}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction onClick={async () => {
                                    await client.logout()
                                }} className="bg-destructive hover:bg-destructive/90">
                                    {t("sidebar.logout")}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* About */}
                    <TabsContent value="about" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">{t("settings.about.title")}</h2>
                            <p className="text-sm text-muted-foreground">{t("settings.about.desc")}</p>
                        </div>
                        <Separator />

                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex flex-col items-center text-center space-y-2 py-4">
                                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 overflow-hidden shadow-sm">
                                        <img src="/logoSGH.png" alt="SportsGradeHub Logo" className="h-full w-full object-cover" />
                                    </div>
                                    <h3 className="text-2xl font-bold">{t("settings.about.appName")}</h3>
                                    <p className="text-muted-foreground">{t("settings.about.appVersion")}</p>
                                </div>

                                <div className="grid gap-4 border-t border-b py-4 my-4">
                                    <div className="flex justify-between py-2">
                                        <span className="font-medium">Build</span>
                                        <span className="text-muted-foreground">2025.12.10</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="font-medium">{t("classes.schoolYear")}</span>
                                        <span className="text-muted-foreground">2025/2026</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="font-medium">{settings.language === 'en' ? "License" : "Licenza"}</span>
                                        <span className="text-muted-foreground">-</span>
                                    </div>
                                </div>

                                <div className="text-sm text-center text-muted-foreground">
                                    <p>© 2025 SportsGradeHub. {t("settings.about.copyright")}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Language Settings */}
                    <TabsContent value="language" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">{t("settings.language.title")}</h2>
                            <p className="text-sm text-muted-foreground">{t("settings.language.desc")}</p>
                        </div>
                        <Separator />

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Languages className="h-5 w-5" />
                                    {t("settings.language.selectLanguage")}
                                </CardTitle>
                                <CardDescription>{t("settings.language.desc")}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Italian option */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            updateSettings({ language: "it" });
                                            toast.success(t("settings.language.saved"));
                                        }}
                                        className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-left transition-all duration-200 hover:shadow-md cursor-pointer ${
                                            settings.language === "it"
                                                ? "border-primary bg-primary/5 shadow-sm"
                                                : "border-border bg-card hover:border-primary/50"
                                        }`}
                                    >
                                        {settings.language === "it" && (
                                            <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-primary" />
                                        )}
                                        <span className="text-4xl">🇮🇹</span>
                                        <div className="text-center">
                                            <p className="font-semibold text-sm">{t("settings.language.italian")}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Italiano</p>
                                        </div>
                                    </button>

                                    {/* English option */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            updateSettings({ language: "en" });
                                            toast.success("Language updated successfully!");
                                        }}
                                        className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-left transition-all duration-200 hover:shadow-md cursor-pointer ${
                                            settings.language === "en"
                                                ? "border-primary bg-primary/5 shadow-sm"
                                                : "border-border bg-card hover:border-primary/50"
                                        }`}
                                    >
                                        {settings.language === "en" && (
                                            <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-primary" />
                                        )}
                                        <span className="text-4xl">🇬🇧</span>
                                        <div className="text-center">
                                            <p className="font-semibold text-sm">{t("settings.language.english")}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">English</p>
                                        </div>
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Batch Year Archive Confirmation Dialog */}
            <AlertDialog open={batchArchiveConfirmOpen} onOpenChange={setBatchArchiveConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Archive className="w-5 h-5 text-amber-600" />
                            {settings.language === 'en'
                                ? `Archive all classes from school year ${selectedYearToArchive}?`
                                : `Archiviare tutte le classi dell'anno ${selectedYearToArchive}?`}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                {settings.language === 'en' ? "Will archive " : "Verranno archiviate "}
                                <strong>{classesInSelectedYear.length}</strong> {settings.language === 'en' ? "classes: " : "classi: "}
                                <span className="text-foreground font-medium">
                                    {classesInSelectedYear.map(c => c.className).join(", ")}
                                </span>.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {settings.language === 'en'
                                    ? "Classes will be moved to historical archive and removed from the active classes menu. All grades, evaluations, and student records are preserved for review and comparison. You can restore them at any time."
                                    : "Le classi verranno spostate nell'archivio storico e rimosse dal menu attivo delle lezioni. Tutti i voti, le valutazioni e la storia degli studenti rimarranno intatti per consultazioni e confronti. Potrai ripristinarle in qualunque momento."}
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isBatchArchiving}>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleBatchArchiveYear();
                            }}
                            disabled={isBatchArchiving}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {isBatchArchiving
                                ? (settings.language === 'en' ? "Archiving..." : "Archiviazione in corso...")
                                : (settings.language === 'en' ? "Confirm Year Archive" : "Conferma Archiviazione Anno")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}

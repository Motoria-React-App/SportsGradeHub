import { useNavigate } from "react-router-dom";
import { useSettings, SchoolPeriod } from "@/provider/settingsProvider";
import { useSchedule, DAYS_ORDER, DAY_LABELS } from "@/provider/scheduleProvider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
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

} from "lucide-react";
import { useSchoolData } from "@/provider/clientProvider";
import { useExport } from "@/hooks/useExport";
import { useDateFormatter } from "@/hooks/useDateFormatter";
import type { DayOfWeek } from "@/types/scheduleTypes";
import { useState, useRef } from "react";
import * as XLSX from 'xlsx';

import { toast } from "sonner";
import { IconInnerShadowTop } from "@tabler/icons-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Settings() {
    const { settings, updateSettings, clearCache, resetSettings, lastSync } = useSettings();
    const { schedule, addSlot, removeSlot, getSlotsByDay, resetSchedule, importSchedule } = useSchedule();
    const { classes } = useSchoolData();
    const { theme, setTheme } = useTheme();
    const client = useClient();
    const user = client.UserModel;
    const navigate = useNavigate();
    const { exportAllEvaluations, exportAllStudents } = useExport();
    const { formatDate } = useDateFormatter()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10 max-w-6xl mx-auto w-full">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="grid w-full gap-2">
                    <h1 className="text-3xl font-semibold">Impostazioni</h1>
                    <p className="text-muted-foreground">
                        Gestisci le preferenze dell'applicazione, l'aspetto e l'account.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="grading" className="flex flex-col md:flex-row gap-8 items-start">
                <aside className="w-full md:w-[250px] shrink-0">
                    <TabsList className="flex flex-col h-auto w-full justify-start gap-1 bg-transparent p-0">
                        <TabsTrigger
                            value="grading"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <FileText className="h-4 w-4" />
                            Valutazioni
                        </TabsTrigger>
                        <TabsTrigger
                            value="display"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <Palette className="h-4 w-4" />
                            Visualizzazione
                        </TabsTrigger>
                        <TabsTrigger
                            value="schedule"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <Calendar className="h-4 w-4" />
                            Orario
                        </TabsTrigger>
                        <TabsTrigger
                            value="justifications"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <AlertTriangle className="h-4 w-4" />
                            Giustifiche
                        </TabsTrigger>
                        <TabsTrigger
                            value="export"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <Download className="h-4 w-4" />
                            Esportazione
                        </TabsTrigger>
                        <TabsTrigger
                            value="data"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <Database className="h-4 w-4" />
                            Gestione Dati
                        </TabsTrigger>
                        <TabsTrigger
                            value="account"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <User className="h-4 w-4" />
                            Account
                        </TabsTrigger>
                        <TabsTrigger
                            value="about"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <HelpCircle className="h-4 w-4" />
                            Informazioni
                        </TabsTrigger>
                    </TabsList>
                </aside>

                <div className="flex-1 w-full space-y-6">
                    {/* Grading Settings */}
                    <TabsContent value="grading" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">Preferenze Valutazioni</h2>
                            <p className="text-sm text-muted-foreground">Configura come vengono calcolati e visualizzati i voti.</p>
                        </div>
                        <Separator />

                        <Card>
                            <CardHeader>
                                <CardTitle>Criteri di Valutazione</CardTitle>
                                <CardDescription>Definisci i parametri per i voti e le medie.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Voto Minimo (Sufficienza)</Label>
                                        <p className="text-sm text-muted-foreground">La soglia per considerare una prova sufficiente.</p>
                                    </div>
                                    <Select
                                        value={settings.passingGrade.toString()}
                                        onValueChange={(val) => updateSettings({ passingGrade: parseFloat(val) })}
                                    >
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder="Seleziona" />
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
                                        <Label className="text-base">Arrotondamento</Label>
                                        <p className="text-sm text-muted-foreground">Come arrotondare le medie dei voti finali.</p>
                                    </div>
                                    <Select
                                        value={settings.roundingMode}
                                        onValueChange={(val: any) => updateSettings({ roundingMode: val })}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Seleziona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="nearest">Matematico (0.5)</SelectItem>
                                            <SelectItem value="up">Per eccesso</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* <Separator />

                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Punto Base (1-10)</Label>
                                        <p className="text-sm text-muted-foreground">Abilita il sistema di voto con base 1 (1 punto base + max 9 punti).</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleRecalculateGrades}
                                            disabled={isRecalculating}
                                            title="Ricalcola tutti i voti degli esercizi a criteri in base all'impostazione attuale"
                                        >
                                            {isRecalculating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                                            Ricalcola Voti
                                        </Button>
                                        <Switch
                                            checked={settings.enableBasePoint}
                                            onCheckedChange={(checked) => updateSettings({ enableBasePoint: checked })}
                                        />
                                    </div>
                                </div>
                                */}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Visualizzazione voti</CardTitle>
                                <CardDescription>Come appaiono i voti nell'interfaccia.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="show-decimals" className="text-base">Mostra decimali</Label>
                                        <p className="text-sm text-muted-foreground">Visualizza i voti con cifre decimali (es. 7.5).</p>
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
                                        <Label htmlFor="highlight-fail" className="text-base">Evidenzia insufficienze</Label>
                                        <p className="text-sm text-muted-foreground">Mostra i voti insufficienti in rosso.</p>
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
                                <CardTitle>Gruppi Esercizi</CardTitle>
                                <CardDescription>Abilita l'organizzazione degli esercizi in gruppi tematici.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="enable-groups" className="text-base">Abilita Gruppi Esercizi</Label>
                                        <p className="text-sm text-muted-foreground">Organizza gli esercizi in gruppi per disciplina, livello o categoria. Quando disabilitato, gli esercizi non richiederanno l'assegnazione a un gruppo. Le assegnazioni esistenti verranno preservate.</p>
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
                            <h2 className="text-xl font-semibold">Visualizzazione</h2>
                            <p className="text-sm text-muted-foreground">Personalizza l'aspetto dell'applicazione.</p>
                        </div>
                        <Separator />

                        <Card>
                            <CardHeader>
                                <CardTitle>Tema</CardTitle>
                                <CardDescription>Scegli il tema dell'interfaccia.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4 max-w-sm">
                                    <Button
                                        variant={theme === "light" ? "default" : "outline"}
                                        className="flex flex-col gap-2 h-auto py-4"
                                        onClick={() => setTheme("light")}
                                    >
                                        <Sun className="h-6 w-6" />
                                        <span>Chiaro</span>
                                    </Button>
                                    <Button
                                        variant={theme === "dark" ? "default" : "outline"}
                                        className="flex flex-col gap-2 h-auto py-4"
                                        onClick={() => setTheme("dark")}
                                    >
                                        <Moon className="h-6 w-6" />
                                        <span>Scuro</span>
                                    </Button>
                                    <Button
                                        variant={theme === "system" ? "default" : "outline"}
                                        className="flex flex-col gap-2 h-auto py-4"
                                        onClick={() => setTheme("system")}
                                    >
                                        <SettingsIcon className="h-6 w-6" />
                                        <span>Sistema</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Interfaccia Utente</CardTitle>
                                <CardDescription>Opzioni generali di visualizzazione.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Pagina Iniziale</Label>
                                        <p className="text-sm text-muted-foreground">La pagina da mostrare dopo il login.</p>
                                    </div>
                                    <Select
                                        value={settings.defaultView}
                                        onValueChange={(val: any) => updateSettings({ defaultView: val })}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Seleziona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dashboard">Dashboard</SelectItem>
                                            <SelectItem value="valutazioni">Valutazioni</SelectItem>
                                            <SelectItem value="exercises">Esercizi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* <Separator /> */}

                                {/* <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Formato Data</Label>
                                        <p className="text-sm text-muted-foreground">Come visualizzare le date.</p>
                                    </div>
                                    <Select
                                        value={settings.dateFormat}
                                        onValueChange={(val: any) => updateSettings({ dateFormat: val })}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Seleziona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DD/MM/YYYY">31/01/2025</SelectItem>
                                            <SelectItem value="YYYY-MM-DD">2025-01-31</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div> */}

                                <Separator />

                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="collapsible-classes" className="text-base">Raggruppa Classi nella sidebar</Label>
                                        <p className="text-sm text-muted-foreground">Mostra le classi in un menu a discesa comprimibile.</p>
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
                            <h2 className="text-xl font-semibold">Orario Settimanale</h2>
                            <p className="text-sm text-muted-foreground">Gestisci l'orario delle lezioni per la pagina di benvenuto.</p>
                        </div>
                        <Separator />


                        {/* Import/Export Schedule */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Importa/Esporta Orario</CardTitle>
                                <CardDescription>Gestisci l'orario massivamente tramite file Excel o CSV.</CardDescription>
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
                                        <Download className="h-4 w-4 mr-2 rotate-180" /> {/* Rotate for upload icon effect or use Upload icon if available */}
                                        Importa da File
                                    </Button>
                                    <Button variant="secondary" onClick={downloadTemplate}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Scarica Modello
                                    </Button>
                                </div>
                                <div className="text-sm text-muted-foreground p-3 bg-secondary/30 rounded-md border border-secondary">
                                    <p className="font-medium mb-1">Istruzioni:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Usa il modello per assicurarti che il formato sia corretto.</li>
                                        <li>Le colonne richieste sono: <strong>Giorno, Ora Inizio, Ora Fine, Classe</strong>.</li>
                                        <li>I nomi delle classi devono corrispondere esattamente a quelli nel sistema.</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Add new slot */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Aggiungi Lezione</CardTitle>
                                <CardDescription>Inserisci un nuovo slot nell'orario settimanale.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>Giorno</Label>
                                        <Select value={newSlotDay} onValueChange={(val) => setNewSlotDay(val as DayOfWeek)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DAYS_ORDER.map((day) => (
                                                    <SelectItem key={day} value={day}>{DAY_LABELS[day]}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ora Inizio</Label>
                                        <Input
                                            type="time"
                                            value={newSlotStart}
                                            onChange={(e) => setNewSlotStart(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ora Fine</Label>
                                        <Input
                                            type="time"
                                            value={newSlotEnd}
                                            onChange={(e) => setNewSlotEnd(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Classe</Label>
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
                                    Aggiungi Slot
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Current schedule by day */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Orario Attuale</CardTitle>
                                <CardDescription>{schedule.length} lezioni programmate</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {DAYS_ORDER.map((day) => {
                                    const daySlots = getSlotsByDay(day);
                                    if (daySlots.length === 0) return null;

                                    return (
                                        <div key={day} className="space-y-2">
                                            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                                                {DAY_LABELS[day]}
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
                                        <p>Nessuna lezione programmata</p>
                                        <p className="text-sm">Aggiungi il tuo primo slot sopra</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Reset schedule */}
                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="text-destructive">Reset Orario</CardTitle>
                                <CardDescription>Ripristina l'orario predefinito di esempio.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="destructive" onClick={resetSchedule}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Ripristina Orario Default
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Justifications Settings */}
                    <TabsContent value="justifications" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">Giustifiche e Periodi</h2>
                            <p className="text-sm text-muted-foreground">Configura la soglia massima di giustifiche e i periodi scolastici.</p>
                        </div>
                        <Separator />

                        {/* Max Justifications */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Soglia Giustifiche</CardTitle>
                                <CardDescription>Numero massimo di giustifiche consentite per periodo. Oltre questa soglia verrà mostrato un avviso.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Massimo Giustifiche</Label>
                                        <p className="text-sm text-muted-foreground">Soglia per periodo scolastico.</p>
                                    </div>
                                    <Select
                                        value={settings.maxJustifications.toString()}
                                        onValueChange={(val) => updateSettings({ maxJustifications: parseInt(val) })}
                                    >
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder="Seleziona" />
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
                                <CardTitle>Aggiungi Periodo Scolastico</CardTitle>
                                <CardDescription>Definisci i periodi dell'anno scolastico (es. Trimestre, Pentamestre).</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nome Periodo</Label>
                                        <Input
                                            placeholder="es. Trimestre"
                                            value={newPeriodName}
                                            onChange={(e) => setNewPeriodName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Data Inizio</Label>
                                        <Input
                                            type="text"
                                            placeholder="GG/MM/AAAA"
                                            value={newPeriodStart}
                                            onChange={(e) => handleDateChange(e.target.value, setNewPeriodStart)}
                                            maxLength={10}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Data Fine</Label>
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
                                            Aggiungi
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Current periods */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Periodi Configurati</CardTitle>
                                <CardDescription>
                                    {settings.schoolPeriods.length} periodi configurati.
                                    {settings.currentPeriodId && ` Periodo attivo: ${settings.schoolPeriods.find(p => p.id === settings.currentPeriodId)?.name || 'Nessuno'}`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {settings.schoolPeriods.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>Nessun periodo configurato</p>
                                        <p className="text-sm">Aggiungi il tuo primo periodo sopra</p>
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
                                                                        Attivo
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
                            <h2 className="text-xl font-semibold">Esportazione</h2>
                            <p className="text-sm text-muted-foreground">Configura come esportare i dati.</p>
                        </div>
                        <Separator />

                        <Card>
                            <CardHeader>
                                <CardTitle>Preferenze Esportazione</CardTitle>
                                <CardDescription>Formati e contenuti per i report.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Formato Predefinito</Label>
                                        <p className="text-sm text-muted-foreground">Il formato file preferito per i download.</p>
                                    </div>
                                    <Select
                                        value={settings.exportFormat}
                                        onValueChange={(val: any) => updateSettings({ exportFormat: val })}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Seleziona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="csv">CSV (Excel, Sheets)</SelectItem>
                                            <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                                            {/* <SelectItem value="pdf">PDF (Documento)</SelectItem> */}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <Label htmlFor="export-notes" className="flex flex-col justify-start items-start space-y-0.5">
                                        <span>Includi Note</span>
                                        <span className="font-normal text-sm text-muted-foreground">Includi i commenti testuali nelle esportazioni.</span>
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
                                <CardTitle>Esportazione Rapida</CardTitle>
                                <CardDescription>Scarica i tuoi dati immediatamente nel formato selezionato ({settings.exportFormat.toUpperCase()}).</CardDescription>
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
                                    {isExporting ? "Esportazione..." : `Esporta tutte le valutazioni`}
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
                                    {isExporting ? "Esportazione..." : `Esporta elenco studenti completo`}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Data Management */}
                    <TabsContent value="data" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">Gestione Dati</h2>
                            <p className="text-sm text-muted-foreground">Gestisci la cache locale e la sincronizzazione.</p>
                        </div>
                        <Separator />

                        <Card>
                            <CardHeader>
                                <CardTitle>Sincronizzazione</CardTitle>
                                <CardDescription>Stato della sincronizzazione con il server.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
                                            <RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Ultima sincronizzazione</p>
                                            <p className="text-sm text-muted-foreground">
                                                {lastSync ? lastSync.toLocaleString() : "Mai"}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">Sincronizza Ora</Button>
                                </div>

                                <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-4">
                                    <div className="flex">
                                        <div className="shrink-0">
                                            <Database className="h-5 w-5 text-blue-400" aria-hidden="true" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Stato Database</h3>
                                            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                                <p>Tutti i dati sono salvati localmente e sincronizzati quando online.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="text-destructive">Zona Pericolosa</CardTitle>
                                <CardDescription>Azioni che rimuovono dati locali.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Svuota Cache Locale</Label>
                                        <p className="text-sm text-muted-foreground">Rimuove i dati salvati nel browser. Utile se l'app è lenta.</p>
                                    </div>
                                    <Button variant="destructive" onClick={clearCache}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Svuota Cache
                                    </Button>
                                </div>

                                <Separator />

                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Ripristina Impostazioni</Label>
                                        <p className="text-sm text-muted-foreground">Riporta tutte le impostazioni ai valori predefiniti.</p>
                                    </div>
                                    <Button variant="outline" onClick={resetSettings}>
                                        Ripristina Default
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Account Settings */}
                    <TabsContent value="account" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">Profilo Utente</h2>
                            <p className="text-sm text-muted-foreground">Gestisci le tue informazioni personali e la sicurezza dell'account.</p>
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
                                            title="Cambia avatar"
                                        >
                                            <Palette className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex-1 text-center sm:text-left space-y-1">
                                        <h3 className="text-2xl capitalize font-bold tracking-tight">{firstName} {lastName}</h3>
                                        <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                Account Attivo
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                Ultimo accesso: {lastSync ? formatDate(lastSync.toISOString()) : "Oggi"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid gap-6">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName" className="text-sm font-semibold">Nome</Label>
                                            <Input
                                                id="firstName"
                                                placeholder="Il tuo nome"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="bg-secondary/20 focus-visible:ring-primary"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName" className="text-sm font-semibold">Cognome</Label>
                                            <Input
                                                id="lastName"
                                                placeholder="Il tuo cognome"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="bg-secondary/20 focus-visible:ring-primary"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-semibold">Email (Non modificabile)</Label>
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
                                            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">Sicurezza Account</h4>
                                            <p className="text-xs text-amber-800/70 dark:text-amber-300/60">
                                                È consigliabile cambiare la password regolarmente per mantenere l'account sicuro.
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-amber-200 bg-white text-amber-900 hover:bg-amber-50 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200"
                                            onClick={() => toast.info("Funzionalità di reset password in arrivo")}
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Reset Password
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
                                    Esci dall'Account
                                </Button>

                                <Button
                                    className="w-full sm:w-auto order-1 sm:order-2 shadow-lg shadow-primary/20"
                                    onClick={() => {
                                        // Mock saving
                                        toast.success("Modifiche salvate con successo!");
                                    }}
                                >
                                    Salva Modifiche
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Sei sicuro di voler uscire dall'account?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Sicuro
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction onClick={async () => {
                                    await client.logout()
                                }} className="bg-destructive hover:bg-destructive/90">
                                    Logout
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* About */}
                    <TabsContent value="about" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">Informazioni</h2>
                            <p className="text-sm text-muted-foreground">Dettagli sull'applicazione.</p>
                        </div>
                        <Separator />

                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex flex-col items-center text-center space-y-2 py-4">
                                    <div className="h-16 w-16 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
                                        <IconInnerShadowTop className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-2xl font-bold">SportsGradeHub</h3>
                                    <p className="text-muted-foreground">Versione 1.0.0</p>
                                </div>

                                <div className="grid gap-4 border-t border-b py-4 my-4">
                                    <div className="flex justify-between py-2">
                                        <span className="font-medium">Build</span>
                                        <span className="text-muted-foreground">2025.12.10</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="font-medium">Anno Scolastico</span>
                                        <span className="text-muted-foreground">2025/2026</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="font-medium">Licenza</span>
                                        <span className="text-muted-foreground">-</span>
                                    </div>
                                </div>

                                <div className="text-sm text-center text-muted-foreground">
                                    <p>© 2025 SportsGradeHub. Tutti i diritti riservati.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

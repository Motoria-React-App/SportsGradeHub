import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useSchoolData } from "@/provider/clientProvider";
import { useSettings, getCurrentSchoolYearLabel } from "@/provider/settingsProvider";
import { GraduationCap, Archive, Clock, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const DISMISSED_DATE_KEY = "sportsgrade_newyear_dismissed_date";

export function NewYearBanner() {
    const { activeClasses, archiveClassesBatch, refreshClasses } = useSchoolData();
    const { settings } = useSettings();

    const [isDismissedToday, setIsDismissedToday] = useState<boolean>(() => {
        const todayStr = new Date().toISOString().split("T")[0];
        return localStorage.getItem(DISMISSED_DATE_KEY) === todayStr;
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [isArchiving, setIsArchiving] = useState(false);

    const startMonth = settings.schoolYearStartMonth ?? 9;
    const startDay = settings.schoolYearStartDay ?? 1;
    const prefixes = useMemo(() => {
        const p = settings.graduatedClassPrefixes;
        return Array.isArray(p) && p.length > 0 ? p : ["5"];
    }, [settings.graduatedClassPrefixes]);

    const currentYearLabel = getCurrentSchoolYearLabel(startMonth, startDay);

    // Filter active classes that match the graduated prefixes (case-insensitive)
    const matchingClasses = useMemo(() => {
        return activeClasses.filter(c => {
            const name = c.className.trim().toLowerCase();
            return prefixes.some(prefix => name.startsWith(prefix.trim().toLowerCase()));
        });
    }, [activeClasses, prefixes]);

    // Check if today is on or after the start date of the school year
    const isNewSchoolYearStarted = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        return (currentMonth > startMonth) || (currentMonth === startMonth && currentDay >= startDay);
    }, [startMonth, startDay]);

    // If dismissed for today, or new year hasn't started, or no matching active classes
    if (isDismissedToday || !isNewSchoolYearStarted || matchingClasses.length === 0) {
        return null;
    }

    const handleDismissToday = () => {
        const todayStr = new Date().toISOString().split("T")[0];
        localStorage.setItem(DISMISSED_DATE_KEY, todayStr);
        setIsDismissedToday(true);
        toast.info("Promemoria posticipato a domani");
    };

    const handleOpenModal = () => {
        // Pre-select all matching classes
        setSelectedClassIds(matchingClasses.map(c => c.id));
        setModalOpen(true);
    };

    const toggleClassSelection = (id: string) => {
        setSelectedClassIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedClassIds.length === matchingClasses.length) {
            setSelectedClassIds([]);
        } else {
            setSelectedClassIds(matchingClasses.map(c => c.id));
        }
    };

    const handleConfirmArchive = async () => {
        if (selectedClassIds.length === 0) return;
        setIsArchiving(true);
        try {
            const count = selectedClassIds.length;
            const success = await archiveClassesBatch(selectedClassIds);
            if (success) {
                toast.success(`${count} ${count === 1 ? "classe archiviata" : "classi archiviate"} con successo`);
                await refreshClasses();
                setModalOpen(false);
            } else {
                toast.error("Errore durante l'archiviazione di alcune classi");
            }
        } catch (error) {
            console.error("Error batch archiving classes:", error);
            toast.error("Si è verificato un errore durante l'operazione");
        } finally {
            setIsArchiving(false);
        }
    };

    const classNamesPreview = matchingClasses.map(c => c.className).slice(0, 4).join(", ");
    const remainingCount = matchingClasses.length - 4;

    return (
        <>
            <Card className="border bg-card shadow-xs rounded-xl overflow-hidden mb-6 transition-all">
                <CardContent className="p-3.5 sm:p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                <GraduationCap className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-sm text-foreground">
                                        Inizio Nuovo Anno Scolastico ({currentYearLabel})
                                    </h4>
                                    <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-normal">
                                        Classi Quinte / Terminali
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Sono presenti <strong className="text-foreground">{matchingClasses.length} classi terminali</strong> attive (
                                    {classNamesPreview}
                                    {remainingCount > 0 ? ` e altre ${remainingCount}` : ""}
                                    ) che possono essere archiviate per iniziare il nuovo anno.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-8 text-muted-foreground hover:text-foreground"
                                onClick={handleDismissToday}
                            >
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                Ricordamelo dopo
                            </Button>
                            <Button
                                size="sm"
                                className="text-xs h-8 gap-1.5 font-medium"
                                onClick={handleOpenModal}
                            >
                                <Archive className="h-3.5 w-3.5" />
                                Archivia Classi ({matchingClasses.length})
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Selection & Confirmation Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Archive className="h-4 w-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold">
                                    Archiviazione Classi Terminali
                                </DialogTitle>
                                <DialogDescription className="text-xs mt-0.5">
                                    Seleziona le classi da archiviare per l'inizio dell'anno {currentYearLabel}.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs text-muted-foreground font-medium">
                                Classi corrispondenti ({selectedClassIds.length}/{matchingClasses.length} selezionate)
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[11px] px-2"
                                onClick={handleSelectAll}
                            >
                                {selectedClassIds.length === matchingClasses.length ? "Deseleziona tutte" : "Seleziona tutte"}
                            </Button>
                        </div>

                        <div className="max-h-56 overflow-y-auto rounded-lg border divide-y">
                            {matchingClasses.map(cls => {
                                const isSelected = selectedClassIds.includes(cls.id);
                                return (
                                    <label
                                        key={cls.id}
                                        className="flex items-center justify-between p-2.5 text-xs hover:bg-muted/50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleClassSelection(cls.id)}
                                            />
                                            <div className="min-w-0">
                                                <span className="font-semibold text-foreground truncate block">
                                                    {cls.className}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground">
                                                    Anno: {cls.schoolYear || "N/D"} • {cls.students?.length || 0} studenti
                                                </span>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] shrink-0">
                                            Prefisso attivo
                                        </Badge>
                                    </label>
                                );
                            })}
                        </div>

                        <div className="p-2.5 rounded-lg bg-muted/40 border text-[11px] text-muted-foreground flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <span>
                                Le classi archiviate non saranno eliminate: tutti i dati, studenti e valutazioni rimarranno consultabili nei record storici e nelle sezioni dedicate.
                            </span>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setModalOpen(false)}
                            disabled={isArchiving}
                        >
                            Annulla
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleConfirmArchive}
                            disabled={selectedClassIds.length === 0 || isArchiving}
                            className="gap-1.5"
                        >
                            {isArchiving ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Archiviazione in corso...
                                </>
                            ) : (
                                <>
                                    <Archive className="h-3.5 w-3.5" />
                                    Conferma Archiviazione ({selectedClassIds.length})
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSchoolData } from "@/provider/clientProvider";
import { useSettings, getCurrentSchoolYearLabel } from "@/provider/settingsProvider";
import { GraduationCap, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const DISMISSED_DATE_KEY = "sportsgrade_newyear_dismissed_date";

export function NewYearBanner() {
    const { activeClasses, archiveClassesBatch, refreshClasses } = useSchoolData();
    const { settings } = useSettings();

    const startMonth = settings.schoolYearStartMonth ?? 9;
    const startDay = settings.schoolYearStartDay ?? 1;
    const currentYearLabel = getCurrentSchoolYearLabel(startMonth, startDay);
    const storageKey = `sportsgrade_auto_archived_${currentYearLabel}`;

    const [isDismissed, setIsDismissed] = useState<boolean>(() => {
        const todayStr = new Date().toISOString().split("T")[0];
        return localStorage.getItem(DISMISSED_DATE_KEY) === todayStr;
    });

    const [autoArchivedNames, setAutoArchivedNames] = useState<string[]>(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    const [isArchiving, setIsArchiving] = useState(false);
    const hasAttemptedAutoArchive = useRef(false);

    const prefixes = useMemo(() => {
        const p = settings.graduatedClassPrefixes;
        return Array.isArray(p) && p.length > 0 ? p : ["5"];
    }, [settings.graduatedClassPrefixes]);

    // Check if today is on or after the start date of the school year
    const isNewSchoolYearStarted = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        return (currentMonth > startMonth) || (currentMonth === startMonth && currentDay >= startDay);
    }, [startMonth, startDay]);

    // Filter active classes that match the graduated prefixes (case-insensitive)
    const matchingClasses = useMemo(() => {
        return activeClasses.filter(c => {
            const name = c.className.trim().toLowerCase();
            return prefixes.some(prefix => name.startsWith(prefix.trim().toLowerCase()));
        });
    }, [activeClasses, prefixes]);

    // Automatically archive 5th classes when detected at the start of the new school year
    useEffect(() => {
        if (!isNewSchoolYearStarted || matchingClasses.length === 0 || hasAttemptedAutoArchive.current || isArchiving) {
            return;
        }

        hasAttemptedAutoArchive.current = true;

        const executeAutoArchive = async () => {
            setIsArchiving(true);
            const names = matchingClasses.map(c => c.className);
            const ids = matchingClasses.map(c => c.id);

            try {
                const success = await archiveClassesBatch(ids);
                if (success) {
                    await refreshClasses();
                    const updatedNames = Array.from(new Set([...autoArchivedNames, ...names]));
                    setAutoArchivedNames(updatedNames);
                    localStorage.setItem(storageKey, JSON.stringify(updatedNames));
                    toast.success(
                        `${names.length} ${names.length === 1 ? "classe quinta archiviata" : "classi quinte archiviate"} automaticamente per il nuovo anno scolastico`
                    );
                } else {
                    toast.error("Errore durante l'archiviazione automatica delle classi quinte");
                }
            } catch (error) {
                console.error("Errore nell'archiviazione automatica delle quinte:", error);
            } finally {
                setIsArchiving(false);
            }
        };

        executeAutoArchive();
    }, [isNewSchoolYearStarted, matchingClasses, isArchiving, archiveClassesBatch, refreshClasses, autoArchivedNames, storageKey]);

    const handleDismiss = () => {
        const todayStr = new Date().toISOString().split("T")[0];
        localStorage.setItem(DISMISSED_DATE_KEY, todayStr);
        setIsDismissed(true);
    };

    // If dismissed or no classes were auto-archived and none are matching
    if (isDismissed || (!isArchiving && autoArchivedNames.length === 0 && matchingClasses.length === 0)) {
        return null;
    }

    const displayNames = autoArchivedNames.length > 0 ? autoArchivedNames : matchingClasses.map(c => c.className);

    return (
        <Card className="border border-primary/20 bg-primary/5 shadow-xs rounded-xl overflow-hidden mb-6 transition-all">
            <CardContent className="p-3.5 sm:p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                            {isArchiving ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <GraduationCap className="h-5 w-5" />
                            )}
                        </div>
                        <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm text-foreground">
                                    Inizio Nuovo Anno Scolastico ({currentYearLabel})
                                </h4>
                                <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-normal">
                                    {isArchiving ? "Archiviazione in corso..." : "Classi Quinte Archiviate"}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {isArchiving ? (
                                    <span>Archiviazione automatica delle classi quinte in corso...</span>
                                ) : (
                                    <>
                                        Le classi quinte terminali (<strong className="text-foreground">{displayNames.join(", ")}</strong>) sono state archiviate automaticamente per l'inizio del nuovo anno. I dati e i record storici rimangono sempre accessibili tramite la ricerca.
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {!isArchiving && (
                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-8 gap-1.5"
                                onClick={handleDismiss}
                            >
                                <Check className="h-3.5 w-3.5" />
                                Ho capito
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSchedule, DAYS_ORDER, DAY_LABELS } from "@/provider/scheduleProvider";
import { useSchoolData } from "@/provider/clientProvider";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Settings, StickyNote, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScheduleSlot, DayOfWeek, isTimeInSlot } from "@/types/scheduleTypes";
import { Clock } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Color palette for classes (will cycle through)
// Color palette for classes (Shadcn-integrated aesthetic)
const CLASS_COLORS = [
    {
        bg: "bg-emerald-500/[0.08]",
        hoverBg: "hover:bg-emerald-500/[0.12]",
        border: "border-emerald-500/20",
        text: "text-emerald-600 dark:text-emerald-400",
        accent: "bg-emerald-500",
    },
    {
        bg: "bg-sky-500/[0.08]",
        hoverBg: "hover:bg-sky-500/[0.12]",
        border: "border-sky-500/20",
        text: "text-sky-600 dark:text-sky-400",
        accent: "bg-sky-500",
    },
    {
        bg: "bg-indigo-500/[0.08]",
        hoverBg: "hover:bg-indigo-500/[0.12]",
        border: "border-indigo-500/20",
        text: "text-indigo-600 dark:text-indigo-400",
        accent: "bg-indigo-500",
    },
    {
        bg: "bg-violet-500/[0.08]",
        hoverBg: "hover:bg-violet-500/[0.12]",
        border: "border-violet-500/20",
        text: "text-violet-600 dark:text-violet-400",
        accent: "bg-violet-500",
    },
    {
        bg: "bg-amber-500/[0.08]",
        hoverBg: "hover:bg-amber-500/[0.12]",
        border: "border-amber-500/20",
        text: "text-amber-600 dark:text-amber-400",
        accent: "bg-amber-500",
    },
    {
        bg: "bg-rose-500/[0.08]",
        hoverBg: "hover:bg-rose-500/[0.12]",
        border: "border-rose-500/20",
        text: "text-rose-600 dark:text-rose-400",
        accent: "bg-rose-500",
    },
];

function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

export function WeeklySchedule() {
    const { schedule, getSlotsByDay, updateSlot } = useSchedule();
    const { classes } = useSchoolData();
    const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
    const [noteText, setNoteText] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [now, setNow] = useState(new Date());
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const handleSlotClick = (slot: ScheduleSlot) => {
        setSelectedSlot(slot);
        setNoteText(slot.note || "");
        setIsDialogOpen(true);
    };

    const currentDayKey = useMemo(() => {
        const dayMap: Record<number, DayOfWeek> = {
            1: 'lunedi', 2: 'martedi', 3: 'mercoledi', 4: 'giovedi', 5: 'venerdi', 6: 'sabato'
        };
        return dayMap[now.getDay()];
    }, [now]);

    const currentSlot = useMemo(() => {
        return schedule.find(slot => isTimeInSlot(slot, now));
    }, [schedule, now]);

    const nextSlot = useMemo(() => {
        if (!currentDayKey) return null;
        const daySlots = getSlotsByDay(currentDayKey);
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        return daySlots.find(slot => timeToMinutes(slot.startTime) > nowMinutes);
    }, [getSlotsByDay, currentDayKey, now]);

    const handleSaveNote = () => {
        if (selectedSlot) {
            updateSlot(selectedSlot.id, { note: noteText });
            setIsDialogOpen(false);
        }
    };

    // Calculate which days have slots
    const activeDays = useMemo(() => {
        return DAYS_ORDER.filter(day => getSlotsByDay(day).length > 0);
    }, [getSlotsByDay]);

    // Calculate time range from schedule
    const { startHour, endHour, timeSlots } = useMemo(() => {
        if (schedule.length === 0) {
            return { startHour: 8, endHour: 14, timeSlots: [] };
        }

        let minMinutes = Infinity;
        let maxMinutes = 0;

        schedule.forEach(slot => {
            const start = timeToMinutes(slot.startTime);
            const end = timeToMinutes(slot.endTime);
            minMinutes = Math.min(minMinutes, start);
            maxMinutes = Math.max(maxMinutes, end);
        });

        // Round to full hours
        const startH = Math.floor(minMinutes / 60);
        const endH = Math.ceil(maxMinutes / 60);

        // Generate time slot labels
        const slots: string[] = [];
        for (let h = startH; h < endH; h++) {
            slots.push(`${h.toString().padStart(2, "0")}:00`);
        }

        return { startHour: startH, endHour: endH, timeSlots: slots };
    }, [schedule]);

    // Map class IDs to colors
    const classColorMap = useMemo(() => {
        const map = new Map<string, typeof CLASS_COLORS[0]>();
        classes.forEach((cls, index) => {
            map.set(cls.id, CLASS_COLORS[index % CLASS_COLORS.length]);
        });
        return map;
    }, [classes]);

    // Get class name by ID
    const getClassName = (classId: string) => {
        const cls = classes.find(c => c.id === classId);
        return cls?.className || "Classe";
    };

    // Calculate slot positioning
    const getSlotStyle = (startTime: string, endTime: string) => {
        const totalMinutes = (endHour - startHour) * 60;
        const slotStart = timeToMinutes(startTime) - startHour * 60;
        const slotEnd = timeToMinutes(endTime) - startHour * 60;

        const topPercent = (slotStart / totalMinutes) * 100;
        const heightPercent = ((slotEnd - slotStart) / totalMinutes) * 100;

        return {
            top: `${topPercent}%`,
            height: `${heightPercent}%`,
        };
    };

    if (schedule.length === 0) {
        return (
            <Card className="flex-1">
                <CardHeader>
                    <CardTitle>Orario Settimanale</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <div className="text-center">
                            <p>Nessun orario configurato.</p>
                            <p className="text-sm mt-1 mb-4">Configura l'orario nelle Impostazioni.</p>
                            <Button asChild variant="outline">
                                <Link to="/settings">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Configura Orario
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="flex-1">
            <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            Orario Settimanale
                            <span className="text-xs font-normal text-muted-foreground ml-2 px-2 py-0.5 bg-muted rounded-full">
                                {now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                        </CardTitle>
                        {(currentSlot || nextSlot) && (
                            <div className="flex items-center gap-3 mt-2">
                                {currentSlot && (
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        In corso: <span className="font-semibold">{getClassName(currentSlot.classId)}</span>
                                    </div>
                                )}
                                {!currentSlot && nextSlot && (
                                    <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                                        <Clock className="w-3 h-3" />
                                        Prossima: <span className="font-semibold">{getClassName(nextSlot.classId)}</span> ({nextSlot.startTime})
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link to="/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Configura Orario
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex gap-1">
                    {/* Time labels column */}
                    <div className="w-14 flex-shrink-0">
                        <div className="h-10" /> {/* Header spacer */}
                        <div className="relative" style={{ height: `${(endHour - startHour) * 90}px` }}>
                            {timeSlots.map((time, idx) => (
                                <div
                                    key={time}
                                    className="absolute right-2 text-xs text-muted-foreground"
                                    style={{ top: `${idx * 90}px` }}
                                >
                                    {time}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Days columns */}
                    <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${activeDays.length}, 1fr)` }}>
                        {activeDays.map(day => {
                            const daySlots = getSlotsByDay(day);
                            return (
                                <div key={day} className="flex flex-col">
                                    {/* Day header */}
                                    <div className="h-10 flex flex-col items-center justify-center border-b border-border/50">
                                        <span className="text-xs font-medium uppercase text-muted-foreground">
                                            {DAY_LABELS[day].slice(0, 3)}
                                        </span>
                                    </div>

                                    {/* Time grid */}
                                    <div
                                        className={cn(
                                            "relative bg-muted/20 rounded-md transition-all",
                                            day === currentDayKey && "bg-primary/5 ring-1 ring-primary/20"
                                        )}
                                        style={{ height: `${(endHour - startHour) * 90}px` }}
                                    >
                                        {/* Grid lines */}
                                        {timeSlots.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className="absolute w-full border-t border-border/20"
                                                style={{ top: `${idx * 90}px` }}
                                            />
                                        ))}

                                        {/* Current Time Indicator Line */}
                                        {day === currentDayKey && (() => {
                                            const nowMin = now.getHours() * 60 + now.getMinutes();
                                            const startMin = startHour * 60;
                                            const endMin = endHour * 60;

                                            if (nowMin >= startMin && nowMin <= endMin) {
                                                const topPercent = ((nowMin - startMin) / (endMin - startMin)) * 100;
                                                return (
                                                    <div
                                                        className="absolute left-0 right-0 z-10 flex items-center"
                                                        style={{ top: `${topPercent}%` }}
                                                    >
                                                        <div className="w-2 h-2 rounded-full bg-rose-500 -ml-1 border-2 border-background" />
                                                        <div className="flex-1 h-0.5 bg-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}

                                        {/* Slots */}
                                        <TooltipProvider>
                                            {daySlots.map(slot => {
                                                const colors = classColorMap.get(slot.classId) || CLASS_COLORS[0];
                                                const style = getSlotStyle(slot.startTime, slot.endTime);
                                                const isActive = isTimeInSlot(slot, now);

                                                return (
                                                    <Tooltip key={slot.id} delayDuration={300}>
                                                        <TooltipTrigger asChild>
                                                            <div
                                                                className={cn(
                                                                    "absolute left-1 right-1 rounded-md border px-2 py-1.5 overflow-hidden group cursor-pointer transition-all duration-200",
                                                                    colors.bg,
                                                                    colors.hoverBg,
                                                                    colors.border,
                                                                    isActive
                                                                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background z-20 shadow-md scale-[1.01]"
                                                                        : "hover:shadow-sm"
                                                                )}
                                                                style={style}
                                                                onClick={() => handleSlotClick(slot)}
                                                                role="button"
                                                                tabIndex={0}
                                                            >
                                                                {/* Side accent bar */}
                                                                <div className={cn("absolute left-0 top-0 bottom-0 w-[4px]", colors.accent)} />

                                                                <div className="flex flex-col h-full overflow-hidden">
                                                                    <div className="flex items-start justify-between gap-1 overflow-hidden shrink-0">
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className={cn("text-sm font-extrabold truncate leading-tight", colors.text)}>
                                                                                {getClassName(slot.classId)}
                                                                            </p>
                                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                                <Clock className="h-3 w-3 text-muted-foreground/60" />
                                                                                <p className="text-xs text-muted-foreground/80 font-semibold">
                                                                                    {slot.startTime}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 mt-0.5 flex-shrink-0">
                                                                            {slot.note && (
                                                                                <StickyNote className={cn("h-4 w-4 opacity-90 animate-in fade-in zoom-in duration-300", colors.text)} />
                                                                            )}
                                                                            {!slot.note && (
                                                                                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {slot.note && (() => {
                                                                        // Calculate available lines based on duration (approx 1 line per 15 mins after header)
                                                                        const durationMin = timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime);
                                                                        const maxLines = Math.max(1, Math.floor((durationMin - 40) / 15));

                                                                        return (
                                                                            <div className="mt-2 pt-1.5 border-t border-border/10 flex gap-2 items-start min-w-0 flex-1 min-h-0 overflow-hidden">
                                                                                <div className={cn("w-1 h-3.5 rounded-full mt-0.5 shrink-0", colors.accent, "opacity-50")} />
                                                                                <p
                                                                                    className="text-xs leading-normal break-words break-all whitespace-pre-wrap text-foreground/90 font-medium italic min-w-0 overflow-hidden"
                                                                                    style={{
                                                                                        display: '-webkit-box',
                                                                                        WebkitLineClamp: maxLines,
                                                                                        WebkitBoxOrient: 'vertical'
                                                                                    }}
                                                                                >
                                                                                    {slot.note}
                                                                                </p>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </TooltipTrigger>
                                                        {slot.note && (
                                                            <TooltipContent
                                                                side="right"
                                                                sideOffset={10}
                                                                className="p-0 border-none bg-transparent shadow-2xl"
                                                            >
                                                                <div className="rounded-xl border border-primary/20 bg-background/95 backdrop-blur-md p-4 shadow-2xl max-w-[320px] w-full flex flex-col max-h-[480px] animate-in fade-in zoom-in duration-200">
                                                                    {/* Tooltip Header */}
                                                                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/50 shrink-0">
                                                                        <div className={cn("p-2 rounded-lg bg-primary/10", colors.text)}>
                                                                            <StickyNote className="h-4 w-4" />
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs font-bold text-foreground leading-none">
                                                                                {getClassName(slot.classId)}
                                                                            </span>
                                                                            <span className="text-[10px] text-muted-foreground mt-1">
                                                                                Nota Lezione
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Note Content - Scrollable section */}
                                                                    <div className="px-1 overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
                                                                        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed font-medium">
                                                                            {slot.note}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </TooltipContent>
                                                        )}
                                                    </Tooltip>
                                                );
                                            })}
                                        </TooltipProvider>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent
                    onOpenAutoFocus={(e) => {
                        e.preventDefault();
                        setTimeout(() => {
                            if (textareaRef.current) {
                                textareaRef.current.focus();
                                const length = textareaRef.current.value.length;
                                textareaRef.current.setSelectionRange(length, length);
                            }
                        }, 50);
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Nota Lezione: {selectedSlot ? getClassName(selectedSlot.classId) : ''}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="note">Nota</Label>
                            <Textarea
                                id="note"
                                ref={textareaRef}
                                className="min-h-[200px]"
                                placeholder="Scrivi una nota per questa lezione..."
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annulla</Button>
                        <Button onClick={handleSaveNote}>Salva</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

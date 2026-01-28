import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSchedule, DAYS_ORDER, DAY_LABELS } from "@/provider/scheduleProvider";
import { useSchoolData } from "@/provider/clientProvider";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Settings, StickyNote, Pencil } from "lucide-react";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScheduleSlot } from "@/types/scheduleTypes";

// Color palette for classes (will cycle through)
const CLASS_COLORS = [
    { bg: "bg-emerald-500/20", border: "border-emerald-500/40", text: "text-emerald-300" },
    { bg: "bg-cyan-500/20", border: "border-cyan-500/40", text: "text-cyan-300" },
    { bg: "bg-violet-500/20", border: "border-violet-500/40", text: "text-violet-300" },
    { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-300" },
    { bg: "bg-rose-500/20", border: "border-rose-500/40", text: "text-rose-300" },
    { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-300" },
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSlotClick = (slot: ScheduleSlot) => {
        setSelectedSlot(slot);
        setNoteText(slot.note || "");
        setIsDialogOpen(true);
    };

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
                <div className="flex items-center justify-between">
                    <CardTitle>Orario Settimanale</CardTitle>
                    <Button asChild variant="ghost" size="sm">
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
                        <div className="relative" style={{ height: `${(endHour - startHour) * 60}px` }}>
                            {timeSlots.map((time, idx) => (
                                <div
                                    key={time}
                                    className="absolute right-2 text-xs text-muted-foreground"
                                    style={{ top: `${idx * 60}px` }}
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
                                        className="relative bg-muted/20 rounded-md"
                                        style={{ height: `${(endHour - startHour) * 60}px` }}
                                    >
                                        {/* Grid lines */}
                                        {timeSlots.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className="absolute w-full border-t border-border/20"
                                                style={{ top: `${idx * 60}px` }}
                                            />
                                        ))}

                                        {/* Slots */}
                                        {daySlots.map(slot => {
                                            const colors = classColorMap.get(slot.classId) || CLASS_COLORS[0];
                                            const style = getSlotStyle(slot.startTime, slot.endTime);
                                            return (
                                                <div
                                                    key={slot.id}
                                                    className={cn(
                                                        "absolute left-1 right-1 rounded-md border px-2 py-1 overflow-hidden group cursor-pointer transition-colors hover:brightness-110",
                                                        colors.bg,
                                                        colors.border
                                                    )}
                                                    style={style}
                                                    onClick={() => handleSlotClick(slot)}
                                                    role="button"
                                                    tabIndex={0}
                                                >
                                                    <div className="flex items-center justify-between gap-1 overflow-hidden">
                                                        <p className={cn("text-xs font-medium truncate", colors.text)}>
                                                            {getClassName(slot.classId)}
                                                        </p>
                                                        <div className="flex items-center gap-1">
                                                            {!slot.note && (
                                                                <Pencil className={cn("h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity", colors.text)} />
                                                            )}
                                                            {slot.note && (
                                                                <StickyNote className={cn("h-3 w-3 flex-shrink-0", colors.text)} />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground truncate">
                                                        {slot.startTime} - {slot.endTime}
                                                    </p>
                                                    {slot.note && (
                                                        <p className={cn("text-[10px] truncate mt-1 border-t border-white/10 pt-0.5", colors.text)}>
                                                            {slot.note}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
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

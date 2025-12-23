import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ScheduleSlot, DayOfWeek } from "@/types/scheduleTypes";
import { isTimeInSlot } from "@/types/scheduleTypes";
import { useSchoolData } from "@/provider/clientProvider";
import type { SchoolClass } from "@/types/types";

const STORAGE_KEY = "sportsgrade-schedule";

// Default schedule - empty, user will configure
const defaultSchedule: ScheduleSlot[] = [];

interface CurrentClassInfo {
    id: string;
    name: string;
    studentCount: number;
}

interface ScheduleProviderState {
    schedule: ScheduleSlot[];
    addSlot: (slot: Omit<ScheduleSlot, 'id'>) => void;
    updateSlot: (id: string, updates: Partial<ScheduleSlot>) => void;
    removeSlot: (id: string) => void;
    getCurrentClass: () => CurrentClassInfo | null;
    getSlotsByDay: (day: DayOfWeek) => ScheduleSlot[];
    resetSchedule: () => void;
}

const ScheduleContext = createContext<ScheduleProviderState | undefined>(undefined);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
    const { classes } = useSchoolData();
    
    const [schedule, setSchedule] = useState<ScheduleSlot[]>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return defaultSchedule;
            }
        }
        return defaultSchedule;
    });

    // Persist to localStorage whenever schedule changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
    }, [schedule]);

    const addSlot = useCallback((slot: Omit<ScheduleSlot, 'id'>) => {
        const newSlot: ScheduleSlot = {
            ...slot,
            id: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        setSchedule(prev => [...prev, newSlot]);
    }, []);

    const updateSlot = useCallback((id: string, updates: Partial<ScheduleSlot>) => {
        setSchedule(prev => prev.map(slot => 
            slot.id === id ? { ...slot, ...updates } : slot
        ));
    }, []);

    const removeSlot = useCallback((id: string) => {
        setSchedule(prev => prev.filter(slot => slot.id !== id));
    }, []);

    const getCurrentClass = useCallback((): CurrentClassInfo | null => {
        const now = new Date();
        const currentSlot = schedule.find(slot => isTimeInSlot(slot, now));
        
        if (!currentSlot) {
            return null;
        }
        
        const foundClass = classes.find((c: SchoolClass) => c.id === currentSlot.classId);
        if (!foundClass) {
            return null;
        }
        
        return {
            id: foundClass.id,
            name: foundClass.className,
            studentCount: foundClass.students.length,
        };
    }, [schedule, classes]);

    const getSlotsByDay = useCallback((day: DayOfWeek): ScheduleSlot[] => {
        return schedule
            .filter(slot => slot.dayOfWeek === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [schedule]);

    const resetSchedule = useCallback(() => {
        setSchedule(defaultSchedule);
    }, []);

    return (
        <ScheduleContext.Provider value={{
            schedule,
            addSlot,
            updateSlot,
            removeSlot,
            getCurrentClass,
            getSlotsByDay,
            resetSchedule,
        }}>
            {children}
        </ScheduleContext.Provider>
    );
}

export const useSchedule = () => {
    const context = useContext(ScheduleContext);
    if (context === undefined) {
        throw new Error("useSchedule must be used within a ScheduleProvider");
    }
    return context;
};

// Day labels in Italian
export const DAY_LABELS: Record<DayOfWeek, string> = {
    lunedi: 'Lunedì',
    martedi: 'Martedì',
    mercoledi: 'Mercoledì',
    giovedi: 'Giovedì',
    venerdi: 'Venerdì',
    sabato: 'Sabato',
};

export const DAYS_ORDER: DayOfWeek[] = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'];

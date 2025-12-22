import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ScheduleSlot, DayOfWeek } from "@/types/scheduleTypes";
import { isTimeInSlot } from "@/types/scheduleTypes";
import { classes } from "@/data/mockData";
import type { Class } from "@/types";

const STORAGE_KEY = "sportsgrade-schedule";

// Default schedule - can be modified by the teacher
const defaultSchedule: ScheduleSlot[] = [
    // Lunedì
    { id: 'sch1', dayOfWeek: 'lunedi', startTime: '08:00', endTime: '09:00', classId: 'c1' },
    { id: 'sch2', dayOfWeek: 'lunedi', startTime: '09:00', endTime: '10:00', classId: 'c2' },
    { id: 'sch3', dayOfWeek: 'lunedi', startTime: '11:00', endTime: '12:00', classId: 'c3' },
    
    // Martedì
    { id: 'sch4', dayOfWeek: 'martedi', startTime: '08:00', endTime: '09:00', classId: 'c4' },
    { id: 'sch5', dayOfWeek: 'martedi', startTime: '10:00', endTime: '11:00', classId: 'c5' },
    { id: 'sch6', dayOfWeek: 'martedi', startTime: '11:00', endTime: '12:00', classId: 'c6' },
    
    // Mercoledì
    { id: 'sch7', dayOfWeek: 'mercoledi', startTime: '08:00', endTime: '09:00', classId: 'c1' },
    { id: 'sch8', dayOfWeek: 'mercoledi', startTime: '09:00', endTime: '10:00', classId: 'c3' },
    { id: 'sch9', dayOfWeek: 'mercoledi', startTime: '11:00', endTime: '12:00', classId: 'c5' },
    
    // Giovedì
    { id: 'sch10', dayOfWeek: 'giovedi', startTime: '08:00', endTime: '09:00', classId: 'c2' },
    { id: 'sch11', dayOfWeek: 'giovedi', startTime: '09:00', endTime: '10:00', classId: 'c4' },
    { id: 'sch12', dayOfWeek: 'giovedi', startTime: '10:00', endTime: '11:00', classId: 'c6' },
    
    // Venerdì
    { id: 'sch13', dayOfWeek: 'venerdi', startTime: '08:00', endTime: '09:00', classId: 'c1' },
    { id: 'sch14', dayOfWeek: 'venerdi', startTime: '09:00', endTime: '10:00', classId: 'c2' },
    { id: 'sch15', dayOfWeek: 'venerdi', startTime: '11:00', endTime: '12:00', classId: 'c3' },
    
    // Sabato
    { id: 'sch16', dayOfWeek: 'sabato', startTime: '08:00', endTime: '09:00', classId: 'c4' },
    { id: 'sch17', dayOfWeek: 'sabato', startTime: '09:00', endTime: '10:00', classId: 'c5' },
];

interface ScheduleProviderState {
    schedule: ScheduleSlot[];
    addSlot: (slot: Omit<ScheduleSlot, 'id'>) => void;
    updateSlot: (id: string, updates: Partial<ScheduleSlot>) => void;
    removeSlot: (id: string) => void;
    getCurrentClass: () => Class | null;
    getSlotsByDay: (day: DayOfWeek) => ScheduleSlot[];
    resetSchedule: () => void;
}

const ScheduleContext = createContext<ScheduleProviderState | undefined>(undefined);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
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

    const getCurrentClass = useCallback((): Class | null => {
        const now = new Date();
        const currentSlot = schedule.find(slot => isTimeInSlot(slot, now));
        
        if (!currentSlot) {
            return null;
        }
        
        return classes.find(c => c.id === currentSlot.classId) || null;
    }, [schedule]);

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

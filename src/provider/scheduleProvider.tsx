import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ScheduleSlot, DayOfWeek } from "@/types/scheduleTypes";
import { isTimeInSlot } from "@/types/scheduleTypes";

import { useSchoolData, useClient, useAuth } from "@/provider/clientProvider";
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
    isLoading: boolean;
    addSlot: (slot: Omit<ScheduleSlot, 'id'>) => void;
    updateSlot: (id: string, updates: Partial<ScheduleSlot>) => void;
    removeSlot: (id: string) => void;
    getCurrentClass: () => CurrentClassInfo | null;
    getSlotsByDay: (day: DayOfWeek) => ScheduleSlot[];
    resetSchedule: () => void;
    importSchedule: (newSchedule: ScheduleSlot[]) => void;
}

const ScheduleContext = createContext<ScheduleProviderState | undefined>(undefined);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
    const { classes } = useSchoolData();
    const client = useClient();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    
    // Initialize with empty or local storage as fallback/cache
    const [schedule, setSchedule] = useState<ScheduleSlot[]>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        try {
            return stored ? JSON.parse(stored) : defaultSchedule;
        } catch {
            return defaultSchedule;
        }
    });

    // Load from API on mount or user change
    useEffect(() => {
        const loadSchedule = async () => {
             if (user) {
                setIsLoading(true);
                // User logged in, fetch from DB
                try {
                    const res = await client.getSettings();
                    if (res.success && res.data?.schedule) {
                        setSchedule(res.data.schedule);
                    } else {
                        // If no schedule in DB, keep what we have (or valid defaults)
                         // Maybe initializing empty is safer if we want to avoid leaking previous user data
                         // But if we trust localStorage was cleared on logout, this is fine.
                         // However, to be safe:
                         if (schedule.length === 0) setSchedule(defaultSchedule); // Just a fallback
                    }
                } catch (e) {
                    console.error("Failed to load schedule", e);
                } finally {
                    setIsLoading(false);
                }
            } else {
                // User logged out, clear schedule
                setSchedule(defaultSchedule);
                localStorage.removeItem(STORAGE_KEY);
                setIsLoading(false);
            }
        };
        loadSchedule();
    }, [client, user]); // Depend on user to re-trigger on login/logout

    // Persist to API and localStorage
    const saveSchedule = useCallback(async (newSchedule: ScheduleSlot[]) => {
        setSchedule(newSchedule);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSchedule)); // Keep local text backup
        
        try {
            await client.updateSettings({ schedule: newSchedule });
        } catch (e) {
            console.error("Failed to sync schedule:", e);
        }
    }, [client]);



    const addSlot = useCallback((slot: Omit<ScheduleSlot, 'id'>) => {
        const newSlot: ScheduleSlot = {
            ...slot,
            id: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        const newSchedule = [...schedule, newSlot];
        saveSchedule(newSchedule);
    }, [schedule, saveSchedule]);

    const updateSlot = useCallback((id: string, updates: Partial<ScheduleSlot>) => {
        const newSchedule = schedule.map(slot => 
            slot.id === id ? { ...slot, ...updates } : slot
        );
        saveSchedule(newSchedule);
    }, [schedule, saveSchedule]);

    const removeSlot = useCallback((id: string) => {
        const newSchedule = schedule.filter(slot => slot.id !== id);
        saveSchedule(newSchedule);
    }, [schedule, saveSchedule]);


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
        saveSchedule(defaultSchedule);
    }, [saveSchedule]);

    return (
        <ScheduleContext.Provider value={{
            schedule,
            isLoading,
            addSlot,
            updateSlot,
            removeSlot,
            getCurrentClass,
            getSlotsByDay,
            resetSchedule,
            importSchedule: (newSchedule: ScheduleSlot[]) => saveSchedule(newSchedule),

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

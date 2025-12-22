// Schedule types for class timetable

export type DayOfWeek = 'lunedi' | 'martedi' | 'mercoledi' | 'giovedi' | 'venerdi' | 'sabato';

export interface ScheduleSlot {
    id: string;
    dayOfWeek: DayOfWeek;
    startTime: string; // Format: "HH:MM" (24h)
    endTime: string;   // Format: "HH:MM" (24h)
    classId: string;
}

// Helper to check if current time falls within a schedule slot
export function isTimeInSlot(slot: ScheduleSlot, currentTime: Date): boolean {
    const dayMap: Record<number, DayOfWeek> = {
        1: 'lunedi',
        2: 'martedi',
        3: 'mercoledi',
        4: 'giovedi',
        5: 'venerdi',
        6: 'sabato'
    };

    const currentDay = dayMap[currentTime.getDay()];
    if (!currentDay || currentDay !== slot.dayOfWeek) {
        return false;
    }

    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    const [startH, startM] = slot.startTime.split(':').map(Number);
    const [endH, endM] = slot.endTime.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

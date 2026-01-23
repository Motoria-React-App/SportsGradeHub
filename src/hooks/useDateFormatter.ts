import { useSettings } from "@/provider/settingsProvider";
import { useCallback, useMemo } from "react";

/**
 * Hook for formatting dates according to user settings.
 * Respects dateFormat setting ('DD/MM/YYYY' or 'YYYY-MM-DD').
 */
export function useDateFormatter() {
    const { settings } = useSettings();

    /**
     * Format a date according to the user's preferred format
     */
    const formatDate = useCallback((date: Date | string): string => {
        const d = typeof date === 'string' ? new Date(date) : date;
        
        if (isNaN(d.getTime())) {
            return 'Data non valida';
        }

        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();

        switch (settings.dateFormat) {
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'DD/MM/YYYY':
            default:
                return `${day}/${month}/${year}`;
        }
    }, [settings.dateFormat]);

    /**
     * Format a date with time
     */
    const formatDateTime = useCallback((date: Date | string): string => {
        const d = typeof date === 'string' ? new Date(date) : date;
        
        if (isNaN(d.getTime())) {
            return 'Data non valida';
        }

        const dateStr = formatDate(d);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');

        return `${dateStr} ${hours}:${minutes}`;
    }, [formatDate]);

    /**
     * Format a relative date (e.g., "oggi", "ieri", "2 giorni fa")
     */
    const formatRelativeDate = useCallback((date: Date | string): string => {
        const d = typeof date === 'string' ? new Date(date) : date;
        
        if (isNaN(d.getTime())) {
            return 'Data non valida';
        }

        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Oggi';
        } else if (diffDays === 1) {
            return 'Ieri';
        } else if (diffDays < 7) {
            return `${diffDays} giorni fa`;
        } else {
            return formatDate(d);
        }
    }, [formatDate]);

    return useMemo(() => ({
        formatDate,
        formatDateTime,
        formatRelativeDate,
    }), [formatDate, formatDateTime, formatRelativeDate]);
}

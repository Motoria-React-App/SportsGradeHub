import { useSettings } from "@/provider/settingsProvider";
import { useMemo, useCallback } from "react";

/**
 * Hook for formatting grades according to user settings.
 * Respects passingGrade, showDecimals, roundingMode, and highlightFailing settings.
 */
export function useGradeFormatter() {
    const { settings } = useSettings();

    /**
     * Round a grade value according to the rounding mode setting
     */
    const roundGrade = useCallback((value: number): number => {
        switch (settings.roundingMode) {
            case 'up':
                return Math.ceil(value);
            case 'down':
                return Math.floor(value);
            case 'nearest':
            default:
                return Math.round(value * 2) / 2; // Round to nearest 0.5
        }
    }, [settings.roundingMode]);

    /**
     * Format a grade value for display, respecting showDecimals setting
     */
    const formatGrade = useCallback((value: number): string => {
        if (settings.showDecimals) {
            // Show one decimal place
            return value.toFixed(1);
        } else {
            // Round and show as integer
            return Math.round(value).toString();
        }
    }, [settings.showDecimals]);

    /**
     * Check if a grade value is passing (sufficient)
     */
    const isPassing = useCallback((value: number): boolean => {
        return value >= settings.passingGrade;
    }, [settings.passingGrade]);

    /**
     * Get the appropriate CSS color class for a grade
     * Returns green for passing, red for failing (if highlighting is enabled)
     */
    const getGradeColor = useCallback((value: number): string => {
        if (!settings.highlightFailing) {
            return ""; // No color highlighting
        }
        return isPassing(value) ? "text-green-600" : "text-red-600";
    }, [settings.highlightFailing, isPassing]);

    /**
     * Get the appropriate CSS background color class for a grade
     */
    const getGradeBgColor = useCallback((value: number): string => {
        if (!settings.highlightFailing) {
            return "";
        }
        return isPassing(value) 
            ? "bg-green-100 dark:bg-green-900/30" 
            : "bg-red-100 dark:bg-red-900/30";
    }, [settings.highlightFailing, isPassing]);

    return useMemo(() => ({
        roundGrade,
        formatGrade,
        isPassing,
        getGradeColor,
        getGradeBgColor,
        passingGrade: settings.passingGrade,
    }), [roundGrade, formatGrade, isPassing, getGradeColor, getGradeBgColor, settings.passingGrade]);
}

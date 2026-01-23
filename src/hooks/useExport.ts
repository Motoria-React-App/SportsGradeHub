import { useSettings } from "@/provider/settingsProvider";
import { useSchoolData } from "@/provider/clientProvider";
import { useCallback, useMemo } from "react";

interface ExportOptions {
    includeNotes?: boolean;
    filename?: string;
}

/**
 * Hook for exporting data in various formats.
 * Supports CSV and Excel export.
 */
export function useExport() {
    const { settings } = useSettings();
    const { students, classes, evaluations, exercises } = useSchoolData();

    /**
     * Convert data to CSV format and trigger download
     */
    const exportToCSV = useCallback((data: Record<string, unknown>[], filename: string) => {
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Escape quotes and wrap in quotes if contains comma
                    const stringValue = String(value ?? '');
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    }, []);

    /**
     * Export to Excel format using SheetJS library
     * Falls back to CSV if xlsx library is not available
     */
    const exportToExcel = useCallback(async (data: Record<string, unknown>[], filename: string) => {
        try {
            // Dynamically import xlsx library
            const XLSX = await import('xlsx');
            
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Dati');
            
            XLSX.writeFile(workbook, `${filename}.xlsx`);
        } catch (error) {
            console.warn('xlsx library not available, falling back to CSV:', error);
            // Fallback to CSV
            exportToCSV(data, filename);
        }
    }, [exportToCSV]);

    /**
     * Prepare evaluations data for export
     */
    const prepareEvaluationsData = useCallback((options: ExportOptions = {}) => {
        const includeNotes = options.includeNotes ?? settings.includeNotesInExport;
        
        return evaluations.map(ev => {
            const student = students.find(s => s.id === ev.studentId);
            const exercise = exercises.find(e => e.id === ev.exerciseId);
            const studentClass = classes.find(c => c.id === student?.currentClassId);

            const baseData: Record<string, unknown> = {
                'Studente': student ? `${student.firstName} ${student.lastName}` : 'N/A',
                'Classe': studentClass?.className ?? 'N/A',
                'Esercizio': exercise?.name ?? 'N/A',
                'Prestazione': ev.performanceValue ?? '',
                'Voto': ev.score ?? '',
                'Data': new Date(ev.createdAt).toLocaleDateString('it-IT'),
            };

            if (includeNotes) {
                baseData['Note'] = ev.comments ?? '';
            }

            return baseData;
        });
    }, [evaluations, students, exercises, classes, settings.includeNotesInExport]);

    /**
     * Prepare students data for export
     */
    const prepareStudentsData = useCallback(() => {
        return students.map(student => {
            const studentClass = classes.find(c => c.id === student.currentClassId);
            const studentEvaluations = evaluations.filter(e => e.studentId === student.id);
            const avgScore = studentEvaluations.length > 0 
                ? studentEvaluations.reduce((sum, e) => sum + (e.score || 0), 0) / studentEvaluations.length
                : null;

            return {
                'Nome': student.firstName,
                'Cognome': student.lastName,
                'Classe': studentClass?.className ?? 'N/A',
                'Genere': student.gender === 'M' ? 'Maschio' : 'Femmina',
                'Valutazioni': studentEvaluations.length,
                'Media': avgScore !== null ? avgScore.toFixed(1) : 'N/A',
            };
        });
    }, [students, classes, evaluations]);

    /**
     * Export all evaluations
     */
    const exportAllEvaluations = useCallback(async (options: ExportOptions = {}) => {
        const data = prepareEvaluationsData(options);
        const filename = options.filename ?? `valutazioni_${new Date().toISOString().split('T')[0]}`;
        
        if (settings.exportFormat === 'excel') {
            await exportToExcel(data, filename);
        } else {
            exportToCSV(data, filename);
        }
    }, [prepareEvaluationsData, settings.exportFormat, exportToCSV, exportToExcel]);

    /**
     * Export all students
     */
    const exportAllStudents = useCallback(async (options: ExportOptions = {}) => {
        const data = prepareStudentsData();
        const filename = options.filename ?? `studenti_${new Date().toISOString().split('T')[0]}`;
        
        if (settings.exportFormat === 'excel') {
            await exportToExcel(data, filename);
        } else {
            exportToCSV(data, filename);
        }
    }, [prepareStudentsData, settings.exportFormat, exportToCSV, exportToExcel]);

    return useMemo(() => ({
        exportToCSV,
        exportToExcel,
        exportAllEvaluations,
        exportAllStudents,
        prepareEvaluationsData,
        prepareStudentsData,
    }), [exportToCSV, exportToExcel, exportAllEvaluations, exportAllStudents, prepareEvaluationsData, prepareStudentsData]);
}

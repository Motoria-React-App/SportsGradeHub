import { createContext, useContext, useEffect, useState } from "react";

export interface AppSettings {
    // Grading
    passingGrade: number;           // default: 6
    showDecimals: boolean;          // default: true
    roundingMode: 'up' | 'down' | 'nearest';  // default: 'nearest'
    highlightFailing: boolean;      // default: true

    // Display
    studentsPerPage: number;        // default: 25
    defaultView: 'dashboard' | 'valutazioni' | 'exercises';
    studentSortBy: 'firstName' | 'lastName' | 'average' | 'class';
    showGender: boolean;            // default: true
    dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD';  // default: 'DD/MM/YYYY'
    enableAnimations: boolean;      // default: true

    // Export
    exportFormat: 'csv' | 'excel' | 'pdf';  // default: 'csv'
    includeNotesInExport: boolean;  // default: true
}

const defaultSettings: AppSettings = {
    passingGrade: 6,
    showDecimals: true,
    roundingMode: 'nearest',
    highlightFailing: true,
    studentsPerPage: 25,
    defaultView: 'dashboard',
    studentSortBy: 'lastName',
    showGender: true,
    dateFormat: 'DD/MM/YYYY',
    enableAnimations: true,
    exportFormat: 'csv',
    includeNotesInExport: true,
};

interface SettingsProviderState {
    settings: AppSettings;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
    resetSettings: () => void;
    lastSync: Date | null;
    clearCache: () => void;
}

const initialState: SettingsProviderState = {
    settings: defaultSettings,
    updateSettings: () => null,
    resetSettings: () => null,
    lastSync: null,
    clearCache: () => null,
};

const SettingsProviderContext = createContext<SettingsProviderState>(initialState);

export function SettingsProvider({ children, storageKey = "sportsgrade-settings" }: { children: React.ReactNode, storageKey?: string }) {
    const [settings, setSettings] = useState<AppSettings>(() => {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                return { ...defaultSettings, ...JSON.parse(stored) };
            } catch (e) {
                return defaultSettings;
            }
        }
        return defaultSettings;
    });

    const [lastSync, setLastSync] = useState<Date | null>(null);

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(settings));
    }, [settings, storageKey]);

    useEffect(() => {
        // Simulate getting last sync time
        setLastSync(new Date());
    }, []);

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings((prev) => ({ ...prev, ...newSettings }));
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
    };

    const clearCache = () => {
        // Clear everything except settings and auth (if stored separately)
        // For now we just keep settings
        const currentSettings = localStorage.getItem(storageKey);
        const auth = localStorage.getItem("sportsgrade_user");

        localStorage.clear();

        if (currentSettings) localStorage.setItem(storageKey, currentSettings);
        if (auth) localStorage.setItem("sportsgrade_user", auth);

        // Force reload to apply clearing
        window.location.reload();
    };

    const value = {
        settings,
        updateSettings,
        resetSettings,
        lastSync,
        clearCache,
    };

    return (
        <SettingsProviderContext.Provider value={value}>
            {children}
        </SettingsProviderContext.Provider>
    );
}

export const useSettings = () => {
    const context = useContext(SettingsProviderContext);
    if (context === undefined)
        throw new Error("useSettings must be used within a SettingsProvider");
    return context;
};

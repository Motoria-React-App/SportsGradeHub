import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useClient, useAuth } from "./clientProvider";

// Periodo scolastico personalizzabile
export interface SchoolPeriod {
    id: string;
    name: string;       // es. "Trimestre", "Pentamestre"
    startDate: string;  // es. "2024-09-15"
    endDate: string;    // es. "2024-12-22"
}

export interface AppSettings {
    // Grading
    passingGrade: number;           // default: 6
    showDecimals: boolean;          // default: true
    roundingMode: 'up' | 'down' | 'nearest';  // default: 'nearest'
    highlightFailing: boolean;      // default: true
    enableBasePoint: boolean;       // default: false (se true, voto = 1 + performance su 9)

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

    // Justifications (Giustifiche)
    maxJustifications: number;          // default: 3 (soglia massima per periodo)
    schoolPeriods: SchoolPeriod[];      // periodi scolastici configurabili
    currentPeriodId: string | null;     // ID del periodo attivo
}

const defaultSettings: AppSettings = {
    passingGrade: 6,
    showDecimals: true,
    roundingMode: 'nearest',
    highlightFailing: true,
    enableBasePoint: false,
    studentsPerPage: 25,
    defaultView: 'dashboard',
    studentSortBy: 'lastName',
    showGender: true,
    dateFormat: 'DD/MM/YYYY',
    enableAnimations: true,
    exportFormat: 'csv',
    includeNotesInExport: true,
    // Justifications defaults
    maxJustifications: 3,
    schoolPeriods: [],
    currentPeriodId: null,
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
    const client = useClient();
    const { user } = useAuth();

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

    // Save to local storage whenever settings change (local cache)
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(settings));
    }, [settings, storageKey]);

    // Load from DB when user logs in, or reset when logs out
    useEffect(() => {
        const loadSettingsFromDb = async () => {
            if (user) {
                // Login case
                try {
                    const res = await client.getSettings();
                    if (res.success && res.data?.general && Object.keys(res.data.general).length > 0) {
                        // DB has settings, sync to local state
                        // Merge with defaults to ensure all fields exist
                        const dbSettings = { ...defaultSettings, ...res.data.general };
                        setSettings(dbSettings);
                        setLastSync(new Date());
                    } else if (res.success) {
                        // DB is empty (or new user), push current local settings to DB
                        // This preserves any customization the user made before syncing was added
                        await client.updateSettings({ general: settings });
                        setLastSync(new Date());
                    }
                } catch (e) {
                    console.error("Failed to sync settings from DB", e);
                }
            } else {
                // Logout case: reset to defaults AND clear specific local storage
                setSettings(defaultSettings);
                // We don't want to clear the entire localStorage here as it might contain other things,
                // but we should clear the settings key specific to this user session context if we wanted.
                // However, since we write to LS in the other useEffect, setting defaultSettings here 
                // will automatically overwrite LS with defaults in the next render cycle via the other useEffect.
                // So we just reset state.
            }
        };

        loadSettingsFromDb();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client, user]); // Run when user authentication changes

    const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
        setSettings((prev) => {
            const updated = { ...prev, ...newSettings };
            
            // Sync to DB (fire and forget)
            if (user) {
                client.updateSettings({ general: updated }).catch(e => {
                    console.error("Failed to save settings to DB", e);
                });
            }
            
            return updated;
        });
    }, [client, user]);

    // Automatic period activation
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const activePeriod = settings.schoolPeriods.find(p => 
            today >= p.startDate && today <= p.endDate
        );

        const activePeriodId = activePeriod ? activePeriod.id : null;

        if (settings.currentPeriodId !== activePeriodId) {
            // We use updateSettings here which will now also sync to DB
            updateSettings({ currentPeriodId: activePeriodId });
        }
    }, [settings.schoolPeriods, settings.currentPeriodId, updateSettings]);

    const resetSettings = useCallback(() => {
        setSettings(defaultSettings);
        if (user) {
            client.updateSettings({ general: defaultSettings }).catch(console.error);
        }
    }, [client, user]);

    const clearCache = useCallback(() => {
        // Clear everything except settings and auth (if stored separately)
        // For now we just keep settings
        const currentSettings = localStorage.getItem(storageKey);
        const auth = localStorage.getItem("sportsgrade_user");

        localStorage.clear();

        if (currentSettings) localStorage.setItem(storageKey, currentSettings);
        if (auth) localStorage.setItem("sportsgrade_user", auth);

        // Force reload to apply clearing
        window.location.reload();
    }, [storageKey]);

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

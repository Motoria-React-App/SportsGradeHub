import { useState, useMemo, useEffect } from "react";

import { SiteHeader } from "@/components/site-header";
import { ClassSelector } from "@/components/dashboard/ClassSelector";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { GradeDistributionChart } from "@/components/dashboard/GradeDistributionChart";
import { CategoryPerformanceChart } from "@/components/dashboard/CategoryPerformanceChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useSchoolData } from "@/provider/clientProvider";
import type { UIClass } from "@/provider/clientProvider";

const LAST_CLASS_KEY = "sportsgrade_last_class";

export default function Dashboard() {
    const { classes, uiClasses, uiStudents, getUIStudentsByClass, getUIGradesByClass } = useSchoolData();

    // State for selected class - initialize from localStorage or default to first class
    const [selectedClassId, setSelectedClassId] = useState<string>("");

    // Update selectedClassId when classes load
    useEffect(() => {
        if (classes.length > 0 && !selectedClassId) {
            const lastClass = localStorage.getItem(LAST_CLASS_KEY);
            if (lastClass && classes.some(c => c.id === lastClass)) {
                setSelectedClassId(lastClass);
            } else {
                setSelectedClassId(classes[0].id);
            }
        }
    }, [classes, selectedClassId]);

    // Get UI-compatible selected class
    const selectedClass = useMemo(() =>
        uiClasses.find(c => c.id === selectedClassId) as UIClass | undefined,
        [uiClasses, selectedClassId]
    );

    // Get students and grades for selected class
    const classStudents = useMemo(() =>
        getUIStudentsByClass(selectedClassId),
        [getUIStudentsByClass, selectedClassId]
    );

    const classGrades = useMemo(() =>
        getUIGradesByClass(selectedClassId),
        [getUIGradesByClass, selectedClassId]
    );

    // Handler for class change - also saves to localStorage
    const handleClassChange = (classId: string) => {
        setSelectedClassId(classId);
        localStorage.setItem(LAST_CLASS_KEY, classId);
    };

    return (
        <div className="flex flex-col h-full bg-background/50">
            {/* <SiteHeader /> */}

            <main className="flex-1 p-4 md:p-8 space-y-8 overflow-y-auto w-full max-w-7xl mx-auto">
                {/* Header Section with Selector */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                            Dashboard
                        </h1>
                        <p className="text-muted-foreground">
                            Panoramica e analisi delle prestazioni
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <ClassSelector
                            classes={classes}
                            selectedClassId={selectedClassId}
                            onSelectClass={handleClassChange}
                        />
                    </div>
                </div>

                {selectedClass ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        {/* Stats Overview */}
                        <StatsCards
                            selectedClass={selectedClass}
                            students={classStudents}
                            grades={classGrades}
                        />

                        {/* Charts & Activity Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                            {/* Main Charts - Spans 4 columns */}
                            <div className="col-span-1 lg:col-span-4 space-y-6">
                                <GradeDistributionChart grades={classGrades} />
                                <CategoryPerformanceChart grades={classGrades} />
                            </div>

                            {/* Sidebar/Activity - Spans 3 columns */}
                            <div className="col-span-1 lg:col-span-3 space-y-6">
                                <RecentActivity grades={classGrades} students={uiStudents} />

                                {/* Quick Action Widget */}
                                <div className="p-6 rounded-xl bg-primary/5 border border-primary/10 flex flex-col items-center justify-center text-center space-y-3">
                                    <h3 className="font-semibold text-primary">Nuova Valutazione</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Inizia una sessione di valutazione per questa classe.
                                    </p>
                                    <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm">
                                        Avvia Valutazione
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                        {classes.length === 0 ? "Nessuna classe disponibile" : "Nessuna classe selezionata o dati non disponibili."}
                    </div>
                )}
            </main>
        </div>
    );
}

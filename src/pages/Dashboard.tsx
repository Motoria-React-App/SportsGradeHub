import { useState, useEffect } from "react";

import { ClassSelector } from "@/components/dashboard/ClassSelector";
import { WeeklySchedule } from "@/components/dashboard/WeeklySchedule";
import { QuickActionsPanel } from "@/components/dashboard/QuickActionsPanel";
import { ClassStatsSummary } from "@/components/dashboard/ClassStatsSummary";
import { RecentActivityCompact } from "@/components/dashboard/RecentActivityCompact";
import { useSchoolData } from "@/provider/clientProvider";

const LAST_CLASS_KEY = "sportsgrade_last_class";

export default function Dashboard() {
    const { classes } = useSchoolData();

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

    // Handler for class change - also saves to localStorage
    const handleClassChange = (classId: string) => {
        setSelectedClassId(classId);
        localStorage.setItem(LAST_CLASS_KEY, classId);
    };

    return (
        <div className="flex flex-col h-full bg-background/50">
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto w-full max-w-[1600px] mx-auto">
                {/* Header Section with Selector */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                            Dashboard
                        </h1>
                        <p className="text-muted-foreground text-sm md:text-base">
                            Panoramica e gestione delle lezioni
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

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    {/* Weekly Schedule - Main Content (2 columns on large screens) */}
                    <div className="lg:col-span-2">
                        <WeeklySchedule />
                    </div>

                    {/* Right Sidebar (1 column on large screens) */}
                    <div className="lg:col-span-1 space-y-6">
                        <QuickActionsPanel selectedClassId={selectedClassId} />
                        <ClassStatsSummary selectedClassId={selectedClassId} />
                        <RecentActivityCompact selectedClassId={selectedClassId} />
                    </div>
                </div>
            </main>
        </div>
    );
}

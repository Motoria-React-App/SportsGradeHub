import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth, useSchoolData } from "@/provider/clientProvider";
import { useSchedule } from "@/provider/scheduleProvider";
import { useSettings } from "@/provider/settingsProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, ArrowRight, AlertTriangle } from "lucide-react";
import type { Student, Justification } from "@/types/types";


const LAST_CLASS_KEY = "sportsgrade_last_class";

export default function WelcomePage() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { getCurrentClass, isLoading } = useSchedule();
    const { students } = useSchoolData();
    const { settings } = useSettings();

    // Redirect to login if not authenticated

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Get the currently scheduled class based on the current time
    const scheduledClass = getCurrentClass();

    // Extract first name from user
    const displayName = user?.user?.displayName || "Professore";

    // Get current period for justification counting
    const currentPeriod = settings.schoolPeriods.find(
        (p: any) => p.id === settings.currentPeriodId
    );
    
    const getJustificationsInPeriod = (justifications: Justification[]) => {
        if (!currentPeriod) return justifications.length;
        return justifications.filter((j) => {
            const jDate = new Date(j.date);
            return jDate >= new Date(currentPeriod.startDate) && jDate <= new Date(currentPeriod.endDate);
        }).length;
    };
    
    // Get students over limit for current class
    const studentsOverLimit = scheduledClass 
        ? students
            .filter((s: Student) => s.currentClassId === scheduledClass.id)
            .filter((s: Student) => {
                const count = getJustificationsInPeriod(s.justifications || []);
                return count >= settings.maxJustifications;
            })
        : [];

    // Loading state while fetching schedule
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
                <div className="w-full max-w-lg flex flex-col items-center justify-center gap-4 animate-pulse">
                    <div className="h-4 w-32 bg-muted rounded"></div>
                    <div className="h-16 w-16 bg-muted rounded-2xl"></div>
                    <div className="h-8 w-48 bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    const handleStartEvaluation = (classId: string) => {
        // Save as last opened class
        localStorage.setItem(LAST_CLASS_KEY, classId);
        navigate(`/valutazioni/${classId}/all`);
    };

    const handleGoToDashboard = () => {
        navigate("/dashboard");
    };

    // If there's a scheduled class, show the focused welcome view
    if (scheduledClass) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
                <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* Welcome greeting */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                            Benvenuto, <span className="text-primary">{displayName}</span>
                        </h1>
                    </div>

                    {/* Class display */}
                    <div className="text-center mb-10">
                        <p className="text-lg text-muted-foreground mb-3">
                            Ecco la
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary">
                                <GraduationCap className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
                                    {scheduledClass.name}
                                </h2>
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <Users className="w-4 h-4" />
                                    {scheduledClass.studentCount} studenti
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Warning for students over limit */}
                    {studentsOverLimit.length > 0 && (
                        <Card className="mb-6 border-destructive bg-destructive/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    Attenzione Giustifiche
                                </CardTitle>
                                <CardDescription>
                                    {studentsOverLimit.length} student{studentsOverLimit.length > 1 ? 'i' : 'e'} ha{studentsOverLimit.length > 1 ? 'nno' : ''} superato la soglia
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex flex-wrap gap-2">
                                    {studentsOverLimit.slice(0, 5).map((s: Student) => (
                                        <Link
                                            key={s.id}
                                            to={`/students/${s.id}`}
                                            className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full hover:bg-destructive/20 transition-colors"
                                        >
                                            {s.firstName} {s.lastName}
                                        </Link>
                                    ))}
                                    {studentsOverLimit.length > 5 && (
                                        <span className="text-xs text-muted-foreground px-2 py-1">
                                            +{studentsOverLimit.length - 5} altri
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* CTA Button */}
                    <div className="flex justify-center">
                        <Button
                            size="lg"
                            onClick={() => handleStartEvaluation(scheduledClass.id)}
                            className="px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                        >
                            Cominciamo a valutare!
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>

                    {/* Link to all classes */}
                    <div className="text-center mt-8">
                        <button
                            onClick={handleGoToDashboard}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Oppure vai al dashboard →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // No scheduled class - show all classes menu
    return (
        <Navigate to="/dashboard" />
    );
}


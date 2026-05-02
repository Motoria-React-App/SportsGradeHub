import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth, useSchoolData } from "@/provider/clientProvider";
import { useSchedule } from "@/provider/scheduleProvider";
import { useSettings } from "@/provider/settingsProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, ArrowRight, AlertTriangle } from "lucide-react";
import type { Student, Justification } from "@/types/types";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition, slideUp, scaleIn, buttonPress } from "@/lib/motion";


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
            <motion.div
                className="flex flex-col items-center justify-center min-h-screen bg-background p-6"
                variants={pageTransition}
                initial="hidden"
                animate="visible"
            >
                <div className="w-full max-w-lg flex flex-col items-center justify-center gap-4">
                    <motion.div
                        className="h-4 w-32 bg-muted rounded"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                        className="h-16 w-16 bg-muted rounded-2xl"
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                        className="h-8 w-48 bg-muted rounded"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    />
                </div>
            </motion.div>
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
            <motion.div
                className="flex flex-col items-center justify-center min-h-screen bg-background p-6"
                variants={pageTransition}
                initial="hidden"
                animate="visible"
            >
                <div className="w-full max-w-lg">
                    {/* Welcome greeting */}
                    <motion.div
                        className="text-center mb-12"
                        variants={slideUp}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                            Benvenuto, <span className="text-primary">{displayName}</span>
                        </h1>
                    </motion.div>

                    {/* Class display */}
                    <motion.div
                        className="text-center mb-10"
                        variants={slideUp}
                        transition={{ delay: 0.1 }}
                    >
                        <p className="text-lg text-muted-foreground mb-3">
                            Ecco la
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <motion.div
                                className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <GraduationCap className="w-8 h-8" />
                            </motion.div>
                            <div>
                                <motion.h2
                                    className="text-5xl md:text-6xl font-bold tracking-tight"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                >
                                    {scheduledClass.name}
                                </motion.h2>
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <Users className="w-4 h-4" />
                                    {scheduledClass.studentCount} studenti
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Warning for students over limit */}
                    <AnimatePresence>
                        {studentsOverLimit.length > 0 && (
                            <motion.div
                                className="mb-6"
                                variants={scaleIn}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                            >
                                <Card className="border-destructive bg-destructive/5">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                                            <motion.div
                                                animate={{ rotate: [0, -10, 10, 0] }}
                                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                                            >
                                                <AlertTriangle className="h-4 w-4" />
                                            </motion.div>
                                            Attenzione Giustifiche
                                        </CardTitle>
                                        <CardDescription>
                                            {studentsOverLimit.length} student{studentsOverLimit.length > 1 ? 'i' : 'e'} ha{studentsOverLimit.length > 1 ? 'nno' : ''} superato la soglia
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex flex-wrap gap-2">
                                            {studentsOverLimit.slice(0, 5).map((s: Student, index) => (
                                                <motion.div
                                                    key={s.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    <Link
                                                        to={`/students/${s.id}`}
                                                        className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full hover:bg-destructive/20 transition-colors"
                                                    >
                                                        {s.firstName} {s.lastName}
                                                    </Link>
                                                </motion.div>
                                            ))}
                                            {studentsOverLimit.length > 5 && (
                                                <span className="text-xs text-muted-foreground px-2 py-1">
                                                    +{studentsOverLimit.length - 5} altri
                                                </span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* CTA Button */}
                    <motion.div
                        className="flex justify-center"
                        variants={slideUp}
                        transition={{ delay: 0.3 }}
                    >
                        <motion.div {...buttonPress}>
                            <Button
                                size="lg"
                                onClick={() => handleStartEvaluation(scheduledClass.id)}
                                className="px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                            >
                                Cominciamo a valutare!
                                <motion.div
                                    className="ml-2"
                                    whileHover={{ x: 5 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </motion.div>
                            </Button>
                        </motion.div>
                    </motion.div>

                    {/* Link to all classes */}
                    <motion.div
                        className="text-center mt-8"
                        variants={slideUp}
                        transition={{ delay: 0.4 }}
                    >
                        <button
                            onClick={handleGoToDashboard}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Oppure vai al dashboard →
                        </button>
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    // No scheduled class - show all classes menu
    return (
        <Navigate to="/dashboard" />
    );
}


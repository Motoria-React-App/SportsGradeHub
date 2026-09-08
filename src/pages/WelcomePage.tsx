import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth, useSchoolData } from "@/provider/clientProvider";
import { useSchedule } from "@/provider/scheduleProvider";
import { useSettings } from "@/provider/settingsProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, ArrowRight, AlertTriangle } from "lucide-react";
import type { Student, Justification } from "@/types/types";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition, slideUp, scaleIn } from "@/lib/motion";
import LoadingPage from "./Loading";



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
        return <LoadingPage />;
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
                className="relative flex flex-col items-center justify-center min-h-screen bg-background p-4 overflow-hidden"
                variants={pageTransition}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                {/* Background ambient glows */}
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div 
                        className="absolute -top-12 -left-12 w-[350px] h-[350px] rounded-full bg-primary/5 blur-[120px]"
                        animate={{
                            x: [0, 20, 0],
                            y: [0, -20, 0],
                        }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    <motion.div 
                        className="absolute -bottom-12 -right-12 w-[350px] h-[350px] rounded-full bg-primary/5 blur-[120px]"
                        animate={{
                            x: [0, -20, 0],
                            y: [0, 20, 0],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1,
                        }}
                    />
                </div>

                <motion.div 
                    className="w-full max-w-lg p-8 md:p-12 rounded-3xl bg-card/50 backdrop-blur-xl border border-muted-foreground/15 shadow-2xl relative z-10 flex flex-col items-center"
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", damping: 15, stiffness: 100 }}
                >
                    {/* Welcome greeting */}
                    <motion.div
                        className="text-center mb-10 w-full"
                        variants={slideUp}
                    >
                        <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-2">Benvenuto</p>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                            Prof. <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">{displayName}</span>
                        </h1>
                    </motion.div>

                    {/* Class display Card */}
                    <motion.div
                        className="w-full text-center mb-8 p-6 rounded-2xl bg-muted/40 border border-muted-foreground/10"
                        variants={slideUp}
                        transition={{ delay: 0.1 }}
                    >
                        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">
                            Classe In Corso
                        </p>
                        <div className="flex flex-col items-center gap-3">
                            <motion.div
                                className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary shadow-inner"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <GraduationCap className="w-7 h-7" />
                            </motion.div>
                            <div className="space-y-1">
                                <motion.h2
                                    className="text-4xl md:text-5xl font-extrabold tracking-tight"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                >
                                    {scheduledClass.name}
                                </motion.h2>
                                <p className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1">
                                    <Users className="w-3.5 h-3.5" />
                                    {scheduledClass.studentCount} studenti registrati
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Warning for students over limit */}
                    <AnimatePresence>
                        {studentsOverLimit.length > 0 && (
                            <motion.div
                                className="mb-6 w-full"
                                variants={scaleIn}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                            >
                                <Card className="border-destructive/30 bg-destructive/5 overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
                                            <motion.div
                                                animate={{ rotate: [0, -10, 10, 0] }}
                                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2.5 }}
                                            >
                                                <AlertTriangle className="h-4 w-4" />
                                            </motion.div>
                                            Attenzione Giustifiche
                                        </CardTitle>
                                        <CardDescription className="text-xs text-destructive/80 font-medium">
                                            {studentsOverLimit.length} student{studentsOverLimit.length > 1 ? 'i' : 'e'} ha{studentsOverLimit.length > 1 ? 'nno' : ''} superato la soglia di giustifiche:
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {studentsOverLimit.slice(0, 5).map((s: Student, index) => (
                                                <motion.div
                                                    key={s.id}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    <Link
                                                        to={`/students/${s.id}`}
                                                        className="text-xs bg-destructive/10 text-destructive font-semibold px-2.5 py-1 rounded-full hover:bg-destructive/20 transition-all border border-destructive/10"
                                                    >
                                                        {s.firstName} {s.lastName}
                                                    </Link>
                                                </motion.div>
                                            ))}
                                            {studentsOverLimit.length > 5 && (
                                                <span className="text-xs text-muted-foreground px-2 py-1 font-medium bg-muted/50 rounded-full border border-muted-foreground/5">
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
                        className="w-full flex justify-center mt-2"
                        variants={slideUp}
                        transition={{ delay: 0.2 }}
                    >
                        <Button
                            size="lg"
                            onClick={() => handleStartEvaluation(scheduledClass.id)}
                            className="w-full py-6 text-base font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 group flex items-center justify-center gap-2"
                        >
                            Cominciamo a valutare!
                            <motion.div
                                animate={{ x: [0, 4, 0] }}
                                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                            >
                                <ArrowRight className="w-4 h-4" />
                            </motion.div>
                        </Button>
                    </motion.div>

                    {/* Link to dashboard */}
                    <motion.div
                        className="text-center mt-6"
                        variants={slideUp}
                        transition={{ delay: 0.3 }}
                    >
                        <button
                            onClick={handleGoToDashboard}
                            className="text-xs font-semibold tracking-wider uppercase text-muted-foreground hover:text-foreground transition-all"
                        >
                            Oppure vai al dashboard →
                        </button>
                    </motion.div>
                </motion.div>
            </motion.div>
        );
    }

    // No scheduled class - show all classes menu
    return (
        <Navigate to="/dashboard" />
    );
}


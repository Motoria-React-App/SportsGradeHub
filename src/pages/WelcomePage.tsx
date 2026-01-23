import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/provider/clientProvider";
import { useSchedule } from "@/provider/scheduleProvider";
import { Button } from "@/components/ui/button"
import { GraduationCap, Users, ArrowRight } from "lucide-react";


const LAST_CLASS_KEY = "sportsgrade_last_class";

export default function WelcomePage() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { getCurrentClass } = useSchedule();

    // Redirect to login if not authenticated

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Get the currently scheduled class based on the current time
    const scheduledClass = getCurrentClass();

    // Extract first name from user
    const displayName = user?.user?.displayName || "Professore";

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


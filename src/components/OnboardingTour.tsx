import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconInnerShadowTop } from "@tabler/icons-react";

interface Step {
    title: string;
    description: string;
    image?: string;
    color: string;
    video?: string;
}

const STEPS: Step[] = [
    {
        title: "Benvenuto su SportsGradeHub!",
        description: "Siamo felici di averti a bordo. Questa breve guida ti mostrerà come ottenere il massimo dalla tua nuova piattaforma di valutazione sportiva.",
        // image: "/onboarding/welcome.png",
        color: "",
    },
    {
        title: "Dashboard e Statistiche",
        description: "Monitora l'andamento generale dei tuoi studenti. Visualizza medie, completamento valutazioni e trend di crescita in un colpo d'occhio.",
        image: "/onboarding/dashboard.png",
        color: "",
    },
    {
        title: "Gestione Classi e Studenti",
        description: "Crea le tue classi in pochi secondi. Aggiungi studenti manualmente o importa liste per organizzare il tuo lavoro in modo efficiente.",
        image: "/onboarding/classes.png",
        color: "",
    },
    {
        title: "Catalogo Esercizi",
        description: "Configura i tuoi esercizi personalizzati. Scegli tra valutazione a fasce, a criteri o mista per adattare l'app a qualsiasi disciplina sportiva.",
        image: "/onboarding/exercise.png",
        color: "",
    },
    {
        title: "Valutazioni Veloci",
        description: "Il cuore dell'app. Inserisci le prestazioni direttamente sul campo. Il sistema calcolerà automaticamente punteggi e medie in tempo reale.",
        image: "/onboarding/evaluation.png",
        color: "",
    },
    {
        title: "Personalizzazione Avanzata",
        description: "Adatta SportsGradeHub alle tue esigenze. Configura parametri di sessione, preferenze di calcolo e molto altro dalle impostazioni. Puoi anche abilitare l'organizzazione degli esercizi in gruppi tematici per una gestione ancora più strutturata.",
        image: "/onboarding/setting.png",
        color: "",
    },
];

export function OnboardingTour() {
    const [open, setOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const hasCompletedTour = localStorage.getItem("onboarding_completed");
        if (true) {
            setOpen(true);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem("onboarding_completed", "true");
        setOpen(false);
    };

    const handleSkip = () => {
        handleComplete();
    };

    const step = STEPS[currentStep];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent showCloseButton={false} className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-xl">
                <div className="flex flex-col h-[600px] md:h-auto">
                    {/* Header/Image Area */}
                    <div className={cn("relative w-full aspect-video overflow-hidden bg-linear-to-br", step.color)}>
                        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                        {step.image && (
                            <img
                                src={step.image}
                                alt={step.title}
                                className="w-full h-full object-cover rounded-lg transform scale-95 transition-transform duration-700 hover:scale-100"
                            />
                        ) || (
                                <div className="w-full h-full flex items-center justify-center">
                                    <IconInnerShadowTop className="h-16 w-16 text-primary" />
                                </div>
                            )}
                        {step.video && (
                            <video
                                src={step.video}
                                autoPlay
                                loop
                                muted
                                className="w-full h-full object-cover transform scale-95 transition-transform duration-700 hover:scale-100"
                            />
                        )}
                        {/* Close/Skip button top right */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full h-8 w-8 z-50"
                            onClick={handleSkip}
                        >
                            <X className="h-4 w-4" />
                        </Button>

                        {/* Step Counter Overlay */}
                        <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[10px] font-bold text-white tracking-widest uppercase">
                            Step {currentStep + 1} / {STEPS.length}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-8 pb-4 space-y-6 flex flex-col items-center text-center">
                        <div className="space-y-2 max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent text-center bg-linear-to-b from-foreground to-foreground/70">
                                    {step.title}
                                </DialogTitle>
                            </DialogHeader>
                            <p className="text-base text-muted-foreground leading-relaxed">
                                {step.description}
                            </p>
                        </div>

                        {/* Progress Indicators */}
                        <div className="flex gap-2 pb-2">
                            {STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-300",
                                        currentStep === i ? "w-8 bg-primary" : "w-1.5 bg-primary/20"
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Footer Area */}
                    <DialogFooter className="p-8 pt-0 flex flex-row items-center justify-between sm:justify-between w-full gap-4">
                        <Button
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground text-xs"
                            onClick={handleSkip}
                        >
                            Salta Tour
                        </Button>

                        <div className="flex items-center gap-2">
                            {currentStep > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBack}
                                    className="h-10 text-xs font-semibold px-4"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Indietro
                                </Button>
                            )}

                            <Button
                                onClick={handleNext}
                                className={cn(
                                    "h-10 text-xs font-bold px-6 shadow-lg shadow-primary/20 transition-all",
                                    currentStep === STEPS.length - 1 ? "bg-emerald-600 hover:bg-emerald-700" : "bg-primary hover:bg-primary/90"
                                )}
                            >
                                {currentStep === STEPS.length - 1 ? (
                                    <>
                                        Inizia ora
                                        <Check className="ml-2 h-4 w-4" />
                                    </>
                                ) : (
                                    <>
                                        Prossimo
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

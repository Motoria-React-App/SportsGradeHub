import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
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

interface StepConfig {
    titleKey: string;
    descKey: string;
    image?: string;
    color: string;
    video?: string;
}

const STEP_CONFIGS: StepConfig[] = [
    {
        titleKey: "banners.onboarding.step1Title",
        descKey: "banners.onboarding.step1Desc",
        color: "",
    },
    {
        titleKey: "banners.onboarding.step2Title",
        descKey: "banners.onboarding.step2Desc",
        image: "/onboarding/dashboard.png",
        color: "",
    },
    {
        titleKey: "banners.onboarding.step3Title",
        descKey: "banners.onboarding.step3Desc",
        image: "/onboarding/classes.png",
        color: "",
    },
    {
        titleKey: "banners.onboarding.step4Title",
        descKey: "banners.onboarding.step4Desc",
        image: "/onboarding/exercise.png",
        color: "",
    },
    {
        titleKey: "banners.onboarding.step5Title",
        descKey: "banners.onboarding.step5Desc",
        image: "/onboarding/evaluation.png",
        color: "",
    },
    {
        titleKey: "banners.onboarding.step6Title",
        descKey: "banners.onboarding.step6Desc",
        image: "/onboarding/setting.png",
        color: "",
    },
];

export function OnboardingTour() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const hasCompletedTour = localStorage.getItem("onboarding_completed");
        if (!hasCompletedTour) {
            setOpen(true);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < STEP_CONFIGS.length - 1) {
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

    const stepConfig = STEP_CONFIGS[currentStep];
    const stepTitle = t(stepConfig.titleKey);
    const stepDescription = t(stepConfig.descKey);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent showCloseButton={false} className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-xl">
                <div className="flex flex-col h-[600px] md:h-auto">
                    {/* Header/Image Area */}
                    <div className={cn("relative w-full aspect-video overflow-hidden bg-linear-to-br", stepConfig.color)}>
                        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                        {stepConfig.image ? (
                            <img
                                src={stepConfig.image}
                                alt={stepTitle}
                                className="w-full h-full object-cover rounded-lg transform scale-95 transition-transform duration-700 hover:scale-100"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <img src="/logoSGH.png" alt="SportsGradeHub Logo" className="h-16 w-16 object-cover rounded-full shadow-sm" />
                            </div>
                        )}
                        {stepConfig.video && (
                            <video
                                src={stepConfig.video}
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
                            {t("banners.onboarding.stepCounter", { current: currentStep + 1, total: STEP_CONFIGS.length, defaultValue: `Step ${currentStep + 1} / ${STEP_CONFIGS.length}` })}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-8 pb-4 space-y-6 flex flex-col items-center text-center">
                        <div className="space-y-2 max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent text-center bg-linear-to-b from-foreground to-foreground/70">
                                    {stepTitle}
                                </DialogTitle>
                            </DialogHeader>
                            <p className="text-base text-muted-foreground leading-relaxed">
                                {stepDescription}
                            </p>
                        </div>

                        {/* Progress Indicators */}
                        <div className="flex gap-2 pb-2">
                            {STEP_CONFIGS.map((_, i) => (
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
                            {t("banners.onboarding.skipTour", { defaultValue: "Salta Tour" })}
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
                                    {t("banners.onboarding.prevStep", { defaultValue: "Indietro" })}
                                </Button>
                            )}

                            <Button
                                onClick={handleNext}
                                className={cn(
                                    "h-10 text-xs font-bold px-6 shadow-lg shadow-primary/20 transition-all",
                                    currentStep === STEP_CONFIGS.length - 1 ? "bg-emerald-600 hover:bg-emerald-700" : "bg-primary hover:bg-primary/90"
                                )}
                            >
                                {currentStep === STEP_CONFIGS.length - 1 ? (
                                    <>
                                        {t("banners.onboarding.finishTour", { defaultValue: "Inizia ora" })}
                                        <Check className="ml-2 h-4 w-4" />
                                    </>
                                ) : (
                                    <>
                                        {t("banners.onboarding.nextStep", { defaultValue: "Prossimo" })}
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

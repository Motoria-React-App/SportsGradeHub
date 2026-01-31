import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface EasterEggData {
    name: string;
    title: string;
    message: string;
    emoji: string;
}

const EASTER_EGGS: Record<string, EasterEggData> = {
    sagal: {
        name: "Sagal",
        title: "🎉 Sagal [Placeholder]",
        message: "Sagalini Skibidini!",
        emoji: "⚡",
    },
    ricky: {
        name: "Ricky",
        title: "🚀 Riccardo [Placeholder]",
        message: "Borronini Skibidini!",
        emoji: "🔥",
    },
    amrit: {
        name: "Amrit",
        title: "✨ Amrit [Placeholder]",
        message: "Amritini Skibidini!",
        emoji: "💎",
    },
    turrina: {
        name: "Turrina",
        title: "✨ Turrina [Placeholder]",
        message: "Professorini Skibidini!",
        emoji: "🎓",
    },
};

export function EasterEgg() {
    const [, setTypedKeys] = useState("");
    const [activeEgg, setActiveEgg] = useState<EasterEggData | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const checkForEasterEgg = useCallback((input: string) => {
        const lowerInput = input.toLowerCase();
        for (const [trigger, data] of Object.entries(EASTER_EGGS)) {
            if (lowerInput.endsWith(trigger)) {
                return data;
            }
        }
        return null;
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input field
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as HTMLElement)?.isContentEditable
            ) {
                return;
            }

            // Only track letter keys
            if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
                setTypedKeys((prev) => {
                    const newKeys = (prev + e.key).slice(-10); // Keep last 10 characters
                    const egg = checkForEasterEgg(newKeys);
                    if (egg) {
                        setActiveEgg(egg);
                        setIsVisible(true);
                        return ""; // Reset after triggering
                    }
                    return newKeys;
                });
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [checkForEasterEgg]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => setActiveEgg(null), 300); // Wait for animation
    };

    if (!activeEgg) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
            onClick={handleClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className={`relative rounded-xl border border-primary/20 bg-background/95 backdrop-blur-md p-6 shadow-2xl max-w-[400px] w-full mx-4 transform transition-all duration-300 ${isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* Content */}
                <div className="flex flex-col items-center text-center">
                    {/* Animated emoji */}
                    <div className="text-6xl mb-4 animate-bounce">{activeEgg.emoji}</div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-foreground mb-2">
                        {activeEgg.title}
                    </h2>

                    {/* Divider */}
                    <div className="w-16 h-0.5 bg-primary/30 rounded-full mb-4" />

                    {/* Message */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {activeEgg.message}
                    </p>

                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-border/50 w-full">
                        <p className="text-xs text-muted-foreground/60">
                            You discovered the{" "}
                            <span className="font-semibold text-foreground">
                                {activeEgg.name}
                            </span>{" "}
                            easter egg! 🎊
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

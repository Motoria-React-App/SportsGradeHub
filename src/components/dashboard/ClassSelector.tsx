import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, GraduationCap, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Class } from "@/types/index";

interface ClassSelectorProps {
    classes: Class[];
    selectedClassId: string;
    onSelectClass: (classId: string) => void;
}

export function ClassSelector({ classes, selectedClassId, onSelectClass }: ClassSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (!classes || classes.length === 0) return null;

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 border border-transparent",
                    "bg-white/50 backdrop-blur-md dark:bg-zinc-900/50 hover:bg-white/80 dark:hover:bg-zinc-800/80",
                    "shadow-sm hover:shadow-md group",
                    isOpen && "ring-2 ring-primary/20 bg-white/90 dark:bg-zinc-800/90"
                )}
            >
                <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary transition-transform duration-300",
                    "group-hover:scale-110",
                    isOpen && "scale-110 bg-primary/20"
                )}>
                    <GraduationCap className="w-5 h-5" />
                </div>

                <div className="flex flex-col items-start mr-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Classe</span>
                    <span className="text-base font-bold leading-none">{selectedClass?.name} <span className="text-muted-foreground font-normal text-xs ml-1">{selectedClass?.year}</span></span>
                </div>

                <ChevronDown className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform duration-300",
                    isOpen && "rotate-180 text-primary"
                )} />
            </button>

            {/* Dropdown Menu */}
            <div className={cn(
                "absolute top-full left-0 mt-2 w-64 p-1 z-50 origin-top-left transition-all duration-200 ease-out",
                "bg-white dark:bg-zinc-950 border border-border/50 rounded-xl shadow-xl backdrop-blur-xl",
                isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            )}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Seleziona una classe
                </div>
                <div className="space-y-1">
                    {classes.map((cls) => (
                        <button
                            key={cls.id}
                            onClick={() => {
                                onSelectClass(cls.id);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "relative flex items-center w-full p-2 rounded-lg text-sm transition-colors",
                                "hover:bg-primary/5 dark:hover:bg-primary/10",
                                selectedClassId === cls.id ? "bg-primary/10 dark:bg-primary/20 text-primary font-medium" : "text-foreground"
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-md mr-3 text-xs font-bold",
                                selectedClassId === cls.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"
                            )}>
                                {cls.name.substring(0, 2)}
                            </div>

                            <div className="flex flex-col items-start flex-1">
                                <span>{cls.name}</span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Users className="w-3 h-3" /> {cls.studentCount} studenti
                                </span>
                            </div>

                            {selectedClassId === cls.id && (
                                <Check className="w-4 h-4 ml-2 animate-in zoom-in" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

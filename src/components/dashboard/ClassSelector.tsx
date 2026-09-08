import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, GraduationCap, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { SchoolClass } from "@/types/types";
import { motion, AnimatePresence } from "framer-motion";
import { slideDown, staggerContainer, staggerItem } from "@/lib/motion";

interface ClassSelectorProps {
    classes: SchoolClass[];
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
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative flex items-center gap-3 px-4 py-2 rounded-xl border border-transparent",
                    "bg-white/50 backdrop-blur-md dark:bg-zinc-900/50 hover:bg-white/80 dark:hover:bg-zinc-800/80",
                    "shadow-sm hover:shadow-md group",
                    isOpen && "ring-2 ring-primary/20 bg-white/90 dark:bg-zinc-800/90"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <motion.div
                    className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary",
                        isOpen && "bg-primary/20"
                    )}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <GraduationCap className="w-5 h-5" />
                </motion.div>

                <div className="flex flex-col items-start mr-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Classe</span>
                    <span className="text-base font-bold leading-none">{selectedClass?.className} <span className="text-muted-foreground font-normal text-xs ml-1">{selectedClass?.schoolYear}</span></span>
                </div>

                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown className={cn(
                        "w-4 h-4 text-muted-foreground",
                        isOpen && "text-primary"
                    )} />
                </motion.div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="absolute top-full left-0 mt-2 w-64 p-1 z-50 origin-top-left"
                        variants={slideDown}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        <div className="bg-white dark:bg-zinc-950 border border-border/50 rounded-xl shadow-xl backdrop-blur-xl">
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                Seleziona una classe
                            </div>
                            <motion.div
                                className="space-y-1"
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                            >
                                {classes.map((cls, index) => (
                                    <motion.button
                                        key={cls.id}
                                        variants={staggerItem}
                                        custom={index}
                                        onClick={() => {
                                            onSelectClass(cls.id);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "relative flex items-center w-full p-2 rounded-lg text-sm",
                                            "hover:bg-primary/5 dark:hover:bg-primary/10",
                                            selectedClassId === cls.id ? "bg-primary/10 dark:bg-primary/20 text-primary font-medium" : "text-foreground"
                                        )}
                                        whileHover={{ x: 4 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <motion.div
                                            className={cn(
                                                "flex items-center justify-center w-8 h-8 rounded-md mr-3 text-xs font-bold",
                                                selectedClassId === cls.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"
                                            )}
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                        >
                                            {cls.className.substring(0, 2)}
                                        </motion.div>

                                        <div className="flex flex-col items-start flex-1">
                                            <span>{cls.className}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Users className="w-3 h-3" /> {cls.students.length} studenti
                                            </span>
                                        </div>

                                        <AnimatePresence>
                                            {selectedClassId === cls.id && (
                                                <motion.div
                                                    initial={{ scale: 0, rotate: -90 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    exit={{ scale: 0, rotate: 90 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                >
                                                    <Check className="w-4 h-4 ml-2" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>
                                ))}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

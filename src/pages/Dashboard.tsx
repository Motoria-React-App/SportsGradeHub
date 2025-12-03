import { useState, useRef, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { classes } from "@/data/mockData";
import { GradeEntryModal } from "@/components/Grading/GradeEntryModal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import TableComp from "@/components/dashboard/table";

export default function Dashboard() {
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1); // -1 for rounding errors
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [classes]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >

            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col p-4 md:p-6 space-y-8 animate-in fade-in duration-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-between w-full gap-4">
                            <div className="flex flex-col">
                                <label htmlFor="class-select" className="sr-only">Seleziona classe</label>
                                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                    <SelectTrigger className="w-[110px] text-2xl font-bold tracking-tight border-none shadow-none p-0 pl-2 h-auto focus:ring-0 hover:text-zinc-300 transition-colors duration-200">
                                        <SelectValue placeholder="Seleziona classe">
                                            {classes.find(c => c.id === selectedClassId)?.name || "Seleziona classe"}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="min-w-[110px] w-[110px]">
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id}>
                                                <span className="font-bold">{cls.name}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-muted-foreground mt-1">Seleziona una classe per visualizzare gli studenti</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setIsGradeModalOpen(true)}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Nuova Valutazione
                        </Button>
                    </div>

                    {/* Scrollable Class Selection */}
                    <div className="relative w-full max-w-full">
                        <div className="flex items-center gap-2 w-full">
                            {canScrollLeft && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-full shrink-0"
                                    onClick={() => scroll('left')}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            )}
                            {canScrollRight && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-full shrink-0"
                                    onClick={() => scroll('right')}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Students Table for Selected Class */}
                    <TableComp />



                    {/* Grade Entry Modal */}
                    <GradeEntryModal
                        isOpen={isGradeModalOpen}
                        onClose={() => setIsGradeModalOpen(false)}
                    />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

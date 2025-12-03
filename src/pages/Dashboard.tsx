import { useState, useRef, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Plus, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { classes, getStudentsByClass } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { GradeEntryModal } from "@/components/Grading/GradeEntryModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";

export default function Dashboard() {
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const selectedClassStudents = selectedClassId ? getStudentsByClass(selectedClassId) : [];

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
                       <DropdownMenu>
  <DropdownMenuTrigger className="flex items-center gap-2 text-3xl font-bold tracking-tight hover:text-zinc-300 transition-colors duration-200 focus:outline-none">
    {classes.find(c => c.id === selectedClassId)?.name || "Seleziona classe"}
    <span className="text-lg text-zinc-400 font-normal">
      - {classes.find(c => c.id === selectedClassId)?.studentCount || 0} Studenti
    </span>
    <ChevronDown className="h-6 w-6" />
  </DropdownMenuTrigger>
  <DropdownMenuContent 
    align="start"
    className="bg-zinc-900 border-zinc-800 shadow-md backdrop-blur-sm"
  >
    {classes.map((cls) => (
      <DropdownMenuItem 
        key={cls.id} 
        onClick={() => setSelectedClassId(cls.id)}
        className={cn(
          "text-white cursor-pointer transition-all duration-200",
          "hover:bg-zinc-800/50 focus:bg-zinc-800/50",
          selectedClassId === cls.id 
            ? "bg-zinc-800 ring-1 ring-blue-500/50 border-l-2 border-blue-500" 
            : ""
        )}
      >
        {cls.name} - {cls.studentCount} Studenti
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
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
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Studenti - Classe {classes.find(c => c.id === selectedClassId)?.name}</CardTitle>
                    <CardDescription>
                        Elenco degli studenti, medie e andamento
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[250px]">Nome</TableHead>
                                <TableHead className="text-center">Media</TableHead>
                                <TableHead className="text-center">Andamento</TableHead>
                                <TableHead className="text-right">Voti Totali</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedClassStudents.map((student) => (
                                <TableRow key={student.id} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {student.fullName.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            {student.fullName}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-lg">
                                        {student.averageGrade}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={cn(
                                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors",
                                            student.trends.improving 
                                                ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-400/20"
                                                : "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-400/20"
                                        )}>
                                            {student.trends.improving ? (
                                                <TrendingUp className="h-3 w-3" />
                                            ) : (
                                                <TrendingUp className="h-3 w-3 rotate-180" />
                                            )}
                                            {student.trends.improving ? "In crescita" : "In calo"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {student.totalGrades} voti
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

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

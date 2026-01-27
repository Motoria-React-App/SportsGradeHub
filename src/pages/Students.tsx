import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useClient, useSchoolData } from "@/provider/clientProvider";
import { useSettings } from "@/provider/settingsProvider";
import { Search, Plus, Filter, MoreHorizontal, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Student, Justification } from "@/types/types";
import { StudentDialog } from "@/components/student-dialog";
import { toast } from "sonner";


export default function Students() {
    const client = useClient();
    const { students, classes, refreshStudents } = useSchoolData();
    const { settings } = useSettings();
    const [selectedClass, setSelectedClass] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // Delete student handler
    const handleDeleteStudent = async (student: Student) => {
        if (!confirm(`Sei sicuro di voler eliminare ${student.firstName} ${student.lastName}?`)) {
            return;
        }
        try {
            const res = await client.deleteStudent(student.id);
            if (res.success) {
                toast.success(`Studente "${student.firstName} ${student.lastName}" eliminato`);
                refreshStudents();
            } else {
                toast.error("Errore durante l'eliminazione");
            }
        } catch {
            toast.error("Errore durante l'eliminazione");
        }
    };

    const filteredStudents = useMemo(() => {
        return students
            .filter(student => {
                const matchesClass = selectedClass === "all" || student.currentClassId === selectedClass;
                const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
                const matchesSearch = fullName.includes(searchQuery.toLowerCase());
                return matchesClass && matchesSearch;
            })
            .sort((a, b) => a.lastName.localeCompare(b.lastName));
    }, [students, selectedClass, searchQuery]);

    // Get class name by id
    const getClassName = (classId: string) => {
        const cls = classes.find(c => c.id === classId);
        return cls?.className || "N/A";
    };

    // Check if student exceeds justification limit
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

    const isOverLimit = (student: Student) => {
        const count = getJustificationsInPeriod(student.justifications || []);
        return count >= settings.maxJustifications;
    };

    return (
        <div className="flex flex-1 flex-col p-4 md:p-6 space-y-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Studenti</h1>
                    <p className="text-muted-foreground">Gestione anagrafica studenti ({students.length} totali)</p>
                </div>
                <Button className="gap-2" onClick={() => { setSelectedStudent(null); setDialogOpen(true); }}>
                    <Plus className="h-4 w-4" />
                    Nuovo Studente
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-[300px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Cerca studente..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filtra per classe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tutte le classi</SelectItem>
                            {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                    Classe {cls.className}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Elenco Studenti</CardTitle>
                    <CardDescription>
                        Visualizzazione di {filteredStudents.length} studenti
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Classe</TableHead>
                                <TableHead>Sesso</TableHead>
                                <TableHead>Data di Nascita</TableHead>
                                <TableHead className="text-right">Azioni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">
                                            <Link to={`/students/${student.id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                                    {student.firstName[0]}{student.lastName[0]}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        <div>{student.firstName} {student.lastName}</div>
                                                        {student.notes && (
                                                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{student.notes}</div>
                                                        )}
                                                    </div>
                                                    {isOverLimit(student) && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Soglia giustifiche superata ({getJustificationsInPeriod(student.justifications || [])}/{settings.maxJustifications})</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10">
                                                {getClassName(student.currentClassId)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                student.gender === 'M' && "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/20",
                                                student.gender === 'F' && "bg-pink-50 text-pink-700 ring-pink-600/20 dark:bg-pink-900/30 dark:text-pink-400 dark:ring-pink-400/20",
                                                !student.gender && "bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-400/20"
                                            )}>
                                                {student.gender === 'M' ? 'Maschio' : student.gender === 'F' ? 'Femmina' : 'N/D'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {student.birthdate ? new Date(student.birthdate).toLocaleDateString("it-IT") : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={() => { setSelectedStudent(student); setDialogOpen(true); }}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Modifica
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onSelect={(e) => {
                                                            e.preventDefault();
                                                            handleDeleteStudent(student);
                                                        }}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Elimina
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        {students.length === 0 ? "Nessuno studente disponibile" : "Nessuno studente trovato."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            {/* Student Dialog */}
            <StudentDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                student={selectedStudent}
                onSuccess={refreshStudents}
            />
        </div>
    );
}

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useClient, useSchoolData } from "@/provider/clientProvider";
import { useSettings } from "@/provider/settingsProvider";
import { Search, Plus, Filter, Trash2, X, Copy, FileText } from "lucide-react";
import { Student, Justification, Evaluation } from "@/types/types";
import { StudentDialog } from "@/components/student-dialog";
import { StudentsTable } from "@/components/students-table";
import { toast } from "sonner";


export default function Students() {
    const client = useClient();
    const { students, classes, evaluations, refreshStudents } = useSchoolData();
    const { settings } = useSettings();
    const [selectedClass, setSelectedClass] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

    // Calculate average score for a student in current year
    const getStudentYearAverage = (studentId: string): number | null => {
        const currentYear = new Date().getFullYear();
        const studentEvals = evaluations.filter(
            (e: Evaluation) =>
                e.studentId === studentId &&
                e.score > 0 &&
                new Date(e.createdAt).getFullYear() === currentYear
        );

        if (studentEvals.length === 0) return null;

        const sum = studentEvals.reduce((acc: number, e: Evaluation) => acc + e.score, 0);
        return Math.round((sum / studentEvals.length) * 10) / 10;
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

    // Statistics
    const studentsWithFailingAverage = useMemo(() => {
        return filteredStudents.filter(student => {
            const avg = getStudentYearAverage(student.id);
            return avg !== null && avg < 6;
        }).length;
    }, [filteredStudents, evaluations]);

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

    // Selection handlers
    const toggleSelectAll = () => {
        if (selectedStudents.size === filteredStudents.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
        }
    };

    const toggleSelectStudent = (studentId: string) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const handleBulkDelete = () => {
        setDeleteDialogOpen(true);
    };

    const confirmBulkDelete = async () => {
        try {
            for (const studentId of selectedStudents) {
                await client.deleteStudent(studentId);
            }
            toast.success(`${selectedStudents.size} studenti eliminati`);
            setSelectedStudents(new Set());
            setDeleteDialogOpen(false);
            refreshStudents();
        } catch {
            toast.error("Errore durante l'eliminazione");
        }
    };

    return (
        <div className="flex flex-1 flex-col p-4 md:p-6 space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Studenti</h1>
                    <p className="text-muted-foreground">Gestione anagrafica studenti</p>
                </div>
                <Button className="gap-2" onClick={() => { setSelectedStudent(null); setDialogOpen(true); }}>
                    <Plus className="h-4 w-4" />
                    Nuovo Studente
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs">Totale Studenti</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{filteredStudents.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs text-orange-600 dark:text-orange-400">Media Insufficiente</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{studentsWithFailingAverage}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs text-green-600 dark:text-green-400">Media Sufficiente</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {filteredStudents.filter(s => {
                                const avg = getStudentYearAverage(s.id);
                                return avg !== null && avg >= 6;
                            }).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs text-red-600 dark:text-red-400">Giustifiche Eccessive</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                            {filteredStudents.filter(isOverLimit).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
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
                    <Select disabled value={selectedClass} onValueChange={setSelectedClass}>
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

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <StudentsTable
                        students={filteredStudents}
                        onEdit={(student) => { setSelectedStudent(student); setDialogOpen(true); }}
                        onDelete={handleDeleteStudent}
                        showCheckboxes={true}
                        showNotes={true}
                        showYearAverage={true}
                        getYearAverage={getStudentYearAverage}
                        getClassName={getClassName}
                        isOverLimit={isOverLimit}
                        getJustificationsCount={(student) => getJustificationsInPeriod(student.justifications || [])}
                        maxJustifications={settings.maxJustifications}
                        selectedStudents={selectedStudents}
                        onToggleSelect={toggleSelectStudent}
                        onToggleSelectAll={toggleSelectAll}
                    />
                </CardContent>
            </Card>

            {/* Bulk Actions Bar */}
            {selectedStudents.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
                    <Card className="shadow-lg border-2">
                        <CardContent className="px-4">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium">
                                    {selectedStudents.size} Selezionat{selectedStudents.size === 1 ? 'o' : 'i'}
                                </span>
                                <div className="h-4 w-px bg-border" />
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => toast.info("Funzione in sviluppo")}>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Duplica
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => toast.info("Funzione in sviluppo")}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Esporta
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Elimina
                                    </Button>
                                </div>
                                <div className="h-4 w-px bg-border" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedStudents(new Set())}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Student Dialog */}
            <StudentDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                student={selectedStudent}
                onSuccess={refreshStudents}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sei sicuro di voler eliminare gli studenti?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Stai per eliminare {selectedStudents.size} student{selectedStudents.size === 1 ? 'e' : 'i'}.
                            Questa azione non può essere annullata.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive hover:bg-destructive/90">
                            Elimina
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

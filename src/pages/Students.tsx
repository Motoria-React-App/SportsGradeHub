import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition, staggerContainer, staggerItem, slideUp, buttonPress, cardHover } from "@/lib/motion";



export default function Students() {
    const client = useClient();
    const { classes, students, evaluations, refreshStudents, setStudents } = useSchoolData();
    const { settings } = useSettings();
    const [selectedClass, setSelectedClass] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set<string>());

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
                setStudents((prev) => prev.filter((s) => s.id !== student.id));
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

            // Remove deleted students from local state
            const deletedIds = new Set<string>(selectedStudents);
            setStudents((prev: Student[]) => prev.filter((s: Student) => !deletedIds.has(s.id)));

            setSelectedStudents(new Set<string>());
            setDeleteDialogOpen(false);
        } catch {
            toast.error("Errore durante l'eliminazione");
        }
    };

    return (
        <motion.div
            className="flex flex-1 flex-col p-4 md:p-6 space-y-6"
            variants={pageTransition}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div
                className="flex items-center justify-between"
                variants={slideUp}
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Studenti</h1>
                    <p className="text-muted-foreground">Gestione anagrafica studenti</p>
                </div>
                <motion.div {...buttonPress}>
                    <Button className="gap-2" onClick={() => { setSelectedStudent(null); setDialogOpen(true); }}>
                        <Plus className="h-4 w-4" />
                        Nuovo Studente
                    </Button>
                </motion.div>
            </motion.div>

            {/* Statistics Cards */}
            <motion.div
                className="grid gap-3 md:grid-cols-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={staggerItem}>
                    <motion.div {...cardHover}>
                        <Card className="overflow-hidden">
                            <CardContent className="p-4 flex flex-col justify-center min-h-[80px]">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Totale Studenti</p>
                                <motion.p
                                    className="text-2xl font-bold leading-none mt-1.5"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                >
                                    {filteredStudents.length}
                                </motion.p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
                <motion.div variants={staggerItem}>
                    <motion.div {...cardHover}>
                        <Card className="overflow-hidden">
                            <CardContent className="p-4 flex flex-col justify-center min-h-[80px]">
                                <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Media Insufficiente</p>
                                <motion.p
                                    className="text-2xl font-bold leading-none mt-1.5 text-orange-600 dark:text-orange-400"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                                >
                                    {studentsWithFailingAverage}
                                </motion.p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
                <motion.div variants={staggerItem}>
                    <motion.div {...cardHover}>
                        <Card className="overflow-hidden">
                            <CardContent className="p-4 flex flex-col justify-center min-h-[80px]">
                                <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Media Sufficiente</p>
                                <motion.p
                                    className="text-2xl font-bold leading-none mt-1.5 text-green-600 dark:text-green-400"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                                >
                                    {filteredStudents.filter(s => {
                                        const avg = getStudentYearAverage(s.id);
                                        return avg !== null && avg >= 6;
                                    }).length}
                                </motion.p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
                <motion.div variants={staggerItem}>
                    <motion.div {...cardHover}>
                        <Card className="overflow-hidden">
                            <CardContent className="p-4 flex flex-col justify-center min-h-[80px]">
                                <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Giustifiche Eccessive</p>
                                <motion.p
                                    className="text-2xl font-bold leading-none mt-1.5 text-red-600 dark:text-red-400"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                                >
                                    {filteredStudents.filter(isOverLimit).length}
                                </motion.p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            </motion.div>

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
            <AnimatePresence>
                {selectedStudents.size > 0 && (
                    <motion.div
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <Card className="shadow-lg border-2">
                            <CardContent className="px-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium">
                                        {selectedStudents.size} Selezionat{selectedStudents.size === 1 ? 'o' : 'i'}
                                    </span>
                                    <div className="h-4 w-px bg-border" />
                                    <div className="flex items-center gap-2">
                                        <motion.div {...buttonPress}>
                                            <Button variant="outline" size="sm" onClick={() => toast.info("Funzione in sviluppo")}>
                                                <Copy className="h-4 w-4 mr-2" />
                                                Duplica
                                            </Button>
                                        </motion.div>
                                        <motion.div {...buttonPress}>
                                            <Button variant="outline" size="sm" onClick={() => toast.info("Funzione in sviluppo")}>
                                                <FileText className="h-4 w-4 mr-2" />
                                                Esporta
                                            </Button>
                                        </motion.div>
                                        <motion.div {...buttonPress}>
                                            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Elimina
                                            </Button>
                                        </motion.div>
                                    </div>
                                    <div className="h-4 w-px bg-border" />
                                    <motion.div {...buttonPress}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedStudents(new Set())}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </motion.div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

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
        </motion.div>
    );
}
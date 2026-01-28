

import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useClient, useSchoolData } from "@/provider/clientProvider";
import { useSettings } from "@/provider/settingsProvider";
import { SchoolClassExpanded, ExerciseGroupExpanded, Student } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Plus, Users } from "lucide-react";
import { StudentDialog } from "@/components/student-dialog";
import { StudentsTable } from "@/components/students-table";


export default function Classes() {

    const { id } = useParams<{ id: string }>();
    const client = useClient();
    const { evaluations, classes } = useSchoolData();
    const { settings } = useSettings();
    const [schoolClass, setSchoolClass] = useState<SchoolClassExpanded | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

    // Selection handlers
    const toggleSelectAll = () => {
        if (!schoolClass) return;
        if (selectedStudents.size === schoolClass.students.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(schoolClass.students.map(s => s.id)));
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

    // Student dialog state
    const [studentDialogOpen, setStudentDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // Calculate average score for a student in current year
    const getStudentYearAverage = (studentId: string): number | null => {
        const currentYear = new Date().getFullYear();
        const studentEvals = evaluations.filter(
            (e: any) =>
                e.studentId === studentId &&
                e.score > 0 &&
                new Date(e.createdAt).getFullYear() === currentYear
        );

        if (studentEvals.length === 0) return null;

        const sum = studentEvals.reduce((acc: number, e: any) => acc + e.score, 0);
        return Math.round((sum / studentEvals.length) * 10) / 10;
    };

    // Get class name by id
    const getClassName = (classId: string) => {
        const cls = classes.find((c: any) => c.id === classId);
        return cls?.className || "N/A";
    };

    // Check if student exceeds justification limit
    const currentPeriod = settings.schoolPeriods.find(
        (p: any) => p.id === settings.currentPeriodId
    );

    const getJustificationsInPeriod = (justifications: any[]) => {
        if (!currentPeriod) return justifications.length;
        return justifications.filter((j: any) => {
            const jDate = new Date(j.date);
            return jDate >= new Date(currentPeriod.startDate) && jDate <= new Date(currentPeriod.endDate);
        }).length;
    };

    const isOverLimit = (student: Student) => {
        const count = getJustificationsInPeriod(student.justifications || []);
        return count >= settings.maxJustifications;
    };

    // Fetch class data
    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const classRes = await client.getClassById(id);
            if (classRes.success && classRes.data) {
                setSchoolClass(classRes.data);
            }
        } catch (error) {
            console.error("Failed to fetch class data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, client]);



    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-64 bg-muted rounded"></div>
                    <div className="h-4 w-48 bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    if (!schoolClass) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <h2 className="text-2xl font-bold">Classe non trovata</h2>
                <p className="text-muted-foreground">La classe richiesta non esiste o è stata rimossa.</p>
                <Button onClick={() => window.history.back()}>
                    Torna indietro
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col p-4 md:p-6 space-y-6 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold tracking-tight">{schoolClass.className}</h1>
                        <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            {schoolClass.schoolYear}
                        </span>
                    </div>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {schoolClass.students.length} Studenti iscritti
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Activity className="w-4 h-4" />
                        Gestisci Esercizi
                    </Button>
                    <Button className="gap-2" onClick={() => { setSelectedStudent(null); setStudentDialogOpen(true); }}>
                        <Plus className="w-4 h-4" />
                        Aggiungi Studente
                    </Button>
                </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="students" className="w-full">
                <TabsList className="grid w-full md:w-[400px] grid-cols-3">
                    <TabsTrigger value="students">Studenti</TabsTrigger>
                    <TabsTrigger value="exercises">Esercizi</TabsTrigger>
                    <TabsTrigger value="analytics">Analisi</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="students" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Elenco Studenti</CardTitle>
                                <CardDescription>
                                    Gestisci l'anagrafica degli studenti della classe {schoolClass.className}.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <StudentsTable
                                    students={[...schoolClass.students].sort((a, b) => a.lastName.localeCompare(b.lastName))}
                                    onEdit={(student) => {
                                        setSelectedStudent(student);
                                        setStudentDialogOpen(true);
                                    }}
                                    showCheckboxes={false}
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
                    </TabsContent>

                    <TabsContent value="exercises">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium">Piano di Lavoro</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Esercizi e gruppi di valutazione assegnati a questa classe.
                                    </p>
                                </div>
                                <Button className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    Assegna Gruppo
                                </Button>
                            </div>

                            {schoolClass.exerciseGroups && schoolClass.exerciseGroups.length > 0 ? (
                                <div className="space-y-8">
                                    {schoolClass.exerciseGroups.map((group: ExerciseGroupExpanded) => (
                                        <div key={group.id} className="space-y-4">
                                            <div className="flex items-center gap-3 pb-4 border-b">
                                                <div className="p-2 bg-primary/10 rounded-md text-primary">
                                                    <Activity className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-lg">{group.groupName}</h4>
                                                    <p className="text-xs text-muted-foreground">{group.exercises.length} esercizi inclusi</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {group.exercises.map((exercise) => {
                                                    return (
                                                        <Link to={"/valutazioni/" + schoolClass.className + "/" + exercise.id}>
                                                            <Card key={exercise.id} className="flex flex-col h-full hover:shadow-md transition-all duration-200 group/card">
                                                                <CardHeader className="pb-3">
                                                                    <div className="flex justify-between items-start gap-2">
                                                                        <CardTitle className="text-base font-bold leading-tight group-hover/card:text-primary transition-colors">
                                                                            {exercise.name}
                                                                        </CardTitle>
                                                                        {exercise.unit && (
                                                                            <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                                                                {exercise.unit}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </CardHeader>
                                                                <CardContent className="flex-1 pb-3 text-sm text-muted-foreground space-y-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Activity className="w-4 h-4 opacity-70" />
                                                                        <span>Valutazione: {exercise.evaluationRanges ? 'A Fasce' : 'Standard'}</span>
                                                                    </div>
                                                                    {exercise.maxScore && (
                                                                        <div className="flex items-center gap-2">
                                                                            <Activity className="w-4 h-4 opacity-70" />
                                                                            <span>Max Score: {exercise.maxScore}</span>
                                                                        </div>
                                                                    )}
                                                                </CardContent>
                                                            </Card>
                                                        </Link>
                                                    );
                                                })}
                                                {group.exercises.length === 0 && (
                                                    <div className="col-span-full py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                                        <p>Nessun esercizio in questo gruppo.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                        <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                        <h3 className="text-lg font-medium">Nessun programma assegnato</h3>
                                        <p className="text-muted-foreground max-w-sm mt-1 mb-4">
                                            Non ci sono ancora gruppi di esercizi collegati a questa classe.
                                        </p>
                                        <Button variant="outline">Crea Primo Gruppo</Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="analytics">
                        <Card>
                            <CardHeader>
                                <CardTitle>Analisi Classe</CardTitle>
                                <CardDescription>Stats e andamento generale.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">Grafici in arrivo...</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
            {/* Student Dialog */}
            <StudentDialog
                open={studentDialogOpen}
                onOpenChange={setStudentDialogOpen}
                student={selectedStudent}
                defaultClassId={schoolClass.id}
                onSuccess={fetchData}
            />
        </div>
    );
}

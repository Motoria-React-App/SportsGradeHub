import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useClient } from "@/provider/clientProvider";
import { SchoolClass, Student } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";


export default function Classes() {

    const { id } = useParams<{ id: string }>();
    const client = useClient();
    const [schoolClass, setSchoolClass] = useState<SchoolClass | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // Fetch class details and all students in parallel
                const [classRes] = await Promise.all([
                    client.getClassById(id),
                ]);

                if (classRes.success && classRes.data) {
                    setSchoolClass(classRes.data);
                    setStudents(classRes.data.students);
                }


            } catch (error) {
                console.error("Failed to fetch class data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, client]);

    if (loading) {
        return (
            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 12)",
                    } as React.CSSProperties
                }>
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-pulse space-y-4">
                            <div className="h-8 w-64 bg-muted rounded"></div>
                            <div className="h-4 w-48 bg-muted rounded"></div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    if (!schoolClass) {
        return (
            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 12)",
                    } as React.CSSProperties
                }>
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <h2 className="text-2xl font-bold">Classe non trovata</h2>
                        <p className="text-muted-foreground">La classe richiesta non esiste o è stata rimossa.</p>
                        <Button onClick={() => window.history.back()}>
                            Torna indietro
                        </Button>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        );
    }

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
                                {students.length} Studenti iscritti
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="gap-2">
                                <Activity className="w-4 h-4" />
                                Gestisci Esercizi
                            </Button>
                            <Button className="gap-2">
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
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nome</TableHead>
                                                    <TableHead>Cognome</TableHead>
                                                    <TableHead className="w-[100px]">Sesso</TableHead>
                                                    <TableHead>Data di Nascita</TableHead>
                                                    <TableHead className="text-right">Azioni</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {students.length > 0 ? (
                                                    students.map((student) => (
                                                        <TableRow key={student.id}>
                                                            <TableCell className="font-medium">{student.firstName}</TableCell>
                                                            <TableCell>{student.lastName}</TableCell>
                                                            <TableCell>
                                                                <span className={cn(
                                                                    "p-2 py-1 rounded text-xs font-semibold",
                                                                    student.gender === 'M' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                                                                        student.gender === 'F' ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" :
                                                                            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                                )}>
                                                                    {student.gender}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell>
                                                                {student.birthdate ? new Date(student.birthdate).toLocaleDateString("it-IT") : "-"}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="sm">
                                                                    Modifica
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                            Nessuno studente in questa classe.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="exercises">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Programma Esercizi</CardTitle>
                                        <CardDescription>
                                            Visualizza i gruppi di esercizi assegnati a questa classe.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {schoolClass.exerciseGroups && schoolClass.exerciseGroups.length > 0 ? (
                                            <div className="space-y-4">
                                                <div className="p-4 rounded-md border bg-muted/30">
                                                    <p className="text-sm font-medium">IDs Gruppi Esercizi:</p>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {schoolClass.exerciseGroups.map(groupId => (
                                                            <span key={groupId} className="px-2 py-1 bg-background border rounded text-xs font-mono">
                                                                {groupId}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground italic">
                                                    TODO: Implementare fetch dettagliata esercizi
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                                <h3 className="text-lg font-medium">Nessun esercizio assegnato</h3>
                                                <p className="text-muted-foreground max-w-sm mt-1 mb-4">
                                                    Non ci sono ancora gruppi di esercizi collegati a questa classe.
                                                </p>
                                                <Button variant="outline">Assegna Esercizi</Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
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
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

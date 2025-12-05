import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { classes } from "@/data/mockData";
import { Search, Plus, Users, GraduationCap, Activity } from "lucide-react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";


export default function Classes() {
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
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Classi</h1>
                            <p className="text-muted-foreground">Gestisci le tue classi e visualizza le statistiche</p>
                        </div>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nuova Classe
                        </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Cerca una classe..."
                                className="pl-8"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {classes.map((cls) => (
                            <Card key={cls.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xl font-bold">{cls.name}</CardTitle>
                                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center text-muted-foreground">
                                                <Users className="mr-2 h-4 w-4" />
                                                Studenti
                                            </div>
                                            <span className="font-medium">{cls.studentCount}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center text-muted-foreground">
                                                <Activity className="mr-2 h-4 w-4" />
                                                Media Voti
                                            </div>
                                            <span className="font-medium">{cls.averageGrade}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center text-muted-foreground">
                                                <Activity className="mr-2 h-4 w-4" />
                                                Esercizi
                                            </div>
                                            <span className="font-medium">{cls.totalExercises}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Riepilogo Classi</CardTitle>
                            <CardDescription>
                                Panoramica dettagliata di tutte le classi per l'anno corrente
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Classe</TableHead>
                                        <TableHead>Anno Scolastico</TableHead>
                                        <TableHead>Studenti</TableHead>
                                        <TableHead>Media Generale</TableHead>
                                        <TableHead className="text-right">Azioni</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {classes.map((cls) => (
                                        <TableRow key={cls.id}>
                                            <TableCell className="font-medium">{cls.name}</TableCell>
                                            <TableCell>{cls.year}</TableCell>
                                            <TableCell>{cls.studentCount}</TableCell>
                                            <TableCell>{cls.averageGrade}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">
                                                    Dettagli
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { students, classes } from "@/data/mockData";
import { Search, Plus, Filter, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function Students() {
    const [selectedClass, setSelectedClass] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredStudents = students.filter(student => {
        const matchesClass = selectedClass === "all" || student.classId === selectedClass;
        const matchesSearch = student.fullName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesClass && matchesSearch;
    });

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
                            <h1 className="text-3xl font-bold tracking-tight">Studenti</h1>
                            <p className="text-muted-foreground">Gestione anagrafica e valutazioni studenti</p>
                        </div>
                        <Button className="gap-2">
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
                                            Classe {cls.name}
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
                                        <TableHead>Media</TableHead>
                                        <TableHead>Livello</TableHead>
                                        <TableHead>Trend</TableHead>
                                        <TableHead className="text-right">Azioni</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium">
                                                <div>
                                                    <div>{student.fullName}</div>
                                                    <div className="text-xs text-muted-foreground">{student.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10">
                                                    {student.className}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "font-bold",
                                                    student.averageGrade >= 8 ? "text-green-600" :
                                                        student.averageGrade >= 6 ? "text-yellow-600" : "text-red-600"
                                                )}>
                                                    {student.averageGrade}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                    student.performanceLevel === 'excellent' && "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-400/20",
                                                    student.performanceLevel === 'good' && "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/20",
                                                    student.performanceLevel === 'average' && "bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400 dark:ring-yellow-400/20",
                                                    student.performanceLevel === 'needs-improvement' && "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-400/20"
                                                )}>
                                                    {student.performanceLevel === 'excellent' && "Eccellente"}
                                                    {student.performanceLevel === 'good' && "Buono"}
                                                    {student.performanceLevel === 'average' && "Sufficiente"}
                                                    {student.performanceLevel === 'needs-improvement' && "Insufficiente"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "text-xs font-medium",
                                                    student.trends.improving ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {student.trends.improving ? "↗" : "↘"} {Math.abs(student.trends.percentageChange)}%
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
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

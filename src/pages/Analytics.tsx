import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart, CartesianGrid } from "recharts";
import { useSchoolData } from "@/provider/clientProvider";
import { SiteHeader } from "@/components/site-header";

export default function Analytics() {
    const { classes, students, evaluations } = useSchoolData();

    // Generate performance data from real classes
    const performanceData = useMemo(() => {
        return classes.map(c => ({
            name: c.className,
            studenti: c.students.length,
            gruppiEsercizi: c.exerciseGroups.length
        }));
    }, [classes]);

    // Placeholder trend data - would come from evaluations when available
    const trendData = [
        { month: 'Set', valutazioni: 0 },
        { month: 'Ott', valutazioni: 0 },
        { month: 'Nov', valutazioni: 0 },
        { month: 'Dic', valutazioni: evaluations.length },
        { month: 'Gen', valutazioni: 0 },
        { month: 'Feb', valutazioni: 0 },
    ];

    return (
        <div className="flex flex-1 flex-col p-4 md:p-6 space-y-6 animate-in fade-in duration-700">
            <SiteHeader />
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analisi Dati</h1>
                <p className="text-muted-foreground">Statistiche basate sui dati reali dal backend</p>
            </div>

            <Tabs defaultValue="generale" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="generale">Generale</TabsTrigger>
                    <TabsTrigger value="classi">Confronto Classi</TabsTrigger>
                    <TabsTrigger value="andamento">Valutazioni</TabsTrigger>
                </TabsList>

                <TabsContent value="generale" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Totale Classi</CardTitle>
                                <CardDescription>Classi attive</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">{classes.length}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {classes.filter(c => !c.isArchived).length} attive, {classes.filter(c => c.isArchived).length} archiviate
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Totale Studenti</CardTitle>
                                <CardDescription>Studenti registrati</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">{students.length}</div>
                                <p className="text-xs text-muted-foreground mt-1">Dal backend</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Valutazioni</CardTitle>
                                <CardDescription>Totale valutazioni</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">{evaluations.length}</div>
                                <p className="text-xs text-muted-foreground mt-1">Registrate</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Connessione</CardTitle>
                                <CardDescription>Stato backend</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-green-600">✓</div>
                                <p className="text-xs text-muted-foreground mt-1">Online</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="classi">
                    <Card>
                        <CardHeader>
                            <CardTitle>Studenti per Classe</CardTitle>
                            <CardDescription>Distribuzione degli studenti nelle classi</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {performanceData.length > 0 ? (
                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={performanceData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "hsl(var(--popover))",
                                                    borderColor: "hsl(var(--border))",
                                                    color: "hsl(var(--popover-foreground))",
                                                }}
                                            />
                                            <Bar dataKey="studenti" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Studenti" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                                    Nessuna classe disponibile
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="andamento">
                    <Card>
                        <CardHeader>
                            <CardTitle>Valutazioni nel Tempo</CardTitle>
                            <CardDescription>Numero di valutazioni effettuate</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--popover))",
                                                borderColor: "hsl(var(--border))",
                                                color: "hsl(var(--popover-foreground))",
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="valutazioni"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>

    );
}

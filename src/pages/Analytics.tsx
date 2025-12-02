import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart, CartesianGrid } from "recharts";
import { classes } from "@/data/mockData";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

const performanceData = classes.map(c => ({
    name: c.name,
    media: c.averageGrade,
    esercizi: c.totalExercises
}));

const trendData = [
    { month: 'Set', media: 6.5 },
    { month: 'Ott', media: 6.8 },
    { month: 'Nov', media: 7.2 },
    { month: 'Dic', media: 7.0 },
    { month: 'Gen', media: 7.4 },
    { month: 'Feb', media: 7.5 },
];

export default function Analytics() {
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
                <div className="flex flex-1 flex-col p-4 md:p-6 space-y-6 animate-in fade-in duration-700">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Analisi Dati</h1>
                        <p className="text-muted-foreground">Statistiche dettagliate e andamenti</p>
                    </div>

                    <Tabs defaultValue="generale" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="generale">Generale</TabsTrigger>
                            <TabsTrigger value="classi">Confronto Classi</TabsTrigger>
                            <TabsTrigger value="andamento">Andamento Temporale</TabsTrigger>
                        </TabsList>

                        <TabsContent value="generale" className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Media Istituto</CardTitle>
                                        <CardDescription>Media voti complessiva</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-4xl font-bold">7.3</div>
                                        <p className="text-xs text-muted-foreground mt-1">+0.2 rispetto al mese scorso</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Esercizi Totali</CardTitle>
                                        <CardDescription>Valutazioni effettuate</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-4xl font-bold">1,248</div>
                                        <p className="text-xs text-muted-foreground mt-1">+12% rispetto al mese scorso</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Studenti Attivi</CardTitle>
                                        <CardDescription>Partecipazione alle lezioni</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-4xl font-bold">98%</div>
                                        <p className="text-xs text-muted-foreground mt-1">Stabile</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="classi">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Performance per Classe</CardTitle>
                                    <CardDescription>Confronto medie voti tra le diverse classi</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={performanceData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" />
                                                <YAxis domain={[0, 10]} />
                                                <Tooltip 
                                                    contentStyle={{
                                                        backgroundColor: "hsl(var(--popover))",
                                                        borderColor: "hsl(var(--border))",
                                                        color: "hsl(var(--popover-foreground))",
                                                    }}
                                                />
                                                <Bar dataKey="media" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="andamento">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Andamento Temporale</CardTitle>
                                    <CardDescription>Evoluzione della media voti nel tempo</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={trendData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="month" />
                                                <YAxis domain={[0, 10]} />
                                                <Tooltip 
                                                    contentStyle={{
                                                        backgroundColor: "hsl(var(--popover))",
                                                        borderColor: "hsl(var(--border))",
                                                        color: "hsl(var(--popover-foreground))",
                                                    }}
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="media" 
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
            </SidebarInset>
        </SidebarProvider>
    );
}

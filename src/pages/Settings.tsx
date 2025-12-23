import { useNavigate } from "react-router-dom";
import { useSettings } from "@/provider/settingsProvider";
import { useSchedule, DAYS_ORDER, DAY_LABELS } from "@/provider/scheduleProvider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClient } from "@/provider/clientProvider";
import {
    HelpCircle,
    LogOut,
    Moon,
    Palette,
    Settings as SettingsIcon,
    Sun,
    User,
    Database,
    FileText,
    BarChart,
    Download,
    RefreshCw,
    Trash2,
    ArrowLeft,
    Clock,
    Plus,
    Calendar,
} from "lucide-react";
import { useSchoolData } from "@/provider/clientProvider";
import type { DayOfWeek } from "@/types/scheduleTypes";
import { useState } from "react";

export default function Settings() {
    const { settings, updateSettings, clearCache, resetSettings, lastSync } = useSettings();
    const { schedule, addSlot, removeSlot, getSlotsByDay, resetSchedule } = useSchedule();
    const { classes } = useSchoolData();
    const { theme, setTheme } = useTheme();
    const client = useClient();
    const user = client.UserModel;
    const navigate = useNavigate();

    // State for adding new slot
    const [newSlotDay, setNewSlotDay] = useState<DayOfWeek>('lunedi');
    const [newSlotStart, setNewSlotStart] = useState('08:00');
    const [newSlotEnd, setNewSlotEnd] = useState('09:00');
    const [newSlotClass, setNewSlotClass] = useState(classes[0]?.id || '');

    const handleAddSlot = () => {
        if (newSlotStart && newSlotEnd && newSlotClass) {
            addSlot({
                dayOfWeek: newSlotDay,
                startTime: newSlotStart,
                endTime: newSlotEnd,
                classId: newSlotClass,
            });
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10 max-w-6xl mx-auto w-full">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="grid w-full gap-2">
                    <h1 className="text-3xl font-semibold">Impostazioni</h1>
                    <p className="text-muted-foreground">
                        Gestisci le preferenze dell'applicazione, l'aspetto e l'account.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="grading" className="flex flex-col md:flex-row gap-8 items-start">
                <aside className="w-full md:w-[250px] shrink-0">
                    <TabsList className="flex flex-col h-auto w-full justify-start gap-1 bg-transparent p-0">
                        <TabsTrigger
                            value="grading"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <FileText className="h-4 w-4" />
                            Valutazioni
                        </TabsTrigger>
                        <TabsTrigger
                            value="display"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <Palette className="h-4 w-4" />
                            Visualizzazione
                        </TabsTrigger>
                        <TabsTrigger
                            value="schedule"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <Calendar className="h-4 w-4" />
                            Orario
                        </TabsTrigger>
                        <TabsTrigger
                            value="export"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <Download className="h-4 w-4" />
                            Esportazione
                        </TabsTrigger>
                        <TabsTrigger
                            value="data"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <Database className="h-4 w-4" />
                            Gestione Dati
                        </TabsTrigger>
                        <TabsTrigger
                            value="account"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <User className="h-4 w-4" />
                            Account
                        </TabsTrigger>
                        <TabsTrigger
                            value="about"
                            className="w-full justify-start gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground px-3 py-2 h-auto"
                        >
                            <HelpCircle className="h-4 w-4" />
                            Informazioni
                        </TabsTrigger>
                    </TabsList>
                </aside>

                <div className="flex-1 w-full space-y-6">
                    {/* Grading Settings */}
                    <TabsContent value="grading" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">Preferenze Valutazioni</h2>
                            <p className="text-sm text-muted-foreground">Configura come vengono calcolati e visualizzati i voti.</p>
                        </div>
                        <Separator />

                        <Card>
                            <CardHeader>
                                <CardTitle>Criteri di Valutazione</CardTitle>
                                <CardDescription>Definisci i parametri per i voti e le medie.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Voto Minimo (Sufficienza)</Label>
                                        <p className="text-sm text-muted-foreground">La soglia per considerare una prova sufficiente.</p>
                                    </div>
                                    <Select
                                        value={settings.passingGrade.toString()}
                                        onValueChange={(val) => updateSettings({ passingGrade: parseFloat(val) })}
                                    >
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder="Seleziona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5.5">5.5</SelectItem>
                                            <SelectItem value="6">6.0</SelectItem>
                                            <SelectItem value="6.5">6.5</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Arrotondamento</Label>
                                        <p className="text-sm text-muted-foreground">Come arrotondare le medie dei voti finali.</p>
                                    </div>
                                    <Select
                                        value={settings.roundingMode}
                                        onValueChange={(val: any) => updateSettings({ roundingMode: val })}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Seleziona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="nearest">Matematico (0.5)</SelectItem>
                                            <SelectItem value="up">Per eccesso</SelectItem>
                                            <SelectItem value="down">Per difetto</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Visualizzazione Voti</CardTitle>
                                <CardDescription>Come appaiono i voti nell'interfaccia.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between space-x-2">
                                    <Label htmlFor="show-decimals" className="flex flex-col space-y-1">
                                        <span>Mostra Decimali</span>
                                        <span className="font-normal text-sm text-muted-foreground">Visualizza i voti con cifre decimali (es. 7.5).</span>
                                    </Label>
                                    <Switch
                                        id="show-decimals"
                                        checked={settings.showDecimals}
                                        onCheckedChange={(checked) => updateSettings({ showDecimals: checked })}
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between space-x-2">
                                    <Label htmlFor="highlight-fail" className="flex flex-col space-y-1">
                                        <span>Evidenzia Insufficienze</span>
                                        <span className="font-normal text-sm text-muted-foreground">Mostra i voti insufficienti in rosso.</span>
                                    </Label>
                                    <Switch
                                        id="highlight-fail"
                                        checked={settings.highlightFailing}
                                        onCheckedChange={(checked) => updateSettings({ highlightFailing: checked })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Display Settings */}
                    <TabsContent value="display" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">Visualizzazione</h2>
                            <p className="text-sm text-muted-foreground">Personalizza l'aspetto dell'applicazione.</p>
                        </div>
                        <Separator />

                        <Card>
                            <CardHeader>
                                <CardTitle>Tema</CardTitle>
                                <CardDescription>Scegli il tema dell'interfaccia.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4 max-w-sm">
                                    <Button
                                        variant={theme === "light" ? "default" : "outline"}
                                        className="flex flex-col gap-2 h-auto py-4"
                                        onClick={() => setTheme("light")}
                                    >
                                        <Sun className="h-6 w-6" />
                                        <span>Chiaro</span>
                                    </Button>
                                    <Button
                                        variant={theme === "dark" ? "default" : "outline"}
                                        className="flex flex-col gap-2 h-auto py-4"
                                        onClick={() => setTheme("dark")}
                                    >
                                        <Moon className="h-6 w-6" />
                                        <span>Scuro</span>
                                    </Button>
                                    <Button
                                        variant={theme === "system" ? "default" : "outline"}
                                        className="flex flex-col gap-2 h-auto py-4"
                                        onClick={() => setTheme("system")}
                                    >
                                        <SettingsIcon className="h-6 w-6" />
                                        <span>Sistema</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Interfaccia Utente</CardTitle>
                                <CardDescription>Opzioni generali di visualizzazione.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Pagina Iniziale</Label>
                                        <p className="text-sm text-muted-foreground">La pagina da mostrare dopo il login.</p>
                                    </div>
                                    <Select
                                        value={settings.defaultView}
                                        onValueChange={(val: any) => updateSettings({ defaultView: val })}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Seleziona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dashboard">Dashboard</SelectItem>
                                            <SelectItem value="valutazioni">Valutazioni</SelectItem>
                                            <SelectItem value="exercises">Esercizi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Formato Data</Label>
                                        <p className="text-sm text-muted-foreground">Come visualizzare le date.</p>
                                    </div>
                                    <Select
                                        value={settings.dateFormat}
                                        onValueChange={(val: any) => updateSettings({ dateFormat: val })}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Seleziona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DD/MM/YYYY">31/01/2025</SelectItem>
                                            <SelectItem value="YYYY-MM-DD">2025-01-31</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between space-x-2">
                                    <Label htmlFor="animations" className="flex flex-col space-y-1">
                                        <span>Abilita Animazioni</span>
                                        <span className="font-normal text-sm text-muted-foreground">Riproduci animazioni e transizioni nell'interfaccia.</span>
                                    </Label>
                                    <Switch
                                        id="animations"
                                        checked={settings.enableAnimations}
                                        onCheckedChange={(checked) => updateSettings({ enableAnimations: checked })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Schedule Settings */}
                    <TabsContent value="schedule" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">Orario Settimanale</h2>
                            <p className="text-sm text-muted-foreground">Gestisci l'orario delle lezioni per la pagina di benvenuto.</p>
                        </div>
                        <Separator />

                        {/* Add new slot */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Aggiungi Lezione</CardTitle>
                                <CardDescription>Inserisci un nuovo slot nell'orario settimanale.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>Giorno</Label>
                                        <Select value={newSlotDay} onValueChange={(val) => setNewSlotDay(val as DayOfWeek)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DAYS_ORDER.map((day) => (
                                                    <SelectItem key={day} value={day}>{DAY_LABELS[day]}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ora Inizio</Label>
                                        <Input 
                                            type="time" 
                                            value={newSlotStart} 
                                            onChange={(e) => setNewSlotStart(e.target.value)} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ora Fine</Label>
                                        <Input 
                                            type="time" 
                                            value={newSlotEnd} 
                                            onChange={(e) => setNewSlotEnd(e.target.value)} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Classe</Label>
                                        <Select value={newSlotClass} onValueChange={setNewSlotClass}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classes.map((cls) => (
                                                    <SelectItem key={cls.id} value={cls.id}>{cls.className}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button onClick={handleAddSlot} className="w-full md:w-auto">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Aggiungi Slot
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Current schedule by day */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Orario Attuale</CardTitle>
                                <CardDescription>{schedule.length} lezioni programmate</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {DAYS_ORDER.map((day) => {
                                    const daySlots = getSlotsByDay(day);
                                    if (daySlots.length === 0) return null;
                                    
                                    return (
                                        <div key={day} className="space-y-2">
                                            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                                                {DAY_LABELS[day]}
                                            </h4>
                                            <div className="grid gap-2">
                                                {daySlots.map((slot) => {
                                                    const classInfo = classes.find(c => c.id === slot.classId);
                                                    return (
                                                        <div 
                                                            key={slot.id} 
                                                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                                    <Clock className="h-4 w-4" />
                                                                    {slot.startTime} - {slot.endTime}
                                                                </div>
                                                                <div className="font-medium">
                                                                {classInfo?.className || slot.classId}
                                                                </div>
                                                            </div>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                onClick={() => removeSlot(slot.id)}
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {schedule.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>Nessuna lezione programmata</p>
                                        <p className="text-sm">Aggiungi il tuo primo slot sopra</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Reset schedule */}
                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="text-destructive">Reset Orario</CardTitle>
                                <CardDescription>Ripristina l'orario predefinito di esempio.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="destructive" onClick={resetSchedule}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Ripristina Orario Default
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Export Settings */}
                    <TabsContent value="export" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">Esportazione</h2>
                            <p className="text-sm text-muted-foreground">Configura come esportare i dati.</p>
                        </div>
                        <Separator />

                        <Card>
                            <CardHeader>
                                <CardTitle>Preferenze Esportazione</CardTitle>
                                <CardDescription>Formati e contenuti per i report.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Formato Predefinito</Label>
                                        <p className="text-sm text-muted-foreground">Il formato file preferito per i download.</p>
                                    </div>
                                    <Select
                                        value={settings.exportFormat}
                                        onValueChange={(val: any) => updateSettings({ exportFormat: val })}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Seleziona" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="csv">CSV (Excel, Sheets)</SelectItem>
                                            <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                                            <SelectItem value="pdf">PDF (Documento)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between space-x-2">
                                    <Label htmlFor="export-notes" className="flex flex-col space-y-1">
                                        <span>Includi Note</span>
                                        <span className="font-normal text-sm text-muted-foreground">Includi i commenti testuali nelle esportazioni.</span>
                                    </Label>
                                    <Switch
                                        id="export-notes"
                                        checked={settings.includeNotesInExport}
                                        onCheckedChange={(checked) => updateSettings({ includeNotesInExport: checked })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Esportazione Rapida</CardTitle>
                                <CardDescription>Scarica i tuoi dati immediatamente.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                <Button variant="outline" className="w-full justify-start">
                                    <Download className="mr-2 h-4 w-4" />
                                    Esporta tutte le valutazioni (CSV)
                                </Button>
                                <Button variant="outline" className="w-full justify-start">
                                    <Download className="mr-2 h-4 w-4" />
                                    Esporta elenco studenti completo
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Data Management */}
                    <TabsContent value="data" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">Gestione Dati</h2>
                            <p className="text-sm text-muted-foreground">Gestisci la cache locale e la sincronizzazione.</p>
                        </div>
                        <Separator />

                        <Card>
                            <CardHeader>
                                <CardTitle>Sincronizzazione</CardTitle>
                                <CardDescription>Stato della sincronizzazione con il server.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
                                            <RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Ultima sincronizzazione</p>
                                            <p className="text-sm text-muted-foreground">
                                                {lastSync ? lastSync.toLocaleString() : "Mai"}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">Sincronizza Ora</Button>
                                </div>

                                <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <Database className="h-5 w-5 text-blue-400" aria-hidden="true" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Stato Database</h3>
                                            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                                <p>Tutti i dati sono salvati localmente e sincronizzati quando online.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="text-destructive">Zona Pericolosa</CardTitle>
                                <CardDescription>Azioni che rimuovono dati locali.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Svuota Cache Locale</Label>
                                        <p className="text-sm text-muted-foreground">Rimuove i dati salvati nel browser. Utile se l'app è lenta.</p>
                                    </div>
                                    <Button variant="destructive" onClick={clearCache}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Svuota Cache
                                    </Button>
                                </div>

                                <Separator />

                                <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Ripristina Impostazioni</Label>
                                        <p className="text-sm text-muted-foreground">Riporta tutte le impostazioni ai valori predefiniti.</p>
                                    </div>
                                    <Button variant="outline" onClick={resetSettings}>
                                        Ripristina Default
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Account Settings */}
                    <TabsContent value="account" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">Account</h2>
                            <p className="text-sm text-muted-foreground">Gestisci il tuo profilo utente.</p>
                        </div>
                        <Separator />

                        <Card>
                            <CardHeader>
                                <CardTitle>Profilo</CardTitle>
                                <CardDescription>Informazioni sull'utente corrente.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
                                        <User className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium">{user?.user.email || "Utente Ospite"}</h3>
                                        <p className="text-sm text-muted-foreground">Insegnante</p>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" value={user?.user.email || ""} disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Ruolo</Label>
                                        <Input id="role" value="Amministratore" disabled />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t px-6 py-4">
                                <p className="text-sm text-muted-foreground">
                                    Sessione scade tra: {client.isRefreshTokenNearExpiry(24) ? "breve" : "24 ore"}
                                </p>
                                <Button variant="destructive" onClick={() => client.logout()}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* About */}
                    <TabsContent value="about" className="space-y-6 mt-0">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">Informazioni</h2>
                            <p className="text-sm text-muted-foreground">Dettagli sull'applicazione.</p>
                        </div>
                        <Separator />

                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex flex-col items-center text-center space-y-2 py-4">
                                    <div className="h-16 w-16 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
                                        <BarChart className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-2xl font-bold">SportsGradeHub</h3>
                                    <p className="text-muted-foreground">Versione 1.0.0</p>
                                </div>

                                <div className="grid gap-4 border-t border-b py-4 my-4">
                                    <div className="flex justify-between py-2">
                                        <span className="font-medium">Build</span>
                                        <span className="text-muted-foreground">2025.12.10</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="font-medium">Anno Scolastico</span>
                                        <span className="text-muted-foreground">2025/2026</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="font-medium">Licenza</span>
                                        <span className="text-muted-foreground">Pro</span>
                                    </div>
                                </div>

                                <div className="text-sm text-center text-muted-foreground">
                                    <p>© 2025 SportsGradeHub. Tutti i diritti riservati.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

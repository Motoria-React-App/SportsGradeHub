import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { useSchoolData, useClient } from '@/provider/clientProvider';
import { useSettings } from '@/provider/settingsProvider';
import { ArrowLeft, TrendingUp, Calendar, AlertTriangle, Plus, Trash2, Settings } from 'lucide-react';
import { useGradeFormatter } from '@/hooks/useGradeFormatter';
import { useDateFormatter } from '@/hooks/useDateFormatter';
import type { Student, Evaluation, Exercise, SchoolClass, Justification } from '@/types/types';
import { toast } from 'sonner';

export default function StudentDetail() {
    const { id } = useParams<{ id: string }>();
    const { students, classes, evaluations, exercises, refreshStudents } = useSchoolData();
    const { settings } = useSettings();
    const client = useClient();
    const { formatGrade } = useGradeFormatter();
    const { formatDate } = useDateFormatter();

    const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');

    // Justification dialog state
    const [justificationDialogOpen, setJustificationDialogOpen] = useState(false);
    const [newJustificationDate, setNewJustificationDate] = useState(() => {
        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    });
    const [newJustificationNote, setNewJustificationNote] = useState('');
    const [isAddingJustification, setIsAddingJustification] = useState(false);

    const student = useMemo(
        () => students.find((s: Student) => s.id === id),
        [students, id]
    );

    const studentClass = useMemo(() => {
        if (!student) return null;
        return classes.find((c: SchoolClass) => c.id === student.currentClassId);
    }, [student, classes]);

    // const classHistory = student?.classHistory || [];

    // Get all unique exercises for this student (from their evaluations)
    const studentExercises = useMemo(() => {
        const uniqueExerciseIds = new Set(
            evaluations
                .filter((e: Evaluation) => e.studentId === student?.id && e.score > 0)
                .map((e: Evaluation) => e.exerciseId)
        );
        return Array.from(uniqueExerciseIds)
            .map((exId) => exercises.find((ex: Exercise) => ex.id === exId))
            .filter(Boolean) as Exercise[];
    }, [evaluations, exercises, student?.id]);

    // Filter evaluations based on selection or show all
    const filteredEvaluations = useMemo(() => {
        if (!student) return [];
        let evals = evaluations.filter((e: Evaluation) => e.studentId === student.id && e.score > 0);

        if (selectedExerciseId) {
            evals = evals.filter((e: Evaluation) => e.exerciseId === selectedExerciseId);
        }

        return evals.sort((a: Evaluation, b: Evaluation) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [evaluations, student, selectedExerciseId]);

    // Graph data - sequence of grades instead of yearly averages
    const chartData = useMemo(() => {
        return filteredEvaluations.map((ev) => {
            const date = new Date(ev.createdAt);
            const exercise = exercises.find((e: Exercise) => e.id === ev.exerciseId);

            return {
                date: date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' }),
                fullDate: date.toLocaleDateString('it-IT'),
                score: ev.score,
                formattedScore: formatGrade(ev.score),
                exerciseName: exercise?.name || 'Valutazione',
            };
        });
    }, [filteredEvaluations, exercises, formatGrade]);

    // Yearly stats
    const yearlyStats = useMemo(() => {
        const stats: Record<string, { count: number; totalScore: number; avg: number }> = {};
        evaluations
            .filter((e: Evaluation) => e.studentId === student?.id && e.score > 0)
            .forEach((evaluation: Evaluation) => {
                const year = new Date(evaluation.createdAt).getFullYear().toString();
                if (!stats[year]) {
                    stats[year] = { count: 0, totalScore: 0, avg: 0 };
                }
                stats[year].count += 1;
                stats[year].totalScore += evaluation.score;
            });

        return Object.entries(stats).map(([anno, data]) => ({
            anno,
            numValutazioni: data.count,
            media: Math.round((data.totalScore / data.count) * 10) / 10,
        })).sort((a, b) => parseInt(b.anno) - parseInt(a.anno));
    }, [evaluations, student?.id]);

    if (!student) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
                <p className="text-muted-foreground">Studente non trovato</p>
                <Button asChild variant="outline" className="mt-4">
                    <Link to="/students">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Torna agli studenti
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col p-4 md:p-6 space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                    <Link to="/students">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                        {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {student.firstName} {student.lastName}
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className="text-sm">
                                {studentClass?.className || 'Nessuna classe'}
                            </Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                {student.gender === 'M' ? 'Maschio' : student.gender === 'F' ? 'Femmina' : 'N/D'}
                            </span>
                            {student.birthdate && (
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatDate(student.birthdate)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Classi frequentate
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{classHistory.length}</div>
                    </CardContent>
                </Card>
            </div> */}

            {/* Giustifiche Section */}
            <JustificationsCard
                student={student}
                settings={settings}
                formatDate={formatDate}
                client={client}
                refreshStudents={refreshStudents}
                justificationDialogOpen={justificationDialogOpen}
                setJustificationDialogOpen={setJustificationDialogOpen}
                newJustificationDate={newJustificationDate}
                setNewJustificationDate={setNewJustificationDate}
                newJustificationNote={newJustificationNote}
                setNewJustificationNote={setNewJustificationNote}
                isAddingJustification={isAddingJustification}
                setIsAddingJustification={setIsAddingJustification}
            />

            {/* Cronologia Classi */}
            {/* <Card>
                <CardHeader>
                    <CardTitle>Cronologia delle Classi</CardTitle>
                    <CardDescription>Classe e anno scolastico</CardDescription>
                </CardHeader>
                <CardContent>
                    {classHistory.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Nessuna cronologia disponibile</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Classe</TableHead>
                                    <TableHead>Anno Scolastico</TableHead>
                                    <TableHead>Stato</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classHistory.map((entry: ClassHistoryEntry) => {
                                    const cls = classes.find((c: SchoolClass) => c.id === entry.classId);
                                    return (
                                        <TableRow key={entry.classId}>
                                            <TableCell className="font-medium">{cls?.className || 'N/D'}</TableCell>
                                            <TableCell>{entry.schoolYear}</TableCell>
                                            <TableCell>
                                                <Badge variant={entry.archived ? "secondary" : "default"}>
                                                    {entry.archived ? 'Archiviata' : 'Attiva'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card> */}

            {/* Grafico e Selezione Esercizio */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Andamento Valutazioni
                    </CardTitle>
                    <CardDescription>
                        Visualizza l'andamento complessivo o filtra per esercizio
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {studentExercises.map((ex: Exercise) => (
                            <Button
                                key={ex.id}
                                variant={selectedExerciseId === ex.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedExerciseId(selectedExerciseId === ex.id ? '' : ex.id)}
                            >
                                {ex.name}
                            </Button>
                        ))}
                    </div>
                    {filteredEvaluations.length > 0 ? (
                        selectedExerciseId && filteredEvaluations.length === 1 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground mb-2">Solo una valutazione disponibile:</p>
                                <div className="text-2xl font-bold">{formatGrade(filteredEvaluations[0].score)}</div>
                                <p className="text-sm text-muted-foreground mt-1">{formatDate(filteredEvaluations[0].createdAt)}</p>
                            </div>
                        ) : (
                            <div className="p-6">
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#a0a0a0" stopOpacity={0.8} />
                                                <stop offset="50%" stopColor="#707070" stopOpacity={0.5} />
                                                <stop offset="100%" stopColor="#404040" stopOpacity={0.2} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#888"
                                            tick={{ fill: '#888', fontSize: 12 }}
                                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            domain={['dataMin', 'dataMax']}
                                            stroke="#888"
                                            tick={{ fill: '#888', fontSize: 12 }}
                                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                        />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div style={{ backgroundColor: 'rgba(0,0,0,0.9)', borderColor: 'rgba(255,255,255,0.1)' }} className="border rounded-lg p-3 text-white shadow-xl">
                                                            <p className="font-medium mb-1 text-sm">{label}</p>
                                                            <div className="flex flex-col gap-0.5">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-gray-400 text-xs">Voto:</span>
                                                                    <span className="font-bold text-white">{data.formattedScore}</span>
                                                                </div>
                                                                <div className="text-xs text-gray-400 mt-1 max-w-[200px] truncate">
                                                                    {data.exerciseName}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="score"
                                            stroke="#d0d0d0"
                                            strokeWidth={2}
                                            fill="url(#colorScore)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )
                    ) : (
                        <p className="text-muted-foreground text-center py-12">Nessuna valutazione presente</p>
                    )}
                </CardContent>
            </Card>

            {/* Media Annuale e Numero Valutazioni */}
            <Card>
                <CardHeader>
                    <CardTitle>Statistiche Annuali</CardTitle>
                    <CardDescription>Media voti e numero di valutazioni per anno</CardDescription>
                </CardHeader>
                <CardContent>
                    {yearlyStats.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Nessuna valutazione registrata</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Anno</TableHead>
                                    <TableHead>Media</TableHead>
                                    <TableHead>Valutazioni</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {yearlyStats.map((stat) => (
                                    <TableRow key={stat.anno}>
                                        <TableCell>{stat.anno}</TableCell>
                                        <TableCell className="font-medium">{formatGrade(stat.media)}</TableCell>
                                        <TableCell>{stat.numValutazioni}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Justifications Card Component
interface JustificationsCardProps {
    student: Student;
    settings: any;
    formatDate: (date: string) => string;
    client: any;
    refreshStudents: () => Promise<void>;
    justificationDialogOpen: boolean;
    setJustificationDialogOpen: (open: boolean) => void;
    newJustificationDate: string;
    setNewJustificationDate: (date: string) => void;
    newJustificationNote: string;
    setNewJustificationNote: (note: string) => void;
    isAddingJustification: boolean;
    setIsAddingJustification: (loading: boolean) => void;
}

function JustificationsCard({
    student,
    settings,
    formatDate,
    client,
    refreshStudents,
    justificationDialogOpen,
    setJustificationDialogOpen,
    newJustificationDate,
    setNewJustificationDate,
    newJustificationNote,
    setNewJustificationNote,
    isAddingJustification,
    setIsAddingJustification,
}: JustificationsCardProps) {

    const justifications = student.justifications || [];

    // Get current period
    const currentPeriod = settings.schoolPeriods.find(
        (p: any) => p.id === settings.currentPeriodId
    );

    // Filter justifications for current period
    // Filter justifications for current period
    const justificationsInPeriod = currentPeriod
        ? justifications.filter((j: any) => {
            const jDate = j.date.split('T')[0];
            const startDate = currentPeriod.startDate.split('T')[0];
            const endDate = currentPeriod.endDate.split('T')[0];
            return jDate >= startDate && jDate <= endDate;
        })
        : justifications;

    const justificationCount = justificationsInPeriod.length;
    const isOverLimit = justificationCount >= settings.maxJustifications;

    const handleDateChange = (value: string, setter: (val: string) => void) => {
        // Remove non-digit characters
        let val = value.replace(/\D/g, '');

        // Limit length
        if (val.length > 8) val = val.slice(0, 8);

        // Add slashes
        if (val.length > 4) {
            val = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4);
        } else if (val.length > 2) {
            val = val.slice(0, 2) + '/' + val.slice(2);
        }

        setter(val);
    };

    const handleAddJustification = async () => {
        // Basic validation for DD/MM/YYYY
        if (newJustificationDate.length !== 10) {
            toast.error('Inserisci una data valida (GG/MM/AAAA)');
            return;
        }

        setIsAddingJustification(true);
        try {
            const newId = Date.now().toString(36) + Math.random().toString(36).substring(2);

            // Convert DD/MM/YYYY to YYYY-MM-DD
            const [day, month, year] = newJustificationDate.split('/');
            const isoDate = `${year}-${month}-${day}`;

            const newJustification: Justification = {
                id: newId,
                date: isoDate,
                note: newJustificationNote,
                createdAt: new Date().toISOString()
            };

            // Create new array with existing justifications + new one
            const updatedJustifications = [...(student.justifications || []), newJustification];

            await client.updateStudent(student.id, {
                justifications: updatedJustifications
            } as any);

            await refreshStudents();
            setJustificationDialogOpen(false);

            // Reset to today formatted as DD/MM/YYYY
            const today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const yyyy = today.getFullYear();
            setNewJustificationDate(`${dd}/${mm}/${yyyy}`);

            setNewJustificationNote('');
            toast.success('Giustifica aggiunta con successo');
        } catch (error) {
            toast.error('Errore durante l\'aggiunta della giustifica');
            console.error(error);
        } finally {
            setIsAddingJustification(false);
        }
    };

    const handleRemoveJustification = async (justificationId: string) => {
        try {
            const updatedJustifications = (student.justifications || []).filter((j: Justification) => j.id !== justificationId);

            await client.updateStudent(student.id, {
                justifications: updatedJustifications
            } as any);

            await refreshStudents();
            toast.success('Giustifica rimossa');
        } catch (error) {
            toast.error('Errore durante la rimozione');
            console.error(error);
        }
    };

    return (
        <>
            <Card className={isOverLimit ? 'border-destructive' : ''}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className={`h-5 w-5 ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`} />
                                Giustifiche
                                {currentPeriod && (
                                    <Badge variant="outline" className="ml-2">{currentPeriod.name}</Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                {currentPeriod
                                    ? `Periodo: ${formatDate(currentPeriod.startDate)} - ${formatDate(currentPeriod.endDate)}`
                                    : (
                                        <span className="flex items-center gap-2">
                                            Nessun periodo selezionato.{' '}
                                            <Link to="/settings" className="text-primary hover:underline inline-flex items-center gap-1">
                                                <Settings className="h-3 w-3" />
                                                Vai alle impostazioni
                                            </Link>
                                        </span>
                                    )
                                }
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => setJustificationDialogOpen(true)}
                            disabled={!currentPeriod}
                            title={!currentPeriod ? 'Prima devi impostare un periodo nelle impostazioni' : undefined}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Aggiungi
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Count and Alert */}
                    <div className={`p-4 rounded-lg border ${isOverLimit ? 'bg-destructive/10 border-destructive' : 'bg-secondary/50'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-3xl font-bold">{justificationCount}</div>
                                <div className="text-sm text-muted-foreground">
                                    di {settings.maxJustifications} giustifiche massime
                                </div>
                            </div>
                            {isOverLimit && (
                                <div className="text-destructive font-medium flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Soglia superata!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Justifications List */}
                    {justificationsInPeriod.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                            Nessuna giustifica registrata {currentPeriod ? 'in questo periodo' : ''}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {justificationsInPeriod.map((j: any) => (
                                <div
                                    key={j.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border"
                                >
                                    <div>
                                        <div className="font-medium">{formatDate(j.date)}</div>
                                        {j.note && (
                                            <div className="text-sm text-muted-foreground">{j.note}</div>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveJustification(j.id)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Justification Dialog */}
            <Dialog open={justificationDialogOpen} onOpenChange={setJustificationDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Aggiungi Giustifica</DialogTitle>
                        <DialogDescription>
                            Registra una nuova giustifica per {student.firstName} {student.lastName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <Input
                                type="text"
                                placeholder="GG/MM/AAAA"
                                value={newJustificationDate}
                                onChange={(e) => handleDateChange(e.target.value, setNewJustificationDate)}
                                maxLength={10}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Nota (opzionale)</Label>
                            <Textarea
                                placeholder="Motivo della giustifica..."
                                value={newJustificationNote}
                                onChange={(e) => setNewJustificationNote(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setJustificationDialogOpen(false)}>
                            Annulla
                        </Button>
                        <Button onClick={handleAddJustification} disabled={isAddingJustification}>
                            {isAddingJustification ? 'Aggiunta...' : 'Aggiungi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

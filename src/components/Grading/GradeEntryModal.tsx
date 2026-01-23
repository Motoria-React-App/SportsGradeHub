import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { classes, exercises, getStudentsByClass } from "@/data/mockData";

interface GradeEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GradeEntryModal({ isOpen, onClose }: GradeEntryModalProps) {
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Criteria
    const [technical, setTechnical] = useState<number>(6);
    const [effort, setEffort] = useState<number>(6);
    const [teamwork, setTeamwork] = useState<number>(6);
    const [overall, setOverall] = useState<number>(6);

    const [notes, setNotes] = useState<string>("");

    const students = selectedClassId ? getStudentsByClass(selectedClassId) : [];
    const selectedExercise = exercises.find(e => e.id === selectedExerciseId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would save to the backend
        console.log({
            studentId: selectedStudentId,
            exerciseId: selectedExerciseId,
            date,
            criteria: { technical, effort, teamwork, overall },
            notes
        });
        onClose();
    };

return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
                <DialogTitle>Nuova Valutazione</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Classe</Label>
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleziona classe" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Studente</Label>
                        <Select
                            value={selectedStudentId}
                            onValueChange={setSelectedStudentId}
                            disabled={!selectedClassId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleziona studente" />
                            </SelectTrigger>
                            <SelectContent>
                                {students.map((student) => (
                                    <SelectItem key={student.id} value={student.id}>
                                        {student.fullName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Esercizio</Label>
                        <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleziona esercizio" />
                            </SelectTrigger>
                            <SelectContent>
                                {exercises.map((ex) => (
                                    <SelectItem key={ex.id} value={ex.id}>
                                        {ex.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Data</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>

                {selectedExercise && (
                    <div className="space-y-4 border rounded-lg p-4">
                        <h4 className="font-medium">Criteri di Valutazione</h4>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Tecnica</Label>
                                    <span className="text-sm text-muted-foreground">{technical}/10</span>
                                </div>
                                <Slider
                                    value={[technical]}
                                    onValueChange={(vals: number[]) => setTechnical(vals[0])}
                                    min={1}
                                    max={10}
                                    step={0.5}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Impegno</Label>
                                    <span className="text-sm text-muted-foreground">{effort}/10</span>
                                </div>
                                <Slider
                                    value={[effort]}
                                    onValueChange={(vals: number[]) => setEffort(vals[0])}
                                    min={1}
                                    max={10}
                                    step={0.5}
                                />
                            </div>

                            {selectedExercise.requiresTeamwork && (
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Gioco di Squadra</Label>
                                        <span className="text-sm text-muted-foreground">{teamwork}/10</span>
                                    </div>
                                    <Slider
                                        value={[teamwork]}
                                        onValueChange={(vals: number[]) => setTeamwork(vals[0])}
                                        min={1}
                                        max={10}
                                        step={0.5}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Valutazione Complessiva</Label>
                                    <span className="text-sm text-muted-foreground">{overall}/10</span>
                                </div>
                                <Slider
                                    value={[overall]}
                                    onValueChange={(vals: number[]) => setOverall(vals[0])}
                                    min={1}
                                    max={10}
                                    step={0.5}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Note (opzionale)</Label>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Aggiungi note sulla prestazione..."
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Annulla
                    </Button>
                    <Button type="submit">
                        Salva Valutazione
                    </Button>
                </div>
            </form>
        </DialogContent>
    </Dialog>
);
}

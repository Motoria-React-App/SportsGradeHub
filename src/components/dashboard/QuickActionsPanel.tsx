import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Users, ClipboardPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSchoolData } from "@/provider/clientProvider";

interface QuickActionsPanelProps {
    selectedClassId: string;
}

export function QuickActionsPanel({ selectedClassId }: QuickActionsPanelProps) {
    const { classes } = useSchoolData();
    const navigate = useNavigate();

    // Get selected class info
    const selectedClass = classes.find(c => c.id === selectedClassId);

    // Navigate to Valutazioni and trigger "Assegna Esercizio" modal
    const handleAssignExercise = () => {
        // Navigate to valutazioni page with the class pre-selected and a query param to open the modal
        navigate(`/valutazioni/${selectedClassId || 'all'}/all?openAssign=true`);
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Azioni Rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Primary CTA - links to valutazioni with selected class */}
                <Button
                    asChild
                    className="w-full h-12 text-base font-medium"
                    size="lg"
                >
                    <Link to={selectedClassId ? `/valutazioni/${selectedClassId}/all` : "/valutazioni/all/all"}>
                        <ClipboardCheck className="mr-2 h-5 w-5" />
                        Avvia Valutazione
                    </Link>
                </Button>

                {/* Secondary actions */}
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        asChild
                        variant="secondary"
                        className="h-14 flex-col gap-1"
                    >
                        <Link to={selectedClassId ? `/students?classId=${selectedClassId}` : "/students"}>
                            <Users className="h-5 w-5" />
                            <span className="text-xs">Studenti</span>
                        </Link>
                    </Button>
                    <Button
                        variant="secondary"
                        className="h-14 flex-col gap-1"
                        onClick={handleAssignExercise}
                    >
                        <ClipboardPlus className="h-5 w-5" />
                        <span className="text-xs">Assegna Esercizio</span>
                    </Button>
                </div>

                {/* Current class indicator */}
                {selectedClass && (
                    <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-xs text-muted-foreground">Classe selezionata</p>
                        <p className="font-medium text-primary">{selectedClass.className}</p>
                        <p className="text-xs text-muted-foreground">
                            {selectedClass.students.length} studenti
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

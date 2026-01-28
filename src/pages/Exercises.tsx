import { useState, useMemo } from "react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useSchoolData, useClient } from "@/provider/clientProvider";
import type { Exercise, Gender, ScoreRange, EvaluationCriterion } from "@/types/types";
import {
  Search,
  Plus,
  Filter,
  Dumbbell,
  Activity,
  Trash2,
  Loader2,
  FolderPlus,
  Ruler,
  Timer,
  Repeat,
  Star,
  ChevronDown,
  ChevronUp,
  Pencil,
  Save,
} from "lucide-react";
import { IconGenderMale, IconGenderFemale } from "@tabler/icons-react";

// Unit display names in Italian
const unitDisplayNames: Record<string, string> = {
  cm: "Centimetri (cm)",
  m: "Metri (m)",
  sec: "Secondi (sec)",
  reps: "Ripetizioni",
  qualitativo: "Qualitativo",
};

// Unit icons
const unitIcons: Record<string, React.ReactNode> = {
  cm: <Ruler className="h-4 w-4" />,
  m: <Ruler className="h-4 w-4" />,
  sec: <Timer className="h-4 w-4" />,
  reps: <Repeat className="h-4 w-4" />,
  qualitativo: <Star className="h-4 w-4" />,
};

// Italian scores 1-10 (including half grades)
const italianScores = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

// Backend unit type
type BackendUnit = 'cm' | 'sec' | 'm' | 'reps' | 'qualitativo';

export default function Exercises() {
  const { 
    exercises, 
    exerciseGroups, 
    refreshExercises, 
    refreshExerciseGroups 
  } = useSchoolData();
  const client = useClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // New group dialog
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  
  // Detail/Edit dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    exerciseGroupId: "",
    unit: "cm" as BackendUnit,
    maxScore: 10,
  });
  const [editRangesMale, setEditRangesMale] = useState<ScoreRange[]>([]);
  const [editRangesFemale, setEditRangesFemale] = useState<ScoreRange[]>([]);
  const [editUseGenderRanges, setEditUseGenderRanges] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);

  // Form state for new exercise
  const [formData, setFormData] = useState({
    name: "",
    exerciseGroupId: "",
    unit: "cm" as BackendUnit,
    maxScore: 10,
  });

  // Range-based evaluation state
  const [rangesMale, setRangesMale] = useState<ScoreRange[]>([
    { min: 0, max: 100, score: 6 }
  ]);
  const [rangesFemale, setRangesFemale] = useState<ScoreRange[]>([
    { min: 0, max: 100, score: 6 }
  ]);
  const [useGenderRanges, setUseGenderRanges] = useState(false);
  const [showRanges, setShowRanges] = useState(false);

  // Evaluation type state (for new exercise)
  const [evaluationType, setEvaluationType] = useState<'range' | 'criteria'>('range');
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([
    { name: '', maxScore: 10 }
  ]);

  // Evaluation type state (for edit)
  const [editEvaluationType, setEditEvaluationType] = useState<'range' | 'criteria'>('range');
  const [editCriteria, setEditCriteria] = useState<EvaluationCriterion[]>([]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Filter exercises based on search and group
  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGroup = selectedGroup === "all" || ex.exerciseGroupId === selectedGroup;
      return matchesSearch && matchesGroup;
    });
  }, [exercises, searchQuery, selectedGroup]);

  // Group exercises by exerciseGroupId
  const exercisesByGroup = useMemo(() => {
    const grouped: Record<string, Exercise[]> = {};

    filteredExercises.forEach(ex => {
      if (!grouped[ex.exerciseGroupId]) {
        grouped[ex.exerciseGroupId] = [];
      }
      grouped[ex.exerciseGroupId].push(ex);
    });

    return grouped;
  }, [filteredExercises]);

  // Get group names for display
  const getGroupName = (groupId: string): string => {
    const group = exerciseGroups.find(g => g.id === groupId);
    return group?.groupName || "Gruppo Sconosciuto";
  };

  // Get ordered groups - show ALL groups (including empty ones)
  const orderedGroups = useMemo(() => {
    // Get groups that have exercises
    const groupsWithExercises = Object.keys(exercisesByGroup);
    
    // Get all group IDs
    const allGroupIds = exerciseGroups.map(g => g.id);
    
    // Combine and deduplicate, ensuring all groups are included
    const allGroups = [...new Set([...allGroupIds, ...groupsWithExercises])];
    
    return allGroups.sort((a, b) => 
      getGroupName(a).localeCompare(getGroupName(b))
    );
  }, [exercisesByGroup, exerciseGroups]);

  // Range management functions
  const addRange = (gender: 'M' | 'F') => {
    const newRange = { min: 0, max: 100, score: 6 };
    if (gender === 'M') {
      setRangesMale([...rangesMale, newRange]);
    } else {
      setRangesFemale([...rangesFemale, newRange]);
    }
  };

  const removeRange = (gender: 'M' | 'F', index: number) => {
    if (gender === 'M' && rangesMale.length > 1) {
      setRangesMale(rangesMale.filter((_, i) => i !== index));
    } else if (gender === 'F' && rangesFemale.length > 1) {
      setRangesFemale(rangesFemale.filter((_, i) => i !== index));
    }
  };

  const updateRange = (gender: 'M' | 'F', index: number, field: keyof ScoreRange, value: number) => {
    if (gender === 'M') {
      const updated = [...rangesMale];
      updated[index] = { ...updated[index], [field]: value };
      setRangesMale(updated);
    } else {
      const updated = [...rangesFemale];
      updated[index] = { ...updated[index], [field]: value };
      setRangesFemale(updated);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Il nome dell'esercizio è obbligatorio";
    }
    if (!formData.exerciseGroupId) {
      newErrors.exerciseGroupId = "Seleziona un gruppo di esercizi";
    }
    if (!formData.unit) {
      newErrors.unit = "Seleziona un'unità di misura";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      exerciseGroupId: "",
      unit: "cm",
      maxScore: 10,
    });
    setRangesMale([{ min: 0, max: 100, score: 6 }]);
    setRangesFemale([{ min: 0, max: 100, score: 6 }]);
    setUseGenderRanges(false);
    setShowRanges(false);
    setEvaluationType('range');
    setCriteria([{ name: '', maxScore: 10 }]);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Build evaluation ranges if configured
      let evaluationRanges: Partial<Record<Gender, ScoreRange[]>> | undefined;
      if (showRanges) {
        evaluationRanges = {
          M: rangesMale,
        };
        if (useGenderRanges) {
          evaluationRanges.F = rangesFemale;
        } else {
          evaluationRanges.F = rangesMale; // Use same ranges for both
        }
      }

      // Build evaluation criteria if type is 'criteria'
      const validCriteria = criteria.filter(c => c.name.trim() !== '');
      
      const response = await client.createExercise({
        name: formData.name,
        exerciseGroupId: formData.exerciseGroupId,
        unit: formData.unit,
        maxScore: formData.maxScore,
        evaluationType,
        evaluationRanges: evaluationType === 'range' ? evaluationRanges : undefined,
        evaluationCriteria: evaluationType === 'criteria' ? validCriteria : undefined,
      });

      if (response.success) {
        await refreshExercises();
        await refreshExerciseGroups();
        setDialogOpen(false);
        resetForm();
      } else {
        console.error("Failed to create exercise:", response.error);
        setErrors({ submit: response.error?.message || "Errore durante la creazione" });
      }
    } catch (error) {
      console.error("Error creating exercise:", error);
      setErrors({ submit: "Errore durante la creazione dell'esercizio" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExercise = async () => {
    if (!exerciseToDelete) return;

    setIsDeleting(true);
    try {
      const response = await client.deleteExercise(exerciseToDelete.id);
      if (response.success) {
        await refreshExercises();
        setDeleteDialogOpen(false);
        setExerciseToDelete(null);
      } else {
        console.error("Failed to delete exercise:", response.error);
      }
    } catch (error) {
      console.error("Error deleting exercise:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    setIsCreatingGroup(true);
    try {
      const response = await client.createExerciseGroup({
        groupName: newGroupName.trim(),
        exercises: [],
      });

      if (response.success) {
        await refreshExerciseGroups();
        setNewGroupDialogOpen(false);
        setNewGroupName("");
      } else {
        console.error("Failed to create group:", response.error);
        alert("Errore: " + (response.error?.message || "Errore sconosciuto"));
      }
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Errore di rete durante la creazione del gruppo");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    setIsDeletingGroup(true);
    try {
      const response = await client.deleteExerciseGroup(groupToDelete);
      if (response.success) {
        await refreshExerciseGroups();
        setDeleteGroupDialogOpen(false);
        setGroupToDelete(null);
      } else {
        console.error("Failed to delete group:", response.error);
        alert("Errore durante l'eliminazione del gruppo");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Errore di rete durante l'eliminazione");
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const openDeleteGroupDialog = (groupId: string) => {
    setGroupToDelete(groupId);
    setDeleteGroupDialogOpen(true);
  };

  const openDeleteDialog = (exercise: Exercise) => {
    setExerciseToDelete(exercise);
    setDeleteDialogOpen(true);
  };

  const openDetailDialog = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setEditFormData({
      name: exercise.name,
      exerciseGroupId: exercise.exerciseGroupId,
      unit: exercise.unit,
      maxScore: exercise.maxScore || 10,
    });
    // Load evaluation type (default to 'range' for backwards compatibility)
    setEditEvaluationType(exercise.evaluationType || 'range');
    
    // Load criteria if they exist
    if (exercise.evaluationCriteria && exercise.evaluationCriteria.length > 0) {
      setEditCriteria(exercise.evaluationCriteria);
    } else {
      setEditCriteria([{ name: '', maxScore: 10 }]);
    }
    
    // Load ranges if they exist
    if (exercise.evaluationRanges?.M) {
      setEditRangesMale(exercise.evaluationRanges.M);
    } else {
      setEditRangesMale([{ min: 0, max: 100, score: 6 }]);
    }
    if (exercise.evaluationRanges?.F) {
      setEditRangesFemale(exercise.evaluationRanges.F);
      setEditUseGenderRanges(true);
    } else {
      setEditRangesFemale([{ min: 0, max: 100, score: 6 }]);
      setEditUseGenderRanges(false);
    }
    setIsEditing(false);
    setDetailDialogOpen(true);
  };

  const handleUpdateExercise = async () => {
    if (!selectedExercise) return;

    setIsUpdating(true);
    try {
      // Build evaluation ranges
      let evaluationRanges: Partial<Record<Gender, ScoreRange[]>> | undefined;
      if (editEvaluationType === 'range' && editRangesMale.length > 0) {
        evaluationRanges = {
          M: editRangesMale,
          F: editUseGenderRanges ? editRangesFemale : editRangesMale,
        };
      }
      
      // Build evaluation criteria
      const validCriteria = editCriteria.filter(c => c.name.trim() !== '');

      const response = await client.updateExercise(selectedExercise.id, {
        name: editFormData.name,
        exerciseGroupId: editFormData.exerciseGroupId,
        unit: editFormData.unit,
        maxScore: editFormData.maxScore,
        evaluationType: editEvaluationType,
        evaluationRanges: editEvaluationType === 'range' ? evaluationRanges : undefined,
        evaluationCriteria: editEvaluationType === 'criteria' ? validCriteria : undefined,
      });

      if (response.success) {
        await refreshExercises();
        setIsEditing(false);
        setDetailDialogOpen(false);
      } else {
        console.error("Failed to update exercise:", response.error);
      }
    } catch (error) {
      console.error("Error updating exercise:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Edit range management
  const addEditRange = (gender: 'M' | 'F') => {
    const newRange = { min: 0, max: 100, score: 6 };
    if (gender === 'M') {
      setEditRangesMale([...editRangesMale, newRange]);
    } else {
      setEditRangesFemale([...editRangesFemale, newRange]);
    }
  };

  const removeEditRange = (gender: 'M' | 'F', index: number) => {
    if (gender === 'M' && editRangesMale.length > 1) {
      setEditRangesMale(editRangesMale.filter((_, i) => i !== index));
    } else if (gender === 'F' && editRangesFemale.length > 1) {
      setEditRangesFemale(editRangesFemale.filter((_, i) => i !== index));
    }
  };

  const updateEditRange = (gender: 'M' | 'F', index: number, field: keyof ScoreRange, value: number) => {
    if (gender === 'M') {
      const updated = [...editRangesMale];
      updated[index] = { ...updated[index], [field]: value };
      setEditRangesMale(updated);
    } else {
      const updated = [...editRangesFemale];
      updated[index] = { ...updated[index], [field]: value };
      setEditRangesFemale(updated);
    }
  };

  // Render range editor for a gender
  const renderRangeEditor = (ranges: ScoreRange[], gender: 'M' | 'F', label: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          {gender === 'M' ? <IconGenderMale className="h-4 w-4 text-blue-500" /> : <IconGenderFemale className="h-4 w-4 text-pink-500" />}
          {label}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addRange(gender)}
          className="h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Aggiungi
        </Button>
      </div>
      <div className="space-y-2">
        {ranges.map((range, index) => (
          <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Min</Label>
                <Input
                  type="text"
                  value={range.min}
                  onChange={(e) => updateRange(gender, index, 'min', parseFloat(e.target.value) || 0)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Max</Label>
                <Input
                  type="text"
                  value={range.max}
                  onChange={(e) => updateRange(gender, index, 'max', parseFloat(e.target.value) || 0)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Voto</Label>
                <Select
                  value={range.score.toString()}
                  onValueChange={(v) => updateRange(gender, index, 'score', parseFloat(v))}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {italianScores.map((score) => (
                      <SelectItem key={score} value={score.toString()}>
                        {score}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {ranges.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRange(gender, index)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Esercizi</h1>
          <p className="text-muted-foreground">Gestisci il catalogo degli esercizi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setNewGroupDialogOpen(true)}>
            <FolderPlus className="h-4 w-4" />
            Nuovo Gruppo
          </Button>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuovo Esercizio
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cerca esercizio..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Gruppo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i gruppi</SelectItem>
              {exerciseGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.groupName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredExercises.length} esercizi trovati
        </div>
      </div>

      {/* Exercise Groups Display */}
      <div className="space-y-8">
        {orderedGroups.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nessun gruppo trovato</p>
            <p className="text-sm mt-2">Crea un gruppo per iniziare</p>
          </div>
        )}

        {orderedGroups.map((groupId) => {
          const groupExercises = exercisesByGroup[groupId] || [];
          const groupName = getGroupName(groupId);

          return (
            <div key={groupId} className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-primary/10 border-primary/20">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-semibold text-primary">
                    {groupName}
                  </h2>
                </div>
                <div className="flex-1 h-[2px] rounded-full bg-gradient-to-r from-primary/40 to-transparent" />
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium bg-primary/10 border-primary/20 text-primary">
                  <span>{groupExercises.length}</span>
                  <span className="opacity-75">eserciz{groupExercises.length === 1 ? 'io' : 'i'}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => openDeleteGroupDialog(groupId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Carousel */}
              <div className="px-12">
                <Carousel
                  opts={{
                    align: "start",
                    loop: false,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {groupExercises.map((ex) => (
                      <CarouselItem key={ex.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                        <Card className="flex flex-col h-full hover:shadow-md transition-all duration-200 group">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start gap-2">
                              <CardTitle className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                                {ex.name}
                              </CardTitle>
                              <Badge variant="secondary" className="capitalize shrink-0">
                                {unitDisplayNames[ex.unit] || ex.unit}
                              </Badge>
                            </div>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              {unitIcons[ex.unit]}
                              <span>Unità: {ex.unit}</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1 pb-3 space-y-2">
                            {ex.maxScore && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Star className="h-4 w-4" />
                                <span>Punteggio max: {ex.maxScore}</span>
                              </div>
                            )}
                            {ex.evaluationType === 'criteria' && ex.evaluationCriteria && ex.evaluationCriteria.length > 0 ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Star className="h-4 w-4" />
                                <span>{ex.evaluationCriteria.length} criteri configurati</span>
                              </div>
                            ) : ex.evaluationRanges && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Ruler className="h-4 w-4" />
                                <span>Fasce di valutazione configurate</span>
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="pt-0 flex justify-between">
                            <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" size="sm" onClick={() => openDeleteDialog(ex)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" className="pl-0 hover:pl-2 transition-all" size="sm" onClick={() => openDetailDialog(ex)}>
                              Dettagli <Dumbbell className="ml-2 h-3 w-3" />
                            </Button>
                          </CardFooter>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Exercise Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Nuovo Esercizio
            </DialogTitle>
            <DialogDescription>
              Crea un nuovo esercizio e assegnalo a un gruppo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Exercise Name */}
            <div className="space-y-2">
              <Label htmlFor="exercise-name">Nome Esercizio *</Label>
              <Input
                id="exercise-name"
                placeholder="es. Salto in Lungo, Corsa 100m"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            {/* Exercise Group Selection */}
            <div className="space-y-2">
              <Label htmlFor="exercise-group">Gruppo Esercizi *</Label>
              <Select 
                value={formData.exerciseGroupId} 
                onValueChange={(value) => setFormData({ ...formData, exerciseGroupId: value })}
              >
                <SelectTrigger id="exercise-group" className={errors.exerciseGroupId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Seleziona un gruppo" />
                </SelectTrigger>
                <SelectContent>
                  {exerciseGroups.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nessun gruppo. Creane uno prima.
                    </div>
                  ) : (
                    exerciseGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.groupName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.exerciseGroupId && <p className="text-sm text-destructive">{errors.exerciseGroupId}</p>}
            </div>

            {/* Unit Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exercise-unit">Unità di Misura *</Label>
                <Select 
                  value={formData.unit} 
                  onValueChange={(value) => setFormData({ ...formData, unit: value as BackendUnit })}
                >
                  <SelectTrigger id="exercise-unit" className={errors.unit ? "border-destructive" : ""}>
                    <SelectValue placeholder="Seleziona unità" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">Centimetri (cm)</SelectItem>
                    <SelectItem value="m">Metri (m)</SelectItem>
                    <SelectItem value="sec">Secondi (sec)</SelectItem>
                    <SelectItem value="reps">Ripetizioni</SelectItem>
                    <SelectItem value="qualitativo">Qualitativo</SelectItem>
                  </SelectContent>
                </Select>
                {errors.unit && <p className="text-sm text-destructive">{errors.unit}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-score">Punteggio Massimo</Label>
                <Input
                  id="max-score"
                  type="text"
                  min="1"
                  max="10"
                  value={formData.maxScore}
                  onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) || 10 })}
                />
              </div>
            </div>

            {/* Evaluation Type Selection */}
            <div className="space-y-4">
              <Label>Tipo di Valutazione</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={evaluationType === 'range' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEvaluationType('range')}
                  className="flex-1"
                >
                  <Ruler className="h-4 w-4 mr-2" />
                  Fasce
                </Button>
                <Button
                  type="button"
                  variant={evaluationType === 'criteria' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEvaluationType('criteria')}
                  className="flex-1"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Criteri
                </Button>
              </div>

              {/* Range-based evaluation */}
              {evaluationType === 'range' && (
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setShowRanges(!showRanges)}
                  >
                    <span className="flex items-center gap-2">
                      <Ruler className="h-4 w-4" />
                      Configura Fasce di Valutazione
                    </span>
                    {showRanges ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>

                  {showRanges && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="use-gender-ranges"
                          checked={useGenderRanges}
                          onChange={(e) => setUseGenderRanges(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="use-gender-ranges" className="text-sm cursor-pointer">
                          Usa fasce diverse per M e F
                        </Label>
                      </div>

                      {renderRangeEditor(rangesMale, 'M', useGenderRanges ? 'Fasce Maschi' : 'Fasce (tutti)')}
                      
                      {useGenderRanges && renderRangeEditor(rangesFemale, 'F', 'Fasce Femmine')}
                    </div>
                  )}
                </div>
              )}

              {/* Criteria-based evaluation */}
              {evaluationType === 'criteria' && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    Definisci i criteri di valutazione. Il voto finale sarà calcolato dalla somma dei punteggi.
                  </p>
                  
                  <div className="space-y-3">
                    {criteria.map((criterion, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <div className="col-span-2 space-y-1">
                            <Label className="text-xs text-muted-foreground">Nome Criterio</Label>
                            <Input
                              placeholder="es. Ricezione, Battuta..."
                              value={criterion.name}
                              onChange={(e) => {
                                const updated = [...criteria];
                                updated[index] = { ...updated[index], name: e.target.value };
                                setCriteria(updated);
                              }}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Max Punti</Label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={criterion.maxScore === 0 ? '' : criterion.maxScore.toString()}
                              onChange={(e) => {
                                const updated = [...criteria];
                                const val = e.target.value;
                                // Allow empty or numeric input
                                if (val === '' || /^\d+$/.test(val)) {
                                  updated[index] = { ...updated[index], maxScore: val === '' ? 0 : parseInt(val) };
                                  setCriteria(updated);
                                }
                              }}
                              onBlur={(e) => {
                                // Ensure minimum value of 1 on blur
                                const updated = [...criteria];
                                const val = parseInt(e.target.value) || 1;
                                updated[index] = { ...updated[index], maxScore: Math.max(1, val) };
                                setCriteria(updated);
                              }}
                              className="h-8"
                            />
                          </div>
                        </div>
                        {criteria.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCriteria(criteria.filter((_, i) => i !== index))}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCriteria([...criteria, { name: '', maxScore: 10 }])}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Criterio
                  </Button>

                  <div className="p-3 rounded-lg bg-primary/10 text-center">
                    <p className="text-sm font-medium">
                      Punteggio Totale Massimo: {criteria.reduce((sum, c) => sum + c.maxScore, 0)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {errors.submit && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{errors.submit}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Annulla
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crea Esercizio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Group Dialog */}
      <Dialog open={newGroupDialogOpen} onOpenChange={setNewGroupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              Nuovo Gruppo Esercizi
            </DialogTitle>
            <DialogDescription>
              Crea un nuovo gruppo per organizzare gli esercizi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Nome Gruppo *</Label>
              <Input
                id="group-name"
                placeholder="es. Atletica, Coordinazione, Forza"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setNewGroupDialogOpen(false); setNewGroupName(""); }}>
              Annulla
            </Button>
            <Button onClick={handleCreateGroup} disabled={isCreatingGroup || !newGroupName.trim()}>
              {isCreatingGroup && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crea Gruppo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation Dialog */}
      <AlertDialog open={deleteGroupDialogOpen} onOpenChange={setDeleteGroupDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il gruppo?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare il gruppo "{groupToDelete ? getGroupName(groupToDelete) : ''}". 
              Gli esercizi associati non verranno eliminati ma rimarranno senza gruppo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingGroup}
            >
              {isDeletingGroup && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Elimina Gruppo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare l'esercizio?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare l'esercizio "{exerciseToDelete?.name}". 
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteExercise}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exercise Detail/Edit Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={(open) => { setDetailDialogOpen(open); if (!open) setIsEditing(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                {isEditing ? "Modifica Esercizio" : "Dettagli Esercizio"}
              </DialogTitle>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifica
                </Button>
              )}
            </div>
          </DialogHeader>

          {selectedExercise && (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome Esercizio</Label>
                  {isEditing ? (
                    <Input
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-md font-medium">{selectedExercise.name}</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gruppo</Label>
                    {isEditing ? (
                      <Select 
                        value={editFormData.exerciseGroupId} 
                        onValueChange={(value) => setEditFormData({ ...editFormData, exerciseGroupId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {exerciseGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.groupName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-muted rounded-md">{getGroupName(selectedExercise.exerciseGroupId)}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Unità di Misura</Label>
                    {isEditing ? (
                      <Select 
                        value={editFormData.unit} 
                        onValueChange={(value) => setEditFormData({ ...editFormData, unit: value as BackendUnit })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cm">Centimetri (cm)</SelectItem>
                          <SelectItem value="m">Metri (m)</SelectItem>
                          <SelectItem value="sec">Secondi (sec)</SelectItem>
                          <SelectItem value="reps">Ripetizioni</SelectItem>
                          <SelectItem value="qualitativo">Qualitativo</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-muted rounded-md">{unitDisplayNames[selectedExercise.unit] || selectedExercise.unit}</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Punteggio Massimo</Label>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={editFormData.maxScore}
                      onChange={(e) => setEditFormData({ ...editFormData, maxScore: parseInt(e.target.value) || 10 })}
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-md">{selectedExercise.maxScore || 10}</div>
                  )}
                </div>
              </div>

              {/* Evaluation Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Tipo di Valutazione</Label>
                </div>
                
                {/* Evaluation Type Toggle (Edit Mode) */}
                {isEditing && (
                  <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
                    <Button
                      type="button"
                      variant={editEvaluationType === 'range' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setEditEvaluationType('range')}
                      className="h-8"
                    >
                      <Ruler className="h-4 w-4 mr-2" />
                      Fasce
                    </Button>
                    <Button
                      type="button"
                      variant={editEvaluationType === 'criteria' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setEditEvaluationType('criteria')}
                      className="h-8"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Criteri
                    </Button>
                  </div>
                )}
                
                {/* View Mode - Show current type */}
                {!isEditing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {(selectedExercise.evaluationType || 'range') === 'criteria' ? (
                      <>
                        <Star className="h-4 w-4" />
                        <span>Valutazione per Criteri</span>
                      </>
                    ) : (
                      <>
                        <Ruler className="h-4 w-4" />
                        <span>Valutazione per Fasce</span>
                      </>
                    )}
                  </div>
                )}

                {/* Range-based evaluation (Edit Mode) */}
                {isEditing && editEvaluationType === 'range' && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="edit-use-gender-ranges"
                        checked={editUseGenderRanges}
                        onChange={(e) => setEditUseGenderRanges(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="edit-use-gender-ranges" className="text-sm cursor-pointer">
                        Fasce diverse per M/F
                      </Label>
                    </div>

                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    {/* Male Ranges */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <IconGenderMale className="h-4 w-4 text-blue-500" />
                          {editUseGenderRanges ? 'Fasce Maschi' : 'Fasce (tutti)'}
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => addEditRange('M')} className="h-7 text-xs">
                          <Plus className="h-3 w-3 mr-1" />
                          Aggiungi
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {editRangesMale.map((range, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Min</Label>
                                <Input
                                  type="number"
                                  value={range.min}
                                  onChange={(e) => updateEditRange('M', index, 'min', parseFloat(e.target.value) || 0)}
                                  className="h-8"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Max</Label>
                                <Input
                                  type="number"
                                  value={range.max}
                                  onChange={(e) => updateEditRange('M', index, 'max', parseFloat(e.target.value) || 0)}
                                  className="h-8"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Voto</Label>
                                <Select
                                  value={range.score.toString()}
                                  onValueChange={(v) => updateEditRange('M', index, 'score', parseFloat(v))}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {italianScores.map((score) => (
                                      <SelectItem key={score} value={score.toString()}>
                                        {score}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {editRangesMale.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEditRange('M', index)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Female Ranges (only if gender ranges enabled) */}
                    {editUseGenderRanges && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <IconGenderFemale className="h-4 w-4 text-pink-500" />
                            Fasce Femmine
                          </Label>
                          <Button type="button" variant="outline" size="sm" onClick={() => addEditRange('F')} className="h-7 text-xs">
                            <Plus className="h-3 w-3 mr-1" />
                            Aggiungi
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {editRangesFemale.map((range, index) => (
                            <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                              <div className="flex-1 grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Min</Label>
                                  <Input
                                    type="number"
                                    value={range.min}
                                    onChange={(e) => updateEditRange('F', index, 'min', parseFloat(e.target.value) || 0)}
                                    className="h-8"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Max</Label>
                                  <Input
                                    type="number"
                                    value={range.max}
                                    onChange={(e) => updateEditRange('F', index, 'max', parseFloat(e.target.value) || 0)}
                                    className="h-8"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Voto</Label>
                                  <Select
                                    value={range.score.toString()}
                                    onValueChange={(v) => updateEditRange('F', index, 'score', parseFloat(v))}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {italianScores.map((score) => (
                                        <SelectItem key={score} value={score.toString()}>
                                          {score}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              {editRangesFemale.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeEditRange('F', index)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  </>
                )}

                {/* Criteria-based evaluation (Edit Mode) */}
                {isEditing && editEvaluationType === 'criteria' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      Definisci i criteri di valutazione. Il voto finale sarà calcolato dalla somma dei punteggi.
                    </p>
                    
                    <div className="space-y-3">
                      {editCriteria.map((criterion, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            <div className="col-span-2 space-y-1">
                              <Label className="text-xs text-muted-foreground">Nome Criterio</Label>
                              <Input
                                placeholder="es. Ricezione, Battuta..."
                                value={criterion.name}
                                onChange={(e) => {
                                  const updated = [...editCriteria];
                                  updated[index] = { ...updated[index], name: e.target.value };
                                  setEditCriteria(updated);
                                }}
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Max Punti</Label>
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={criterion.maxScore === 0 ? '' : criterion.maxScore.toString()}
                                onChange={(e) => {
                                  const updated = [...editCriteria];
                                  const val = e.target.value;
                                  if (val === '' || /^\d+$/.test(val)) {
                                    updated[index] = { ...updated[index], maxScore: val === '' ? 0 : parseInt(val) };
                                    setEditCriteria(updated);
                                  }
                                }}
                                onBlur={(e) => {
                                  const updated = [...editCriteria];
                                  const val = parseInt(e.target.value) || 1;
                                  updated[index] = { ...updated[index], maxScore: Math.max(1, val) };
                                  setEditCriteria(updated);
                                }}
                                className="h-8"
                              />
                            </div>
                          </div>
                          {editCriteria.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditCriteria(editCriteria.filter((_, i) => i !== index))}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditCriteria([...editCriteria, { name: '', maxScore: 10 }])}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Criterio
                    </Button>

                    <div className="p-3 rounded-lg bg-primary/10 text-center">
                      <p className="text-sm font-medium">
                        Punteggio Totale Massimo: {editCriteria.reduce((sum, c) => sum + c.maxScore, 0)}
                      </p>
                    </div>
                  </div>
                )}

                {/* View Mode - Show ranges or criteria */}
                {!isEditing && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    {(selectedExercise.evaluationType || 'range') === 'criteria' ? (
                      /* Criteria view */
                      selectedExercise.evaluationCriteria && selectedExercise.evaluationCriteria.length > 0 ? (
                        <div className="space-y-3">
                          {selectedExercise.evaluationCriteria.map((criterion, i) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-background rounded border">
                              <span className="font-medium">{criterion.name}</span>
                              <span className="text-muted-foreground">max {criterion.maxScore} punti</span>
                            </div>
                          ))}
                          <div className="p-3 rounded-lg bg-primary/10 text-center">
                            <p className="text-sm font-medium">
                              Punteggio Totale Massimo: {selectedExercise.evaluationCriteria.reduce((sum, c) => sum + c.maxScore, 0)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nessun criterio di valutazione configurato</p>
                      )
                    ) : (
                      /* Ranges view */
                      selectedExercise.evaluationRanges?.M ? (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <IconGenderMale className="h-4 w-4 text-blue-500" />
                              Fasce Maschi
                            </Label>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              {selectedExercise.evaluationRanges.M.map((range, i) => (
                                <div key={i} className="p-2 bg-background rounded border text-center">
                                  {range.min}-{range.max} → <strong>{range.score}</strong>
                                </div>
                              ))}
                            </div>
                          </div>
                          {selectedExercise.evaluationRanges?.F && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                <IconGenderFemale className="h-4 w-4 text-pink-500" />
                                Fasce Femmine
                              </Label>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                {selectedExercise.evaluationRanges.F.map((range, i) => (
                                  <div key={i} className="p-2 bg-background rounded border text-center">
                                    {range.min}-{range.max} → <strong>{range.score}</strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nessuna fascia di valutazione configurata</p>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Metadata */}
              {!isEditing && (
                <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
                  <p>Creato: {new Date(selectedExercise.createdAt).toLocaleDateString('it-IT')}</p>
                  <p>Aggiornato: {new Date(selectedExercise.updatedAt).toLocaleDateString('it-IT')}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Annulla
                </Button>
                <Button onClick={handleUpdateExercise} disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Salva Modifiche
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                Chiudi
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

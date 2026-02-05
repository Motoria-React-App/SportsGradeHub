import { useState, useMemo } from "react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
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
import type { Exercise, Gender, ScoreRange, EvaluationCriterion, CriterionWithRanges } from "@/types/types";
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
  X,
  TrendingUp,
} from "lucide-react";
import { IconGenderMale, IconGenderFemale } from "@tabler/icons-react";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [evaluationType, setEvaluationType] = useState<'range' | 'criteria' | 'criteria-ranges'>('range');
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([
    { name: '', maxScore: 10 }
  ]);
  const [criteriaWithRanges, setCriteriaWithRanges] = useState<CriterionWithRanges[]>([
    { name: '', unit: 'cm', maxScore: 10, ranges: { M: [{ min: 0, max: 100, score: 6 }] } }
  ]);

  // Evaluation type state (for edit)
  const [editEvaluationType, setEditEvaluationType] = useState<'range' | 'criteria' | 'criteria-ranges'>('range');
  const [editCriteria, setEditCriteria] = useState<EvaluationCriterion[]>([]);
  const [editCriteriaWithRanges, setEditCriteriaWithRanges] = useState<CriterionWithRanges[]>([]);

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
    setCriteriaWithRanges([{ name: '', unit: 'cm', maxScore: 10, ranges: { M: [{ min: 0, max: 100, score: 6 }] } }]);
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

      // Build criteria with ranges if type is 'criteria-ranges'
      const validCriteriaWithRanges = criteriaWithRanges.filter(c => c.name.trim() !== '');

      const response = await client.createExercise({
        name: formData.name,
        exerciseGroupId: formData.exerciseGroupId,
        unit: formData.unit,
        maxScore: formData.maxScore,
        evaluationType,
        evaluationRanges: evaluationType === 'range' ? evaluationRanges : undefined,
        evaluationCriteria: evaluationType === 'criteria' ? validCriteria : undefined,
        evaluationCriteriaWithRanges: evaluationType === 'criteria-ranges' ? validCriteriaWithRanges : undefined,
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

    // Load criteria with ranges if they exist
    if (exercise.evaluationCriteriaWithRanges && exercise.evaluationCriteriaWithRanges.length > 0) {
      setEditCriteriaWithRanges(exercise.evaluationCriteriaWithRanges);
    } else {
      setEditCriteriaWithRanges([{ name: '', unit: 'cm', maxScore: 10, ranges: { M: [{ min: 0, max: 100, score: 6 }] } }]);
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

      // Build criteria with ranges
      const validCriteriaWithRanges = editCriteriaWithRanges.filter(c => c.name.trim() !== '');

      const response = await client.updateExercise(selectedExercise.id, {
        name: editFormData.name,
        exerciseGroupId: editFormData.exerciseGroupId,
        unit: editFormData.unit,
        maxScore: editFormData.maxScore,
        evaluationType: editEvaluationType,
        evaluationRanges: editEvaluationType === 'range' ? evaluationRanges : undefined,
        evaluationCriteria: editEvaluationType === 'criteria' ? validCriteria : undefined,
        evaluationCriteriaWithRanges: editEvaluationType === 'criteria-ranges' ? validCriteriaWithRanges : undefined,
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
      {/* Header with decorative background */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-primary to-primary/60">
            Catalogo Esercizi
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestisci e organizza gli esercizi per le tue classi
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 shadow-sm hover:shadow-md transition-all" onClick={() => setNewGroupDialogOpen(true)}>
            <FolderPlus className="h-4 w-4" />
            Nuovo Gruppo
          </Button>
          <Button className="gap-2 shadow-md hover:shadow-lg transition-all bg-linear-to-r from-primary to-primary/90" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuovo Esercizio
          </Button>
        </div>
      </div>

      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/50 backdrop-blur-sm p-4 rounded-xl border shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-[350px] w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cerca per nome o unità..."
              className="pl-9 bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-full sm:w-[220px] bg-background/50 border-muted-foreground/20">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filtra per Gruppo" />
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
        <div className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          {filteredExercises.length} esercizi trovati
        </div>
      </div>

      {/* Exercise Groups Display */}
      <div className="space-y-10 pb-10">
        {orderedGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-2 border-dashed rounded-xl border-muted-foreground/20 bg-muted/5">
            <div className="bg-background p-4 rounded-full shadow-sm">
              <Activity className="h-10 w-10 text-primary/50" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Nessun gruppo trovato</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Non hai ancora creato gruppi di esercizi o la ricerca non ha prodotto risultati.
              </p>
            </div>
            {(searchQuery || selectedGroup !== 'all') && (
              <Button variant="link" onClick={() => { setSearchQuery(''); setSelectedGroup('all'); }}>
                Azzera filtri
              </Button>
            )}
          </div>
        )}

        {orderedGroups.map((groupId) => {
          const groupExercises = exercisesByGroup[groupId] || [];
          const groupName = getGroupName(groupId);

          return (
            <div key={groupId} className="space-y-5 animate-in slide-in-from-bottom duration-500 fade-in">
              {/* Section Header */}
              <div className="flex items-center gap-4 group/header">
                <div className="flex items-center gap-3 pl-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shadow-sm group-hover/header:scale-105 transition-transform">
                    <Dumbbell className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    {groupName}
                  </h2>
                </div>
                <div className="h-px flex-1 bg-linear-to-r from-border to-transparent" />
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-normal text-muted-foreground bg-secondary/50">
                    {groupExercises.length} esercizi
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/header:opacity-100 transition-all"
                    onClick={() => openDeleteGroupDialog(groupId)}
                    title="Elimina gruppo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Carousel */}
              <div className="px-4 md:px-12">
                <Carousel
                  opts={{
                    align: "start",
                    loop: false,
                    slidesToScroll: 1
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-3 md:-ml-5 pb-4">
                    {groupExercises.map((ex) => (
                      <CarouselItem key={ex.id} className="pl-3 md:pl-5 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                        <Card className="flex flex-col h-full hover:shadow-md transition-all duration-200 cursor-pointer group/card border-muted/60">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start gap-2">
                              <div className="space-y-1">
                                <CardTitle className="text-base font-bold leading-tight group-hover/card:text-primary transition-colors line-clamp-2">
                                  {ex.name}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  {unitIcons[ex.unit]}
                                  <span className="capitalize">{unitDisplayNames[ex.unit]?.split(' ')[0] || ex.unit}</span>
                                </p>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="flex-1 pb-3 space-y-3">
                            <div className="flex flex-wrap gap-2 text-xs">
                              {ex.maxScore && (
                                <Badge variant="secondary" className="font-normal bg-secondary/50 hover:bg-secondary/70">
                                  Max: {ex.maxScore} pt
                                </Badge>
                              )}

                              {ex.evaluationType === 'criteria' ? (
                                <Badge variant="outline" className="font-normal border-purple-200 text-purple-700 bg-purple-50">
                                  {ex.evaluationCriteria?.length || 0} Criteri
                                </Badge>
                              ) : ex.evaluationType === 'criteria-ranges' ? (
                                <Badge variant="outline" className="font-normal border-indigo-200 text-indigo-700 bg-indigo-50">
                                  {ex.evaluationCriteriaWithRanges?.length || 0} Criteri+Fasce
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="font-normal border-blue-200 text-blue-700 bg-blue-50">
                                  Fasce
                                </Badge>
                              )}
                            </div>
                          </CardContent>

                          <CardFooter className="pt-0 flex justify-between gap-2">
                            <Button
                              variant="ghost"
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                              onClick={() => openDeleteDialog(ex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 h-8 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-all"
                              onClick={() => openDetailDialog(ex)}
                            >
                              Dettagli
                            </Button>
                          </CardFooter>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="-left-3 md:-left-12 h-10 w-10 border-muted-foreground/20 hover:border-primary hover:text-primary" />
                  <CarouselNext className="-right-3 md:-right-12 h-10 w-10 border-muted-foreground/20 hover:border-primary hover:text-primary" />
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
              <div className="grid grid-cols-3 gap-2">
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
                <Button
                  type="button"
                  variant={evaluationType === 'criteria-ranges' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEvaluationType('criteria-ranges')}
                  className="flex-1"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Criteri+Fasce
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
                        <Checkbox
                          id="use-gender-ranges"
                          checked={useGenderRanges}
                          onCheckedChange={(checked: boolean) => setUseGenderRanges(checked)}
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

              {/* Criteria with Ranges evaluation */}
              {evaluationType === 'criteria-ranges' && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    Definisci criteri con fasce di valutazione. Per ogni criterio, inserisci una prestazione che verrà convertita in punteggio tramite le fasce.
                  </p>

                  <div className="space-y-4">
                    {criteriaWithRanges.map((criterion, criterionIndex) => (
                      <div key={criterionIndex} className="p-4 rounded-lg bg-background border space-y-3">
                        {/* Criterion Header */}
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Criterio {criterionIndex + 1}</Label>
                          {criteriaWithRanges.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setCriteriaWithRanges(criteriaWithRanges.filter((_, i) => i !== criterionIndex))}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        {/* Criterion Name, Unit, Max Score */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Nome</Label>
                            <Input
                              placeholder="es. Ricezione"
                              value={criterion.name}
                              onChange={(e) => {
                                const updated = [...criteriaWithRanges];
                                updated[criterionIndex] = { ...updated[criterionIndex], name: e.target.value };
                                setCriteriaWithRanges(updated);
                              }}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Unità</Label>
                            <Select
                              value={criterion.unit}
                              onValueChange={(value) => {
                                const updated = [...criteriaWithRanges];
                                updated[criterionIndex] = { ...updated[criterionIndex], unit: value as BackendUnit };
                                setCriteriaWithRanges(updated);
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cm">cm</SelectItem>
                                <SelectItem value="m">m</SelectItem>
                                <SelectItem value="sec">sec</SelectItem>
                                <SelectItem value="reps">reps</SelectItem>
                                <SelectItem value="qualitativo">qual.</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Max Punti</Label>
                            <Input
                              type="number"
                              min="1"
                              value={criterion.maxScore}
                              onChange={(e) => {
                                const updated = [...criteriaWithRanges];
                                updated[criterionIndex] = { ...updated[criterionIndex], maxScore: parseInt(e.target.value) || 1 };
                                setCriteriaWithRanges(updated);
                              }}
                              className="h-8"
                            />
                          </div>
                        </div>

                        {/* Gender Ranges Toggle */}
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`criterion-${criterionIndex}-gender`}
                            checked={criterion.ranges?.F !== undefined && criterion.ranges?.M !== criterion.ranges?.F}
                            onCheckedChange={(checked: boolean) => {
                              const updated = [...criteriaWithRanges];
                              if (checked) {
                                updated[criterionIndex] = {
                                  ...updated[criterionIndex],
                                  ranges: {
                                    M: criterion.ranges?.M || [{ min: 0, max: 100, score: 6 }],
                                    F: [{ min: 0, max: 100, score: 6 }]
                                  }
                                };
                              } else {
                                const maleRanges = criterion.ranges?.M || [{ min: 0, max: 100, score: 6 }];
                                updated[criterionIndex] = {
                                  ...updated[criterionIndex],
                                  ranges: { M: maleRanges, F: maleRanges }
                                };
                              }
                              setCriteriaWithRanges(updated);
                            }}
                            className="rounded"
                          />
                          <Label htmlFor={`criterion-${criterionIndex}-gender`} className="text-xs cursor-pointer">
                            Fasce diverse per M/F
                          </Label>
                        </div>

                        {/* Ranges for Male */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium flex items-center gap-1">
                              <IconGenderMale className="h-3 w-3 text-blue-500" />
                              {criterion.ranges?.F !== undefined && criterion.ranges?.M !== criterion.ranges?.F ? 'Fasce Maschi' : 'Fasce (tutti)'}
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const updated = [...criteriaWithRanges];
                                const currentRanges = updated[criterionIndex].ranges?.M || [];
                                updated[criterionIndex] = {
                                  ...updated[criterionIndex],
                                  ranges: {
                                    ...updated[criterionIndex].ranges,
                                    M: [...currentRanges, { min: 0, max: 100, score: 6 }]
                                  }
                                };
                                setCriteriaWithRanges(updated);
                              }}
                              className="h-6 text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Aggiungi
                            </Button>
                          </div>
                          <div className="space-y-1">
                            {(criterion.ranges?.M || [{ min: 0, max: 100, score: 6 }]).map((range, rangeIndex) => (
                              <div key={rangeIndex} className="flex items-center gap-1">
                                <Input
                                  type="text"
                                  placeholder="Min"
                                  value={range.min}
                                  onChange={(e) => {
                                    const updated = [...criteriaWithRanges];
                                    const ranges = [...(updated[criterionIndex].ranges?.M || [])];
                                    ranges[rangeIndex] = { ...ranges[rangeIndex], min: parseFloat(e.target.value) || 0 };
                                    updated[criterionIndex] = {
                                      ...updated[criterionIndex],
                                      ranges: { ...updated[criterionIndex].ranges, M: ranges }
                                    };
                                    setCriteriaWithRanges(updated);
                                  }}
                                  className="h-7 text-xs"
                                />
                                <Input
                                  type="text"
                                  placeholder="Max"
                                  value={range.max}
                                  onChange={(e) => {
                                    const updated = [...criteriaWithRanges];
                                    const ranges = [...(updated[criterionIndex].ranges?.M || [])];
                                    ranges[rangeIndex] = { ...ranges[rangeIndex], max: parseFloat(e.target.value) || 0 };
                                    updated[criterionIndex] = {
                                      ...updated[criterionIndex],
                                      ranges: { ...updated[criterionIndex].ranges, M: ranges }
                                    };
                                    setCriteriaWithRanges(updated);
                                  }}
                                  className="h-7 text-xs"
                                />
                                <Select
                                  value={range.score.toString()}
                                  onValueChange={(v) => {
                                    const updated = [...criteriaWithRanges];
                                    const ranges = [...(updated[criterionIndex].ranges?.M || [])];
                                    ranges[rangeIndex] = { ...ranges[rangeIndex], score: parseFloat(v) };
                                    updated[criterionIndex] = {
                                      ...updated[criterionIndex],
                                      ranges: { ...updated[criterionIndex].ranges, M: ranges }
                                    };
                                    setCriteriaWithRanges(updated);
                                  }}
                                >
                                  <SelectTrigger className="h-7 text-xs w-16">
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
                                {(criterion.ranges?.M || []).length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const updated = [...criteriaWithRanges];
                                      const ranges = (updated[criterionIndex].ranges?.M || []).filter((_, i) => i !== rangeIndex);
                                      updated[criterionIndex] = {
                                        ...updated[criterionIndex],
                                        ranges: { ...updated[criterionIndex].ranges, M: ranges }
                                      };
                                      setCriteriaWithRanges(updated);
                                    }}
                                    className="h-7 w-7 p-0 text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Ranges for Female (if different) */}
                        {criterion.ranges?.F !== undefined && criterion.ranges?.M !== criterion.ranges?.F && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium flex items-center gap-1">
                                <IconGenderFemale className="h-3 w-3 text-pink-500" />
                                Fasce Femmine
                              </Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const updated = [...criteriaWithRanges];
                                  const currentRanges = updated[criterionIndex].ranges?.F || [];
                                  updated[criterionIndex] = {
                                    ...updated[criterionIndex],
                                    ranges: {
                                      ...updated[criterionIndex].ranges,
                                      F: [...currentRanges, { min: 0, max: 100, score: 6 }]
                                    }
                                  };
                                  setCriteriaWithRanges(updated);
                                }}
                                className="h-6 text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Aggiungi
                              </Button>
                            </div>
                            <div className="space-y-1">
                              {(criterion.ranges?.F || []).map((range, rangeIndex) => (
                                <div key={rangeIndex} className="flex items-center gap-1">
                                  <Input
                                    type="text"
                                    placeholder="Min"
                                    value={range.min}
                                    onChange={(e) => {
                                      const updated = [...criteriaWithRanges];
                                      const ranges = [...(updated[criterionIndex].ranges?.F || [])];
                                      ranges[rangeIndex] = { ...ranges[rangeIndex], min: parseFloat(e.target.value) || 0 };
                                      updated[criterionIndex] = {
                                        ...updated[criterionIndex],
                                        ranges: { ...updated[criterionIndex].ranges, F: ranges }
                                      };
                                      setCriteriaWithRanges(updated);
                                    }}
                                    className="h-7 text-xs"
                                  />
                                  <Input
                                    type="text"
                                    placeholder="Max"
                                    value={range.max}
                                    onChange={(e) => {
                                      const updated = [...criteriaWithRanges];
                                      const ranges = [...(updated[criterionIndex].ranges?.F || [])];
                                      ranges[rangeIndex] = { ...ranges[rangeIndex], max: parseFloat(e.target.value) || 0 };
                                      updated[criterionIndex] = {
                                        ...updated[criterionIndex],
                                        ranges: { ...updated[criterionIndex].ranges, F: ranges }
                                      };
                                      setCriteriaWithRanges(updated);
                                    }}
                                    className="h-7 text-xs"
                                  />
                                  <Select
                                    value={range.score.toString()}
                                    onValueChange={(v) => {
                                      const updated = [...criteriaWithRanges];
                                      const ranges = [...(updated[criterionIndex].ranges?.F || [])];
                                      ranges[rangeIndex] = { ...ranges[rangeIndex], score: parseFloat(v) };
                                      updated[criterionIndex] = {
                                        ...updated[criterionIndex],
                                        ranges: { ...updated[criterionIndex].ranges, F: ranges }
                                      };
                                      setCriteriaWithRanges(updated);
                                    }}
                                  >
                                    <SelectTrigger className="h-7 text-xs w-16">
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
                                  {(criterion.ranges?.F || []).length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updated = [...criteriaWithRanges];
                                        const ranges = (updated[criterionIndex].ranges?.F || []).filter((_, i) => i !== rangeIndex);
                                        updated[criterionIndex] = {
                                          ...updated[criterionIndex],
                                          ranges: { ...updated[criterionIndex].ranges, F: ranges }
                                        };
                                        setCriteriaWithRanges(updated);
                                      }}
                                      className="h-7 w-7 p-0 text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCriteriaWithRanges([...criteriaWithRanges, { name: '', unit: 'cm', maxScore: 10, ranges: { M: [{ min: 0, max: 100, score: 6 }] } }])}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Criterio
                  </Button>

                  <div className="p-3 rounded-lg bg-primary/10 text-center">
                    <p className="text-sm font-medium">
                      Punteggio Totale Massimo: {criteriaWithRanges.reduce((sum, c) => sum + c.maxScore, 0)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                {isEditing ? "Modifica Esercizio" : "Dettagli Esercizio"}
              </DialogTitle>
              <div className="flex items-center gap-4">
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifica
                  </Button>
                )}
                <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </DialogClose>
              </div>
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
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={editEvaluationType === 'range' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditEvaluationType('range')}
                      className="h-8"
                    >
                      <Ruler className="h-4 w-4 mr-2" />
                      Fasce
                    </Button>
                    <Button
                      type="button"
                      variant={editEvaluationType === 'criteria' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditEvaluationType('criteria')}
                      className="h-8"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Criteri
                    </Button>
                    <Button
                      type="button"
                      variant={editEvaluationType === 'criteria-ranges' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditEvaluationType('criteria-ranges')}
                      className="h-8"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Criteri+Fasce
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
                    ) : (selectedExercise.evaluationType || 'range') === 'criteria-ranges' ? (
                      <>
                        <TrendingUp className="h-4 w-4" />
                        <span>Criteri con Fasce</span>
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

                {/* Criteria with Ranges evaluation (Edit Mode) - COPY FROM CREATE FORM BUT WITH edit prefix */}
                {isEditing && editEvaluationType === 'criteria-ranges' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      Definisci criteri con fasce di valutazione. Per ogni criterio, inserisci una prestazione che verrà convertita in punteggio tramite le fasce.
                    </p>

                    <div className="space-y-4">
                      {editCriteriaWithRanges.map((criterion, criterionIndex) => (
                        <div key={criterionIndex} className="p-4 rounded-lg bg-background border space-y-3">
                          {/* Criterion Header */}
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">Criterio {criterionIndex + 1}</Label>
                            {editCriteriaWithRanges.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditCriteriaWithRanges(editCriteriaWithRanges.filter((_, i) => i !== criterionIndex))}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>

                          {/* Criterion Name, Unit, Max Score */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Nome</Label>
                              <Input
                                placeholder="es. Ricezione"
                                value={criterion.name}
                                onChange={(e) => {
                                  const updated = [...editCriteriaWithRanges];
                                  updated[criterionIndex] = { ...updated[criterionIndex], name: e.target.value };
                                  setEditCriteriaWithRanges(updated);
                                }}
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Unità</Label>
                              <Select
                                value={criterion.unit}
                                onValueChange={(value) => {
                                  const updated = [...editCriteriaWithRanges];
                                  updated[criterionIndex] = { ...updated[criterionIndex], unit: value as BackendUnit };
                                  setEditCriteriaWithRanges(updated);
                                }}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cm">cm</SelectItem>
                                  <SelectItem value="m">m</SelectItem>
                                  <SelectItem value="sec">sec</SelectItem>
                                  <SelectItem value="reps">reps</SelectItem>
                                  <SelectItem value="qualitativo">qual.</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Max Punti</Label>
                              <Input
                                type="number"
                                min="1"
                                value={criterion.maxScore}
                                onChange={(e) => {
                                  const updated = [...editCriteriaWithRanges];
                                  updated[criterionIndex] = { ...updated[criterionIndex], maxScore: parseInt(e.target.value) || 1 };
                                  setEditCriteriaWithRanges(updated);
                                }}
                                className="h-8"
                              />
                            </div>
                          </div>

                          {/* Gender Ranges Toggle */}
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`edit-criterion-${criterionIndex}-gender`}
                              checked={criterion.ranges?.F !== undefined && criterion.ranges?.M !== criterion.ranges?.F}
                              onCheckedChange={(checked: boolean) => {
                                const updated = [...editCriteriaWithRanges];
                                if (checked) {
                                  updated[criterionIndex] = {
                                    ...updated[criterionIndex],
                                    ranges: {
                                      M: criterion.ranges?.M || [{ min: 0, max: 100, score: 6 }],
                                      F: [{ min: 0, max: 100, score: 6 }]
                                    }
                                  };
                                } else {
                                  const maleRanges = criterion.ranges?.M || [{ min: 0, max: 100, score: 6 }];
                                  updated[criterionIndex] = {
                                    ...updated[criterionIndex],
                                    ranges: { M: maleRanges, F: maleRanges }
                                  };
                                }
                                setEditCriteriaWithRanges(updated);
                              }}
                              className="rounded"
                            />
                            <Label htmlFor={`edit-criterion-${criterionIndex}-gender`} className="text-xs cursor-pointer">
                              Fasce diverse per M/F
                            </Label>
                          </div>

                          {/* Ranges for Male */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium flex items-center gap-1">
                                <IconGenderMale className="h-3 w-3 text-blue-500" />
                                {criterion.ranges?.F !== undefined && criterion.ranges?.M !== criterion.ranges?.F ? 'Fasce Maschi' : 'Fasce (tutti)'}
                              </Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const updated = [...editCriteriaWithRanges];
                                  const currentRanges = updated[criterionIndex].ranges?.M || [];
                                  updated[criterionIndex] = {
                                    ...updated[criterionIndex],
                                    ranges: {
                                      ...updated[criterionIndex].ranges,
                                      M: [...currentRanges, { min: 0, max: 100, score: 6 }]
                                    }
                                  };
                                  setEditCriteriaWithRanges(updated);
                                }}
                                className="h-6 text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Aggiungi
                              </Button>
                            </div>
                            <div className="space-y-1">
                              {(criterion.ranges?.M || [{ min: 0, max: 100, score: 6 }]).map((range, rangeIndex) => (
                                <div key={rangeIndex} className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    placeholder="Min"
                                    value={range.min}
                                    onChange={(e) => {
                                      const updated = [...editCriteriaWithRanges];
                                      const ranges = [...(updated[criterionIndex].ranges?.M || [])];
                                      ranges[rangeIndex] = { ...ranges[rangeIndex], min: parseFloat(e.target.value) || 0 };
                                      updated[criterionIndex] = {
                                        ...updated[criterionIndex],
                                        ranges: { ...updated[criterionIndex].ranges, M: ranges }
                                      };
                                      setEditCriteriaWithRanges(updated);
                                    }}
                                    className="h-7 text-xs"
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Max"
                                    value={range.max}
                                    onChange={(e) => {
                                      const updated = [...editCriteriaWithRanges];
                                      const ranges = [...(updated[criterionIndex].ranges?.M || [])];
                                      ranges[rangeIndex] = { ...ranges[rangeIndex], max: parseFloat(e.target.value) || 0 };
                                      updated[criterionIndex] = {
                                        ...updated[criterionIndex],
                                        ranges: { ...updated[criterionIndex].ranges, M: ranges }
                                      };
                                      setEditCriteriaWithRanges(updated);
                                    }}
                                    className="h-7 text-xs"
                                  />
                                  <Select
                                    value={range.score.toString()}
                                    onValueChange={(v) => {
                                      const updated = [...editCriteriaWithRanges];
                                      const ranges = [...(updated[criterionIndex].ranges?.M || [])];
                                      ranges[rangeIndex] = { ...ranges[rangeIndex], score: parseFloat(v) };
                                      updated[criterionIndex] = {
                                        ...updated[criterionIndex],
                                        ranges: { ...updated[criterionIndex].ranges, M: ranges }
                                      };
                                      setEditCriteriaWithRanges(updated);
                                    }}
                                  >
                                    <SelectTrigger className="h-7 text-xs w-16">
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
                                  {(criterion.ranges?.M || []).length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updated = [...editCriteriaWithRanges];
                                        const ranges = (updated[criterionIndex].ranges?.M || []).filter((_, i) => i !== rangeIndex);
                                        updated[criterionIndex] = {
                                          ...updated[criterionIndex],
                                          ranges: { ...updated[criterionIndex].ranges, M: ranges }
                                        };
                                        setEditCriteriaWithRanges(updated);
                                      }}
                                      className="h-7 w-7 p-0 text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Ranges for Female (if enabled) */}
                          {criterion.ranges?.F !== undefined && criterion.ranges?.M !== criterion.ranges?.F && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium flex items-center gap-1">
                                  <IconGenderFemale className="h-3 w-3 text-pink-500" />
                                  Fasce Femmine
                                </Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const updated = [...editCriteriaWithRanges];
                                    const currentRanges = updated[criterionIndex].ranges?.F || [];
                                    updated[criterionIndex] = {
                                      ...updated[criterionIndex],
                                      ranges: {
                                        ...updated[criterionIndex].ranges,
                                        F: [...currentRanges, { min: 0, max: 100, score: 6 }]
                                      }
                                    };
                                    setEditCriteriaWithRanges(updated);
                                  }}
                                  className="h-6 text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Aggiungi
                                </Button>
                              </div>
                              <div className="space-y-1">
                                {(criterion.ranges?.F || []).map((range, rangeIndex) => (
                                  <div key={rangeIndex} className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      placeholder="Min"
                                      value={range.min}
                                      onChange={(e) => {
                                        const updated = [...editCriteriaWithRanges];
                                        const ranges = [...(updated[criterionIndex].ranges?.F || [])];
                                        ranges[rangeIndex] = { ...ranges[rangeIndex], min: parseFloat(e.target.value) || 0 };
                                        updated[criterionIndex] = {
                                          ...updated[criterionIndex],
                                          ranges: { ...updated[criterionIndex].ranges, F: ranges }
                                        };
                                        setEditCriteriaWithRanges(updated);
                                      }}
                                      className="h-7 text-xs"
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Max"
                                      value={range.max}
                                      onChange={(e) => {
                                        const updated = [...editCriteriaWithRanges];
                                        const ranges = [...(updated[criterionIndex].ranges?.F || [])];
                                        ranges[rangeIndex] = { ...ranges[rangeIndex], max: parseFloat(e.target.value) || 0 };
                                        updated[criterionIndex] = {
                                          ...updated[criterionIndex],
                                          ranges: { ...updated[criterionIndex].ranges, F: ranges }
                                        };
                                        setEditCriteriaWithRanges(updated);
                                      }}
                                      className="h-7 text-xs"
                                    />
                                    <Select
                                      value={range.score.toString()}
                                      onValueChange={(v) => {
                                        const updated = [...editCriteriaWithRanges];
                                        const ranges = [...(updated[criterionIndex].ranges?.F || [])];
                                        ranges[rangeIndex] = { ...ranges[rangeIndex], score: parseFloat(v) };
                                        updated[criterionIndex] = {
                                          ...updated[criterionIndex],
                                          ranges: { ...updated[criterionIndex].ranges, F: ranges }
                                        };
                                        setEditCriteriaWithRanges(updated);
                                      }}
                                    >
                                      <SelectTrigger className="h-7 text-xs w-16">
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
                                    {(criterion.ranges?.F || []).length > 1 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const updated = [...editCriteriaWithRanges];
                                          const ranges = (updated[criterionIndex].ranges?.F || []).filter((_, i) => i !== rangeIndex);
                                          updated[criterionIndex] = {
                                            ...updated[criterionIndex],
                                            ranges: { ...updated[criterionIndex].ranges, F: ranges }
                                          };
                                          setEditCriteriaWithRanges(updated);
                                        }}
                                        className="h-7 w-7 p-0 text-destructive"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditCriteriaWithRanges([...editCriteriaWithRanges, { name: '', unit: 'cm', maxScore: 10, ranges: { M: [{ min: 0, max: 100, score: 6 }] } }])}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Criterio
                    </Button>

                    <div className="p-3 rounded-lg bg-primary/10 text-center">
                      <p className="text-sm font-medium">
                        Punteggio Totale Massimo: {editCriteriaWithRanges.reduce((sum, c) => sum + c.maxScore, 0)}
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
                    ) : (selectedExercise.evaluationType === 'criteria-ranges') ? (
                      /* Criteria with Ranges view */
                      selectedExercise.evaluationCriteriaWithRanges && selectedExercise.evaluationCriteriaWithRanges.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid gap-3">
                            {selectedExercise.evaluationCriteriaWithRanges.map((criterion, i) => (
                              <div key={i} className="p-3 bg-background rounded-lg border space-y-2">
                                <div className="flex justify-between items-center border-b pb-2">
                                  <div className="font-medium flex items-center gap-2">
                                    <Badge variant="outline" className="h-5 text-[10px]">{criterion.unit}</Badge>
                                    {criterion.name}
                                  </div>
                                  <Badge variant="secondary">Max: {criterion.maxScore}</Badge>
                                </div>

                                {/* Ranges Preview */}
                                <div className="space-y-4 pt-2">
                                  {criterion.ranges?.M && (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                        <IconGenderMale className="h-3.5 w-3.5 text-blue-500" />
                                        Fasce {criterion.ranges?.F ? 'Maschi' : 'Uniche'}
                                      </div>
                                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
                                        {criterion.ranges.M.map((r, idx) => (
                                          <div key={idx} className="p-1.5 bg-muted/40 rounded border text-center whitespace-nowrap">
                                            {r.min}-{r.max} → <strong>{r.score}</strong>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {criterion.ranges?.F && (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                        <IconGenderFemale className="h-3.5 w-3.5 text-pink-500" />
                                        Fasce Femmine
                                      </div>
                                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
                                        {criterion.ranges.F.map((r, idx) => (
                                          <div key={idx} className="p-1.5 bg-muted/40 rounded border text-center whitespace-nowrap">
                                            {r.min}-{r.max} → <strong>{r.score}</strong>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="p-3 rounded-lg bg-primary/10 text-center">
                            <p className="text-sm font-medium">
                              Punteggio Totale Massimo: {selectedExercise.evaluationCriteriaWithRanges.reduce((sum, c) => sum + c.maxScore, 0)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nessun criterio con fasce configurato</p>
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

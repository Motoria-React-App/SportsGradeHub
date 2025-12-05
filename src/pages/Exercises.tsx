import { useState, useMemo } from "react";
import { AppSidebar } from "@/components/app-sidebar";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { exercises as mockExercises } from "@/data/mockData";
import {
  Search,
  Plus,
  Filter,
  Dumbbell,
  Users,
  Activity,
  Zap,
  Wind,
  Target,
  Move,
  Flame,
  Circle,
  Ruler,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { IconGenderMale, IconGenderFemale } from "@tabler/icons-react";
import type { Exercise, ExerciseType, EvaluationMode, MeasurementUnit, ScoreRange, CustomCriterion, SubExerciseItem } from "@/types";

// Type display names in Italian
const typeDisplayNames: Record<ExerciseType, string> = {
  velocita: "Velocità",
  resistenza: "Resistenza",
  forza: "Forza",
  coordinazione: "Coordinazione",
  flessibilita: "Flessibilità",
  pallavolo: "Pallavolo",
  basket: "Basket",
  calcio: "Calcio",
  ginnastica: "Ginnastica",
  atletica: "Atletica",
};

// Type icons
const typeIcons: Record<ExerciseType, React.ReactNode> = {
  velocita: <Zap className="h-5 w-5" />,
  resistenza: <Wind className="h-5 w-5" />,
  forza: <Flame className="h-5 w-5" />,
  coordinazione: <Target className="h-5 w-5" />,
  flessibilita: <Move className="h-5 w-5" />,
  pallavolo: <Circle className="h-5 w-5" />,
  basket: <Circle className="h-5 w-5" />,
  calcio: <Circle className="h-5 w-5" />,
  ginnastica: <Circle className="h-5 w-5" />,
  atletica: <Dumbbell className="h-5 w-5" />,
};

// Type colors for badges and section headers
const typeColors: Record<ExerciseType, { bg: string; text: string; border: string }> = {
  velocita: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800"
  },
  resistenza: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800"
  },
  forza: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800"
  },
  coordinazione: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800"
  },
  flessibilita: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-200 dark:border-green-800"
  },
  pallavolo: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800"
  },
  basket: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800"
  },
  calcio: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800"
  },
  ginnastica: {
    bg: "bg-pink-100 dark:bg-pink-900/30",
    text: "text-pink-700 dark:text-pink-400",
    border: "border-pink-200 dark:border-pink-800"
  },
  atletica: {
    bg: "bg-sky-100 dark:bg-sky-900/30",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-200 dark:border-sky-800"
  },
};

// Order for displaying types
const typeOrder: ExerciseType[] = [
  "forza",
  "velocita",
  "resistenza",
  "coordinazione",
  "flessibilita",
  "atletica",
  "pallavolo",
  "basket",
  "calcio",
  "ginnastica",
];

// Unit display names
const unitDisplayNames: Record<MeasurementUnit, string> = {
  cm: "Centimetri (cm)",
  m: "Metri (m)",
  km: "Chilometri (km)",
  sec: "Secondi (sec)",
  min: "Minuti (min)",
  reps: "Ripetizioni",
  kg: "Chilogrammi (kg)",
  points: "Punti",
};

// Italian scores 1-10
const italianScores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>(mockExercises);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Multi-step form state
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    type: "" as ExerciseType | "",
    description: "",
    requiresTeamwork: false,
    evaluationMode: "" as EvaluationMode | "composite" | "",
    unit: "cm" as MeasurementUnit,
  });

  // Range-based exercise state
  const [rangesMale, setRangesMale] = useState<ScoreRange[]>([
    { minValue: 0, maxValue: 100, score: 6 }
  ]);
  const [rangesFemale, setRangesFemale] = useState<ScoreRange[]>([
    { minValue: 0, maxValue: 100, score: 6 }
  ]);
  const [useGenderRanges, setUseGenderRanges] = useState(true);

  // Criteria-based exercise state
  const [customCriteria, setCustomCriteria] = useState<Omit<CustomCriterion, 'id'>[]>([
    { name: "", maxScore: 10, weight: 1 }
  ]);

  // Composite exercise state - sub-exercises
  const [subExerciseItems, setSubExerciseItems] = useState<Omit<SubExerciseItem, 'id'>[]>([]);
  const [expandedSubEx, setExpandedSubEx] = useState<number | null>(null);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Get unique exercise types for the filter
  const exerciseTypes = Array.from(new Set(exercises.map(ex => ex.type)));

  // Filter exercises based on search and type
  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || ex.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Group exercises by type
  const exercisesByType = useMemo(() => {
    const grouped: Record<ExerciseType, Exercise[]> = {} as Record<ExerciseType, Exercise[]>;

    filteredExercises.forEach(ex => {
      if (!grouped[ex.type]) {
        grouped[ex.type] = [];
      }
      grouped[ex.type].push(ex);
    });

    return grouped;
  }, [filteredExercises]);

  // Get ordered types that have exercises
  const orderedTypesWithExercises = typeOrder.filter(type => exercisesByType[type]?.length > 0);

  const getTypeColor = (type: ExerciseType) => {
    const colors = typeColors[type];
    return `${colors.bg} ${colors.text} hover:opacity-80`;
  };

  // Range management functions - syncs both genders when gender ranges are enabled
  const addRange = () => {
    const newRange = { minValue: 0, maxValue: 100, score: 6 };
    // Add to both genders to keep them in sync
    if (useGenderRanges) {
      setRangesMale([...rangesMale, newRange]);
      setRangesFemale([...rangesFemale, newRange]);
    } else {
      setRangesMale([...rangesMale, newRange]);
    }
  };

  const removeRange = (index: number) => {
    // Remove from both genders to keep them in sync
    if (useGenderRanges) {
      if (rangesMale.length > 1) {
        setRangesMale(rangesMale.filter((_, i) => i !== index));
        setRangesFemale(rangesFemale.filter((_, i) => i !== index));
      }
    } else {
      if (rangesMale.length > 1) {
        setRangesMale(rangesMale.filter((_, i) => i !== index));
      }
    }
  };

  const updateRange = (gender: 'male' | 'female', index: number, field: keyof ScoreRange, value: number) => {
    const setter = gender === 'male' ? setRangesMale : setRangesFemale;
    const current = gender === 'male' ? rangesMale : rangesFemale;
    const updated = [...current];
    updated[index] = { ...updated[index], [field]: value };
    setter(updated);
  };

  // Criteria management functions
  const addCriterion = () => {
    setCustomCriteria([...customCriteria, { name: "", maxScore: 10, weight: 1 }]);
  };

  const removeCriterion = (index: number) => {
    if (customCriteria.length > 1) {
      setCustomCriteria(customCriteria.filter((_, i) => i !== index));
    }
  };

  const updateCriterion = (index: number, field: keyof Omit<CustomCriterion, 'id'>, value: string | number) => {
    const updated = [...customCriteria];
    updated[index] = { ...updated[index], [field]: value };
    setCustomCriteria(updated);
  };

  // Sub-exercise management functions
  const addSubExerciseItem = () => {
    setSubExerciseItems([...subExerciseItems, {
      name: "",
      evaluationMode: 'range',
      unit: 'cm',
      rangesMale: [{ minValue: 0, maxValue: 100, score: 6 }],
      rangesFemale: [{ minValue: 0, maxValue: 100, score: 6 }],
      useGenderRanges: false,
      customCriteria: [{ id: 'c1', name: '', maxScore: 10 }],
    }]);
    setExpandedSubEx(subExerciseItems.length);
  };

  const removeSubExerciseItem = (index: number) => {
    setSubExerciseItems(subExerciseItems.filter((_, i) => i !== index));
    setExpandedSubEx(null);
  };

  const updateSubExerciseItem = (index: number, updates: Partial<Omit<SubExerciseItem, 'id'>>) => {
    const updated = [...subExerciseItems];
    updated[index] = { ...updated[index], ...updates };
    setSubExerciseItems(updated);
  };

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Il nome dell'esercizio è obbligatorio";
    }
    if (!formData.type) {
      newErrors.type = "Il tipo di esercizio è obbligatorio";
    }
    if (!formData.evaluationMode) {
      newErrors.evaluationMode = "Seleziona una modalità di valutazione";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: { [key: string]: string } = {};

    if (formData.evaluationMode === 'range') {
      const validateRanges = (ranges: ScoreRange[], prefix: string) => {
        ranges.forEach((range, index) => {
          if (range.minValue >= range.maxValue) {
            newErrors[`${prefix}${index}`] = "Il valore minimo deve essere inferiore al massimo";
          }
        });
      };
      validateRanges(rangesMale, 'rangeMale');
      if (useGenderRanges) {
        validateRanges(rangesFemale, 'rangeFemale');
      }
    } else if (formData.evaluationMode === 'criteria') {
      customCriteria.forEach((criterion, index) => {
        if (!criterion.name.trim()) {
          newErrors[`criterion${index}`] = "Il nome del criterio è obbligatorio";
        }
      });
    } else if (formData.evaluationMode === 'composite') {
      if (subExerciseItems.length === 0) {
        newErrors.subExercises = "Aggiungi almeno un sotto-esercizio";
      }
      subExerciseItems.forEach((subEx, index) => {
        if (!subEx.name.trim()) {
          newErrors[`subEx${index}`] = "Il nome del sotto-esercizio è obbligatorio";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      name: "",
      type: "" as ExerciseType | "",
      description: "",
      requiresTeamwork: false,
      evaluationMode: "" as EvaluationMode | "composite" | "",
      unit: "cm" as MeasurementUnit,
    });
    setRangesMale([{ minValue: 0, maxValue: 100, score: 6 }]);
    setRangesFemale([{ minValue: 0, maxValue: 100, score: 6 }]);
    setUseGenderRanges(true);
    setCustomCriteria([{ name: "", maxScore: 10, weight: 1 }]);
    setSubExerciseItems([]);
    setExpandedSubEx(null);
    setErrors({});
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    if (!validateStep2()) return;

    const newExercise: Exercise = {
      id: `ex${Date.now()}`,
      name: formData.name,
      type: formData.type as ExerciseType,
      description: formData.description,
      requiresTeamwork: formData.requiresTeamwork,
      evaluationMode: formData.evaluationMode as EvaluationMode | 'composite',
      ...(formData.evaluationMode === 'range' && {
        unit: formData.unit,
        rangesMale: rangesMale,
        rangesFemale: useGenderRanges ? rangesFemale : rangesMale,
      }),
      ...(formData.evaluationMode === 'criteria' && {
        customCriteria: customCriteria.map((c, i) => ({
          ...c,
          id: `crit${Date.now()}-${i}`,
        })),
      }),
      ...(formData.evaluationMode === 'composite' && {
        subExerciseItems: subExerciseItems.map((s, i) => ({
          ...s,
          id: `subex${Date.now()}-${i}`,
        })),
      }),
    };

    setExercises([...exercises, newExercise]);
    setDialogOpen(false);
    resetForm();
  };

  // Render range editor
  const renderRangeEditor = (ranges: ScoreRange[], gender: 'male' | 'female', label: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addRange()}
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
                  type="number"
                  value={range.minValue}
                  onChange={(e) => updateRange(gender, index, 'minValue', parseFloat(e.target.value) || 0)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Max</Label>
                <Input
                  type="number"
                  value={range.maxValue}
                  onChange={(e) => updateRange(gender, index, 'maxValue', parseFloat(e.target.value) || 0)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Voto</Label>
                <Select
                  value={range.score.toString()}
                  onValueChange={(v) => updateRange(gender, index, 'score', parseInt(v))}
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
                onClick={() => removeRange(index)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      {errors[`range${gender.charAt(0).toUpperCase() + gender.slice(1)}0`] && (
        <p className="text-xs text-destructive">{errors[`range${gender.charAt(0).toUpperCase() + gender.slice(1)}0`]}</p>
      )}
    </div>
  );

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
              <h1 className="text-3xl font-bold tracking-tight">Esercizi</h1>
              <p className="text-muted-foreground">Catalogo degli esercizi e attività disponibili</p>
            </div>
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nuovo Esercizio
            </Button>
          </div>

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
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tipo attività" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i tipi</SelectItem>
                  {exerciseTypes.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {typeDisplayNames[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredExercises.length} esercizi trovati
            </div>
          </div>

          {/* Carousel sections by type */}
          <div className="space-y-8">
            {orderedTypesWithExercises.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nessun esercizio trovato</p>
              </div>
            )}

            {orderedTypesWithExercises.map((type) => {
              const typeExercises = exercisesByType[type];
              const colors = typeColors[type];

              return (
                <div key={type} className="space-y-4">
                  {/* Section Header */}
                  <div className="flex items-center gap-3">
                    {/* Label Box */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${colors.bg} ${colors.border}`}>
                      <div className={colors.text}>
                        {typeIcons[type]}
                      </div>
                      <h2 className={`text-base font-semibold ${colors.text}`}>
                        {typeDisplayNames[type]}
                      </h2>
                    </div>
                    {/* Colored Line */}
                    <div className={`flex-1 h-[2px] rounded-full ${colors.bg.replace('bg-', 'bg-').replace('/30', '/50')}`} style={{
                      background: `linear-gradient(to right, ${type === 'velocita' ? 'rgb(234 88 12 / 0.4)' :
                        type === 'resistenza' ? 'rgb(37 99 235 / 0.4)' :
                          type === 'forza' ? 'rgb(220 38 38 / 0.4)' :
                            type === 'coordinazione' ? 'rgb(147 51 234 / 0.4)' :
                              type === 'flessibilita' ? 'rgb(22 163 74 / 0.4)' :
                                type === 'pallavolo' ? 'rgb(217 119 6 / 0.4)' :
                                  type === 'basket' ? 'rgb(234 88 12 / 0.4)' :
                                    type === 'calcio' ? 'rgb(5 150 105 / 0.4)' :
                                      type === 'ginnastica' ? 'rgb(219 39 119 / 0.4)' :
                                        'rgb(14 165 233 / 0.4)'
                        }, transparent)`
                    }} />
                    {/* Exercise Count Badge */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${colors.bg} ${colors.border} ${colors.text}`}>
                      <span>{typeExercises.length}</span>
                      <span className="opacity-75">eserciz{typeExercises.length === 1 ? 'io' : 'i'}</span>
                    </div>
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
                        {typeExercises.map((ex) => (
                          <CarouselItem key={ex.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                            <Card className="flex flex-col h-full hover:shadow-md transition-all duration-200 cursor-pointer group">
                              <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-2">
                                  <CardTitle className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                                    {ex.name}
                                  </CardTitle>
                                  <Badge variant="secondary" className={`capitalize shrink-0 ${getTypeColor(ex.type)}`}>
                                    {typeDisplayNames[ex.type] || ex.type}
                                  </Badge>
                                </div>
                                <CardDescription className="flex items-center gap-1 mt-1">
                                  <Activity className="h-3 w-3" />
                                  {ex.evaluationMode === 'range' ? 'Valutazione a fasce' :
                                    ex.evaluationMode === 'criteria' ? 'Valutazione a criteri' :
                                      'Attività fisica'}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="flex-1 pb-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Users className="h-4 w-4" />
                                  <span>
                                    {ex.requiresTeamwork ? "Richiede gioco di squadra" : "Individuale"}
                                  </span>
                                </div>
                                {ex.evaluationMode === 'range' && ex.unit && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Ruler className="h-4 w-4 text-primary" />
                                    <span className="text-muted-foreground">Unità: {unitDisplayNames[ex.unit]}</span>
                                  </div>
                                )}
                                {ex.evaluationMode === 'criteria' && ex.customCriteria && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <ClipboardList className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-primary">
                                      {ex.customCriteria.length} criter{ex.customCriteria.length === 1 ? 'io' : 'i'}
                                    </span>
                                  </div>
                                )}
                              </CardContent>
                              <CardFooter className="pt-0">
                                <Button variant="ghost" className="w-full justify-start pl-0 hover:pl-2 transition-all" size="sm">
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

          {/* Add Exercise Dialog - Redesigned */}
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {step === 1 ? (
                    <>
                      <Dumbbell className="h-5 w-5" />
                      Nuovo Esercizio
                    </>
                  ) : (
                    <>
                      {formData.evaluationMode === 'range' ? (
                        <><Ruler className="h-5 w-5" /> Configura Fasce di Valutazione</>
                      ) : (
                        <><ClipboardList className="h-5 w-5" /> Configura Criteri di Valutazione</>
                      )}
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {step === 1 ? (
                    "Definisci le informazioni base dell'esercizio e scegli la modalità di valutazione."
                  ) : formData.evaluationMode === 'range' ? (
                    "Imposta le fasce di punteggio in base alle prestazioni misurate."
                  ) : (
                    "Aggiungi i criteri con cui valuterai manualmente gli studenti."
                  )}
                </DialogDescription>
              </DialogHeader>

              {/* Step Indicator */}
              <div className="flex items-center gap-2 py-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  1
                </div>
                <div className={`flex-1 h-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  2
                </div>
              </div>

              {step === 1 && (
                <div className="space-y-6 py-4">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="exercise-name">Nome Esercizio *</Label>
                      <Input
                        id="exercise-name"
                        placeholder="es. Salto in Lungo, Pallavolo - Fondamentali"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="exercise-type">Categoria *</Label>
                        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as ExerciseType })}>
                          <SelectTrigger id="exercise-type" className={errors.type ? "border-destructive" : ""}>
                            <SelectValue placeholder="Seleziona categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {typeOrder.map((type) => (
                              <SelectItem key={type} value={type}>
                                <div className="flex items-center gap-2">
                                  {typeIcons[type]}
                                  {typeDisplayNames[type]}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                      </div>

                      <div className="space-y-2 flex items-end">
                        <div className="flex items-center space-x-2 pb-2">
                          <Checkbox
                            id="teamwork"
                            checked={formData.requiresTeamwork}
                            onCheckedChange={(checked) => setFormData({ ...formData, requiresTeamwork: checked as boolean })}
                          />
                          <Label htmlFor="teamwork" className="cursor-pointer">
                            Richiede gioco di squadra
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="exercise-desc">Descrizione (opzionale)</Label>
                      <Textarea
                        id="exercise-desc"
                        placeholder="Descrizione dell'esercizio..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Evaluation Mode Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Modalità di Valutazione *</Label>
                    {errors.evaluationMode && <p className="text-sm text-destructive">{errors.evaluationMode}</p>}

                    <div className="grid grid-cols-3 gap-3">
                      {/* Range-based card */}
                      <Card
                        className={`cursor-pointer transition-all hover:shadow-md ${formData.evaluationMode === 'range'
                          ? 'ring-2 ring-primary border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                          }`}
                        onClick={() => setFormData({ ...formData, evaluationMode: 'range' })}
                      >
                        <CardHeader className="pb-2 p-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${formData.evaluationMode === 'range' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}>
                            <Ruler className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-sm">A Fasce</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-3 p-3 pt-0">
                          <p className="text-xs text-muted-foreground">
                            Voto automatico (es. salto, corsa)
                          </p>
                        </CardContent>
                      </Card>

                      {/* Criteria-based card */}
                      <Card
                        className={`cursor-pointer transition-all hover:shadow-md ${formData.evaluationMode === 'criteria'
                          ? 'ring-2 ring-primary border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                          }`}
                        onClick={() => setFormData({ ...formData, evaluationMode: 'criteria' })}
                      >
                        <CardHeader className="pb-2 p-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${formData.evaluationMode === 'criteria' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}>
                            <ClipboardList className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-sm">A Criteri</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-3 p-3 pt-0">
                          <p className="text-xs text-muted-foreground">
                            Valutazione manuale (es. tecnica)
                          </p>
                        </CardContent>
                      </Card>

                      {/* Composite card */}
                      <Card
                        className={`cursor-pointer transition-all hover:shadow-md ${formData.evaluationMode === 'composite'
                          ? 'ring-2 ring-primary border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                          }`}
                        onClick={() => setFormData({ ...formData, evaluationMode: 'composite' })}
                      >
                        <CardHeader className="pb-2 p-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${formData.evaluationMode === 'composite' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}>
                            <Layers className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-sm">Composto</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-3 p-3 pt-0">
                          <p className="text-xs text-muted-foreground">
                            Con sotto-esercizi (es. body)
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && formData.evaluationMode === 'range' && (
                <div className="space-y-6 py-4">
                  {/* Unit selector */}
                  <div className="space-y-2">
                    <Label>Unità di Misura</Label>
                    <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v as MeasurementUnit })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(unitDisplayNames).map(([key, name]) => (
                          <SelectItem key={key} value={key}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Gender toggle */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="gender-ranges"
                      checked={useGenderRanges}
                      onCheckedChange={(checked) => {
                        const isEnabled = checked as boolean;
                        if (isEnabled) {
                          // Sync female ranges to match male ranges when enabling
                          setRangesFemale([...rangesMale]);
                        }
                        setUseGenderRanges(isEnabled);
                      }}
                    />
                    <Label htmlFor="gender-ranges" className="cursor-pointer">
                      Usa fasce diverse per genere (M/F)
                    </Label>
                  </div>

                  {/* Range editors */}
                  {useGenderRanges ? (
                    <Tabs defaultValue="male" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 p-1 h-11">
                        <TabsTrigger
                          value="male"
                          className="gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-400 data-[state=active]:shadow-[0_0_12px_rgba(59,130,246,0.4)] dark:data-[state=active]:bg-blue-950/50 dark:data-[state=active]:text-blue-300 dark:data-[state=active]:border-blue-500 dark:data-[state=active]:shadow-[0_0_12px_rgba(59,130,246,0.3)] border-2 border-transparent transition-all"
                        >
                          <IconGenderMale className="h-4 w-4" />
                          Maschi
                        </TabsTrigger>
                        <TabsTrigger
                          value="female"
                          className="gap-2 data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700 data-[state=active]:border-pink-400 data-[state=active]:shadow-[0_0_12px_rgba(236,72,153,0.4)] dark:data-[state=active]:bg-pink-950/50 dark:data-[state=active]:text-pink-300 dark:data-[state=active]:border-pink-500 dark:data-[state=active]:shadow-[0_0_12px_rgba(236,72,153,0.3)] border-2 border-transparent transition-all"
                        >
                          <IconGenderFemale className="h-4 w-4" />
                          Femmine
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="male" className="mt-4">
                        {renderRangeEditor(rangesMale, 'male', 'Fasce Maschi')}
                      </TabsContent>
                      <TabsContent value="female" className="mt-4">
                        {renderRangeEditor(rangesFemale, 'female', 'Fasce Femmine')}
                      </TabsContent>
                    </Tabs>
                  ) : (
                    renderRangeEditor(rangesMale, 'male', 'Fasce di Valutazione')
                  )}

                  {/* Range preview hint */}
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Esempio:</strong> Se uno studente ottiene un risultato tra il valore minimo e massimo di una fascia, riceverà il voto corrispondente.
                    </p>
                  </div>
                </div>
              )}

              {step === 2 && formData.evaluationMode === 'criteria' && (
                <div className="space-y-6 py-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Criteri di Valutazione</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCriterion}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Aggiungi Criterio
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {customCriteria.map((criterion, index) => (
                      <div key={index} className="p-4 rounded-lg bg-muted/50 border space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Criterio {index + 1}</Label>
                          {customCriteria.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCriterion(index)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2 space-y-1">
                            <Label className="text-xs text-muted-foreground">Nome Criterio</Label>
                            <Input
                              placeholder="es. Tecnica, Velocità, Posizionamento"
                              value={criterion.name}
                              onChange={(e) => updateCriterion(index, 'name', e.target.value)}
                              className={errors[`criterion${index}`] ? "border-destructive" : ""}
                            />
                            {errors[`criterion${index}`] && (
                              <p className="text-xs text-destructive">{errors[`criterion${index}`]}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Voto Max</Label>
                            <Select
                              value={criterion.maxScore.toString()}
                              onValueChange={(v) => updateCriterion(index, 'maxScore', parseInt(v))}
                            >
                              <SelectTrigger>
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
                      </div>
                    ))}
                  </div>

                  {/* Criteria hint */}
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Suggerimento:</strong> Crea criteri come "Tecnica", "Impegno", "Coordinazione" per valutare aspetti specifici della prestazione.
                    </p>
                  </div>
                </div>
              )}

              {step === 2 && formData.evaluationMode === 'composite' && (
                <div className="space-y-6 py-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Sotto-esercizi</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addSubExerciseItem} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Aggiungi
                    </Button>
                  </div>
                  {errors.subExercises && <p className="text-sm text-destructive">{errors.subExercises}</p>}

                  {subExerciseItems.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <Layers className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-muted-foreground">Nessun sotto-esercizio</p>
                      <Button variant="link" onClick={addSubExerciseItem} className="mt-2">
                        Aggiungi il primo sotto-esercizio
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {subExerciseItems.map((subEx, index) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{index + 1}</Badge>
                                <span className="font-medium">{subEx.name || "Nuovo sotto-esercizio"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button" variant="ghost" size="sm"
                                  onClick={() => setExpandedSubEx(expandedSubEx === index ? null : index)}
                                >
                                  {expandedSubEx === index ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                                <Button
                                  type="button" variant="ghost" size="sm"
                                  onClick={() => removeSubExerciseItem(index)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {expandedSubEx === index && (
                              <div className="space-y-4 pt-2 border-t">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Nome *</Label>
                                    <Input
                                      placeholder="es. Salto in lungo"
                                      value={subEx.name}
                                      onChange={(e) => updateSubExerciseItem(index, { name: e.target.value })}
                                      className={errors[`subEx${index}`] ? "border-destructive" : ""}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Tipo valutazione</Label>
                                    <Select
                                      value={subEx.evaluationMode}
                                      onValueChange={(v) => updateSubExerciseItem(index, { evaluationMode: v as 'range' | 'criteria' })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="range">📏 A Fasce</SelectItem>
                                        <SelectItem value="criteria">📋 A Criteri</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {subEx.evaluationMode === 'range' && (
                                  <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-xs font-medium">Configurazione Fasce</Label>
                                      <Select
                                        value={subEx.unit || 'cm'}
                                        onValueChange={(v) => updateSubExerciseItem(index, { unit: v as MeasurementUnit })}
                                      >
                                        <SelectTrigger className="w-[120px] h-7 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Object.entries(unitDisplayNames).map(([key, name]) => (
                                            <SelectItem key={key} value={key}>{name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        id={`gender-${index}`}
                                        checked={subEx.useGenderRanges || false}
                                        onCheckedChange={(checked) => updateSubExerciseItem(index, { useGenderRanges: checked as boolean })}
                                      />
                                      <Label htmlFor={`gender-${index}`} className="text-xs cursor-pointer">Fasce diverse per genere</Label>
                                    </div>

                                    {subEx.useGenderRanges ? (
                                      <Tabs defaultValue="male" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 h-9 p-1">
                                          <TabsTrigger
                                            value="male"
                                            className="text-xs gap-1.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-400 data-[state=active]:shadow-[0_0_10px_rgba(59,130,246,0.35)] dark:data-[state=active]:bg-blue-950/50 dark:data-[state=active]:text-blue-300 dark:data-[state=active]:border-blue-500 border border-transparent transition-all"
                                          >
                                            <IconGenderMale className="h-3.5 w-3.5" />
                                            Maschi
                                          </TabsTrigger>
                                          <TabsTrigger
                                            value="female"
                                            className="text-xs gap-1.5 data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700 data-[state=active]:border-pink-400 data-[state=active]:shadow-[0_0_10px_rgba(236,72,153,0.35)] dark:data-[state=active]:bg-pink-950/50 dark:data-[state=active]:text-pink-300 dark:data-[state=active]:border-pink-500 border border-transparent transition-all"
                                          >
                                            <IconGenderFemale className="h-3.5 w-3.5" />
                                            Femmine
                                          </TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="male" className="mt-2 space-y-2">
                                          {(subEx.rangesMale || []).map((range, rIdx) => (
                                            <div key={rIdx} className="flex items-center gap-1">
                                              <Input type="number" className="h-7 text-xs w-16" placeholder="Min" value={range.minValue}
                                                onChange={(e) => {
                                                  const newRanges = [...(subEx.rangesMale || [])];
                                                  newRanges[rIdx] = { ...newRanges[rIdx], minValue: parseFloat(e.target.value) || 0 };
                                                  updateSubExerciseItem(index, { rangesMale: newRanges });
                                                }} />
                                              <span className="text-xs">-</span>
                                              <Input type="number" className="h-7 text-xs w-16" placeholder="Max" value={range.maxValue}
                                                onChange={(e) => {
                                                  const newRanges = [...(subEx.rangesMale || [])];
                                                  newRanges[rIdx] = { ...newRanges[rIdx], maxValue: parseFloat(e.target.value) || 0 };
                                                  updateSubExerciseItem(index, { rangesMale: newRanges });
                                                }} />
                                              <span className="text-xs">=</span>
                                              <Select value={range.score.toString()} onValueChange={(v) => {
                                                const newRanges = [...(subEx.rangesMale || [])];
                                                newRanges[rIdx] = { ...newRanges[rIdx], score: parseInt(v) };
                                                updateSubExerciseItem(index, { rangesMale: newRanges });
                                              }}>
                                                <SelectTrigger className="h-7 w-14 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>{italianScores.map(s => <SelectItem key={s} value={s.toString()}>{s}</SelectItem>)}</SelectContent>
                                              </Select>
                                              {(subEx.rangesMale?.length || 0) > 1 && (
                                                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                                                  onClick={() => updateSubExerciseItem(index, { rangesMale: (subEx.rangesMale || []).filter((_, i) => i !== rIdx) })}>
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              )}
                                            </div>
                                          ))}
                                          <Button type="button" variant="outline" size="sm" className="h-7 text-xs w-full"
                                            onClick={() => updateSubExerciseItem(index, { rangesMale: [...(subEx.rangesMale || []), { minValue: 0, maxValue: 100, score: 6 }] })}>
                                            <Plus className="h-3 w-3 mr-1" /> Aggiungi fascia
                                          </Button>
                                        </TabsContent>
                                        <TabsContent value="female" className="mt-2 space-y-2">
                                          {(subEx.rangesFemale || []).map((range, rIdx) => (
                                            <div key={rIdx} className="flex items-center gap-1">
                                              <Input type="number" className="h-7 text-xs w-16" placeholder="Min" value={range.minValue}
                                                onChange={(e) => {
                                                  const newRanges = [...(subEx.rangesFemale || [])];
                                                  newRanges[rIdx] = { ...newRanges[rIdx], minValue: parseFloat(e.target.value) || 0 };
                                                  updateSubExerciseItem(index, { rangesFemale: newRanges });
                                                }} />
                                              <span className="text-xs">-</span>
                                              <Input type="number" className="h-7 text-xs w-16" placeholder="Max" value={range.maxValue}
                                                onChange={(e) => {
                                                  const newRanges = [...(subEx.rangesFemale || [])];
                                                  newRanges[rIdx] = { ...newRanges[rIdx], maxValue: parseFloat(e.target.value) || 0 };
                                                  updateSubExerciseItem(index, { rangesFemale: newRanges });
                                                }} />
                                              <span className="text-xs">=</span>
                                              <Select value={range.score.toString()} onValueChange={(v) => {
                                                const newRanges = [...(subEx.rangesFemale || [])];
                                                newRanges[rIdx] = { ...newRanges[rIdx], score: parseInt(v) };
                                                updateSubExerciseItem(index, { rangesFemale: newRanges });
                                              }}>
                                                <SelectTrigger className="h-7 w-14 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>{italianScores.map(s => <SelectItem key={s} value={s.toString()}>{s}</SelectItem>)}</SelectContent>
                                              </Select>
                                              {(subEx.rangesFemale?.length || 0) > 1 && (
                                                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                                                  onClick={() => updateSubExerciseItem(index, { rangesFemale: (subEx.rangesFemale || []).filter((_, i) => i !== rIdx) })}>
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              )}
                                            </div>
                                          ))}
                                          <Button type="button" variant="outline" size="sm" className="h-7 text-xs w-full"
                                            onClick={() => updateSubExerciseItem(index, { rangesFemale: [...(subEx.rangesFemale || []), { minValue: 0, maxValue: 100, score: 6 }] })}>
                                            <Plus className="h-3 w-3 mr-1" /> Aggiungi fascia
                                          </Button>
                                        </TabsContent>
                                      </Tabs>
                                    ) : (
                                      <div className="space-y-2">
                                        {(subEx.rangesMale || []).map((range, rIdx) => (
                                          <div key={rIdx} className="flex items-center gap-1">
                                            <Input type="number" className="h-7 text-xs w-16" placeholder="Min" value={range.minValue}
                                              onChange={(e) => {
                                                const newRanges = [...(subEx.rangesMale || [])];
                                                newRanges[rIdx] = { ...newRanges[rIdx], minValue: parseFloat(e.target.value) || 0 };
                                                updateSubExerciseItem(index, { rangesMale: newRanges });
                                              }} />
                                            <span className="text-xs">-</span>
                                            <Input type="number" className="h-7 text-xs w-16" placeholder="Max" value={range.maxValue}
                                              onChange={(e) => {
                                                const newRanges = [...(subEx.rangesMale || [])];
                                                newRanges[rIdx] = { ...newRanges[rIdx], maxValue: parseFloat(e.target.value) || 0 };
                                                updateSubExerciseItem(index, { rangesMale: newRanges });
                                              }} />
                                            <span className="text-xs">=</span>
                                            <Select value={range.score.toString()} onValueChange={(v) => {
                                              const newRanges = [...(subEx.rangesMale || [])];
                                              newRanges[rIdx] = { ...newRanges[rIdx], score: parseInt(v) };
                                              updateSubExerciseItem(index, { rangesMale: newRanges });
                                            }}>
                                              <SelectTrigger className="h-7 w-14 text-xs"><SelectValue /></SelectTrigger>
                                              <SelectContent>{italianScores.map(s => <SelectItem key={s} value={s.toString()}>{s}</SelectItem>)}</SelectContent>
                                            </Select>
                                            {(subEx.rangesMale?.length || 0) > 1 && (
                                              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                                                onClick={() => updateSubExerciseItem(index, { rangesMale: (subEx.rangesMale || []).filter((_, i) => i !== rIdx) })}>
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            )}
                                          </div>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" className="h-7 text-xs w-full"
                                          onClick={() => updateSubExerciseItem(index, { rangesMale: [...(subEx.rangesMale || []), { minValue: 0, maxValue: 100, score: 6 }] })}>
                                          <Plus className="h-3 w-3 mr-1" /> Aggiungi fascia
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {subEx.evaluationMode === 'criteria' && (
                                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                                    <Label className="text-xs font-medium">Configurazione Criteri</Label>
                                    {(subEx.customCriteria || []).map((crit, cIdx) => (
                                      <div key={cIdx} className="flex items-center gap-2">
                                        <Input
                                          className="h-7 text-xs flex-1"
                                          placeholder="Nome criterio"
                                          value={crit.name}
                                          onChange={(e) => {
                                            const newCrit = [...(subEx.customCriteria || [])];
                                            newCrit[cIdx] = { ...newCrit[cIdx], name: e.target.value };
                                            updateSubExerciseItem(index, { customCriteria: newCrit });
                                          }}
                                        />
                                        <Select value={(crit.maxScore || 10).toString()} onValueChange={(v) => {
                                          const newCrit = [...(subEx.customCriteria || [])];
                                          newCrit[cIdx] = { ...newCrit[cIdx], maxScore: parseInt(v) };
                                          updateSubExerciseItem(index, { customCriteria: newCrit });
                                        }}>
                                          <SelectTrigger className="h-7 min-w-[50px] w-auto text-xs">
                                            <span className="text-muted-foreground">/</span><SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>{italianScores.map(s => <SelectItem key={s} value={s.toString()}>{s}</SelectItem>)}</SelectContent>
                                        </Select>
                                        {(subEx.customCriteria?.length || 0) > 1 && (
                                          <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                                            onClick={() => updateSubExerciseItem(index, { customCriteria: (subEx.customCriteria || []).filter((_, i) => i !== cIdx) })}>
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs w-full"
                                      onClick={() => updateSubExerciseItem(index, { customCriteria: [...(subEx.customCriteria || []), { id: `c${Date.now()}`, name: '', maxScore: 10 }] })}>
                                      <Plus className="h-3 w-3 mr-1" /> Aggiungi criterio
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Esempio:</strong> "Body" può avere sotto-esercizi come "Salto in lungo" (a fasce), "Flessioni" (a fasce), "Coordinazione" (a criteri).
                    </p>
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2">
                {step > 1 && (
                  <Button variant="outline" onClick={handleBack} className="gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Indietro
                  </Button>
                )}
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Annulla
                </Button>
                {step === 1 ? (
                  <Button onClick={handleNext} className="gap-2">
                    Avanti
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit}>
                    Crea Esercizio
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider >
  );
}

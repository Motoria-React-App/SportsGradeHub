import { useState, useMemo } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
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
  X,
  ListPlus,
  Zap,
  Wind,
  Target,
  Move,
  Flame,
  Circle,
} from "lucide-react";
import type { Exercise, ExerciseType, SubExercise, EvaluationCriterionType } from "@/types";

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

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>(mockExercises);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "" as ExerciseType | "",
    description: "",
    requiresTeamwork: false,
  });
  const [subExercises, setSubExercises] = useState<Omit<SubExercise, 'id'>[]>([{
    name: "",
    evaluationCriteria: [] as EvaluationCriterionType[],
    weight: undefined,
  }]);
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

  const evaluationCriteriaOptions: EvaluationCriterionType[] = ['technical', 'effort', 'teamwork', 'overall'];

  const addSubExercise = () => {
    setSubExercises([...subExercises, { name: "", evaluationCriteria: [], weight: undefined }]);
  };

  const removeSubExercise = (index: number) => {
    if (subExercises.length > 1) {
      setSubExercises(subExercises.filter((_, i) => i !== index));
    }
  };

  const updateSubExercise = (index: number, field: keyof SubExercise, value: any) => {
    const updated = [...subExercises];
    updated[index] = { ...updated[index], [field]: value };
    setSubExercises(updated);
  };

  const toggleCriterion = (subExIndex: number, criterion: EvaluationCriterionType) => {
    const updated = [...subExercises];
    const criteria = updated[subExIndex].evaluationCriteria;
    if (criteria.includes(criterion)) {
      updated[subExIndex].evaluationCriteria = criteria.filter(c => c !== criterion);
    } else {
      updated[subExIndex].evaluationCriteria = [...criteria, criterion];
    }
    setSubExercises(updated);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Il nome dell'esercizio è obbligatorio";
    }
    if (!formData.type) {
      newErrors.type = "Il tipo di esercizio è obbligatorio";
    }
    if (subExercises.length === 0) {
      newErrors.subExercises = "Aggiungi almeno un sotto-esercizio";
    }

    subExercises.forEach((subEx, index) => {
      if (!subEx.name.trim()) {
        newErrors[`subEx${index}`] = "Il nome del sotto-esercizio è obbligatorio";
      }
      if (subEx.evaluationCriteria.length === 0) {
        newErrors[`subExCriteria${index}`] = "Seleziona almeno un criterio";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "" as ExerciseType | "",
      description: "",
      requiresTeamwork: false,
    });
    setSubExercises([{ name: "", evaluationCriteria: [], weight: undefined }]);
    setErrors({});
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const newExercise: Exercise = {
      id: `ex${Date.now()}`,
      name: formData.name,
      type: formData.type as ExerciseType,
      description: formData.description,
      requiresTeamwork: formData.requiresTeamwork,
      subExercises: subExercises.map((subEx, index) => ({
        ...subEx,
        id: `subex${Date.now()}-${index}`,
      })),
    };

    setExercises([...exercises, newExercise]);
    setDialogOpen(false);
    resetForm();
  };

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
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${colors.bg} ${colors.border}`}>
                    <div className={colors.text}>
                      {typeIcons[type]}
                    </div>
                    <h2 className={`text-base font-semibold ${colors.text}`}>
                      {typeDisplayNames[type]}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      ({typeExercises.length})
                    </span>
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
                                  Attività fisica
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="flex-1 pb-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Users className="h-4 w-4" />
                                  <span>
                                    {ex.requiresTeamwork ? "Richiede gioco di squadra" : "Individuale"}
                                  </span>
                                </div>
                                {ex.subExercises && ex.subExercises.length > 0 && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <ListPlus className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-primary">
                                      {ex.subExercises.length} sotto-eserciz{ex.subExercises.length === 1 ? 'io' : 'i'}
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

          {/* Add Exercise Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto CustomScrollbar-thin">
              <DialogHeader>
                <DialogTitle>Aggiungi Nuovo Esercizio</DialogTitle>
                <DialogDescription>
                  Crea un nuovo esercizio con i suoi sotto-esercizi e criteri di valutazione.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Main Exercise Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="exercise-name">Nome Esercizio *</Label>
                    <Input
                      id="exercise-name"
                      placeholder="es. Pallavolo - Fondamentali"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exercise-type">Tipo *</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as ExerciseType })}>
                      <SelectTrigger id="exercise-type" className={errors.type ? "border-red-500" : ""}>
                        <SelectValue placeholder="Seleziona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="coordinazione">Coordinazione</SelectItem>
                        <SelectItem value="forza">Forza</SelectItem>
                        <SelectItem value="resistenza">Resistenza</SelectItem>
                        <SelectItem value="velocita">Velocità</SelectItem>
                        <SelectItem value="flessibilita">Flessibilità</SelectItem>
                        <SelectItem value="pallavolo">Pallavolo</SelectItem>
                        <SelectItem value="basket">Basket</SelectItem>
                        <SelectItem value="calcio">Calcio</SelectItem>
                        <SelectItem value="atletica">Atletica</SelectItem>
                        <SelectItem value="ginnastica">Ginnastica</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exercise-desc">Descrizione</Label>
                    <Textarea
                      id="exercise-desc"
                      placeholder="Descrizione dell'esercizio..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
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

                {/* Sub-exercises */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Sotto-esercizi *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addSubExercise} className="gap-2">
                      <ListPlus className="h-4 w-4" />
                      Aggiungi Sotto-esercizio
                    </Button>
                  </div>
                  {errors.subExercises && <p className="text-sm text-red-500">{errors.subExercises}</p>}

                  <div className="space-y-4">
                    {subExercises.map((subEx, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Sotto-esercizio {index + 1}</Label>
                            {subExercises.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSubExercise(index)}
                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Input
                              placeholder="Nome sotto-esercizio"
                              value={subEx.name}
                              onChange={(e) => updateSubExercise(index, 'name', e.target.value)}
                              className={errors[`subEx${index}`] ? "border-red-500" : ""}
                            />
                            {errors[`subEx${index}`] && <p className="text-xs text-red-500">{errors[`subEx${index}`]}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Criteri di Valutazione *</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {evaluationCriteriaOptions.map((criterion) => (
                                <div key={criterion} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${index}-${criterion}`}
                                    checked={subEx.evaluationCriteria.includes(criterion)}
                                    onCheckedChange={() => toggleCriterion(index, criterion)}
                                  />
                                  <Label htmlFor={`${index}-${criterion}`} className="text-sm cursor-pointer capitalize">
                                    {criterion === 'technical' && 'Tecnica'}
                                    {criterion === 'effort' && 'Impegno'}
                                    {criterion === 'teamwork' && 'Lavoro di squadra'}
                                    {criterion === 'overall' && 'Generale'}
                                  </Label>
                                </div>
                              ))}
                            </div>
                            {errors[`subExCriteria${index}`] && <p className="text-xs text-red-500">{errors[`subExCriteria${index}`]}</p>}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Annulla
                </Button>
                <Button onClick={handleSubmit}>
                  Crea Esercizio
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

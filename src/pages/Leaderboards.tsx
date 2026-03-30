import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSchoolData } from '@/provider/clientProvider';
import { LeaderboardContainer } from '@/components/leaderboards/LeaderboardContainer';
import { LeaderboardTable } from '@/components/leaderboards/LeaderboardTable';
import {
  extractCriteriaFromExercise,
  calculateCriteriaRankings,
  filterEvaluationsByExerciseAndClass,
} from '@/utils/leaderboard-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Leaderboards() {
  const { classes, students, exercises, evaluations, exerciseGroups } = useSchoolData();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial values from URL params or localStorage
  const initialClassId = searchParams.get('class') || localStorage.getItem('sportsgrade_last_class') || '';
  const initialExerciseId = searchParams.get('exercise') || '';

  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(initialExerciseId);

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedClassId) params.set('class', selectedClassId);
    if (selectedExerciseId) params.set('exercise', selectedExerciseId);
    setSearchParams(params);
  }, [selectedClassId, selectedExerciseId, setSearchParams]);

  // Save selected class to localStorage
  useEffect(() => {
    if (selectedClassId) {
      localStorage.setItem('sportsgrade_last_class', selectedClassId);
    }
  }, [selectedClassId]);

  // Handle class change
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedExerciseId(''); // Reset exercise selection
  };

  // Handle exercise change
  const handleExerciseChange = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
  };

  // Get filtered exercises for selected class
  const filteredExercises = useMemo(() => {
    if (!selectedClassId || selectedClassId === 'all') {
      return exercises;
    }

    const selectedClass = classes.find((c) => c.id === selectedClassId);
    if (!selectedClass) return [];

    // Get IDs of exercises directly assigned
    const assignedIds = new Set(selectedClass.assignedExercises || []);

    // Get IDs of exercises from assigned groups
    const groupIds = selectedClass.exerciseGroups || [];
    groupIds.forEach((groupId) => {
      const group = exerciseGroups.find((g) => g.id === groupId);
      if (group && group.exercises) {
        group.exercises.forEach((exId) => assignedIds.add(exId));
      }
    });

    return exercises.filter((ex) => assignedIds.has(ex.id));
  }, [selectedClassId, classes, exercises, exerciseGroups]);

  // Get students in selected class
  const studentsInClass = useMemo(() => {
    if (!selectedClassId || selectedClassId === 'all') {
      // For 'all', include all students whose class has the selected exercise
      if (!selectedExerciseId) return [];

      const classIdsWithExercise = new Set<string>();
      classes.forEach((cls) => {
        const assigned = new Set(cls.assignedExercises || []);
        (cls.exerciseGroups || []).forEach((groupId) => {
          const group = exerciseGroups.find((g) => g.id === groupId);
          if (group && group.exercises) {
            group.exercises.forEach((exId) => assigned.add(exId));
          }
        });
        if (assigned.has(selectedExerciseId)) {
          classIdsWithExercise.add(cls.id);
        }
      });

      return students.filter((s) => classIdsWithExercise.has(s.currentClassId));
    }

    return students.filter((s) => s.currentClassId === selectedClassId);
  }, [selectedClassId, selectedExerciseId, students, classes, exerciseGroups]);

  // Get selected exercise
  const selectedExercise = useMemo(() => {
    return exercises.find((e) => e.id === selectedExerciseId);
  }, [selectedExerciseId, exercises]);

  // Calculate criteria rankings
  const criteriaLeaderboards = useMemo(() => {
    if (!selectedClassId || !selectedExerciseId || !selectedExercise) {
      return [];
    }

    // Filter evaluations for selected exercise and class
    const filteredEvals = filterEvaluationsByExerciseAndClass(
      evaluations,
      selectedExerciseId,
      studentsInClass
    );

    // Extract criteria from exercise
    const criteria = extractCriteriaFromExercise(selectedExercise);
    if (criteria.length === 0) {
      return [];
    }

    // Calculate rankings for each criterion
    return calculateCriteriaRankings(filteredEvals, criteria, studentsInClass, selectedExercise, classes);
  }, [selectedClassId, selectedExerciseId, selectedExercise, evaluations, students, studentsInClass, classes]);

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboards</h1>
        <p className="text-muted-foreground mt-2">
          Visualizza la classifica degli studenti per criteri di valutazione per ogni esercizio
        </p>
      </div>

      {/* Filter Card */}
      <Card className="max-w-3xl mx-auto overflow-hidden">
        <CardHeader>
          <CardTitle>Seleziona Classe ed Esercizio</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-4">
          <LeaderboardContainer
            classes={classes}
            exercises={filteredExercises}
            selectedClassId={selectedClassId}
            selectedExerciseId={selectedExerciseId}
            onClassChange={handleClassChange}
            onExerciseChange={handleExerciseChange}
          />
        </CardContent>
      </Card>

      {/* Leaderboard Card */}
      {selectedClassId && selectedExerciseId && selectedExercise && (
        <Card className="max-w-6xl mx-auto overflow-hidden">
          <CardHeader>
            <CardTitle>
              {selectedExercise.name} - Rankings
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {studentsInClass.length} studenti nella classe
              {criteriaLeaderboards.length > 0 &&
                ` • ${criteriaLeaderboards.length} criteri`}
            </p>
          </CardHeader>
          <CardContent className="px-4 py-4">
            <LeaderboardTable
              criteriaLeaderboards={criteriaLeaderboards}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

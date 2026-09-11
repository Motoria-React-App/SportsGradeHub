import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Exercise, SchoolClass } from '@/types/types';
import { useTranslation } from '@/hooks/useTranslation';

interface LeaderboardContainerProps {
  classes: SchoolClass[];
  exercises: Exercise[];
  selectedClassId: string;
  selectedExerciseId: string;
  onClassChange: (classId: string) => void;
  onExerciseChange: (exerciseId: string) => void;
}

export function LeaderboardContainer({
  classes,
  exercises,
  selectedClassId,
  selectedExerciseId,
  onClassChange,
  onExerciseChange,
}: LeaderboardContainerProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 mb-2 max-w-2xl">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Class Selector */}
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">{t("leaderboards.selectClass")}</label>
          <Select value={selectedClassId} onValueChange={onClassChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("dashboard.selectClassPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")} {t("sidebar.classes")}</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.className} ({cls.schoolYear})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Exercise Selector */}
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">{t("leaderboards.selectExercise")}</label>
          <Select value={selectedExerciseId} onValueChange={onExerciseChange} disabled={!selectedClassId}>
            <SelectTrigger>
              <SelectValue placeholder={t("common.select") + " " + t("dashboard.exercise").toLowerCase()} />
            </SelectTrigger>
            <SelectContent>
              {exercises
                .filter((ex) => {
                  // Only show exercises with criteria-based evaluation types
                  return ex.evaluationType === 'criteria' || ex.evaluationType === 'criteria-ranges';
                })
                .map((exercise) => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

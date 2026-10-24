import React, { createContext, useContext, useState } from 'react';

import { AppThemeColors } from '@/constants/theme';

export interface WorkoutPreset {
  id: string;
  title: string;
  category: 'Classical' | 'Easy' | 'Intervals' | 'Tempo' | 'Long Run';
  isClassical?: boolean;
  isCustom?: boolean;
  targetDistanceKm?: number;
  targetPaceSecPerKm?: number;
  description?: string;
  steps?: string[];
  accentColor: string;
}

export interface RunSession {
  id: string;
  title: string;
  category: WorkoutPreset['category'];
  dateLabel: string;
  distanceKm: number;
  durationSec: number;
  avgPaceSecPerKm: number;
  lastKmPaceSec: number;
  calories: number;
  avgHr: number;
  splits: number[]; // seconds per km
}

export interface PlanDay {
  id: string;
  weekNumber: number;
  dayIndex: number; // 0 = Mon .. 6 = Sun
  dayShort: string;
  dayName: string;
  dateNumber: number;
  workoutId: string | null; // null = Rest day
  completed: boolean;
  isToday?: boolean;
}

export interface PlanWeekSummary {
  weekNumber: number;
  label: string;
  targetKm: number;
  sessionsCount: number;
  completedSessionsCount: number;
}

export interface MedalReward {
  id: string;
  tier: 'week' | 'month' | 'year';
  title: string;
  subtitle: string;
  earnedAtLabel: string;
  icon: string;
  color: string;
}

export type GoalType = '5K' | '10K' | 'Half-Marathon' | 'Fitness';

export const CLASSICAL_WORKOUT: WorkoutPreset = {
  id: 'classical',
  title: 'Classical Run',
  category: 'Classical',
  isClassical: true,
  targetDistanceKm: 5.0,
  targetPaceSecPerKm: 315,
  description: 'Free run without instructions or target timing.',
  accentColor: '#FF5A36',
};

export const WORKOUT_LIBRARY: WorkoutPreset[] = [
  {
    id: 'easy-recovery',
    title: 'Easy Aerobic Run',
    category: 'Easy',
    targetDistanceKm: 5.0,
    targetPaceSecPerKm: 330, // 5:30 /km
    description: 'Relaxed conversational pace.',
    accentColor: '#10B981',
  },
  {
    id: 'tempo-5k',
    title: 'Threshold Tempo',
    category: 'Tempo',
    targetDistanceKm: 7.0,
    targetPaceSecPerKm: 280, // 4:40 /km
    description: 'Steady comfortably hard pace.',
    accentColor: '#F59E0B',
  },
  {
    id: 'intervals-400',
    title: '6 × 400m Intervals',
    category: 'Intervals',
    targetDistanceKm: 5.0,
    targetPaceSecPerKm: 255, // 4:15 /km
    description: '10m warm-up • 6×400m (90s rest) • 10m cool-down',
    steps: ['10 min warm-up', '6 × 400m (90s recovery)', '10 min cool-down'],
    accentColor: '#EF4444',
  },
  {
    id: 'long-progressive',
    title: 'Sunday Long Run',
    category: 'Long Run',
    targetDistanceKm: 10.0,
    targetPaceSecPerKm: 310, // 5:10 /km
    description: 'Steady endurance session.',
    accentColor: '#3B82F6',
  },
];

export const WORKOUT_PRESETS: WorkoutPreset[] = [CLASSICAL_WORKOUT, ...WORKOUT_LIBRARY];

export const WEEKDAYS = [
  { index: 0, short: 'M', name: 'Monday' },
  { index: 1, short: 'T', name: 'Tuesday' },
  { index: 2, short: 'W', name: 'Wednesday' },
  { index: 3, short: 'T', name: 'Thursday' },
  { index: 4, short: 'F', name: 'Friday' },
  { index: 5, short: 'S', name: 'Saturday' },
  { index: 6, short: 'S', name: 'Sunday' },
] as const;

const INITIAL_RUNS: RunSession[] = [
  {
    id: 'run-1',
    title: 'Morning Tempo Session',
    category: 'Tempo',
    dateLabel: 'Yesterday • 07:15',
    distanceKm: 6.82,
    durationSec: 1924,
    avgPaceSecPerKm: 282,
    lastKmPaceSec: 276,
    calories: 465,
    avgHr: 166,
    splits: [295, 284, 279, 276, 278, 276],
  },
  {
    id: 'run-2',
    title: 'Easy Riverfront Loop',
    category: 'Easy',
    dateLabel: 'Tue • 18:10',
    distanceKm: 5.25,
    durationSec: 1732,
    avgPaceSecPerKm: 330,
    lastKmPaceSec: 326,
    calories: 350,
    avgHr: 142,
    splits: [334, 331, 328, 329, 326],
  },
  {
    id: 'run-3',
    title: 'Sunday Long Run',
    category: 'Long Run',
    dateLabel: 'Sun • 08:30',
    distanceKm: 10.4,
    durationSec: 3203,
    avgPaceSecPerKm: 308,
    lastKmPaceSec: 298,
    calories: 710,
    avgHr: 155,
    splits: [320, 316, 312, 310, 306, 298],
  },
];

const INITIAL_MEDALS: MedalReward[] = [
  {
    id: 'medal-w-prev1',
    tier: 'week',
    title: 'Week Finisher I',
    subtitle: 'Completed all weekly training sessions',
    earnedAtLabel: '2 weeks ago',
    icon: '🥉',
    color: '#CD7F32',
  },
  {
    id: 'medal-w-prev2',
    tier: 'week',
    title: 'Week Finisher II',
    subtitle: 'Back-to-back consistent training week',
    earnedAtLabel: 'Last week',
    icon: '🥈',
    color: '#94A3B8',
  },
  {
    id: 'medal-m-prev1',
    tier: 'month',
    title: 'Monthly Crown • Oct',
    subtitle: '4 consecutive weeks of completed sessions',
    earnedAtLabel: 'This month',
    icon: '🥇',
    color: '#F59E0B',
  },
];

export function generateScheduleForGoal(
  goal: GoalType,
  sessionsPerWeek: 2 | 3 | 4 | 5
): (string | null)[] {
  const mainWorkout =
    goal === '5K'
      ? 'intervals-400'
      : goal === '10K'
        ? 'tempo-5k'
        : goal === 'Half-Marathon'
          ? 'tempo-5k'
          : 'classical';

  const longWorkout = goal === 'Fitness' ? 'easy-recovery' : 'long-progressive';

  if (sessionsPerWeek === 2) {
    return [null, null, mainWorkout, null, null, null, longWorkout];
  }
  if (sessionsPerWeek === 3) {
    return [null, 'easy-recovery', null, mainWorkout, null, null, longWorkout];
  }
  if (sessionsPerWeek === 4) {
    return [
      null,
      'easy-recovery',
      mainWorkout,
      null,
      goal === 'Fitness' ? 'classical' : 'intervals-400',
      null,
      longWorkout,
    ];
  }
  return [
    'easy-recovery',
    mainWorkout,
    null,
    'intervals-400',
    'easy-recovery',
    null,
    longWorkout,
  ];
}

function buildPlanDays(weeks: number, weeklySchedule: (string | null)[]): PlanDay[] {
  const days: PlanDay[] = [];
  let dateCounter = 1;
  for (let week = 1; week <= weeks; week++) {
    WEEKDAYS.forEach((meta, dayIdx) => {
      days.push({
        id: `w${week}-d${dayIdx}`,
        weekNumber: week,
        dayIndex: dayIdx,
        dayShort: meta.short,
        dayName: meta.name,
        dateNumber: dateCounter++,
        workoutId: weeklySchedule[dayIdx] ?? null,
        completed: false,
        isToday: week === 1 && dayIdx === 0,
      });
    });
  }
  return days;
}

interface TrainingContextValue {
  runs: RunSession[];
  workoutLibrary: WorkoutPreset[];
  allWorkouts: WorkoutPreset[];
  addWorkoutToLibrary: (workout: Omit<WorkoutPreset, 'id'>) => WorkoutPreset;
  removeWorkoutFromLibrary: (id: string) => void;
  hasActivePlan: boolean;
  planName: string;
  weeklyGoalKm: number;
  monthlyGoalKm: number;
  planGoalKm: number;
  currentWeekNumber: number;
  setCurrentWeekNumber: (week: number) => void;
  totalPlanWeeks: number;
  trainingDaysCount: number;
  completedSessionsSeries: number;
  selectedWorkout: WorkoutPreset;
  setSelectedWorkout: (workout: WorkoutPreset) => void;
  addRunSession: (session: Omit<RunSession, 'id' | 'dateLabel'>) => void;
  planDays: PlanDay[];
  currentWeekDays: PlanDay[];
  planWeeksSummary: PlanWeekSummary[];
  togglePlanDay: (dayId: string) => void;
  updatePlanDayWorkout: (dayId: string, workoutId: string | null, applyToAllWeeks?: boolean) => void;
  createCustomPlan: (config: {
    name?: string;
    weeks: number;
    weeklySchedule: (string | null)[];
  }) => void;
  createGoalPlan: (config: {
    goal: GoalType;
    sessionsPerWeek: 2 | 3 | 4 | 5;
    weeks: number;
  }) => void;
  resetPlan: () => void;
  // Rewards / Medals
  medals: MedalReward[];
  awardDemoMedal: (tier: 'week' | 'month' | 'year') => void;
  // Custom Theme Colors
  customTheme: Partial<AppThemeColors>;
  updateThemeColors: (updates: Partial<AppThemeColors>) => void;
  resetThemeColors: () => void;
}

const TrainingContext = createContext<TrainingContextValue | null>(null);

export function TrainingProvider({ children }: { children: React.ReactNode }) {
  const [runs, setRuns] = useState<RunSession[]>(INITIAL_RUNS);
  const [workoutLibrary, setWorkoutLibrary] = useState<WorkoutPreset[]>(WORKOUT_LIBRARY);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutPreset>(CLASSICAL_WORKOUT);

  // Plan starts empty until the user defines it
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [planName, setPlanName] = useState('My Training Plan');
  const [totalPlanWeeks, setTotalPlanWeeks] = useState(8);
  const [currentWeekNumber, setCurrentWeekNumber] = useState(1);
  const [planDays, setPlanDays] = useState<PlanDay[]>([]);

  // Base Medals + dynamically earned plan medals
  const [baseMedals, setBaseMedals] = useState<MedalReward[]>(INITIAL_MEDALS);

  // Custom Theme Colors
  const [customTheme, setCustomTheme] = useState<Partial<AppThemeColors>>({});

  const updateThemeColors = (updates: Partial<AppThemeColors>) => {
    setCustomTheme((prev) => ({ ...prev, ...updates }));
  };

  const resetThemeColors = () => {
    setCustomTheme({});
  };

  const allWorkouts: WorkoutPreset[] = [CLASSICAL_WORKOUT, ...workoutLibrary];

  const addWorkoutToLibrary = (workout: Omit<WorkoutPreset, 'id'>): WorkoutPreset => {
    const newWorkout: WorkoutPreset = {
      ...workout,
      id: `custom-${Date.now()}`,
      isCustom: true,
    };
    setWorkoutLibrary((prev) => [newWorkout, ...prev]);
    return newWorkout;
  };

  const removeWorkoutFromLibrary = (id: string) => {
    setWorkoutLibrary((prev) => prev.filter((w) => w.id !== id));
    if (selectedWorkout.id === id) {
      setSelectedWorkout(CLASSICAL_WORKOUT);
    }
  };

  const currentWeekDays = planDays.filter((d) => d.weekNumber === currentWeekNumber);

  const getWorkoutKm = (workoutId: string | null) => {
    if (!workoutId) return 0;
    const found = allWorkouts.find((w) => w.id === workoutId);
    return found?.targetDistanceKm ?? 5;
  };

  const weeklyGoalKm = currentWeekDays.reduce((acc, d) => acc + getWorkoutKm(d.workoutId), 0);

  const monthlyDays = planDays.filter((d) => d.weekNumber <= Math.min(4, totalPlanWeeks));
  const monthlyGoalKm = monthlyDays.reduce((acc, d) => acc + getWorkoutKm(d.workoutId), 0);

  const planGoalKm = planDays.reduce((acc, d) => acc + getWorkoutKm(d.workoutId), 0);

  const completedSessionsSeries = planDays.filter(
    (d) => d.workoutId !== null && d.completed
  ).length;

  const lastCompletedIndex = planDays.reduce(
    (lastIdx, d, idx) => (d.completed ? idx : lastIdx),
    -1
  );
  const trainingDaysCount =
    lastCompletedIndex >= 0 ? lastCompletedIndex + 1 : completedSessionsSeries > 0 ? 1 : 0;

  const planWeeksSummary: PlanWeekSummary[] = Array.from(
    { length: totalPlanWeeks },
    (_, idx) => {
      const weekNum = idx + 1;
      const days = planDays.filter((d) => d.weekNumber === weekNum);
      const sessionsCount = days.filter((d) => d.workoutId !== null).length;
      const completedSessionsCount = days.filter(
        (d) => d.workoutId !== null && d.completed
      ).length;
      const targetKm = days.reduce((acc, d) => acc + getWorkoutKm(d.workoutId), 0);
      return {
        weekNumber: weekNum,
        label: `Week ${weekNum}`,
        targetKm,
        sessionsCount,
        completedSessionsCount,
      };
    }
  );

  // Dynamically derive medals earned from completed weeks/months in the active training plan
  const planEarnedMedals: MedalReward[] = [];
  if (hasActivePlan) {
    let completedWeeksCount = 0;
    planWeeksSummary.forEach((w) => {
      if (w.sessionsCount > 0 && w.completedSessionsCount === w.sessionsCount) {
        completedWeeksCount += 1;
        planEarnedMedals.push({
          id: `plan-week-${w.weekNumber}`,
          tier: 'week',
          title: `Plan Week ${w.weekNumber}`,
          subtitle: `Finished all ${w.sessionsCount} sessions (${w.targetKm.toFixed(0)} km)`,
          earnedAtLabel: `Week ${w.weekNumber}`,
          icon: '🥈',
          color: '#38BDF8',
        });
      }
    });

    const completedMonths = Math.floor(completedWeeksCount / 4);
    for (let m = 1; m <= completedMonths; m++) {
      planEarnedMedals.push({
        id: `plan-month-${m}`,
        tier: 'month',
        title: `Plan Month ${m}`,
        subtitle: `Completed 4 full training weeks in a row`,
        earnedAtLabel: `Month ${m}`,
        icon: '🥇',
        color: '#F59E0B',
      });
    }
  }

  const medals: MedalReward[] = [...planEarnedMedals, ...baseMedals];

  const awardDemoMedal = (tier: 'week' | 'month' | 'year') => {
    const countForTier = medals.filter((m) => m.tier === tier).length + 1;
    const newMedal: MedalReward =
      tier === 'week'
        ? {
            id: `demo-week-${Date.now()}`,
            tier: 'week',
            title: `Week Finisher #${countForTier}`,
            subtitle: 'Completed a full week of training sessions',
            earnedAtLabel: 'Just earned',
            icon: countForTier % 2 === 0 ? '🥈' : '🥉',
            color: countForTier % 2 === 0 ? '#94A3B8' : '#CD7F32',
          }
        : tier === 'month'
          ? {
              id: `demo-month-${Date.now()}`,
              tier: 'month',
              title: `Month Master #${countForTier}`,
              subtitle: 'Completed 4 weeks of consistent training',
              earnedAtLabel: 'Just earned',
              icon: '🥇',
              color: '#F59E0B',
            }
          : {
              id: `demo-year-${Date.now()}`,
              tier: 'year',
              title: `Year Legend #${countForTier}`,
              subtitle: '365 days of dedication & endurance',
              earnedAtLabel: 'Just earned',
              icon: '🏆',
              color: '#A855F7',
            };

    setBaseMedals((prev) => [newMedal, ...prev]);
  };

  const addRunSession = (session: Omit<RunSession, 'id' | 'dateLabel'>) => {
    const newRun: RunSession = {
      ...session,
      id: `run-${Date.now()}`,
      dateLabel: 'Today • Just now',
    };
    setRuns((prev) => [newRun, ...prev]);
  };

  const togglePlanDay = (dayId: string) => {
    setPlanDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, completed: !d.completed } : d))
    );
  };

  const updatePlanDayWorkout = (
    dayId: string,
    workoutId: string | null,
    applyToAllWeeks = false
  ) => {
    setPlanDays((prev) => {
      const targetDay = prev.find((d) => d.id === dayId);
      if (!targetDay) return prev;
      return prev.map((d) => {
        if (d.id === dayId || (applyToAllWeeks && d.dayIndex === targetDay.dayIndex)) {
          return {
            ...d,
            workoutId,
            completed: workoutId === null ? false : d.completed,
          };
        }
        return d;
      });
    });
  };

  const createCustomPlan = ({
    name = 'Custom Plan',
    weeks,
    weeklySchedule,
  }: {
    name?: string;
    weeks: number;
    weeklySchedule: (string | null)[];
  }) => {
    setPlanName(name);
    setTotalPlanWeeks(weeks);
    setCurrentWeekNumber(1);
    setPlanDays(buildPlanDays(weeks, weeklySchedule));
    setHasActivePlan(true);
  };

  const createGoalPlan = ({
    goal,
    sessionsPerWeek,
    weeks,
  }: {
    goal: GoalType;
    sessionsPerWeek: 2 | 3 | 4 | 5;
    weeks: number;
  }) => {
    const schedule = generateScheduleForGoal(goal, sessionsPerWeek);
    setPlanName(`${goal} Plan • ${sessionsPerWeek}x/week`);
    setTotalPlanWeeks(weeks);
    setCurrentWeekNumber(1);
    setPlanDays(buildPlanDays(weeks, schedule));
    setHasActivePlan(true);
  };

  const resetPlan = () => {
    setHasActivePlan(false);
    setPlanDays([]);
    setCurrentWeekNumber(1);
  };

  return (
    <TrainingContext.Provider
      value={{
        runs,
        workoutLibrary,
        allWorkouts,
        addWorkoutToLibrary,
        removeWorkoutFromLibrary,
        hasActivePlan,
        planName,
        weeklyGoalKm,
        monthlyGoalKm,
        planGoalKm,
        currentWeekNumber,
        setCurrentWeekNumber,
        totalPlanWeeks,
        trainingDaysCount,
        completedSessionsSeries,
        selectedWorkout,
        setSelectedWorkout,
        addRunSession,
        planDays,
        currentWeekDays,
        planWeeksSummary,
        togglePlanDay,
        updatePlanDayWorkout,
        createCustomPlan,
        createGoalPlan,
        resetPlan,
        medals,
        awardDemoMedal,
        customTheme,
        updateThemeColors,
        resetThemeColors,
      }}>
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  const ctx = useContext(TrainingContext);
  if (!ctx) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return ctx;
}

export function useOptionalTraining() {
  return useContext(TrainingContext);
}

export function formatPace(secPerKm: number): string {
  if (!secPerKm || !isFinite(secPerKm) || secPerKm <= 0) return '--:--';
  const mins = Math.floor(secPerKm / 60);
  const secs = Math.round(secPerKm % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

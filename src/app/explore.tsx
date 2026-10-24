import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  generateScheduleForGoal,
  GoalType,
  useTraining,
  WEEKDAYS,
  WORKOUT_PRESETS,
  WorkoutPreset,
} from '@/context/training-context';
import { useTheme } from '@/hooks/use-theme';

type GoalPeriod = 'week' | 'month' | 'plan';
type SetupMode = 'guided' | 'custom';

const GOALS: { type: GoalType; subtitle: string }[] = [
  { type: '5K', subtitle: 'Build speed and sharpen your 5 km pace with intervals' },
  { type: '10K', subtitle: 'Balance endurance and threshold tempo for 10 km' },
  { type: 'Half-Marathon', subtitle: 'Progressive long runs & steady aerobic stamina' },
  { type: 'Fitness', subtitle: 'Stay active and consistent with stress-free runs' },
];
const SESSION_COUNTS: { count: 2 | 3 | 4 | 5; subtitle: string }[] = [
  { count: 2, subtitle: 'Light schedule • 2 runs & 5 recovery days' },
  { count: 3, subtitle: 'Balanced • 3 runs & 4 recovery days' },
  { count: 4, subtitle: 'Committed • 4 runs & 3 recovery days' },
  { count: 5, subtitle: 'Intensive • 5 runs & 2 recovery days' },
];
const WEEK_DURATIONS: { weeks: number; subtitle: string }[] = [
  { weeks: 4, subtitle: '1-month quick block' },
  { weeks: 6, subtitle: '6-week progression' },
  { weeks: 8, subtitle: 'Standard 2-month training cycle' },
  { weeks: 12, subtitle: 'Complete 3-month preparation' },
];

export default function GoalsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const {
    hasActivePlan = false,
    planName = 'My Training Plan',
    planDays = [],
    currentWeekDays = [],
    planWeeksSummary = [],
    allWorkouts = WORKOUT_PRESETS,
    togglePlanDay,
    updatePlanDayWorkout,
    setSelectedWorkout,
    weeklyGoalKm = 0,
    monthlyGoalKm = 0,
    planGoalKm = 0,
    currentWeekNumber = 1,
    setCurrentWeekNumber,
    totalPlanWeeks = 8,
    trainingDaysCount = 0,
    completedSessionsSeries = 0,
    createCustomPlan,
    createGoalPlan,
  } = useTraining();

  const [period, setPeriod] = useState<GoalPeriod>('week');
  const [isEditingPlan, setIsEditingPlan] = useState(false);

  // Plan Builder state
  // builderStep === 0 -> Choose Automatic vs Custom and press Apply
  // builderStep >= 1 -> Step-by-step wizard with Previous / Next buttons
  const [builderStep, setBuilderStep] = useState<number>(0);
  const [setupMode, setSetupMode] = useState<SetupMode>('guided');
  const [selectedGoal, setSelectedGoal] = useState<GoalType>('10K');
  const [sessionsPerWeek, setSessionsPerWeek] = useState<2 | 3 | 4 | 5>(3);
  const [selectedWeeks, setSelectedWeeks] = useState<number>(8);

  const [customSchedule, setCustomSchedule] = useState<(string | null)[]>([
    null,
    'easy-recovery',
    null,
    'tempo-5k',
    null,
    null,
    'long-progressive',
  ]);
  const [editingCustomDayIdx, setEditingCustomDayIdx] = useState<number | null>(null);
  const [editingActiveDayId, setEditingActiveDayId] = useState<string | null>(null);

  if (!hasActivePlan || isEditingPlan) {
    const previewSchedule =
      setupMode === 'guided'
        ? generateScheduleForGoal(selectedGoal, sessionsPerWeek)
        : customSchedule;

    const plannedSessionsCount = previewSchedule.filter((id) => id !== null).length;
    const plannedRestCount = 7 - plannedSessionsCount;
    const plannedWeeklyKm = previewSchedule.reduce((acc, id) => {
      if (!id) return acc;
      const w = allWorkouts.find((p) => p.id === id);
      return acc + (w?.targetDistanceKm ?? 5);
    }, 0);

    const totalSteps = setupMode === 'guided' ? 4 : 3;

    const handleApplyMode = () => {
      setEditingCustomDayIdx(null);
      setBuilderStep(1);
    };

    const handlePrevStep = () => {
      setEditingCustomDayIdx(null);
      setBuilderStep((prev) => Math.max(0, prev - 1));
    };

    const handleNextStep = () => {
      setEditingCustomDayIdx(null);
      if (builderStep < totalSteps) {
        setBuilderStep((prev) => prev + 1);
      } else {
        handleConfirmPlan();
      }
    };

    const handleConfirmPlan = () => {
      if (setupMode === 'guided') {
        createGoalPlan({
          goal: selectedGoal,
          sessionsPerWeek,
          weeks: selectedWeeks,
        });
      } else {
        createCustomPlan({
          name: `Custom Plan • ${plannedSessionsCount}x/week`,
          weeks: selectedWeeks,
          weeklySchedule: customSchedule,
        });
      }
      setBuilderStep(0);
      setIsEditingPlan(false);
    };

    const handleSetCustomDay = (dayIdx: number, workoutId: string | null) => {
      setCustomSchedule((prev) => prev.map((val, i) => (i === dayIdx ? workoutId : val)));
      setEditingCustomDayIdx(null);
    };

    return (
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: safeAreaInsets.top + (Platform.OS === 'web' ? Spacing.six : Spacing.four),
            paddingBottom: Spacing.five,
          },
        ]}>
        <ThemedView style={styles.container}>
          {/* Header */}
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle">Set Up Training Plan</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {builderStep === 0
                  ? 'Select a plan creation mode below and press Apply'
                  : `${setupMode === 'guided' ? 'Automatic Plan' : 'Custom Plan'} • Step ${builderStep} of ${totalSteps}`}
              </ThemedText>
            </View>
            {hasActivePlan && (
              <Pressable
                onPress={() => {
                  setBuilderStep(0);
                  setIsEditingPlan(false);
                }}
                style={[styles.actionPill, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">Cancel</ThemedText>
              </Pressable>
            )}
          </View>

          {/* STEP 0: INITIAL SELECTION (Automatic vs Custom + Apply Button) */}
          {builderStep === 0 && (
            <>
              <View style={styles.modeCardsColumn}>
                {/* Automatic Option */}
                <Pressable
                  onPress={() => setSetupMode('guided')}
                  style={({ pressed }) => [
                    styles.modeOptionCard,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: setupMode === 'guided' ? theme.primary : 'transparent',
                    },
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.modeOptionHeader}>
                    <View style={styles.modeOptionTitleGroup}>
                      <ThemedText type="default" style={styles.modeOptionTitle}>
                        Automatic Plan
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        Answer 3 quick questions (goal, days per week, duration) and let the app build your schedule automatically.
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        {
                          borderColor:
                            setupMode === 'guided' ? theme.primary : theme.textSecondary,
                        },
                      ]}>
                      {setupMode === 'guided' && (
                        <View
                          style={[styles.radioInner, { backgroundColor: theme.primary }]}
                        />
                      )}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.selectOptionBtn,
                      {
                        backgroundColor:
                          setupMode === 'guided' ? theme.primary : theme.background,
                      },
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={{
                        color: setupMode === 'guided' ? '#FFFFFF' : theme.text,
                      }}>
                      {setupMode === 'guided' ? '✓ Selected' : 'Select Automatic'}
                    </ThemedText>
                  </View>
                </Pressable>

                {/* Custom Option */}
                <Pressable
                  onPress={() => setSetupMode('custom')}
                  style={({ pressed }) => [
                    styles.modeOptionCard,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: setupMode === 'custom' ? theme.primary : 'transparent',
                    },
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.modeOptionHeader}>
                    <View style={styles.modeOptionTitleGroup}>
                      <ThemedText type="default" style={styles.modeOptionTitle}>
                        Custom Plan
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        Choose your plan duration and manually assign workouts or rest days for each day of the week.
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        {
                          borderColor:
                            setupMode === 'custom' ? theme.primary : theme.textSecondary,
                        },
                      ]}>
                      {setupMode === 'custom' && (
                        <View
                          style={[styles.radioInner, { backgroundColor: theme.primary }]}
                        />
                      )}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.selectOptionBtn,
                      {
                        backgroundColor:
                          setupMode === 'custom' ? theme.primary : theme.background,
                      },
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={{
                        color: setupMode === 'custom' ? '#FFFFFF' : theme.text,
                      }}>
                      {setupMode === 'custom' ? '✓ Selected' : 'Select Custom'}
                    </ThemedText>
                  </View>
                </Pressable>
              </View>

              {/* Apply Button */}
              <Pressable
                onPress={handleApplyMode}
                style={({ pressed }) => [
                  styles.confirmBtn,
                  { backgroundColor: theme.primary },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={styles.confirmBtnText}>
                  Apply
                </ThemedText>
              </Pressable>
            </>
          )}

          {/* STEP-BY-STEP WIZARD (builderStep >= 1) */}
          {builderStep >= 1 && (
            <>
              {/* Step Progress Bar */}
              <View style={styles.stepProgressRow}>
                {Array.from({ length: totalSteps }, (_, idx) => {
                  const stepNum = idx + 1;
                  const isActive = stepNum <= builderStep;
                  return (
                    <View
                      key={stepNum}
                      style={[
                        styles.stepProgressSegment,
                        {
                          backgroundColor: isActive
                            ? theme.primary
                            : theme.backgroundElement,
                        },
                      ]}
                    />
                  );
                })}
              </View>

              {/* AUTOMATIC MODE: STEP 1 - CHOOSE GOAL */}
              {setupMode === 'guided' && builderStep === 1 && (
                <ThemedView type="backgroundElement" style={styles.builderCard}>
                  <ThemedText type="code" themeColor="textSecondary">
                    STEP 1 OF {totalSteps}
                  </ThemedText>
                  <ThemedText type="default" style={styles.stepTitle}>
                    Choose Your Goal
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    What are you training for?
                  </ThemedText>

                  <View style={styles.stepOptionsList}>
                    {GOALS.map((item) => {
                      const active = selectedGoal === item.type;
                      return (
                        <Pressable
                          key={item.type}
                          onPress={() => setSelectedGoal(item.type)}
                          style={[
                            styles.stepChoiceCard,
                            {
                              backgroundColor: theme.background,
                              borderColor: active ? theme.primary : 'transparent',
                            },
                          ]}>
                          <View style={{ flex: 1, gap: 2 }}>
                            <ThemedText type="smallBold">{item.type}</ThemedText>
                            <ThemedText type="small" themeColor="textSecondary">
                              {item.subtitle}
                            </ThemedText>
                          </View>
                          <View
                            style={[
                              styles.radioOuter,
                              {
                                borderColor: active ? theme.primary : theme.textSecondary,
                              },
                            ]}>
                            {active && (
                              <View
                                style={[
                                  styles.radioInner,
                                  { backgroundColor: theme.primary },
                                ]}
                              />
                            )}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </ThemedView>
              )}

              {/* AUTOMATIC MODE: STEP 2 - SESSIONS PER WEEK */}
              {setupMode === 'guided' && builderStep === 2 && (
                <ThemedView type="backgroundElement" style={styles.builderCard}>
                  <ThemedText type="code" themeColor="textSecondary">
                    STEP 2 OF {totalSteps}
                  </ThemedText>
                  <ThemedText type="default" style={styles.stepTitle}>
                    Sessions Per Week
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    How many days a week would you like to run?
                  </ThemedText>

                  <View style={styles.stepOptionsList}>
                    {SESSION_COUNTS.map((item) => {
                      const active = sessionsPerWeek === item.count;
                      return (
                        <Pressable
                          key={item.count}
                          onPress={() => setSessionsPerWeek(item.count)}
                          style={[
                            styles.stepChoiceCard,
                            {
                              backgroundColor: theme.background,
                              borderColor: active ? theme.primary : 'transparent',
                            },
                          ]}>
                          <View style={{ flex: 1, gap: 2 }}>
                            <ThemedText type="smallBold">{item.count} days / week</ThemedText>
                            <ThemedText type="small" themeColor="textSecondary">
                              {item.subtitle}
                            </ThemedText>
                          </View>
                          <View
                            style={[
                              styles.radioOuter,
                              {
                                borderColor: active ? theme.primary : theme.textSecondary,
                              },
                            ]}>
                            {active && (
                              <View
                                style={[
                                  styles.radioInner,
                                  { backgroundColor: theme.primary },
                                ]}
                              />
                            )}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </ThemedView>
              )}

              {/* STEP: PLAN DURATION (Automatic Step 3 OR Custom Step 1) */}
              {((setupMode === 'guided' && builderStep === 3) ||
                (setupMode === 'custom' && builderStep === 1)) && (
                <ThemedView type="backgroundElement" style={styles.builderCard}>
                  <ThemedText type="code" themeColor="textSecondary">
                    STEP {builderStep} OF {totalSteps}
                  </ThemedText>
                  <ThemedText type="default" style={styles.stepTitle}>
                    Plan Duration
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    How many weeks should your training plan last?
                  </ThemedText>

                  <View style={styles.stepOptionsList}>
                    {WEEK_DURATIONS.map((item) => {
                      const active = selectedWeeks === item.weeks;
                      return (
                        <Pressable
                          key={item.weeks}
                          onPress={() => setSelectedWeeks(item.weeks)}
                          style={[
                            styles.stepChoiceCard,
                            {
                              backgroundColor: theme.background,
                              borderColor: active ? theme.primary : 'transparent',
                            },
                          ]}>
                          <View style={{ flex: 1, gap: 2 }}>
                            <ThemedText type="smallBold">{item.weeks} Weeks</ThemedText>
                            <ThemedText type="small" themeColor="textSecondary">
                              {item.subtitle}
                            </ThemedText>
                          </View>
                          <View
                            style={[
                              styles.radioOuter,
                              {
                                borderColor: active ? theme.primary : theme.textSecondary,
                              },
                            ]}>
                            {active && (
                              <View
                                style={[
                                  styles.radioInner,
                                  { backgroundColor: theme.primary },
                                ]}
                              />
                            )}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </ThemedView>
              )}

              {/* CUSTOM MODE: STEP 2 - ASSIGN WORKOUTS BY DAY */}
              {setupMode === 'custom' && builderStep === 2 && (
                <ThemedView type="backgroundElement" style={styles.builderCard}>
                  <View style={styles.goalHeaderRow}>
                    <ThemedText type="code" themeColor="textSecondary">
                      STEP 2 OF {totalSteps}
                    </ThemedText>
                    <ThemedText type="code" style={{ color: theme.primary }}>
                      {plannedWeeklyKm.toFixed(0)} km/wk
                    </ThemedText>
                  </View>
                  <ThemedText type="default" style={styles.stepTitle}>
                    Customize Weekly Days
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Tap any day below to assign a workout or rest day
                  </ThemedText>

                  <View style={styles.daysList}>
                    {WEEKDAYS.map((dayMeta) => {
                      const workoutId = customSchedule[dayMeta.index];
                      const workout = allWorkouts.find((w) => w.id === workoutId);
                      const isSelectingThisDay = editingCustomDayIdx === dayMeta.index;

                      return (
                        <View key={dayMeta.index} style={styles.dayBuilderWrapper}>
                          <Pressable
                            onPress={() =>
                              setEditingCustomDayIdx(
                                isSelectingThisDay ? null : dayMeta.index
                              )
                            }
                            style={[styles.dayRow, { backgroundColor: theme.background }]}>
                            <View
                              style={[
                                styles.colorIndicator,
                                {
                                  backgroundColor: workout
                                    ? workout.accentColor
                                    : theme.backgroundSelected,
                                },
                              ]}
                            />
                            <View style={{ flex: 1 }}>
                              <ThemedText type="smallBold">{dayMeta.name}</ThemedText>
                              <ThemedText type="small" themeColor="textSecondary">
                                {workout
                                  ? `${workout.title} (${workout.targetDistanceKm} km)`
                                  : 'Rest Day'}
                              </ThemedText>
                            </View>
                            <ThemedText type="code" themeColor="textSecondary">
                              {isSelectingThisDay ? 'Close ▴' : 'Change ▾'}
                            </ThemedText>
                          </Pressable>

                          {isSelectingThisDay && (
                            <View
                              style={[
                                styles.inlinePicker,
                                { backgroundColor: theme.background },
                              ]}>
                              <Pressable
                                onPress={() => handleSetCustomDay(dayMeta.index, null)}
                                style={[
                                  styles.pickerOption,
                                  {
                                    backgroundColor:
                                      workoutId === null
                                        ? theme.backgroundSelected
                                        : 'transparent',
                                  },
                                ]}>
                                <ThemedText type="smallBold">Rest Day</ThemedText>
                                <ThemedText type="code" themeColor="textSecondary">
                                  Recovery
                                </ThemedText>
                              </Pressable>

                              {allWorkouts.map((preset) => (
                                <Pressable
                                  key={preset.id}
                                  onPress={() =>
                                    handleSetCustomDay(dayMeta.index, preset.id)
                                  }
                                  style={[
                                    styles.pickerOption,
                                    {
                                      backgroundColor:
                                        workoutId === preset.id
                                          ? theme.backgroundSelected
                                          : 'transparent',
                                    },
                                  ]}>
                                  <View style={styles.pickerOptionLeft}>
                                    <View
                                      style={[
                                        styles.smallDot,
                                        { backgroundColor: preset.accentColor },
                                      ]}
                                    />
                                    <ThemedText type="smallBold">{preset.title}</ThemedText>
                                  </View>
                                  <ThemedText type="code" themeColor="textSecondary">
                                    {preset.targetDistanceKm} km
                                  </ThemedText>
                                </Pressable>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </ThemedView>
              )}

              {/* FINAL STEP: REVIEW & CONFIRM (Automatic Step 4 OR Custom Step 3) */}
              {builderStep === totalSteps && (
                <ThemedView type="backgroundElement" style={styles.builderCard}>
                  <View style={styles.goalHeaderRow}>
                    <ThemedText type="code" themeColor="textSecondary">
                      STEP {totalSteps} OF {totalSteps} • REVIEW
                    </ThemedText>
                    <ThemedText type="code" style={{ color: theme.primary }}>
                      {plannedWeeklyKm.toFixed(0)} km/wk
                    </ThemedText>
                  </View>

                  <ThemedText type="default" style={styles.stepTitle}>
                    {setupMode === 'guided'
                      ? `${selectedGoal} Plan (${sessionsPerWeek}x/week)`
                      : `Custom Plan (${plannedSessionsCount}x/week)`}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {selectedWeeks} weeks • {plannedSessionsCount} runs & {plannedRestCount} rest days per week • {(plannedWeeklyKm * selectedWeeks).toFixed(0)} km total
                  </ThemedText>

                  <View style={styles.daysList}>
                    {WEEKDAYS.map((dayMeta) => {
                      const workoutId = previewSchedule[dayMeta.index];
                      const workout = allWorkouts.find((w) => w.id === workoutId);

                      return (
                        <View
                          key={dayMeta.index}
                          style={[styles.dayRow, { backgroundColor: theme.background }]}>
                          <View
                            style={[
                              styles.colorIndicator,
                              {
                                backgroundColor: workout
                                  ? workout.accentColor
                                  : theme.backgroundSelected,
                              },
                            ]}
                          />
                          <View style={{ flex: 1 }}>
                            <ThemedText type="smallBold">{dayMeta.name}</ThemedText>
                            <ThemedText type="small" themeColor="textSecondary">
                              {workout
                                ? `${workout.title} (${workout.targetDistanceKm} km)`
                                : 'Rest Day'}
                            </ThemedText>
                          </View>
                          <ThemedText type="code" themeColor="textSecondary">
                            {workout ? `${workout.targetDistanceKm} km` : 'Rest'}
                          </ThemedText>
                        </View>
                      );
                    })}
                  </View>
                </ThemedView>
              )}

              {/* Bottom Navigation: Previous & Next / Start Plan */}
              <View style={styles.wizardNavRow}>
                <Pressable
                  onPress={handlePrevStep}
                  style={({ pressed }) => [
                    styles.wizardPrevBtn,
                    { backgroundColor: theme.backgroundElement },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold">← Previous</ThemedText>
                </Pressable>

                <Pressable
                  onPress={handleNextStep}
                  style={({ pressed }) => [
                    styles.wizardNextBtn,
                    { backgroundColor: theme.primary },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" style={styles.confirmBtnText}>
                    {builderStep < totalSteps ? 'Next →' : 'Start My Plan'}
                  </ThemedText>
                </Pressable>
              </View>
            </>
          )}
        </ThemedView>
      </ScrollView>
    );
  }

  // ACTIVE PLAN VIEW
  const safeWeekDays =
    currentWeekDays.length > 0
      ? currentWeekDays
      : planDays.filter((d) => d.weekNumber === currentWeekNumber);

  const weekSessionsTotal = safeWeekDays.filter((d) => d.workoutId !== null).length;
  const weekSessionsDone = safeWeekDays.filter(
    (d) => d.workoutId !== null && d.completed
  ).length;
  const weekKmDone = safeWeekDays.reduce((acc, d) => {
    if (!d.completed || !d.workoutId) return acc;
    const w = allWorkouts.find((p) => p.id === d.workoutId);
    return acc + (w?.targetDistanceKm ?? 5);
  }, 0);

  const monthDays = planDays.filter((d) => d.weekNumber <= Math.min(4, totalPlanWeeks));
  const monthSessionsTotal = monthDays.filter((d) => d.workoutId !== null).length;
  const monthSessionsDone = monthDays.filter(
    (d) => d.workoutId !== null && d.completed
  ).length;
  const monthKmDone = monthDays.reduce((acc, d) => {
    if (!d.completed || !d.workoutId) return acc;
    const w = allWorkouts.find((p) => p.id === d.workoutId);
    return acc + (w?.targetDistanceKm ?? 5);
  }, 0);

  const totalPlanSessions = planDays.filter((d) => d.workoutId !== null).length;
  const totalPlanKmDone = planDays.reduce((acc, d) => {
    if (!d.completed || !d.workoutId) return acc;
    const w = allWorkouts.find((p) => p.id === d.workoutId);
    return acc + (w?.targetDistanceKm ?? 5);
  }, 0);

  const goalSummary =
    period === 'week'
      ? {
          title: `Week ${currentWeekNumber} Goal`,
          sessionsDone: weekSessionsDone,
          sessionsTotal: weekSessionsTotal,
          kmDone: Number(weekKmDone) || 0,
          kmTarget: Number(weeklyGoalKm) || 0,
        }
      : period === 'month'
        ? {
            title: `Monthly Goal (${Math.min(4, totalPlanWeeks)} Weeks)`,
            sessionsDone: monthSessionsDone,
            sessionsTotal: monthSessionsTotal,
            kmDone: Number(monthKmDone) || 0,
            kmTarget: Number(monthlyGoalKm) || 0,
          }
        : {
            title: `${totalPlanWeeks}-Week Plan Goal`,
            sessionsDone: completedSessionsSeries,
            sessionsTotal: totalPlanSessions,
            kmDone: Number(totalPlanKmDone) || 0,
            kmTarget: Number(planGoalKm) || 0,
          };

  const progressRatio = Math.min(
    1,
    goalSummary.sessionsTotal > 0 ? goalSummary.sessionsDone / goalSummary.sessionsTotal : 0
  );

  const handleLaunchWorkout = (workout: WorkoutPreset) => {
    setSelectedWorkout(workout);
    router.navigate('/');
  };

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingTop: safeAreaInsets.top + (Platform.OS === 'web' ? Spacing.six : Spacing.four),
          paddingBottom: Spacing.five,
        },
      ]}>
      <ThemedView style={styles.container}>
        {/* Header with Edit Plan button */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle">Goals & Schedule</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {planName}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => {
              setBuilderStep(0);
              setIsEditingPlan(true);
            }}
            style={({ pressed }) => [
              styles.actionPill,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold">Edit Plan</ThemedText>
          </Pressable>
        </View>

        {/* Series Counter Banner */}
        <ThemedView type="backgroundElement" style={styles.seriesCard}>
          <View style={styles.seriesMain}>
            <View style={[styles.streakBadge, { backgroundColor: `${theme.primary}20` }]}>
              <ThemedText style={styles.streakIcon}>🔥</ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="code" themeColor="textSecondary">
                TRAINING SERIES
              </ThemedText>
              <ThemedText type="default" style={styles.seriesHeadline}>
                {completedSessionsSeries} sessions completed
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {trainingDaysCount} active days • Week {currentWeekNumber} of {totalPlanWeeks}
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Period Switcher: Week / Month / Plan */}
        <View style={[styles.periodSwitcher, { backgroundColor: theme.backgroundElement }]}>
          {(
            [
              { key: 'week', label: 'This Week' },
              { key: 'month', label: 'Month' },
              { key: 'plan', label: 'Full Plan' },
            ] as const
          ).map((tab) => {
            const active = period === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setPeriod(tab.key)}
                style={[
                  styles.periodTab,
                  active && { backgroundColor: theme.background },
                ]}>
                <ThemedText
                  type="smallBold"
                  themeColor={active ? 'text' : 'textSecondary'}>
                  {tab.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* Goal Progress Summary */}
        <ThemedView type="backgroundElement" style={styles.goalCard}>
          <View style={styles.goalHeaderRow}>
            <ThemedText type="smallBold">{goalSummary.title}</ThemedText>
            <ThemedText type="code" style={{ color: theme.primary }}>
              {goalSummary.sessionsDone}/{goalSummary.sessionsTotal} sessions
            </ThemedText>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(progressRatio * 100)}%`,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>

          <View style={styles.goalSubRow}>
            <ThemedText type="small" themeColor="textSecondary">
              Distance completed
            </ThemedText>
            <ThemedText type="smallBold">
              {goalSummary.kmDone.toFixed(0)} / {goalSummary.kmTarget.toFixed(0)} km
            </ThemedText>
          </View>
        </ThemedView>

        {/* WEEK VIEW: Weekly Calendar Strip + Day-by-Day Checklist */}
        {period === 'week' && (
          <ThemedView type="backgroundElement" style={styles.calendarCard}>
            <View style={styles.goalHeaderRow}>
              <View style={styles.calendarHeader}>
                <ThemedText type="smallBold">Week {currentWeekNumber} Calendar</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Check off sessions or tap a day to adjust
                </ThemedText>
              </View>

              <View style={styles.weekStepper}>
                <Pressable
                  disabled={currentWeekNumber <= 1}
                  onPress={() => setCurrentWeekNumber(Math.max(1, currentWeekNumber - 1))}
                  style={[styles.stepBtn, { backgroundColor: theme.background }]}>
                  <ThemedText type="smallBold">‹</ThemedText>
                </Pressable>
                <Pressable
                  disabled={currentWeekNumber >= totalPlanWeeks}
                  onPress={() =>
                    setCurrentWeekNumber(Math.min(totalPlanWeeks, currentWeekNumber + 1))
                  }
                  style={[styles.stepBtn, { backgroundColor: theme.background }]}>
                  <ThemedText type="smallBold">›</ThemedText>
                </Pressable>
              </View>
            </View>

            {/* 7-Day Horizontal Calendar Strip */}
            <View style={styles.weekStripRow}>
              {safeWeekDays.map((day) => {
                const isRest = day.workoutId === null;
                return (
                  <Pressable
                    key={day.id}
                    disabled={isRest}
                    onPress={() => togglePlanDay(day.id)}
                    style={[
                      styles.dayColumn,
                      {
                        backgroundColor: theme.background,
                        borderColor: day.isToday ? '#FF5A36' : 'transparent',
                      },
                    ]}>
                    <ThemedText type="code" themeColor="textSecondary">
                      {day.dayShort}
                    </ThemedText>
                    {isRest ? (
                      <View style={styles.restDot}>
                        <ThemedText type="code" themeColor="textSecondary">
                          –
                        </ThemedText>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.miniCheckbox,
                          {
                            backgroundColor: day.completed ? '#10B981' : 'transparent',
                            borderColor: day.completed ? '#10B981' : theme.textSecondary,
                          },
                        ]}>
                        {day.completed && (
                          <ThemedText type="code" style={styles.checkMarkText}>
                            ✓
                          </ThemedText>
                        )}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Detailed Week Schedule: Sessions & Rest Days */}
            <View style={styles.daysList}>
              {safeWeekDays.map((day) => {
                const workout = allWorkouts.find((w) => w.id === day.workoutId);
                const isRest = !workout;
                const isEditingThisDay = editingActiveDayId === day.id;

                return (
                  <View key={day.id} style={styles.dayBuilderWrapper}>
                    <View
                      style={[
                        styles.dayRow,
                        {
                          backgroundColor: theme.background,
                          opacity: isRest && !isEditingThisDay ? 0.7 : 1,
                        },
                      ]}>
                      {isRest ? (
                        <View
                          style={[
                            styles.restBox,
                            { backgroundColor: theme.backgroundElement },
                          ]}>
                          <ThemedText type="code" themeColor="textSecondary">
                            –
                          </ThemedText>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => togglePlanDay(day.id)}
                          style={[
                            styles.checkbox,
                            {
                              backgroundColor: day.completed ? '#10B981' : 'transparent',
                              borderColor: day.completed ? '#10B981' : theme.textSecondary,
                            },
                          ]}>
                          {day.completed && (
                            <ThemedText type="smallBold" style={styles.checkMarkText}>
                              ✓
                            </ThemedText>
                          )}
                        </Pressable>
                      )}

                      <Pressable
                        onPress={() =>
                          setEditingActiveDayId(isEditingThisDay ? null : day.id)
                        }
                        style={{ flex: 1 }}>
                        <ThemedText type="smallBold">{day.dayName}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {workout
                            ? `${workout.title} • ${workout.targetDistanceKm} km`
                            : 'Rest Day (tap to change)'}
                        </ThemedText>
                      </Pressable>

                      {workout ? (
                        <Pressable
                          onPress={() => handleLaunchWorkout(workout)}
                          style={({ pressed }) => [
                            styles.startSessionBtn,
                            { backgroundColor: theme.backgroundElement },
                            pressed && styles.pressed,
                          ]}>
                          <ThemedText type="code">Run →</ThemedText>
                        </Pressable>
                      ) : (
                        <Pressable
                          onPress={() =>
                            setEditingActiveDayId(isEditingThisDay ? null : day.id)
                          }>
                          <ThemedText type="code" themeColor="textSecondary">
                            Rest
                          </ThemedText>
                        </Pressable>
                      )}
                    </View>

                    {isEditingThisDay && (
                      <View
                        style={[
                          styles.inlinePicker,
                          { backgroundColor: theme.background },
                        ]}>
                        <Pressable
                          onPress={() => {
                            updatePlanDayWorkout(day.id, null, false);
                            setEditingActiveDayId(null);
                          }}
                          style={[
                            styles.pickerOption,
                            {
                              backgroundColor: isRest
                                ? theme.backgroundSelected
                                : 'transparent',
                            },
                          ]}>
                          <ThemedText type="smallBold">Rest Day</ThemedText>
                          <ThemedText type="code" themeColor="textSecondary">
                            Recovery
                          </ThemedText>
                        </Pressable>

                        {allWorkouts.map((preset) => (
                          <Pressable
                            key={preset.id}
                            onPress={() => {
                              updatePlanDayWorkout(day.id, preset.id, false);
                              setEditingActiveDayId(null);
                            }}
                            style={[
                              styles.pickerOption,
                              {
                                backgroundColor:
                                  day.workoutId === preset.id
                                    ? theme.backgroundSelected
                                    : 'transparent',
                              },
                            ]}>
                            <View style={styles.pickerOptionLeft}>
                              <View
                                style={[
                                  styles.smallDot,
                                  { backgroundColor: preset.accentColor },
                                ]}
                              />
                              <ThemedText type="smallBold">{preset.title}</ThemedText>
                            </View>
                            <ThemedText type="code" themeColor="textSecondary">
                              {preset.targetDistanceKm} km
                            </ThemedText>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ThemedView>
        )}

        {/* MONTH VIEW: 4-Week Calendar Grid with Checkboxes */}
        {period === 'month' && (
          <ThemedView type="backgroundElement" style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <ThemedText type="smallBold">Monthly Training Calendar</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Checkboxes = Session days • (Rest) = Recovery days
              </ThemedText>
            </View>

            <View style={styles.monthHeaderRow}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <View key={d} style={styles.monthHeaderCell}>
                  <ThemedText type="code" themeColor="textSecondary">
                    {d}
                  </ThemedText>
                </View>
              ))}
            </View>

            {Array.from({ length: Math.min(4, totalPlanWeeks) }, (_, i) => i + 1).map(
              (weekNum) => {
                const daysInWeek = planDays.filter((d) => d.weekNumber === weekNum);
                if (daysInWeek.length === 0) return null;
                return (
                  <View key={weekNum} style={styles.monthWeekBlock}>
                    <ThemedText type="code" themeColor="textSecondary">
                      WEEK {weekNum} {weekNum === currentWeekNumber ? '• CURRENT' : ''}
                    </ThemedText>
                    <View style={styles.monthGridRow}>
                      {daysInWeek.map((day, idx) => {
                        const isRest = day.workoutId === null;
                        return (
                          <Pressable
                            key={day.id}
                            disabled={isRest}
                            onPress={() => togglePlanDay(day.id)}
                            style={[
                              styles.monthCell,
                              {
                                backgroundColor: theme.background,
                                borderColor: day.isToday ? '#FF5A36' : 'transparent',
                              },
                            ]}>
                            <ThemedText type="code" themeColor="textSecondary">
                              D{day.dateNumber ?? idx + 1}
                            </ThemedText>
                            {isRest ? (
                              <ThemedText type="code" themeColor="textSecondary">
                                Rest
                              </ThemedText>
                            ) : (
                              <View
                                style={[
                                  styles.miniCheckbox,
                                  {
                                    backgroundColor: day.completed ? '#10B981' : 'transparent',
                                    borderColor: day.completed ? '#10B981' : theme.textSecondary,
                                  },
                                ]}>
                                {day.completed && (
                                  <ThemedText type="code" style={styles.checkMarkText}>
                                    ✓
                                  </ThemedText>
                                )}
                              </View>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              }
            )}
          </ThemedView>
        )}

        {/* FULL PLAN VIEW: Multi-Week Overview */}
        {period === 'plan' && (
          <ThemedView type="backgroundElement" style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <ThemedText type="smallBold">{totalPlanWeeks}-Week Training Plan</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Tap any week to open its daily schedule
              </ThemedText>
            </View>

            <View style={styles.daysList}>
              {planWeeksSummary.map((w) => {
                const isComplete =
                  w.sessionsCount > 0 && w.completedSessionsCount === w.sessionsCount;
                const isCurrent = w.weekNumber === currentWeekNumber;
                return (
                  <Pressable
                    key={w.weekNumber}
                    onPress={() => {
                      setCurrentWeekNumber(w.weekNumber);
                      setPeriod('week');
                    }}
                    style={[
                      styles.dayRow,
                      {
                        backgroundColor: theme.background,
                        borderColor: isCurrent ? '#FF5A36' : 'transparent',
                        borderWidth: isCurrent ? 1.5 : 0,
                      },
                    ]}>
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: isComplete ? '#10B981' : 'transparent',
                          borderColor: isComplete
                            ? '#10B981'
                            : isCurrent
                              ? '#FF5A36'
                              : theme.textSecondary,
                        },
                      ]}>
                      {isComplete ? (
                        <ThemedText type="smallBold" style={styles.checkMarkText}>
                          ✓
                        </ThemedText>
                      ) : (
                        <ThemedText
                          type="code"
                          style={{ color: isCurrent ? '#FF5A36' : theme.textSecondary }}>
                          {w.completedSessionsCount}/{w.sessionsCount}
                        </ThemedText>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold">{w.label}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {w.sessionsCount} sessions • {7 - w.sessionsCount} rest days
                      </ThemedText>
                    </View>

                    <ThemedText type="smallBold">{w.targetKm.toFixed(0)} km</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </ThemedView>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  modeCardsColumn: {
    gap: Spacing.three,
  },
  modeOptionCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: 2,
    gap: Spacing.three,
  },
  modeOptionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  modeOptionTitleGroup: {
    flex: 1,
    gap: 4,
  },
  modeOptionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  selectOptionBtn: {
    paddingVertical: 10,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepProgressRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepProgressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  stepOptionsList: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  stepChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 2,
    gap: Spacing.three,
  },
  wizardNavRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  wizardPrevBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardNextBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  builderCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  stepLabel: {
    marginTop: Spacing.one,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  optionChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBuilderWrapper: {
    gap: 4,
  },
  colorIndicator: {
    width: 6,
    height: 32,
    borderRadius: 3,
  },
  inlinePicker: {
    padding: Spacing.two,
    borderRadius: Spacing.three,
    gap: 4,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
  },
  pickerOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  smallDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confirmBtn: {
    paddingVertical: 16,
    borderRadius: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  seriesCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  seriesMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  streakBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakIcon: {
    fontSize: 22,
  },
  seriesHeadline: {
    fontSize: 20,
    fontWeight: '700',
  },
  periodSwitcher: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Spacing.three,
    gap: 4,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calendarCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  calendarHeader: {
    gap: 2,
    flex: 1,
  },
  weekStepper: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekStripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1.5,
    gap: 6,
  },
  miniCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restDot: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysList: {
    gap: Spacing.two,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  startSessionBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Spacing.two,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  monthHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  monthWeekBlock: {
    gap: 6,
  },
  monthGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  monthCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Spacing.two,
    borderWidth: 1.5,
    gap: 4,
  },
  pressed: {
    opacity: 0.75,
  },
});

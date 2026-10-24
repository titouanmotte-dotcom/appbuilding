import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PaceWheelPicker } from '@/components/pace-wheel-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  CLASSICAL_WORKOUT,
  formatDuration,
  formatPace,
  useTraining,
  WORKOUT_LIBRARY,
  WorkoutPreset,
} from '@/context/training-context';
import { useTheme } from '@/hooks/use-theme';

type CreatorType = 'target' | 'intervals';

const TARGET_CATEGORIES: {
  label: 'Easy' | 'Tempo' | 'Long Run';
  color: string;
}[] = [
  { label: 'Easy', color: '#10B981' },
  { label: 'Tempo', color: '#F59E0B' },
  { label: 'Long Run', color: '#3B82F6' },
];

function parseDecimalInput(raw: string, fallback: number): number {
  const normalized = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = parseFloat(normalized);
  return isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseIntInput(raw: string, fallback: number): number {
  const normalized = raw.replace(/[^0-9]/g, '');
  const parsed = parseInt(normalized, 10);
  return isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export default function WorkoutScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const {
    selectedWorkout = CLASSICAL_WORKOUT,
    setSelectedWorkout,
    addRunSession,
    workoutLibrary = WORKOUT_LIBRARY,
    addWorkoutToLibrary,
    removeWorkoutFromLibrary,
  } = useTraining();

  const [showLibrary, setShowLibrary] = useState(false);
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false);
  const [viewingWorkout, setViewingWorkout] = useState<WorkoutPreset | null>(null);

  // Workout Creator state
  const [creatorType, setCreatorType] = useState<CreatorType>('target');
  const [customTitle, setCustomTitle] = useState('');
  const [targetCategory, setTargetCategory] = useState<'Easy' | 'Tempo' | 'Long Run'>('Easy');
  const [distanceInputText, setDistanceInputText] = useState('5.0');
  const [hasTargetPace, setHasTargetPace] = useState(false);
  const [targetPaceSec, setTargetPaceSec] = useState(315); // 5:15 /km

  // Intervals / Blocks Creator state (exact text inputs)
  const [warmupText, setWarmupText] = useState('10');
  const [repeatsText, setRepeatsText] = useState('6');
  const [workDistMetersText, setWorkDistMetersText] = useState('400');
  const [recoverySecText, setRecoverySecText] = useState('90');
  const [cooldownText, setCooldownText] = useState('10');
  const [hasIntervalPace, setHasIntervalPace] = useState(true);
  const [intervalPaceSec, setIntervalPaceSec] = useState(255); // 4:15 /km

  // Live Workout state
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [lastKmPaceSec, setLastKmPaceSec] = useState(0);
  const [liveSplits, setLiveSplits] = useState<number[]>([]);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const isClassical = Boolean(selectedWorkout?.isClassical || selectedWorkout?.id === 'classical');

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsedSec((prev) => prev + 1);

      const basePace = selectedWorkout?.targetPaceSecPerKm ?? 310;
      const jitter = (Math.random() - 0.48) * 6;
      const currentInstantPace = Math.round(Math.max(210, basePace + jitter));
      const deltaKm = (1 / currentInstantPace) * 3;

      setLastKmPaceSec(currentInstantPace);

      setDistanceKm((prevKm) => {
        const nextKm = prevKm + deltaKm;
        if (Math.floor(nextKm) > Math.floor(prevKm)) {
          setLiveSplits((splits) => [...splits, currentInstantPace]);
        }
        return nextKm;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, selectedWorkout]);

  const globalPaceSec =
    distanceKm > 0.02 ? Math.round(elapsedSec / distanceKm / 3) : 0;

  const displayedLastKmPaceSec =
    liveSplits.length > 0
      ? liveSplits[liveSplits.length - 1]
      : distanceKm > 0.02
        ? lastKmPaceSec
        : 0;

  const handleClearSelectedWorkout = () => {
    if (isRunning) return;
    setSelectedWorkout(CLASSICAL_WORKOUT);
  };

  const handleDoWorkout = (workout: WorkoutPreset) => {
    if (isRunning) return;
    setSelectedWorkout(workout);
    setViewingWorkout(null);
    setIsCreatingWorkout(false);
    setShowLibrary(false);
  };

  const handleSaveCustomWorkout = () => {
    let created: WorkoutPreset;
    if (creatorType === 'target') {
      const catMeta =
        TARGET_CATEGORIES.find((c) => c.label === targetCategory) ?? TARGET_CATEGORIES[0];
      const parsedDistanceKm = Number(parseDecimalInput(distanceInputText, 5.0).toFixed(2));
      const title =
        customTitle.trim() || `${parsedDistanceKm}K ${targetCategory} Run`;

      const description = hasTargetPace
        ? `${targetCategory} • Target ${formatPace(targetPaceSec)}/km`
        : `${targetCategory} • Distance goal (${parsedDistanceKm} km)`;

      created = addWorkoutToLibrary({
        title,
        category: targetCategory,
        targetDistanceKm: parsedDistanceKm,
        targetPaceSecPerKm: hasTargetPace ? targetPaceSec : undefined,
        description,
        accentColor: catMeta.color,
      });
    } else {
      const warmupMin = parseIntInput(warmupText, 10);
      const repeatsCount = Math.max(1, parseIntInput(repeatsText, 6));
      const workDistanceM = Math.max(50, parseIntInput(workDistMetersText, 400));
      const recoverySec = parseIntInput(recoverySecText, 90);
      const cooldownMin = parseIntInput(cooldownText, 10);

      const title =
        customTitle.trim() || `${repeatsCount} × ${workDistanceM}m Intervals`;
      const warmupKm = Number((warmupMin * 0.17).toFixed(1));
      const cooldownKm = Number((cooldownMin * 0.17).toFixed(1));
      const repsKm = Number(((repeatsCount * (workDistanceM + 150)) / 1000).toFixed(1));
      const estTotalKm = Math.max(1, Number((warmupKm + repsKm + cooldownKm).toFixed(1)));

      const paceLabel = hasIntervalPace ? ` at ${formatPace(intervalPaceSec)}/km` : '';
      const steps = [
        `${warmupMin} min warm-up`,
        `${repeatsCount} × ${workDistanceM}m${paceLabel} (${recoverySec}s rest)`,
        `${cooldownMin} min cool-down`,
      ];

      created = addWorkoutToLibrary({
        title,
        category: 'Intervals',
        targetDistanceKm: estTotalKm,
        targetPaceSecPerKm: hasIntervalPace ? intervalPaceSec : undefined,
        description: `${warmupMin}m warm-up • ${repeatsCount}×${workDistanceM}m${paceLabel} (${recoverySec}s rest) • ${cooldownMin}m cool-down`,
        steps,
        accentColor: '#EF4444',
      });
    }

    setCustomTitle('');
    setIsCreatingWorkout(false);
    setViewingWorkout(created);
  };

  const handleStartPause = () => {
    setSavedNotice(null);
    setIsRunning((prev) => !prev);
  };

  const handleStepHalfKm = () => {
    const basePace = selectedWorkout?.targetPaceSecPerKm ?? 310;
    const simulatedPace = basePace + Math.round((Math.random() - 0.5) * 8);
    const boostKm = 0.5;
    const addedSec = Math.round((simulatedPace * boostKm) / 3);

    setElapsedSec((prev) => prev + addedSec);
    setLastKmPaceSec(simulatedPace);
    setDistanceKm((prevKm) => {
      const nextKm = prevKm + boostKm;
      if (Math.floor(nextKm) > Math.floor(prevKm)) {
        setLiveSplits((splits) => [...splits, simulatedPace]);
      }
      return nextKm;
    });
  };

  const handleFinish = () => {
    setIsRunning(false);
    const finalDist = Math.max(0.1, Number(distanceKm.toFixed(2)));
    const finalGlobalPace =
      globalPaceSec > 0 ? globalPaceSec : (selectedWorkout?.targetPaceSecPerKm ?? 310);
    const finalLastKmPace = displayedLastKmPaceSec > 0 ? displayedLastKmPaceSec : finalGlobalPace;
    const realDurationSec = Math.max(30, Math.round(finalDist * finalGlobalPace));

    addRunSession({
      title: selectedWorkout?.title ?? 'Classical Run',
      category: selectedWorkout?.category ?? 'Classical',
      distanceKm: finalDist,
      durationSec: realDurationSec,
      avgPaceSecPerKm: finalGlobalPace,
      lastKmPaceSec: finalLastKmPace,
      calories: Math.round(finalDist * 65),
      avgHr: 152,
      splits: liveSplits.length > 0 ? liveSplits : [finalGlobalPace],
    });

    setSavedNotice(`Saved ${finalDist.toFixed(2)} km • ${selectedWorkout?.title ?? 'Run'}`);
    setElapsedSec(0);
    setDistanceKm(0);
    setLastKmPaceSec(0);
    setLiveSplits([]);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedSec(0);
    setDistanceKm(0);
    setLastKmPaceSec(0);
    setLiveSplits([]);
  };

  const hasProgress = elapsedSec > 0 || distanceKm > 0;

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingTop: safeAreaInsets.top + (Platform.OS === 'web' ? Spacing.six : Spacing.four),
          paddingBottom: Spacing.five,
        },
      ]}>
      <ThemedView style={styles.container}>
        {/* Minimal Header */}
        <View style={styles.header}>
          <ThemedText type="subtitle">
            {showLibrary
              ? viewingWorkout
                ? 'Workout Details'
                : isCreatingWorkout
                  ? 'Create Workout'
                  : 'Workout Library'
              : 'Workout'}
          </ThemedText>
          {showLibrary ? (
            <Pressable
              onPress={() => {
                if (viewingWorkout) {
                  setViewingWorkout(null);
                } else if (isCreatingWorkout) {
                  setIsCreatingWorkout(false);
                } else {
                  setShowLibrary(false);
                }
              }}
              style={[styles.backPillBtn, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">← Back</ThemedText>
            </Pressable>
          ) : (
            savedNotice && (
              <ThemedText type="smallBold" style={{ color: '#10B981' }}>
                ✓ {savedNotice}
              </ThemedText>
            )
          )}
        </View>

        {!showLibrary ? (
          <>
            {/* Selected Workout Indicator */}
            <View
              style={[
                styles.workoutIndicatorCard,
                { backgroundColor: theme.backgroundElement },
              ]}>
              <View style={styles.libraryItemLeft}>
                <View
                  style={[
                    styles.colorDot,
                    {
                      backgroundColor: isClassical
                        ? theme.textSecondary
                        : selectedWorkout.accentColor,
                    },
                  ]}
                />
                <ThemedText
                  type="smallBold"
                  themeColor={isClassical ? 'textSecondary' : 'text'}>
                  {isClassical ? 'No workout selected' : selectedWorkout.title}
                </ThemedText>
              </View>

              {!isClassical && !isRunning && (
                <Pressable
                  onPress={handleClearSelectedWorkout}
                  hitSlop={8}
                  style={styles.clearWorkoutBtn}>
                  <ThemedText type="code" themeColor="textSecondary">
                    ✕
                  </ThemedText>
                </Pressable>
              )}
            </View>

            {/* Core Telemetry Indicators: Time, Distance, Global Pace, Last Km Pace */}
            <ThemedView type="backgroundElement" style={styles.metricsCard}>
              {/* Time */}
              <View style={styles.primaryMetricBlock}>
                <ThemedText type="code" themeColor="textSecondary">
                  TIME
                </ThemedText>
                <ThemedText style={styles.heroValue}>{formatDuration(elapsedSec)}</ThemedText>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />

              {/* Distance */}
              <View style={styles.primaryMetricBlock}>
                <ThemedText type="code" themeColor="textSecondary">
                  DISTANCE
                </ThemedText>
                <View style={styles.distanceRow}>
                  <ThemedText style={styles.heroValue}>{distanceKm.toFixed(2)}</ThemedText>
                  <ThemedText type="default" themeColor="textSecondary" style={styles.unitLabel}>
                    km
                  </ThemedText>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />

              {/* Pace Row: Global Pace & Last Km Pace */}
              <View style={styles.paceGrid}>
                <View style={styles.paceBlock}>
                  <ThemedText type="code" themeColor="textSecondary">
                    GLOBAL PACE
                  </ThemedText>
                  <ThemedText type="subtitle" style={styles.paceValue}>
                    {formatPace(globalPaceSec)}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    min/km
                  </ThemedText>
                </View>

                <View
                  style={[styles.verticalDivider, { backgroundColor: theme.backgroundSelected }]}
                />

                <View style={styles.paceBlock}>
                  <ThemedText type="code" themeColor="textSecondary">
                    LAST KM PACE
                  </ThemedText>
                  <ThemedText type="subtitle" style={styles.paceValue}>
                    {formatPace(displayedLastKmPaceSec)}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    min/km
                  </ThemedText>
                </View>
              </View>
            </ThemedView>

            {/* Bottom Controls + Library Button */}
            <View style={styles.controlsSection}>
              <Pressable
                onPress={handleStartPause}
                style={({ pressed }) => [
                  styles.startBtn,
                  {
                    backgroundColor: isRunning
                      ? '#F59E0B'
                      : isClassical
                        ? theme.primary
                        : (selectedWorkout?.accentColor ?? theme.primary),
                  },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={styles.startBtnText}>
                  {isRunning ? 'Pause' : hasProgress ? 'Resume' : 'Start Workout'}
                </ThemedText>
              </Pressable>

              {hasProgress && (
                <View style={styles.secondaryActionsRow}>
                  <Pressable
                    onPress={handleFinish}
                    style={({ pressed }) => [
                      styles.finishBtn,
                      { backgroundColor: '#10B981' },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="smallBold" style={styles.startBtnText}>
                      Finish & Save
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={handleStepHalfKm}
                    style={({ pressed }) => [
                      styles.subtleBtn,
                      { backgroundColor: theme.backgroundElement },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="small" themeColor="textSecondary">
                      +0.5 km
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={handleReset}
                    style={({ pressed }) => [
                      styles.subtleBtn,
                      { backgroundColor: theme.backgroundElement },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="small" themeColor="textSecondary">
                      Reset
                    </ThemedText>
                  </Pressable>
                </View>
              )}

              {/* Library Button at the Bottom of the Page */}
              <Pressable
                disabled={isRunning}
                onPress={() => {
                  setViewingWorkout(null);
                  setIsCreatingWorkout(false);
                  setShowLibrary(true);
                }}
                style={({ pressed }) => [
                  styles.libraryBottomBtn,
                  {
                    backgroundColor: theme.backgroundElement,
                    opacity: isRunning ? 0.5 : 1,
                  },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold">Library</ThemedText>
              </Pressable>
            </View>
          </>
        ) : viewingWorkout ? (
          /* WORKOUT DETAILS VIEW + DO WORKOUT BUTTON AT BOTTOM */
          <>
            <ThemedView type="backgroundElement" style={styles.detailsCard}>
              <View style={styles.detailsHeaderRow}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: `${viewingWorkout.accentColor}22` },
                  ]}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: viewingWorkout.accentColor },
                    ]}
                  />
                  <ThemedText
                    type="code"
                    style={{ color: viewingWorkout.accentColor }}>
                    {viewingWorkout.category.toUpperCase()}
                  </ThemedText>
                </View>

                {viewingWorkout.isCustom && (
                  <Pressable
                    onPress={() => {
                      removeWorkoutFromLibrary(viewingWorkout.id);
                      setViewingWorkout(null);
                    }}
                    style={[styles.newWorkoutBtn, { backgroundColor: theme.background }]}>
                    <ThemedText type="code" themeColor="textSecondary">
                      Delete Workout
                    </ThemedText>
                  </Pressable>
                )}
              </View>

              <ThemedText type="subtitle">{viewingWorkout.title}</ThemedText>
              {viewingWorkout.description && (
                <ThemedText type="default" themeColor="textSecondary">
                  {viewingWorkout.description}
                </ThemedText>
              )}

              <View style={styles.detailsMetricsRow}>
                <View
                  style={[
                    styles.detailsMetricBox,
                    { backgroundColor: theme.background },
                  ]}>
                  <ThemedText type="code" themeColor="textSecondary">
                    TARGET DISTANCE
                  </ThemedText>
                  <ThemedText type="subtitle">
                    {viewingWorkout.targetDistanceKm ?? 5} km
                  </ThemedText>
                </View>

                <View
                  style={[
                    styles.detailsMetricBox,
                    { backgroundColor: theme.background },
                  ]}>
                  <ThemedText type="code" themeColor="textSecondary">
                    TARGET PACE
                  </ThemedText>
                  <ThemedText type="subtitle">
                    {viewingWorkout.targetPaceSecPerKm
                      ? `${formatPace(viewingWorkout.targetPaceSecPerKm)} /km`
                      : 'Free pace'}
                  </ThemedText>
                </View>
              </View>

              {viewingWorkout.steps && viewingWorkout.steps.length > 0 && (
                <View style={styles.stepsBlock}>
                  <ThemedText type="code" themeColor="textSecondary">
                    WORKOUT STRUCTURE
                  </ThemedText>
                  <View style={styles.stepsList}>
                    {viewingWorkout.steps.map((step, index) => (
                      <View
                        key={index}
                        style={[
                          styles.stepItemRow,
                          { backgroundColor: theme.background },
                        ]}>
                        <View
                          style={[
                            styles.stepNumberBadge,
                            { backgroundColor: viewingWorkout.accentColor },
                          ]}>
                          <ThemedText type="code" style={{ color: '#FFFFFF' }}>
                            {index + 1}
                          </ThemedText>
                        </View>
                        <ThemedText type="smallBold" style={{ flex: 1 }}>
                          {step}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ThemedView>

            <Pressable
              onPress={() => handleDoWorkout(viewingWorkout)}
              style={({ pressed }) => [
                styles.startBtn,
                { backgroundColor: viewingWorkout.accentColor || theme.primary },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={styles.startBtnText}>
                Do Workout
              </ThemedText>
            </Pressable>
          </>
        ) : (
          /* WORKOUT LIBRARY LIST & NEW WORKOUT CREATOR */
          <ThemedView type="backgroundElement" style={styles.librarySheet}>
            <View style={styles.libraryHeaderRow}>
              <ThemedText
                type="smallBold"
                themeColor="textSecondary"
                style={styles.libraryHeaderTitle}>
                {isCreatingWorkout ? 'NEW WORKOUT' : 'YOUR WORKOUTS'}
              </ThemedText>
              <Pressable
                onPress={() => setIsCreatingWorkout((prev) => !prev)}
                style={[styles.newWorkoutBtn, { backgroundColor: theme.background }]}>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>
                  {isCreatingWorkout ? '← Back to List' : '+ New Workout'}
                </ThemedText>
              </Pressable>
            </View>

            {!isCreatingWorkout ? (
              <View style={styles.libraryList}>
                {workoutLibrary.map((item) => {
                  const selected = selectedWorkout?.id === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setViewingWorkout(item)}
                      style={({ pressed }) => [
                        styles.libraryItem,
                        {
                          backgroundColor: theme.background,
                          borderColor: selected ? item.accentColor : 'transparent',
                        },
                        pressed && styles.pressed,
                      ]}>
                      <View style={styles.libraryItemLeft}>
                        <View style={[styles.colorDot, { backgroundColor: item.accentColor }]} />
                        <View style={{ flex: 1 }}>
                          <ThemedText type="smallBold">{item.title}</ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {item.description}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.libraryItemRight}>
                        <ThemedText type="code" themeColor="textSecondary">
                          {item.targetDistanceKm} km ›
                        </ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              /* Custom Workout Builder */
              <View style={styles.creatorContainer}>
                {/* Type Toggle: Target Run vs Intervals/Blocks */}
                <View style={[styles.creatorTypeRow, { backgroundColor: theme.background }]}>
                  <Pressable
                    onPress={() => setCreatorType('target')}
                    style={[
                      styles.creatorTypeTab,
                      creatorType === 'target' && {
                        backgroundColor: theme.backgroundElement,
                      },
                    ]}>
                    <ThemedText
                      type="smallBold"
                      themeColor={creatorType === 'target' ? 'text' : 'textSecondary'}>
                      Target Run
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => setCreatorType('intervals')}
                    style={[
                      styles.creatorTypeTab,
                      creatorType === 'intervals' && {
                        backgroundColor: theme.backgroundElement,
                      },
                    ]}>
                    <ThemedText
                      type="smallBold"
                      themeColor={creatorType === 'intervals' ? 'text' : 'textSecondary'}>
                      Intervals / Blocks
                    </ThemedText>
                  </Pressable>
                </View>

                {/* Workout Name Input */}
                <View style={styles.fieldGroup}>
                  <ThemedText type="code" themeColor="textSecondary">
                    WORKOUT NAME (OPTIONAL)
                  </ThemedText>
                  <TextInput
                    value={customTitle}
                    onChangeText={setCustomTitle}
                    placeholder={
                      creatorType === 'target'
                        ? `e.g. ${distanceInputText || '5'}K ${targetCategory} Run`
                        : `e.g. ${repeatsText || '6'} × ${workDistMetersText || '400'}m Intervals`
                    }
                    placeholderTextColor={theme.textSecondary}
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.background,
                        color: theme.text,
                      },
                    ]}
                  />
                </View>

                {creatorType === 'target' ? (
                  <>
                    {/* Category */}
                    <View style={styles.fieldGroup}>
                      <ThemedText type="code" themeColor="textSecondary">
                        CATEGORY
                      </ThemedText>
                      <View style={styles.chipsRow}>
                        {TARGET_CATEGORIES.map((cat) => {
                          const active = targetCategory === cat.label;
                          return (
                            <Pressable
                              key={cat.label}
                              onPress={() => setTargetCategory(cat.label)}
                              style={[
                                styles.chipBtn,
                                {
                                  flex: 1,
                                  backgroundColor: active ? cat.color : theme.background,
                                },
                              ]}>
                              <ThemedText
                                type="smallBold"
                                style={{ color: active ? '#FFFFFF' : theme.text }}>
                                {cat.label}
                              </ThemedText>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    {/* Exact Target Distance Input */}
                    <View style={[styles.inlineInputRow, { backgroundColor: theme.background }]}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="code" themeColor="textSecondary">
                          TARGET DISTANCE
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          Type exact distance in km
                        </ThemedText>
                      </View>
                      <View style={styles.numericBoxRow}>
                        <TextInput
                          value={distanceInputText}
                          onChangeText={setDistanceInputText}
                          keyboardType="decimal-pad"
                          selectTextOnFocus
                          placeholder="5.0"
                          placeholderTextColor={theme.textSecondary}
                          style={[
                            styles.numericInput,
                            {
                              backgroundColor: theme.backgroundElement,
                              color: theme.text,
                            },
                          ]}
                        />
                        <ThemedText type="smallBold">km</ThemedText>
                      </View>
                    </View>

                    {/* Optional Target Pace Toggle */}
                    <View style={styles.fieldGroup}>
                      <View style={styles.paceToggleHeader}>
                        <ThemedText type="code" themeColor="textSecondary">
                          PACE GOAL
                        </ThemedText>
                        <View
                          style={[
                            styles.miniToggleContainer,
                            { backgroundColor: theme.background },
                          ]}>
                          <Pressable
                            onPress={() => setHasTargetPace(false)}
                            style={[
                              styles.miniToggleBtn,
                              !hasTargetPace && {
                                backgroundColor: theme.backgroundElement,
                              },
                            ]}>
                            <ThemedText
                              type="smallBold"
                              themeColor={!hasTargetPace ? 'text' : 'textSecondary'}>
                              Distance Only
                            </ThemedText>
                          </Pressable>
                          <Pressable
                            onPress={() => setHasTargetPace(true)}
                            style={[
                              styles.miniToggleBtn,
                              hasTargetPace && {
                                backgroundColor: theme.primary,
                              },
                            ]}>
                            <ThemedText
                              type="smallBold"
                              style={{
                                color: hasTargetPace ? '#FFFFFF' : theme.textSecondary,
                              }}>
                              Set Target Pace
                            </ThemedText>
                          </Pressable>
                        </View>
                      </View>

                      {hasTargetPace && (
                        <PaceWheelPicker
                          paceSecPerKm={targetPaceSec}
                          onChange={setTargetPaceSec}
                        />
                      )}
                    </View>
                  </>
                ) : (
                  <>
                    {/* Warm-up & Cool-down exact inputs */}
                    <View style={styles.twoColRow}>
                      <View
                        style={[
                          styles.inlineInputRow,
                          { flex: 1, backgroundColor: theme.background },
                        ]}>
                        <ThemedText type="code" themeColor="textSecondary">
                          WARM-UP
                        </ThemedText>
                        <View style={styles.numericBoxRow}>
                          <TextInput
                            value={warmupText}
                            onChangeText={setWarmupText}
                            keyboardType="number-pad"
                            selectTextOnFocus
                            style={[
                              styles.numericInputSmall,
                              {
                                backgroundColor: theme.backgroundElement,
                                color: theme.text,
                              },
                            ]}
                          />
                          <ThemedText type="small" themeColor="textSecondary">
                            m
                          </ThemedText>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.inlineInputRow,
                          { flex: 1, backgroundColor: theme.background },
                        ]}>
                        <ThemedText type="code" themeColor="textSecondary">
                          COOL-DOWN
                        </ThemedText>
                        <View style={styles.numericBoxRow}>
                          <TextInput
                            value={cooldownText}
                            onChangeText={setCooldownText}
                            keyboardType="number-pad"
                            selectTextOnFocus
                            style={[
                              styles.numericInputSmall,
                              {
                                backgroundColor: theme.backgroundElement,
                                color: theme.text,
                              },
                            ]}
                          />
                          <ThemedText type="small" themeColor="textSecondary">
                            m
                          </ThemedText>
                        </View>
                      </View>
                    </View>

                    {/* Repeats, Rep Distance (m), Recovery (s) exact inputs */}
                    <View style={[styles.inlineInputRow, { backgroundColor: theme.background }]}>
                      <ThemedText type="code" themeColor="textSecondary">
                        REPEATS
                      </ThemedText>
                      <View style={styles.numericBoxRow}>
                        <TextInput
                          value={repeatsText}
                          onChangeText={setRepeatsText}
                          keyboardType="number-pad"
                          selectTextOnFocus
                          style={[
                            styles.numericInput,
                            {
                              backgroundColor: theme.backgroundElement,
                              color: theme.text,
                            },
                          ]}
                        />
                        <ThemedText type="smallBold">reps</ThemedText>
                      </View>
                    </View>

                    <View style={[styles.inlineInputRow, { backgroundColor: theme.background }]}>
                      <ThemedText type="code" themeColor="textSecondary">
                        REP DISTANCE
                      </ThemedText>
                      <View style={styles.numericBoxRow}>
                        <TextInput
                          value={workDistMetersText}
                          onChangeText={setWorkDistMetersText}
                          keyboardType="number-pad"
                          selectTextOnFocus
                          style={[
                            styles.numericInput,
                            {
                              backgroundColor: theme.backgroundElement,
                              color: theme.text,
                            },
                          ]}
                        />
                        <ThemedText type="smallBold">m</ThemedText>
                      </View>
                    </View>

                    <View style={[styles.inlineInputRow, { backgroundColor: theme.background }]}>
                      <ThemedText type="code" themeColor="textSecondary">
                        RECOVERY REST
                      </ThemedText>
                      <View style={styles.numericBoxRow}>
                        <TextInput
                          value={recoverySecText}
                          onChangeText={setRecoverySecText}
                          keyboardType="number-pad"
                          selectTextOnFocus
                          style={[
                            styles.numericInput,
                            {
                              backgroundColor: theme.backgroundElement,
                              color: theme.text,
                            },
                          ]}
                        />
                        <ThemedText type="smallBold">sec</ThemedText>
                      </View>
                    </View>

                    {/* Optional Interval Target Pace Toggle + Wheel Picker */}
                    <View style={styles.fieldGroup}>
                      <View style={styles.paceToggleHeader}>
                        <ThemedText type="code" themeColor="textSecondary">
                          REP PACE GOAL
                        </ThemedText>
                        <View
                          style={[
                            styles.miniToggleContainer,
                            { backgroundColor: theme.background },
                          ]}>
                          <Pressable
                            onPress={() => setHasIntervalPace(false)}
                            style={[
                              styles.miniToggleBtn,
                              !hasIntervalPace && {
                                backgroundColor: theme.backgroundElement,
                              },
                            ]}>
                            <ThemedText
                              type="smallBold"
                              themeColor={!hasIntervalPace ? 'text' : 'textSecondary'}>
                              No Pace Goal
                            </ThemedText>
                          </Pressable>
                          <Pressable
                            onPress={() => setHasIntervalPace(true)}
                            style={[
                              styles.miniToggleBtn,
                              hasIntervalPace && {
                                backgroundColor: theme.primary,
                              },
                            ]}>
                            <ThemedText
                              type="smallBold"
                              style={{
                                color: hasIntervalPace ? '#FFFFFF' : theme.textSecondary,
                              }}>
                              Set Rep Pace
                            </ThemedText>
                          </Pressable>
                        </View>
                      </View>

                      {hasIntervalPace && (
                        <PaceWheelPicker
                          paceSecPerKm={intervalPaceSec}
                          onChange={setIntervalPaceSec}
                        />
                      )}
                    </View>
                  </>
                )}

                <Pressable
                  onPress={handleSaveCustomWorkout}
                  style={({ pressed }) => [
                    styles.saveWorkoutBtn,
                    { backgroundColor: theme.primary },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" style={styles.startBtnText}>
                    Save Workout
                  </ThemedText>
                </Pressable>
              </View>
            )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backPillBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  workoutIndicatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  clearWorkoutBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  libraryBottomBtn: {
    paddingVertical: 16,
    borderRadius: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Spacing.two,
  },
  detailsMetricsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  detailsMetricBox: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: 4,
  },
  stepsBlock: {
    gap: Spacing.two,
  },
  stepsList: {
    gap: Spacing.two,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  librarySheet: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  libraryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  libraryHeaderTitle: {
    flex: 1,
  },
  newWorkoutBtn: {
    flexShrink: 0,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Spacing.two,
  },
  libraryList: {
    gap: Spacing.two,
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    gap: Spacing.two,
  },
  libraryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  libraryItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  deleteBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  creatorContainer: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  creatorTypeRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Spacing.two,
    gap: 4,
  },
  creatorTypeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGroup: {
    gap: 6,
  },
  textInput: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: Spacing.two,
    fontSize: 15,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chipBtn: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  inlineInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  numericBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  numericInput: {
    minWidth: 68,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  numericInputSmall: {
    minWidth: 46,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  paceToggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniToggleContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 8,
    gap: 4,
  },
  miniToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveWorkoutBtn: {
    paddingVertical: 14,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  activeWorkoutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  metricsCard: {
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  primaryMetricBlock: {
    alignItems: 'center',
    gap: 4,
  },
  heroValue: {
    fontSize: 56,
    lineHeight: 62,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  unitLabel: {
    fontSize: 20,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  paceGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: Spacing.one,
  },
  paceBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  paceValue: {
    fontSize: 32,
    lineHeight: 38,
    fontVariant: ['tabular-nums'],
  },
  verticalDivider: {
    width: 1,
    height: 52,
  },
  controlsSection: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  startBtn: {
    paddingVertical: 18,
    borderRadius: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  finishBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtleBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});

import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  formatDuration,
  formatPace,
  RunSession,
  useTraining,
} from '@/context/training-context';
import { useTheme } from '@/hooks/use-theme';

export default function ActivitiesScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const { runs = [] } = useTraining();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const latestRun = runs[0];
  const previousRuns = runs.slice(1);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const renderExpandedDetails = (run: RunSession) => {
    const lastKmPace =
      run.lastKmPaceSec ??
      (run.splits && run.splits.length > 0
        ? run.splits[run.splits.length - 1]
        : run.avgPaceSecPerKm);

    return (
      <View style={[styles.detailsPanel, { backgroundColor: theme.background }]}>
        <View style={styles.detailsGrid}>
          <View style={styles.detailCell}>
            <ThemedText type="small" themeColor="textSecondary">
              Duration
            </ThemedText>
            <ThemedText type="smallBold">{formatDuration(run.durationSec)}</ThemedText>
          </View>
          <View style={styles.detailCell}>
            <ThemedText type="small" themeColor="textSecondary">
              Global Pace
            </ThemedText>
            <ThemedText type="smallBold">{formatPace(run.avgPaceSecPerKm)} /km</ThemedText>
          </View>
          <View style={styles.detailCell}>
            <ThemedText type="small" themeColor="textSecondary">
              Last Km Pace
            </ThemedText>
            <ThemedText type="smallBold">{formatPace(lastKmPace)} /km</ThemedText>
          </View>
          <View style={styles.detailCell}>
            <ThemedText type="small" themeColor="textSecondary">
              Type
            </ThemedText>
            <ThemedText type="smallBold">{run.category}</ThemedText>
          </View>
          <View style={styles.detailCell}>
            <ThemedText type="small" themeColor="textSecondary">
              Avg HR
            </ThemedText>
            <ThemedText type="smallBold">{run.avgHr} bpm</ThemedText>
          </View>
          <View style={styles.detailCell}>
            <ThemedText type="small" themeColor="textSecondary">
              Energy
            </ThemedText>
            <ThemedText type="smallBold">{run.calories} kcal</ThemedText>
          </View>
        </View>

        {run.splits && run.splits.length > 0 && (
          <View style={styles.splitsSection}>
            <ThemedText type="code" themeColor="textSecondary">
              KILOMETER SPLITS
            </ThemedText>
            <View style={styles.splitsRow}>
              {run.splits.map((splitSec, idx) => (
                <View
                  key={idx}
                  style={[styles.splitChip, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="code" themeColor="textSecondary">
                    Km {idx + 1}
                  </ThemedText>
                  <ThemedText type="smallBold">{formatPace(splitSec)}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
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
        <View style={styles.header}>
          <ThemedText type="subtitle">Activities</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Tap any activity to view full details
          </ThemedText>
        </View>

        {/* Highlighted Latest Activity */}
        {latestRun && (
          <Pressable
            onPress={() => toggleExpand(latestRun.id)}
            style={({ pressed }) => [
              styles.latestCard,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.primary,
              },
              pressed && styles.pressed,
            ]}>
            <View style={styles.latestTopRow}>
              <View style={[styles.latestBadge, { backgroundColor: `${theme.primary}20` }]}>
                <ThemedText type="code" style={{ color: theme.primary }}>
                  LATEST ACTIVITY
                </ThemedText>
              </View>
              <ThemedText type="code" themeColor="textSecondary">
                {latestRun.dateLabel}
              </ThemedText>
            </View>

            <View style={styles.latestMainRow}>
              <View style={{ flex: 1 }}>
                <ThemedText type="default" style={styles.latestTitle}>
                  {latestRun.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatDuration(latestRun.durationSec)} • {formatPace(latestRun.avgPaceSecPerKm)}{' '}
                  /km
                </ThemedText>
              </View>

              <View style={styles.latestDistanceBlock}>
                <ThemedText style={styles.latestDistanceValue}>
                  {(latestRun.distanceKm ?? 0).toFixed(2)}
                </ThemedText>
                <ThemedText type="code" themeColor="textSecondary">
                  KM
                </ThemedText>
              </View>
            </View>

            <View style={styles.expandHintRow}>
              <ThemedText type="code" themeColor="textSecondary">
                {expandedId === latestRun.id ? 'Hide details ▴' : 'Tap to see details ▾'}
              </ThemedText>
            </View>

            {expandedId === latestRun.id && renderExpandedDetails(latestRun)}
          </Pressable>
        )}

        {/* Previous Activities List */}
        {previousRuns.length > 0 && (
          <View style={styles.previousSection}>
            <ThemedText type="code" themeColor="textSecondary">
              PREVIOUS SESSIONS
            </ThemedText>

            <View style={styles.list}>
              {previousRuns.map((run) => {
                const isExpanded = expandedId === run.id;
                return (
                  <Pressable
                    key={run.id}
                    onPress={() => toggleExpand(run.id)}
                    style={({ pressed }) => [
                      styles.previousCard,
                      { backgroundColor: theme.backgroundElement },
                      pressed && styles.pressed,
                    ]}>
                    <View style={styles.previousSummaryRow}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold">{run.title}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {run.dateLabel}
                        </ThemedText>
                      </View>

                      <View style={styles.previousRightMetrics}>
                        <ThemedText type="smallBold">
                          {(run.distanceKm ?? 0).toFixed(2)} km
                        </ThemedText>
                        <ThemedText type="code" themeColor="textSecondary">
                          {formatPace(run.avgPaceSecPerKm)} /km {isExpanded ? '▴' : '▾'}
                        </ThemedText>
                      </View>
                    </View>

                    {isExpanded && renderExpandedDetails(run)}
                  </Pressable>
                );
              })}
            </View>
          </View>
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
    gap: 2,
  },
  latestCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: 2,
    gap: Spacing.two,
  },
  latestTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  latestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  latestMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  latestTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  latestDistanceBlock: {
    alignItems: 'flex-end',
  },
  latestDistanceValue: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  expandHintRow: {
    alignItems: 'flex-start',
  },
  previousSection: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  list: {
    gap: Spacing.two,
  },
  previousCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  previousSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previousRightMetrics: {
    alignItems: 'flex-end',
    gap: 2,
  },
  detailsPanel: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.two,
  },
  detailCell: {
    width: '33%',
    gap: 2,
  },
  splitsSection: {
    gap: Spacing.one,
  },
  splitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  splitChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Spacing.two,
    alignItems: 'center',
    minWidth: 64,
  },
  pressed: {
    opacity: 0.8,
  },
});

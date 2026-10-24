import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { MedalReward, useTraining } from '@/context/training-context';
import { useTheme } from '@/hooks/use-theme';

export default function RewardsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const { medals = [], awardDemoMedal } = useTraining();

  const [selectedMedal, setSelectedMedal] = useState<MedalReward | null>(null);

  const weeklyMedals = medals.filter((m) => m.tier === 'week');
  const monthlyMedals = medals.filter((m) => m.tier === 'month');
  const yearlyMedals = medals.filter((m) => m.tier === 'year');

  const renderShelf = ({
    title,
    subtitle,
    items,
    minSlots,
    emptyLabel,
  }: {
    title: string;
    subtitle: string;
    items: MedalReward[];
    minSlots: number;
    emptyLabel: string;
  }) => {
    const emptySlotsCount = Math.max(1, minSlots - items.length);
    const emptySlots = Array.from({ length: emptySlotsCount }, (_, idx) => idx);

    return (
      <ThemedView type="backgroundElement" style={styles.shelfContainer}>
        <View style={styles.shelfHeaderRow}>
          <View style={styles.shelfTitleGroup}>
            <ThemedText type="smallBold">{title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {subtitle}
            </ThemedText>
          </View>
          <View style={[styles.countBadge, { backgroundColor: `${theme.primary}22` }]}>
            <ThemedText type="code" style={{ color: theme.primary }}>
              {items.length} earned
            </ThemedText>
          </View>
        </View>

        {/* Bookshelf Items Row */}
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shelfItemsRow}>
          {items.map((medal) => {
            const isSelected = selectedMedal?.id === medal.id;
            return (
              <Pressable
                key={medal.id}
                onPress={() => setSelectedMedal(isSelected ? null : medal)}
                style={({ pressed }) => [
                  styles.medalPedestal,
                  {
                    backgroundColor: theme.background,
                    borderColor: isSelected ? theme.primary : medal.color,
                  },
                  pressed && styles.pressed,
                ]}>
                <View style={[styles.medalRibbon, { backgroundColor: medal.color }]} />
                <ThemedText style={styles.medalEmoji}>{medal.icon}</ThemedText>
                <ThemedText
                  type="code"
                  numberOfLines={1}
                  style={styles.medalPedestalLabel}>
                  {medal.title}
                </ThemedText>
              </Pressable>
            );
          })}

          {/* Locked / Upcoming Slots on the Shelf */}
          {emptySlots.map((slotIdx) => (
            <View
              key={`locked-${slotIdx}`}
              style={[
                styles.lockedSlot,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.backgroundSelected,
                },
              ]}>
              <ThemedText style={styles.lockedIcon}>🔒</ThemedText>
              <ThemedText type="code" themeColor="textSecondary">
                {emptyLabel}
              </ThemedText>
            </View>
          ))}
        </ScrollView>

        {/* Bookshelf Ledge */}
        <View style={[styles.shelfLedge, { backgroundColor: theme.backgroundSelected }]}>
          <View style={[styles.shelfLedgeHighlight, { backgroundColor: theme.primary }]} />
        </View>
      </ThemedView>
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
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="subtitle">Medal Library</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Your bookshelf of weekly, monthly, and yearly achievements
          </ThemedText>
        </View>

        {/* Summary Totals Banner */}
        <ThemedView type="backgroundElement" style={styles.summaryRowCard}>
          <View style={styles.summaryCell}>
            <ThemedText type="subtitle" style={{ color: theme.primary }}>
              {weeklyMedals.length}
            </ThemedText>
            <ThemedText type="code" themeColor="textSecondary">
              WEEKLY
            </ThemedText>
          </View>
          <View
            style={[styles.summaryDivider, { backgroundColor: theme.backgroundSelected }]}
          />
          <View style={styles.summaryCell}>
            <ThemedText type="subtitle" style={{ color: '#F59E0B' }}>
              {monthlyMedals.length}
            </ThemedText>
            <ThemedText type="code" themeColor="textSecondary">
              MONTHLY
            </ThemedText>
          </View>
          <View
            style={[styles.summaryDivider, { backgroundColor: theme.backgroundSelected }]}
          />
          <View style={styles.summaryCell}>
            <ThemedText type="subtitle" style={{ color: '#A855F7' }}>
              {yearlyMedals.length}
            </ThemedText>
            <ThemedText type="code" themeColor="textSecondary">
              YEARLY
            </ThemedText>
          </View>
        </ThemedView>

        {/* Selected Medal Detail Inspection Card */}
        {selectedMedal && (
          <ThemedView
            type="backgroundElement"
            style={[styles.detailCard, { borderColor: theme.primary }]}>
            <View style={styles.detailRow}>
              <View
                style={[
                  styles.detailIconCircle,
                  { backgroundColor: `${selectedMedal.color}25` },
                ]}>
                <ThemedText style={styles.detailEmoji}>{selectedMedal.icon}</ThemedText>
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold">{selectedMedal.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {selectedMedal.subtitle}
                </ThemedText>
                <ThemedText type="code" style={{ color: theme.primary, marginTop: 2 }}>
                  Earned • {selectedMedal.earnedAtLabel}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => setSelectedMedal(null)}
                hitSlop={8}
                style={styles.closeBtn}>
                <ThemedText type="code" themeColor="textSecondary">
                  ✕
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        )}

        {/* Shelf 1: Weekly Medals */}
        {renderShelf({
          title: 'Weekly Finisher Shelf',
          subtitle: 'Unlocked each time you complete a full training week',
          items: weeklyMedals,
          minSlots: 5,
          emptyLabel: 'Next Week',
        })}

        {/* Shelf 2: Monthly Medals */}
        {renderShelf({
          title: 'Monthly Crown Shelf',
          subtitle: 'Unlocked every 4 completed weeks of training',
          items: monthlyMedals,
          minSlots: 4,
          emptyLabel: 'Next Month',
        })}

        {/* Shelf 3: Yearly Trophies */}
        {renderShelf({
          title: 'Yearly Legend Shelf',
          subtitle: 'Unlocked after a full year of consistent training',
          items: yearlyMedals,
          minSlots: 3,
          emptyLabel: 'Next Year',
        })}

        {/* Subtle Demo Controls to test adding medals onto the shelves */}
        <ThemedView type="backgroundElement" style={styles.demoCard}>
          <ThemedText type="code" themeColor="textSecondary">
            SIMULATE MILESTONE UNLOCK
          </ThemedText>
          <View style={styles.demoButtonsRow}>
            <Pressable
              onPress={() => awardDemoMedal('week')}
              style={({ pressed }) => [
                styles.demoBtn,
                { backgroundColor: theme.background },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold">+ Week 🥈</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => awardDemoMedal('month')}
              style={({ pressed }) => [
                styles.demoBtn,
                { backgroundColor: theme.background },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold">+ Month 🥇</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => awardDemoMedal('year')}
              style={({ pressed }) => [
                styles.demoBtn,
                { backgroundColor: theme.background },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold">+ Year 🏆</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
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
  summaryRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.four,
  },
  summaryCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
  },
  detailCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: 1.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  detailIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailEmoji: {
    fontSize: 28,
  },
  closeBtn: {
    padding: 4,
  },
  shelfContainer: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  shelfHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  shelfTitleGroup: {
    flex: 1,
    gap: 2,
  },
  countBadge: {
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  shelfItemsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.one,
  },
  medalPedestal: {
    width: 96,
    height: 104,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    gap: 6,
    overflow: 'hidden',
  },
  medalRibbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  medalEmoji: {
    fontSize: 34,
    lineHeight: 40,
  },
  medalPedestalLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  lockedSlot: {
    width: 96,
    height: 104,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    gap: 6,
    opacity: 0.55,
  },
  lockedIcon: {
    fontSize: 22,
  },
  shelfLedge: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  shelfLedgeHighlight: {
    height: 3,
    width: '35%',
    borderRadius: 2,
    opacity: 0.7,
  },
  demoCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  demoBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});

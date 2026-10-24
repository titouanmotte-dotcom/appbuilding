import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppThemeColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTraining } from '@/context/training-context';
import { useTheme } from '@/hooks/use-theme';

interface ThemePreset {
  id: string;
  name: string;
  colors: AppThemeColors;
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'light',
    name: 'Clean Light',
    colors: {
      background: '#FFFFFF',
      backgroundElement: '#F0F0F3',
      backgroundSelected: '#E0E1E6',
      text: '#000000',
      textSecondary: '#60646C',
      primary: '#FF5A36',
    },
  },
  {
    id: 'dark',
    name: 'Midnight Dark',
    colors: {
      background: '#000000',
      backgroundElement: '#212225',
      backgroundSelected: '#2E3135',
      text: '#FFFFFF',
      textSecondary: '#B0B4BA',
      primary: '#FF5A36',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean Night',
    colors: {
      background: '#0B1120',
      backgroundElement: '#1E293B',
      backgroundSelected: '#334155',
      text: '#F8FAFC',
      textSecondary: '#94A3B8',
      primary: '#38BDF8',
    },
  },
  {
    id: 'forest',
    name: 'Forest Trail',
    colors: {
      background: '#0C1A14',
      backgroundElement: '#162B22',
      backgroundSelected: '#234235',
      text: '#ECFDF5',
      textSecondary: '#86EFAC',
      primary: '#10B981',
    },
  },
  {
    id: 'sand',
    name: 'Warm Sand',
    colors: {
      background: '#FAF6F0',
      backgroundElement: '#EFECE6',
      backgroundSelected: '#E2DDD5',
      text: '#1C1917',
      textSecondary: '#78716C',
      primary: '#EA580C',
    },
  },
  {
    id: 'plum',
    name: 'Violet Dusk',
    colors: {
      background: '#130F1E',
      backgroundElement: '#221B35',
      backgroundSelected: '#342A4F',
      text: '#F5F3FF',
      textSecondary: '#C4B5FD',
      primary: '#A855F7',
    },
  },
];

const BUTTON_SWATCHES = [
  { label: 'Coral', hex: '#FF5A36' },
  { label: 'Emerald', hex: '#10B981' },
  { label: 'Blue', hex: '#3B82F6' },
  { label: 'Violet', hex: '#8B5CF6' },
  { label: 'Amber', hex: '#F59E0B' },
  { label: 'Rose', hex: '#EC4899' },
  { label: 'Cyan', hex: '#06B6D4' },
  { label: 'Crimson', hex: '#EF4444' },
];

const BACKGROUND_SWATCHES = [
  {
    label: 'Pure White',
    bg: '#FFFFFF',
    card: '#F0F0F3',
    selected: '#E0E1E6',
    text: '#000000',
    textSec: '#60646C',
  },
  {
    label: 'Warm Sand',
    bg: '#FAF6F0',
    card: '#EFECE6',
    selected: '#E2DDD5',
    text: '#1C1917',
    textSec: '#78716C',
  },
  {
    label: 'Cool Slate',
    bg: '#F1F5F9',
    card: '#E2E8F0',
    selected: '#CBD5E1',
    text: '#0F172A',
    textSec: '#475569',
  },
  {
    label: 'Charcoal',
    bg: '#121316',
    card: '#212225',
    selected: '#2E3135',
    text: '#FFFFFF',
    textSec: '#B0B4BA',
  },
  {
    label: 'Pitch Black',
    bg: '#000000',
    card: '#18181B',
    selected: '#27272A',
    text: '#FFFFFF',
    textSec: '#A1A1AA',
  },
  {
    label: 'Deep Navy',
    bg: '#0B1120',
    card: '#1E293B',
    selected: '#334155',
    text: '#F8FAFC',
    textSec: '#94A3B8',
  },
  {
    label: 'Deep Forest',
    bg: '#0C1A14',
    card: '#162B22',
    selected: '#234235',
    text: '#ECFDF5',
    textSec: '#86EFAC',
  },
];

const CARD_SWATCHES = [
  { label: 'Soft Gray', card: '#F0F0F3', selected: '#E0E1E6' },
  { label: 'Warm Cream', card: '#EFECE6', selected: '#E2DDD5' },
  { label: 'Cool Mist', card: '#E2E8F0', selected: '#CBD5E1' },
  { label: 'Dark Zinc', card: '#212225', selected: '#2E3135' },
  { label: 'Navy Slate', card: '#1E293B', selected: '#334155' },
  { label: 'Forest Moss', card: '#162B22', selected: '#234235' },
  { label: 'Plum Surface', card: '#221B35', selected: '#342A4F' },
];

export default function SettingsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const { updateThemeColors, resetThemeColors, hasActivePlan, resetPlan } = useTraining();

  const [customHexInput, setCustomHexInput] = useState('');

  const handleApplyHex = () => {
    const cleaned = customHexInput.trim();
    const formatted = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(formatted)) {
      updateThemeColors({ primary: formatted });
      setCustomHexInput('');
    }
  };

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
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle">Settings</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Customize app colors and preferences
            </ThemedText>
          </View>
          <Pressable
            onPress={resetThemeColors}
            style={({ pressed }) => [
              styles.resetPill,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold">Reset Colors</ThemedText>
          </Pressable>
        </View>

        {/* Live Preview Card */}
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <View style={styles.previewRow}>
            <View style={{ flex: 1 }}>
              <ThemedText type="code" themeColor="textSecondary">
                ACTIVE THEME PREVIEW
              </ThemedText>
              <ThemedText type="smallBold">Buttons, Cards & Background</ThemedText>
            </View>
            <View style={[styles.sampleBtn, { backgroundColor: theme.primary }]}>
              <ThemedText type="smallBold" style={styles.sampleBtnText}>
                Button
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* 1. Theme Presets */}
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <ThemedText type="code" themeColor="textSecondary">
            THEME PRESETS
          </ThemedText>
          <View style={styles.presetsGrid}>
            {THEME_PRESETS.map((preset) => {
              const isSelected =
                theme.background.toLowerCase() === preset.colors.background.toLowerCase() &&
                theme.primary.toLowerCase() === preset.colors.primary.toLowerCase();

              return (
                <Pressable
                  key={preset.id}
                  onPress={() => updateThemeColors(preset.colors)}
                  style={({ pressed }) => [
                    styles.presetCard,
                    {
                      backgroundColor: preset.colors.background,
                      borderColor: isSelected ? preset.colors.primary : preset.colors.backgroundSelected,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.presetDotsRow}>
                    <View
                      style={[
                        styles.presetDot,
                        { backgroundColor: preset.colors.primary },
                      ]}
                    />
                    <View
                      style={[
                        styles.presetDot,
                        { backgroundColor: preset.colors.backgroundElement },
                      ]}
                    />
                  </View>
                  <ThemedText
                    type="smallBold"
                    style={{ color: preset.colors.text, fontSize: 13 }}>
                    {preset.name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </ThemedView>

        {/* 2. Primary Button & Accent Color */}
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <ThemedText type="code" themeColor="textSecondary">
            BUTTONS & ACCENT COLOR
          </ThemedText>
          <View style={styles.swatchesGrid}>
            {BUTTON_SWATCHES.map((swatch) => {
              const isSelected =
                theme.primary.toLowerCase() === swatch.hex.toLowerCase();
              return (
                <Pressable
                  key={swatch.hex}
                  onPress={() => updateThemeColors({ primary: swatch.hex })}
                  style={[
                    styles.colorSwatchItem,
                    {
                      backgroundColor: theme.background,
                      borderColor: isSelected ? swatch.hex : 'transparent',
                    },
                  ]}>
                  <View style={[styles.swatchCircle, { backgroundColor: swatch.hex }]} />
                  <ThemedText type="code">{swatch.label}</ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Optional Custom Hex Input */}
          <View style={styles.customHexRow}>
            <TextInput
              value={customHexInput}
              onChangeText={setCustomHexInput}
              placeholder="Custom hex (e.g. #FF5A36)"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="characters"
              maxLength={7}
              style={[
                styles.hexInput,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                },
              ]}
            />
            <Pressable
              onPress={handleApplyHex}
              style={[styles.applyHexBtn, { backgroundColor: theme.primary }]}>
              <ThemedText type="smallBold" style={styles.sampleBtnText}>
                Apply
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>

        {/* 3. App Background Color */}
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <ThemedText type="code" themeColor="textSecondary">
            PAGE BACKGROUND
          </ThemedText>
          <View style={styles.swatchesGrid}>
            {BACKGROUND_SWATCHES.map((item) => {
              const isSelected =
                theme.background.toLowerCase() === item.bg.toLowerCase();
              return (
                <Pressable
                  key={item.bg}
                  onPress={() =>
                    updateThemeColors({
                      background: item.bg,
                      backgroundElement: item.card,
                      backgroundSelected: item.selected,
                      text: item.text,
                      textSecondary: item.textSec,
                    })
                  }
                  style={[
                    styles.colorSwatchItem,
                    {
                      backgroundColor: theme.background,
                      borderColor: isSelected ? theme.primary : 'transparent',
                    },
                  ]}>
                  <View
                    style={[
                      styles.swatchCircle,
                      {
                        backgroundColor: item.bg,
                        borderWidth: 1,
                        borderColor: item.selected,
                      },
                    ]}
                  />
                  <ThemedText type="code">{item.label}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        </ThemedView>

        {/* 4. Cards & Surfaces Color */}
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <ThemedText type="code" themeColor="textSecondary">
            CARDS & CONTAINERS
          </ThemedText>
          <View style={styles.swatchesGrid}>
            {CARD_SWATCHES.map((item) => {
              const isSelected =
                theme.backgroundElement.toLowerCase() === item.card.toLowerCase();
              return (
                <Pressable
                  key={item.card}
                  onPress={() =>
                    updateThemeColors({
                      backgroundElement: item.card,
                      backgroundSelected: item.selected,
                    })
                  }
                  style={[
                    styles.colorSwatchItem,
                    {
                      backgroundColor: theme.background,
                      borderColor: isSelected ? theme.primary : 'transparent',
                    },
                  ]}>
                  <View
                    style={[
                      styles.swatchCircle,
                      {
                        backgroundColor: item.card,
                        borderWidth: 1,
                        borderColor: item.selected,
                      },
                    ]}
                  />
                  <ThemedText type="code">{item.label}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        </ThemedView>

        {/* 5. Training Plan Management (Future Settings Section) */}
        {hasActivePlan && (
          <ThemedView type="backgroundElement" style={styles.sectionCard}>
            <ThemedText type="code" themeColor="textSecondary">
              TRAINING PLAN
            </ThemedText>
            <View style={styles.previewRow}>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold">Reset Active Training Plan</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Start fresh with a new weekly schedule
                </ThemedText>
              </View>
              <Pressable
                onPress={resetPlan}
                style={[styles.resetPill, { backgroundColor: theme.background }]}>
                <ThemedText type="smallBold" style={{ color: '#EF4444' }}>
                  Reset Plan
                </ThemedText>
              </Pressable>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  sectionCard: {
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sampleBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: Spacing.three,
  },
  sampleBtnText: {
    color: '#FFFFFF',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  presetCard: {
    width: '31%',
    flexGrow: 1,
    padding: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 2,
    gap: 8,
  },
  presetDotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  swatchesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorSwatchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Spacing.two,
    borderWidth: 1.5,
  },
  swatchCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  customHexRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  hexInput: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Spacing.two,
    fontSize: 14,
  },
  applyHexBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});

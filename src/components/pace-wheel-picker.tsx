import React, { useEffect, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ITEM_HEIGHT = 36;
const MINUTES_LIST = Array.from({ length: 13 }, (_, i) => i + 2); // 2 to 14 min/km
const SECONDS_LIST = Array.from({ length: 60 }, (_, i) => i); // 00 to 59 sec

interface PaceWheelPickerProps {
  paceSecPerKm: number;
  onChange: (newPaceSec: number) => void;
}

export function PaceWheelPicker({ paceSecPerKm, onChange }: PaceWheelPickerProps) {
  const theme = useTheme();
  const currentMin = Math.max(2, Math.min(14, Math.floor(paceSecPerKm / 60)));
  const currentSec = Math.max(0, Math.min(59, Math.round(paceSecPerKm % 60)));

  const minScrollRef = useRef<ScrollView>(null);
  const secScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const minIdx = MINUTES_LIST.indexOf(currentMin);
    if (minIdx >= 0) {
      minScrollRef.current?.scrollTo({ y: minIdx * ITEM_HEIGHT, animated: false });
    }
    secScrollRef.current?.scrollTo({ y: currentSec * ITEM_HEIGHT, animated: false });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMinScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clampedIdx = Math.max(0, Math.min(MINUTES_LIST.length - 1, idx));
    const newMin = MINUTES_LIST[clampedIdx];
    onChange(newMin * 60 + currentSec);
  };

  const handleSecScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clampedSec = Math.max(0, Math.min(59, idx));
    onChange(currentMin * 60 + clampedSec);
  };

  const selectMinute = (min: number, idx: number) => {
    minScrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
    onChange(min * 60 + currentSec);
  };

  const selectSecond = (sec: number) => {
    secScrollRef.current?.scrollTo({ y: sec * ITEM_HEIGHT, animated: true });
    onChange(currentMin * 60 + sec);
  };

  const handleTypeMinutes = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned) return;
    const num = Math.max(1, Math.min(25, parseInt(cleaned, 10)));
    const idx = MINUTES_LIST.indexOf(num);
    if (idx >= 0) {
      minScrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
    }
    onChange(num * 60 + currentSec);
  };

  const handleTypeSeconds = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned) {
      onChange(currentMin * 60);
      return;
    }
    const num = Math.max(0, Math.min(59, parseInt(cleaned, 10)));
    secScrollRef.current?.scrollTo({ y: num * ITEM_HEIGHT, animated: true });
    onChange(currentMin * 60 + num);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Direct Typing Header Bar */}
      <View style={styles.directInputRow}>
        <ThemedText type="small" themeColor="textSecondary">
          Scroll wheel or type:
        </ThemedText>

        <View style={styles.inputsBox}>
          <TextInput
            value={String(currentMin)}
            onChangeText={handleTypeMinutes}
            keyboardType="number-pad"
            maxLength={2}
            selectTextOnFocus
            style={[
              styles.timeInput,
              {
                backgroundColor: theme.backgroundElement,
                color: theme.text,
              },
            ]}
          />
          <ThemedText type="smallBold">:</ThemedText>
          <TextInput
            value={currentSec < 10 ? `0${currentSec}` : String(currentSec)}
            onChangeText={handleTypeSeconds}
            keyboardType="number-pad"
            maxLength={2}
            selectTextOnFocus
            style={[
              styles.timeInput,
              {
                backgroundColor: theme.backgroundElement,
                color: theme.text,
              },
            ]}
          />
          <ThemedText type="small" themeColor="textSecondary">
            /km
          </ThemedText>
        </View>
      </View>

      {/* Dual Wheel Drum Picker */}
      <View style={styles.wheelWrapper}>
        {/* Selection Highlight Bar in the center */}
        <View
          pointerEvents="none"
          style={[
            styles.selectionHighlight,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.primary,
            },
          ]}
        />

        {/* Minutes Column */}
        <View style={styles.wheelColumn}>
          <ScrollView
            ref={minScrollRef}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            onMomentumScrollEnd={handleMinScrollEnd}
            onScrollEndDrag={handleMinScrollEnd}
            contentContainerStyle={styles.wheelContent}>
            {MINUTES_LIST.map((min, idx) => {
              const selected = min === currentMin;
              return (
                <Pressable
                  key={min}
                  onPress={() => selectMinute(min, idx)}
                  style={styles.wheelItem}>
                  <ThemedText
                    type={selected ? 'smallBold' : 'small'}
                    style={[
                      styles.wheelText,
                      {
                        color: selected ? theme.primary : theme.textSecondary,
                        fontSize: selected ? 18 : 14,
                      },
                    ]}>
                    {min} min
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ThemedText type="smallBold" style={styles.wheelColon}>
          :
        </ThemedText>

        {/* Seconds Column */}
        <View style={styles.wheelColumn}>
          <ScrollView
            ref={secScrollRef}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            onMomentumScrollEnd={handleSecScrollEnd}
            onScrollEndDrag={handleSecScrollEnd}
            contentContainerStyle={styles.wheelContent}>
            {SECONDS_LIST.map((sec) => {
              const selected = sec === currentSec;
              return (
                <Pressable
                  key={sec}
                  onPress={() => selectSecond(sec)}
                  style={styles.wheelItem}>
                  <ThemedText
                    type={selected ? 'smallBold' : 'small'}
                    style={[
                      styles.wheelText,
                      {
                        color: selected ? theme.primary : theme.textSecondary,
                        fontSize: selected ? 18 : 14,
                      },
                    ]}>
                    {sec < 10 ? `0${sec}` : sec} sec
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.two,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  directInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.one,
  },
  inputsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeInput: {
    width: 44,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  wheelWrapper: {
    height: ITEM_HEIGHT * 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  selectionHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: Spacing.two,
    right: Spacing.two,
    height: ITEM_HEIGHT,
    borderRadius: 8,
    borderWidth: 1,
  },
  wheelColumn: {
    flex: 1,
    height: ITEM_HEIGHT * 3,
  },
  wheelContent: {
    paddingVertical: ITEM_HEIGHT,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: {
    fontVariant: ['tabular-nums'],
  },
  wheelColon: {
    fontSize: 18,
    paddingHorizontal: 4,
  },
});

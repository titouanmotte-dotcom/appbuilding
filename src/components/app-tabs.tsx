import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TAB_CONFIG = [
  {
    name: 'index',
    title: 'Workout',
    iosIcon: 'figure.run' as const,
    androidIcon: 'directions_run' as const,
    fallback: '▶',
  },
  {
    name: 'explore',
    title: 'Goals',
    iosIcon: 'calendar' as const,
    androidIcon: 'calendar_today' as const,
    fallback: '✓',
  },
  {
    name: 'activities',
    title: 'Activities',
    iosIcon: 'clock.arrow.circlepath' as const,
    androidIcon: 'history' as const,
    fallback: '≡',
  },
  {
    name: 'rewards',
    title: 'Rewards',
    iosIcon: 'trophy.fill' as const,
    androidIcon: 'emoji_events' as const,
    fallback: '★',
  },
  {
    name: 'settings',
    title: 'Settings',
    iosIcon: 'gearshape.fill' as const,
    androidIcon: 'settings' as const,
    fallback: '⚙',
  },
];

export default function AppTabs() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<ScrollView>(null);
  const currentPageRef = useRef(0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      layout={({ state, descriptors, navigation }) => {
        return (
          <SwipeableTabLayout
            state={state}
            descriptors={descriptors}
            navigation={navigation}
            width={width}
            bottomInset={insets.bottom}
            colors={theme}
            pagerRef={pagerRef}
            currentPageRef={currentPageRef}
          />
        );
      }}>
      <Tabs.Screen name="index" options={{ title: 'Workout' }} />
      <Tabs.Screen name="explore" options={{ title: 'Goals' }} />
      <Tabs.Screen name="activities" options={{ title: 'Activities' }} />
      <Tabs.Screen name="rewards" options={{ title: 'Rewards' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

interface SwipeableTabLayoutProps {
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
  descriptors: Record<string, { render: () => React.ReactNode }>;
  navigation: {
    navigate: (name: string) => void;
  };
  width: number;
  bottomInset: number;
  colors: AppThemeColors;
  pagerRef: React.RefObject<ScrollView | null>;
  currentPageRef: React.MutableRefObject<number>;
}

function SwipeableTabLayout({
  state,
  descriptors,
  navigation,
  width,
  bottomInset,
  colors,
  pagerRef,
  currentPageRef,
}: SwipeableTabLayoutProps) {
  useEffect(() => {
    if (width <= 0) return;
    if (currentPageRef.current !== state.index) {
      currentPageRef.current = state.index;
      pagerRef.current?.scrollTo({
        x: state.index * width,
        animated: true,
      });
    }
  }, [state.index, width, pagerRef, currentPageRef]);

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return;
    const offsetX = e.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(offsetX / width);
    const clampedIndex = Math.max(0, Math.min(state.routes.length - 1, nextIndex));

    currentPageRef.current = clampedIndex;
    if (clampedIndex !== state.index) {
      const targetRoute = state.routes[clampedIndex];
      if (targetRoute) {
        navigation.navigate(targetRoute.name);
      }
    }
  };

  const handleTabPress = (index: number, routeName: string) => {
    currentPageRef.current = index;
    pagerRef.current?.scrollTo({
      x: index * width,
      animated: true,
    });
    if (state.index !== index) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        directionalLockEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.pager}>
        {state.routes.map((route) => (
          <View key={route.key} style={{ width, flex: 1 }}>
            {descriptors[route.key]?.render()}
          </View>
        ))}
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.backgroundSelected,
            paddingBottom: Math.max(bottomInset, 8),
          },
        ]}>
        {state.routes.map((route, idx) => {
          const isFocused = state.index === idx;
          const meta =
            TAB_CONFIG.find((t) => t.name === route.name) ?? TAB_CONFIG[0];
          const tintColor = isFocused ? colors.primary : colors.textSecondary;

          return (
            <Pressable
              key={route.key}
              onPress={() => handleTabPress(idx, route.name)}
              style={styles.tabItem}>
              <SymbolView
                name={{
                  ios: meta.iosIcon,
                  android: meta.androidIcon,
                  web: meta.androidIcon,
                }}
                size={22}
                tintColor={tintColor}
                fallback={
                  <Text style={{ color: tintColor, fontSize: 16, fontWeight: '700' }}>
                    {meta.fallback}
                  </Text>
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: tintColor,
                    fontWeight: isFocused ? '600' : '500',
                  },
                ]}>
                {meta.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 11,
  },
});

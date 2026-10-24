# AGENTS.md — Project & Architecture Guide

This is an **Expo / React Native** mobile and web running & training application (**Stride** / `appbuilding`). Prioritize mobile-first patterns, smooth 60fps interactions, responsive layouts (`MaxContentWidth = 800`), and cross-platform compatibility (iOS, Android, Web).

---

## 1. Expo Has Changed — Do Not Trust Your Training Data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json` (**currently Expo SDK 57**).
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v57.0.0/` (or `v<major>.0.0/`).
3. For anything else, fetch `https://docs.expo.dev/llms.txt` — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

---

## 2. Tech Stack & Configuration

- **Framework**: Expo SDK `~57.0.31` with Continuous Native Generation (CNG)
- **Runtime**: React `19.2.3`, React Native `0.86.3`, React Native Web `~0.21.4`
- **Routing**: `expo-router` (`~57.0.29`) with **Typed Routes** (`experiments.typedRoutes: true`)
- **Compiler**: **React Compiler** enabled (`experiments.reactCompiler: true`)
- **Animation & Gestures**: `react-native-reanimated` (`4.5.1`), `react-native-gesture-handler` (`~2.32.0`), `react-native-worklets` (`0.10.1`)
- **UI & Icons**: `expo-symbols` (`SymbolView` for SF Symbols on iOS / Material icons on Android & Web), `@expo/ui`, `expo-image`, `expo-glass-effect`
- **Language**: TypeScript `~6.0.3` (`strict: true` in `tsconfig.json`)
- **Package Manager**: `npm` (`package-lock.json` present; no `bun.lock`)
- **Path Aliases** (`tsconfig.json`):
  - `@/*` → `./src/*`
  - `@/assets/*` → `./assets/*`

---

## 3. Commands & Quality Checks

> **Windows / PowerShell Environment Note**: Node.js is managed via `fnm` (`Fast Node Manager`). In non-interactive PowerShell sessions where the user profile is not loaded automatically, prepend the `fnm` default alias directory to `$env:PATH` in each command call before invoking `node`, `npm`, or `npx`:
> ```powershell
> $env:PATH = "$env:APPDATA\fnm\aliases\default;$env:PATH"; <command>
> ```

Use `bunx` instead of `npx` only if `bun.lock` is present (this repo uses `npm` / `npx`):

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the Metro dev server
npx expo lint               # run ESLint (eslint-config-expo)
npx tsc --noEmit            # run TypeScript typechecker
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

**Mandatory Verification**: Always run `npx expo lint` and `npx tsc --noEmit` before declaring any task done.

---

## 4. Directory Structure

```text
src/
├── app/                          # Expo Router screens & layouts (routes only)
│   ├── _layout.tsx               # Root layout: ThemeProvider, TrainingProvider, AnimatedSplashOverlay, AppTabs
│   ├── index.tsx                 # Tab 1: Workout (live run tracker, workout library, custom workout creator)
│   ├── explore.tsx               # Tab 2: Goals & Schedule (step-by-step plan wizard, week/month/plan calendars)
│   ├── activities.tsx            # Tab 3: Activities (highlighted latest run + expandable past run sessions)
│   ├── rewards.tsx               # Tab 4: Rewards / Medal Library (weekly, monthly, yearly bookshelf + inspector)
│   └── settings.tsx              # Tab 5: Settings (live theme presets, accent/background/card swatches, plan reset)
├── components/                   # Reusable UI components (platform-aware)
│   ├── app-tabs.tsx              # Native tab bar + horizontal swipeable ScrollView pager across all 5 tabs
│   ├── app-tabs.web.tsx          # Web navigation header bar using expo-router/ui (Tabs, TabList, TabTrigger)
│   ├── pace-wheel-picker.tsx     # Dual-column scrollable drum picker + direct numeric input for min:sec /km pace
│   ├── themed-text.tsx           # Typography component aware of active theme colors and text variants
│   ├── themed-view.tsx           # Container View aware of theme surface tokens (background, backgroundElement, etc.)
│   ├── animated-icon.tsx         # Native animated splash overlay & icon
│   ├── animated-icon.web.tsx     # Web animated icon variant
│   ├── external-link.tsx         # Cross-platform external link (opens in-app browser on native)
│   ├── hint-row.tsx              # Helper row component
│   ├── web-badge.tsx             # Badge component
│   └── ui/
│       └── collapsible.tsx       # Expandable/collapsible accordion primitive
├── constants/
│   └── theme.ts                  # AppThemeColors, light/dark defaults, Fonts, Spacing, BottomTabInset, MaxContentWidth
├── context/
│   └── training-context.tsx      # Global state: workouts, runs, training plan, medals, custom theme overrides
├── hooks/
│   ├── use-theme.ts              # Returns active AppThemeColors (merges system scheme with user customTheme)
│   ├── use-color-scheme.ts       # Native color scheme hook
│   └── use-color-scheme.web.ts   # Web color scheme hook
└── global.css                    # Global web font & style variables
```

---

## 5. Navigation & Tab Architecture

- **Expo Router**: All routes live in `src/app/`. Keep non-route code (components, hooks, context, constants) outside `src/app/`.
- **Imports**: Always import `Link`, `router`, `Tabs`, and `useLocalSearchParams` from `expo-router`.
- **5 Main Tabs**:
  1. `index` — **Workout** (`/`): Live run telemetry & workout library
  2. `explore` — **Goals** (`/explore`): Training plan wizard & weekly/monthly/full-plan schedules
  3. `activities` — **Activities** (`/activities`): Completed run history & kilometer splits
  4. `rewards` — **Rewards** (`/rewards`): Bookshelf of weekly, monthly, and yearly medals
  5. `settings` — **Settings** (`/settings`): Dynamic theme & color customization + plan reset
- **Swipeable Native Tabs (`src/components/app-tabs.tsx`)**:
  - On iOS and Android, `AppTabs` uses a custom `layout` prop on `<Tabs>` (`SwipeableTabLayout`) that renders all 5 tab screens inside a horizontal `pagingEnabled` `ScrollView` so users can swipe left/right between tabs or tap the bottom tab bar.
  - **Important Scroll Rule**: When adding horizontal `ScrollView`s (like medal shelves in `rewards.tsx`) or vertical inner `ScrollView`s (like `PaceWheelPicker`), always include `nestedScrollEnabled` so gestures do not conflict with the parent screen `ScrollView` or the horizontal tab pager.
- **Web Tabs (`src/components/app-tabs.web.tsx`)**:
  - Uses `expo-router/ui` (`Tabs`, `TabList`, `TabTrigger`, `TabSlot`). When adding or renaming a tab route, update **both** `app-tabs.tsx` and `app-tabs.web.tsx`.

---

## 6. Global State & Domain Model (`src/context/training-context.tsx`)

All domain state is managed in `TrainingContext` via `<TrainingProvider>` (mounted in `src/app/_layout.tsx`) and consumed via `useTraining()` (or `useOptionalTraining()` inside hooks like `useTheme()`).

### Core Data Types
- **`WorkoutPreset`**:
  - `id`, `title`, `category` (`'Classical' | 'Easy' | 'Intervals' | 'Tempo' | 'Long Run'`), `isClassical?`, `isCustom?`, `targetDistanceKm?`, `targetPaceSecPerKm?`, `description?`, `steps?: string[]`, `accentColor: string`.
  - Default free-run preset: `CLASSICAL_WORKOUT` (`id: 'classical'`, `'Classical Run'`, `#FF5A36`).
  - Built-in library: `WORKOUT_LIBRARY` (`easy-recovery`, `tempo-5k`, `intervals-400`, `long-progressive`).
- **`RunSession`**:
  - `id`, `title`, `category`, `dateLabel`, `distanceKm`, `durationSec`, `avgPaceSecPerKm`, `lastKmPaceSec`, `calories`, `avgHr`, `splits: number[]` (seconds per km).
- **`PlanDay` & `PlanWeekSummary`**:
  - `PlanDay`: `id` (`w{week}-d{dayIdx}`), `weekNumber`, `dayIndex` (`0` = Mon .. `6` = Sun), `dayShort`, `dayName`, `dateNumber`, `workoutId: string | null` (`null` = Rest day), `completed: boolean`, `isToday?: boolean`.
  - `PlanWeekSummary`: `weekNumber`, `label`, `targetKm`, `sessionsCount`, `completedSessionsCount`.
- **`MedalReward`**:
  - `id`, `tier` (`'week' | 'month' | 'year'`), `title`, `subtitle`, `earnedAtLabel`, `icon`, `color`.
  - Combines base/demo medals (`INITIAL_MEDALS` + `awardDemoMedal`) with dynamically unlocked plan medals (earned automatically when all sessions in a plan week are marked completed, and every 4 completed weeks for monthly crowns).
- **`GoalType`**: `'5K' | '10K' | 'Half-Marathon' | 'Fitness'`.

### Key Context Actions & Helpers
- **Workouts**: `selectedWorkout`, `setSelectedWorkout`, `workoutLibrary`, `allWorkouts`, `addWorkoutToLibrary`, `removeWorkoutFromLibrary`.
- **Runs**: `runs`, `addRunSession` (prepends new run to `runs` with `'Today • Just now'`).
- **Training Plan**:
  - Starts with `hasActivePlan = false` until the user creates a plan in the Goals tab.
  - `createGoalPlan({ goal, sessionsPerWeek, weeks })`: Generates an automatic weekly schedule via `generateScheduleForGoal`.
  - `createCustomPlan({ name, weeks, weeklySchedule })`: Builds a custom multi-week plan from a 7-day array of `workoutId | null`.
  - `togglePlanDay(dayId)`: Toggles completion checkbox for a scheduled session day.
  - `updatePlanDayWorkout(dayId, workoutId, applyToAllWeeks?)`: Changes a day's assigned workout or sets it to Rest (`null`).
  - `resetPlan()`: Clears the active plan and returns Goals screen to the setup wizard.
- **Formatting Utilities**:
  - `formatPace(secPerKm: number): string` → e.g. `315` → `"5:15"` (or `"--:--"` if `<= 0`).
  - `formatDuration(totalSeconds: number): string` → e.g. `"05:20"` or `"1:05:20"`.

---

## 7. Theming, Styling & UI Conventions

- **Theme Tokens (`src/constants/theme.ts` & `src/hooks/use-theme.ts`)**:
  - `useTheme()` returns `AppThemeColors`:
    - `background`: Main page background (`#ffffff` light / `#000000` dark)
    - `backgroundElement`: Card / surface container background (`#F0F0F3` light / `#212225` dark)
    - `backgroundSelected`: Borders, dividers, selected pills (`#E0E1E6` light / `#2E3135` dark)
    - `text`: Primary text (`#000000` light / `#ffffff` dark)
    - `textSecondary`: Muted labels and subtitles (`#60646C` light / `#B0B4BA` dark)
    - `primary`: Brand accent color (defaults to `#FF5A36` coral orange)
  - Users can customize `primary`, `background`, `backgroundElement`, `backgroundSelected`, `text`, and `textSecondary` live at runtime via `SettingsScreen` (`updateThemeColors` / `resetThemeColors`).
  - **Never hardcode light/dark backgrounds or text colors** in screens—always read from `const theme = useTheme()` or use `<ThemedView>` and `<ThemedText>`.
- **Typography (`<ThemedText type="...">`)**:
  - Variants: `'default'` (16px), `'small'` (14px), `'smallBold'` (14px bold), `'subtitle'` (32px), `'title'` (48px), `'code'` (12px monospace), `'link'`, `'linkPrimary'`.
  - Use `fontVariant: ['tabular-nums']` on live timers, distances, and pace numbers so digits never jitter during updates.
- **Layout & Spacing (`src/constants/theme.ts`)**:
  - `Spacing`: `half` (2), `one` (4), `two` (8), `three` (16), `four` (24), `five` (32), `six` (64).
  - `MaxContentWidth`: `800`. Standard screen layout centers content horizontally using `maxWidth: MaxContentWidth` and respects `useSafeAreaInsets().top`.

---

## 8. Screen-by-Screen Implementation Details

1. **Workout Screen (`src/app/index.tsx`)**:
   - **Main Tracker View**: Shows a compact indicator card at the top (`"No workout selected"` with a gray dot when `isClassical`, or the selected workout's title + `accentColor` dot and a `✕` button to clear back to `CLASSICAL_WORKOUT`).
   - **Telemetry Card**: Displays **TIME** (`elapsedSec`), **DISTANCE** (`distanceKm`), **GLOBAL PACE**, and **LAST KM PACE**.
   - **Bottom Controls**: `Start Workout` / `Pause` / `Resume` button, secondary actions when a run is in progress (`Finish & Save`, `+0.5 km` simulation step, `Reset`), and the `Library` button at the bottom of the screen.
   - **Workout Library & Creator**:
     - Tapping `Library` opens the workout list.
     - Tapping any workout opens the **Workout Details** view with a `Do Workout` button at the bottom (and `Delete Workout` if `isCustom`).
     - Tapping `+ New Workout` opens the custom builder supporting two modes:
       1. **Target Run**: Category (`Easy`, `Tempo`, `Long Run`), exact decimal km `TextInput`, and optional target pace via `<PaceWheelPicker />`.
       2. **Intervals / Blocks**: Exact integer `TextInput`s for warm-up (min), cool-down (min), repeats, rep distance (m), recovery rest (sec), and optional rep target pace via `<PaceWheelPicker />`.
2. **Goals & Schedule Screen (`src/app/explore.tsx`)**:
   - **Wizard Setup (`!hasActivePlan || isEditingPlan`)**:
     - `builderStep === 0`: User chooses **Automatic Plan** (`guided`) or **Custom Plan** (`custom`) and presses **Apply**.
     - `builderStep >= 1`: Step-by-step wizard with a progress bar and `← Previous` / `Next →` (`Start My Plan` on the final review step).
       - *Automatic*: Step 1 (Goal: `5K`, `10K`, `Half-Marathon`, `Fitness`) → Step 2 (Sessions/week: `2`, `3`, `4`, `5`) → Step 3 (Duration: `4`, `6`, `8`, `12` weeks) → Step 4 (Review & Confirm).
       - *Custom*: Step 1 (Duration) → Step 2 (Assign workouts or rest days for Monday–Sunday) → Step 3 (Review & Confirm).
   - **Active Plan View (`hasActivePlan`)**:
     - Displays Training Series banner, period switcher (`This Week`, `Month`, `Full Plan`), goal progress bar, interactive 7-day strip & daily checklist, inline day workout switcher, and a `Run →` button on scheduled days that sets `selectedWorkout` and navigates to `'/'`.
3. **Activities Screen (`src/app/activities.tsx`)**:
   - Highlights `runs[0]` in a prominent `LATEST ACTIVITY` card at the top, followed by `PREVIOUS SESSIONS`.
   - Tapping any activity card expands/collapses its full metrics grid (Duration, Global Pace, Last Km Pace, Type, Avg HR, Energy kcal) and Kilometer Splits chips.
4. **Rewards Screen (`src/app/rewards.tsx`)**:
   - Displays a 3-column summary counter (`WEEKLY`, `MONTHLY`, `YEARLY`) and three horizontal 3D-styled bookshelf rows (`Weekly Finisher Shelf`, `Monthly Crown Shelf`, `Yearly Legend Shelf`) with unlocked medal pedestals and dashed locked slots.
   - Tapping a medal opens an inspection card above the shelves. Includes a `SIMULATE MILESTONE UNLOCK` card at the bottom for testing medal shelves.
5. **Settings Screen (`src/app/settings.tsx`)**:
   - Live theme preview card, 6 full theme presets (`Clean Light`, `Midnight Dark`, `Ocean Night`, `Forest Trail`, `Warm Sand`, `Violet Dusk`), primary button/accent color swatches + custom `#HEX` input, page background swatches, card/container surface swatches, `Reset Colors` pill, and a `Reset Plan` action when a training plan is active.

---

## 9. Building with EAS & Native Rules

- Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `npx eas-cli@latest <command>` (or `bunx eas-cli <command>` in Bun projects).
  Docs: `https://docs.expo.dev/eas/index.md`
- If `ios/` and `android/` directories do not exist, they are generated via Continuous Native Generation (CNG). **Never create or edit them by hand** — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with custom native code, the app requires a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check available skills before adding dependencies.

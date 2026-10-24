# Stride — Running & Training Companion (`appbuilding`)

**Stride** is a cross-platform mobile and web running, workout builder, and training plan application built with **Expo SDK 57**, **React Native**, and **Expo Router**.

---

## ✨ Features

### 1. 🏃 Live Workout Tracker & Custom Workout Library (`Workout` Tab)
- **Live Run Telemetry**: Real-time tracking card displaying **Time**, **Distance (km)**, **Global Pace (min/km)**, and **Last Km Pace (min/km)** with tabular numeric alignment.
- **Quick Simulation & Controls**: Start, pause, resume, step `+0.5 km` for testing splits, reset, or finish & save directly to your activity history.
- **Workout Library & Details**: Browse built-in presets (*Classical Run*, *Easy Aerobic Run*, *Threshold Tempo*, *6 × 400m Intervals*, *Sunday Long Run*) or inspect full workout structure and target metrics before selecting **Do Workout**.
- **Custom Workout Creator**:
  - **Target Run Mode**: Choose category (*Easy*, *Tempo*, *Long Run*), type exact target distance in km, and optionally set a target pace using the dual-column **Pace Wheel Picker** (scroll wheel or direct numeric input).
  - **Intervals / Blocks Mode**: Configure exact warm-up duration, repeat count, rep distance (meters), recovery rest (seconds), cool-down duration, and optional interval target pace.

### 2. 📅 Goals & Schedule Wizard (`Goals` Tab)
- **Step-by-Step Training Plan Builder**:
  - **Automatic Plan**: Guided wizard where you pick your goal (*5K*, *10K*, *Half-Marathon*, *Fitness*), weekly session frequency (*2–5 days/week*), and plan duration (*4, 6, 8, or 12 weeks*).
  - **Custom Plan**: Choose your plan duration and manually assign rest days or custom workouts to each day of the week (*Monday–Sunday*).
- **Multi-Horizon Views**:
  - **This Week**: 7-day interactive calendar strip, daily session checklist, inline day workout switcher, and a one-tap `Run →` launcher.
  - **Month**: 4-week calendar grid showing completed sessions and rest days at a glance.
  - **Full Plan**: Multi-week progression overview with target mileage and completion ratios.

### 3. 📊 Activity History & Splits (`Activities` Tab)
- **Highlighted Latest Activity**: Prominent summary card for your most recent run session.
- **Expandable Session Breakdown**: Tap any activity to inspect **Duration**, **Global Pace**, **Last Km Pace**, **Workout Category**, **Average Heart Rate (bpm)**, **Energy (kcal)**, and **Kilometer Splits**.

### 4. 🏆 Medal Library & Bookshelf (`Rewards` Tab)
- **3-Tier Achievement Bookshelf**:
  - **Weekly Finisher Shelf**: Unlocked automatically each time all scheduled sessions in a training week are completed.
  - **Monthly Crown Shelf**: Unlocked every 4 completed training weeks.
  - **Yearly Legend Shelf**: Long-term endurance milestones.
- **Interactive Medal Inspector**: Tap any medal pedestal on the shelves to view its details and earned date, or test shelf progression with the built-in milestone simulator.

### 5. 🎨 Live Theme & Color Customizer (`Settings` Tab)
- **6 Curated Theme Presets**: *Clean Light*, *Midnight Dark*, *Ocean Night*, *Forest Trail*, *Warm Sand*, and *Violet Dusk*.
- **Granular Surface & Accent Controls**: Customize primary button/accent colors (swatches or custom `#HEX` code), page backgrounds, and card/container surfaces with live preview.

---

## 🛠️ Tech Stack

- **Framework**: [Expo SDK 57](https://docs.expo.dev/) (`~57.0.31`)
- **UI & Runtime**: React `19.2.3`, React Native `0.86.3`, React Native Web `~0.21.4`
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (`~57.0.29`) with Typed Routes & swipeable native tab pager
- **Compiler**: React Compiler enabled (`experiments.reactCompiler: true`)
- **Animations & Gestures**: `react-native-reanimated` (`4.5.1`), `react-native-gesture-handler`, `react-native-worklets`
- **Icons**: `expo-symbols` (SF Symbols on iOS, Material Icons on Android/Web)
- **Language**: TypeScript `~6.0.3` (`strict: true`)

---

## 📁 Project Structure

```text
src/
├── app/                          # Expo Router tab screens & root layout
│   ├── _layout.tsx               # ThemeProvider, TrainingProvider, AnimatedSplashOverlay, AppTabs
│   ├── index.tsx                 # Tab 1: Workout tracker, library & custom workout creator
│   ├── explore.tsx               # Tab 2: Goals & training plan wizard + weekly/monthly/plan schedules
│   ├── activities.tsx            # Tab 3: Activity history & expandable kilometer splits
│   ├── rewards.tsx               # Tab 4: Weekly, monthly & yearly medal bookshelf
│   └── settings.tsx              # Tab 5: Live theme presets, color swatches & plan reset
├── components/                   # Reusable UI components
│   ├── app-tabs.tsx              # Native bottom tab bar + horizontal swipeable ScrollView pager
│   ├── app-tabs.web.tsx          # Web navigation header bar
│   ├── pace-wheel-picker.tsx     # Scrollable min:sec/km drum picker + direct numeric input
│   ├── themed-text.tsx           # Theme-aware typography primitive
│   └── themed-view.tsx           # Theme-aware surface container primitive
├── constants/
│   └── theme.ts                  # Light/dark palettes, typography tokens, spacing & layout constants
├── context/
│   └── training-context.tsx      # Global state: workouts, runs, training plan, medals & custom theme
└── hooks/
    ├── use-theme.ts              # Merges system color scheme with user customTheme overrides
    └── use-color-scheme.ts       # Platform color scheme detection
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v20+ / v22+ recommended)
- **npm**
- **Expo Go** on iOS/Android (or an iOS Simulator / Android Emulator / Web browser)

### Installation

```bash
npm install
```

### Running the App

```bash
# Start the Expo development server
npx expo start

# Launch directly on a specific platform
npm run ios
npm run android
npm run web
```

### Typechecking & Linting

```bash
npx tsc --noEmit
npx expo lint
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

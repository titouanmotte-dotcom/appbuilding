/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { AppThemeColors, Colors } from '@/constants/theme';
import { useOptionalTraining } from '@/context/training-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme(): AppThemeColors {
  const scheme = useColorScheme();
  const base = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const training = useOptionalTraining();

  if (!training || !training.customTheme) {
    return base;
  }

  return {
    ...base,
    ...training.customTheme,
  };
}

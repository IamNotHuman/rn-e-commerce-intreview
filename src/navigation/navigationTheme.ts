import {DarkTheme, DefaultTheme} from '@react-navigation/native';
import type {Theme} from '@react-navigation/native';
import type {AppTheme} from '../theme';

/**
 * react-navigation paints its own chrome — the header, the screen background
 * behind a transition — from its own theme object, not from styled-components.
 * Without this mapping a dark app gets a white header bar. Fonts are taken from
 * the library's own presets, since the app has no font tokens of its own.
 */
export const toNavigationTheme = (theme: AppTheme): Theme => {
  const preset = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;

  return {
    ...preset,
    dark: theme.scheme === 'dark',
    colors: {
      ...preset.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
  };
};

import type { ColorSchemeName } from 'react-native';
import type {
  AppTheme,
  ColorScheme,
  ThemeColors,
  ThemeFontSize,
  ThemeFontWeight,
} from './theme.type';

/**
 * The raw scales are named locally so the text variants below can be composed
 * from them. A variant that hardcoded its own 16 could drift off the scale
 * without anything failing; composing guarantees every variant is a point on
 * it.
 */
const fontSize: ThemeFontSize = {
  caption: 12,
  body: 14,
  title: 16,
  heading: 22,
};

const fontWeight: ThemeFontWeight = {
  regular: '400',
  medium: '600',
  bold: '700',
};

const lightColors: ThemeColors = {
  background: '#f5f5f7',
  surface: '#ffffff',
  border: '#e2e2e7',
  text: '#1c1c1e',
  textMuted: '#6e6e73',
  primary: '#0a7ea4',
  onPrimary: '#ffffff',
  danger: '#c0392b',
  disabled: '#d1d1d6',
  onDisabled: '#8e8e93',
};

/**
 * Same roles, re-pitched for a dark ground. `primary` is lifted so it keeps
 * contrast against the near-black surfaces, and `onPrimary` flips to dark so
 * the label still reads on the lighter blue. `disabled` sits just above the
 * surface rather than just below the background, which is the same
 * relationship the light palette has, mirrored.
 */
const darkColors: ThemeColors = {
  background: '#0f0f12',
  surface: '#1c1c1e',
  border: '#2c2c30',
  text: '#f2f2f7',
  textMuted: '#9a9aa3',
  primary: '#4fb3d9',
  onPrimary: '#0b1a20',
  danger: '#ff6b5e',
  disabled: '#2c2c30',
  onDisabled: '#6e6e76',
};

/**
 * Everything that is not a colour is scheme-independent and lives once. The
 * two themes differ only in `scheme` and `colors`, which is what keeps a
 * layout identical between modes — a component that looked different in dark
 * would be a token that had leaked into the wrong group.
 */
const base: Omit<AppTheme, 'scheme' | 'colors'> = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
  fontSize,
  fontWeight,
  /**
   * 44 is the iOS minimum and, with the 8px slop, clears Android's 48dp too.
   * Both are here so a style can choose: grow the box to `touchTarget`, or keep
   * the box small and extend it with `hitSlop` where the visual size is doing
   * work (R13).
   */
  size: {
    touchTarget: 44,
    hitSlop: 8,
  },
  /**
   * Roles, not sizes. `price` is its own variant because it appears in
   * ProductCard, ProductDetail and CartItem, and it is exactly the value that
   * drifts to a different weight in each of them when there is nothing to
   * point at.
   */
  text: {
    heading: { size: fontSize.heading, weight: fontWeight.bold },
    title: { size: fontSize.title, weight: fontWeight.medium },
    body: { size: fontSize.body, weight: fontWeight.regular },
    caption: { size: fontSize.caption, weight: fontWeight.regular },
    price: { size: fontSize.title, weight: fontWeight.bold },
  },
  /**
   * Two levels only. `card` is the resting lift for a surface in a list;
   * `raised` is for a surface that sits above the page (the cart summary bar).
   * A third level would be a value nothing in this app needs.
   */
  shadow: {
    card: {
      color: '#000000',
      offsetX: 0,
      offsetY: 1,
      opacity: 0.08,
      radius: 3,
      elevation: 2,
    },
    raised: {
      color: '#000000',
      offsetX: 0,
      offsetY: 4,
      opacity: 0.12,
      radius: 8,
      elevation: 6,
    },
  },
};

export const lightTheme: AppTheme = {
  scheme: 'light',
  colors: lightColors,
  ...base,
};
export const darkTheme: AppTheme = {
  scheme: 'dark',
  colors: darkColors,
  ...base,
};

const themes: Record<ColorScheme, AppTheme> = {
  light: lightTheme,
  dark: darkTheme,
};

/**
 * Resolves react-native's nullable ColorSchemeName to a theme. `null` and
 * `undefined` mean the OS did not say, and the answer to "not stated" is the
 * light theme, never a crash.
 */
export const getTheme = (scheme: ColorSchemeName): AppTheme =>
  themes[scheme ?? 'light'];

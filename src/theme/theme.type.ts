/**
 * Design tokens. The shape here is what `props.theme` resolves to inside every
 * *.style.ts file, via the DefaultTheme augmentation in styled.d.ts.
 *
 * Numeric spacing/radius rather than pre-formatted strings: styled-components
 * for native needs a unit, so styles interpolate `${({theme}) => theme.spacing.md}px`.
 * Keeping the token numeric leaves it usable in arithmetic and in props that
 * take raw numbers (FlatList offsets, Image dimensions).
 */
export interface ThemeColors {
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  danger: string;
  /**
   * A disabled control has to read as unavailable, and the grey that says so
   * is a design value like any other — without a token it arrives as a literal
   * in a *.style.ts (R12a). `disabled` is the surface/border, `onDisabled` the
   * label sitting on it. The cases here are the decrement step at quantity 1
   * and checkout with an empty cart.
   */
  disabled: string;
  onDisabled: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface ThemeRadius {
  sm: number;
  md: number;
  lg: number;
}

export interface ThemeFontSize {
  caption: number;
  body: number;
  title: number;
  heading: number;
}

export interface ThemeFontWeight {
  regular: '400';
  medium: '600';
  bold: '700';
}

/**
 * A size/weight pair that always travels together. Colour is deliberately not
 * part of a variant: size and weight are fixed by the role a piece of text
 * plays, but its colour changes with context (text, textMuted, onPrimary,
 * danger), so bundling one would force a variant per colour.
 */
export interface ThemeTextVariant {
  size: number;
  weight: ThemeFontWeight[keyof ThemeFontWeight];
}

export interface ThemeText {
  heading: ThemeTextVariant;
  title: ThemeTextVariant;
  body: ThemeTextVariant;
  caption: ThemeTextVariant;
  price: ThemeTextVariant;
}

/**
 * One elevation level, split into the primitives a *.style.ts interpolates.
 * React Native has no single shadow property: iOS reads shadowColor/Offset/
 * Opacity/Radius, Android reads elevation, and both have to be set for a card
 * to lift on either platform. Keeping the level as primitives rather than a
 * pre-built css fragment is what lets the token stay in theme/ instead of
 * becoming a styling helper (R6).
 */
export interface ThemeShadowLevel {
  color: string;
  offsetX: number;
  offsetY: number;
  opacity: number;
  radius: number;
  elevation: number;
}

export interface ThemeShadow {
  card: ThemeShadowLevel;
  raised: ThemeShadowLevel;
}

/**
 * Interaction sizing. `touchTarget` is the platform minimum for anything
 * tappable (iOS HIG 44pt, Android 48dp — 44 plus the default slop clears
 * both). `hitSlop` extends a control whose visual box is deliberately smaller
 * than its target, which is the quantity stepper's whole problem: a 32px
 * button looks right next to the number and is too small to hit.
 *
 * Tokens rather than literals because a touch target is a design decision, not
 * a layout-intrinsic value (R12a).
 */
export interface ThemeSize {
  touchTarget: number;
  hitSlop: number;
}

/**
 * Mirrors react-native's ColorSchemeName minus its nullable cases, which are
 * resolved to 'light' before a theme is ever built.
 */
export type ColorScheme = 'light' | 'dark';

export interface AppTheme {
  /**
   * Carried on the theme so consumers that need a boolean rather than a colour
   * (StatusBar's barStyle, react-navigation's `dark` flag) read it from the
   * same object as everything else instead of re-deriving it.
   */
  scheme: ColorScheme;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  fontSize: ThemeFontSize;
  fontWeight: ThemeFontWeight;
  text: ThemeText;
  shadow: ThemeShadow;
  size: ThemeSize;
}

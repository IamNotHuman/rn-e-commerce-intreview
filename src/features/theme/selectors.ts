import type {ColorSchemeName} from 'react-native';
import type {RootState} from '../../app/store';
import type {ColorScheme} from '../../theme';

export const selectSchemeOverride = (state: RootState) => state.theme.override;

/**
 * The scheme the app renders in: the user's override when set, otherwise the
 * OS value (unstated → light). A plain function rather than createSelector —
 * it derives a string from two scalars, so there is nothing to memoize.
 */
export const selectEffectiveScheme = (
  state: RootState,
  osScheme: ColorSchemeName,
): ColorScheme => state.theme.override ?? osScheme ?? 'light';
